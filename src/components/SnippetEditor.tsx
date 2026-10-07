import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import {
  Snippet,
  UserPresence,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  PRESENCE_COLORS,
  getRandomColor
} from '../types/snippet';
import {
  subscribeToSnippet,
  updateSnippet,
  deleteSnippet,
  updatePresence,
  removePresence,
  subscribeToPresence
} from '../services/snippetService';
import {
  ArrowLeft,
  Share2,
  Copy,
  Trash2,
  Lock,
  Globe,
  Tag,
  Plus,
  X,
  Check,
  Users2,
  Wifi,
  Sparkles,
  Sun,
  Moon,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Clock
} from 'lucide-react';

// Send cursor position to Firestore at most once per this many ms
const PRESENCE_THROTTLE_MS = 1500;

interface SnippetEditorProps {
  snippetId: string;
  onBack: () => void;
  onSnippetDeleted: () => void;
}

export const SnippetEditor: React.FC<SnippetEditorProps> = ({
  snippetId,
  onBack,
  onSnippetDeleted,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme, monacoTheme } = useTheme();
  const { showToast } = useToast();

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<'saved' | 'saving' | 'synced'>('synced');

  // Local state for edits
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Collaborators & Presence
  const [collaborators, setCollaborators] = useState<UserPresence[]>([]);
  const userColorRef = useRef<string>(getRandomColor(user?.uid || 'guest'));
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // Modals & UI states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [tagInputOpen, setTagInputOpen] = useState(false);

  // Sync flags to prevent loopback overwrites
  const isLocalEditRef = useRef(false);
  const applyingRemoteRef = useRef(false); // true while we push remote text into Monaco
  const editVersionRef = useRef(0); // counts local edits
  const latestRemoteRef = useRef<Snippet | null>(null);
  const pendingCodeRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPresenceSentRef = useRef(0);
  const userRef = useRef(user);
  const flushRef = useRef<() => void>(() => {});

  const isOwner = Boolean(user && snippet && user.uid === snippet.ownerId);
  // Only signed-in users can write (Firestore rules require it)
  const canEdit = Boolean(user) && (isOwner || Boolean(snippet?.isPublic));

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Push remote data into the editor without triggering our own save
  const applyRemoteSnippet = useCallback((remote: Snippet) => {
    setCode(remote.code);
    setTitle(remote.title);
    setLanguage(remote.language);
    setIsPublic(remote.isPublic);
    setTags(remote.tags || []);
    const editor = editorRef.current;
    if (editor && editor.getValue() !== remote.code) {
      const pos = editor.getPosition();
      applyingRemoteRef.current = true;
      try {
        editor.setValue(remote.code);
      } finally {
        applyingRemoteRef.current = false;
      }
      if (pos) editor.setPosition(pos);
    }
  }, []);

  // 1. Subscribe to the snippet doc
  useEffect(() => {
    setLoading(true);
    setPermissionError(null);

    const unsubscribe = subscribeToSnippet(
      snippetId,
      (updatedSnippet) => {
        setLoading(false);
        if (!updatedSnippet) {
          setPermissionError('This snippet does not exist or has been deleted.');
          return;
        }

        // Check private permission: if private and user is not owner
        if (!updatedSnippet.isPublic && (!user || user.uid !== updatedSnippet.ownerId)) {
          setPermissionError('This snippet is private. Only the owner can view or edit it.');
          return;
        }

        setSnippet(updatedSnippet);
        latestRemoteRef.current = updatedSnippet;

        // If not currently typing locally, update editor content
        if (!isLocalEditRef.current) {
          applyRemoteSnippet(updatedSnippet);
        }
      },
      (error) => {
        setLoading(false);
        const msg = error?.message || '';
        if (msg.includes('Missing or insufficient permissions') || msg.includes('PERMISSION_DENIED')) {
          setPermissionError('Access denied: You do not have permission to view this snippet.');
        } else {
          setPermissionError('Error loading snippet. Please try again.');
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [snippetId, user, applyRemoteSnippet]);

  // 2. Presence tracking (online users & live cursors)
  useEffect(() => {
    if (!snippetId) return;

    // Subscribe to presence subcollection
    const unsubPresence = subscribeToPresence(
      snippetId,
      (presenceList) => {
        setCollaborators(presenceList);
      },
      (err) => {
        console.debug('Presence subscription notice:', err);
      }
    );

    // If user is authenticated, periodically heartbeat active status
    if (user) {
      const sendHeartbeat = () => {
        if (!editorRef.current) return;
        const pos = editorRef.current.getPosition() || { lineNumber: 1, column: 1 };
        updatePresence(
          snippetId,
          user,
          pos.lineNumber,
          pos.column,
          userColorRef.current
        ).catch(() => {});
      };

      sendHeartbeat();
      presenceIntervalRef.current = setInterval(sendHeartbeat, 30000);
    }

    return () => {
      unsubPresence();
      if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
      if (presenceTimerRef.current) {
        clearTimeout(presenceTimerRef.current);
        presenceTimerRef.current = null;
      }
      if (user) {
        removePresence(snippetId, user.uid);
      }
    };
  }, [snippetId, user]);

  // 3. Render collaborator cursors in Monaco
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Filter out current user's own presence
    const remoteCollaborators = collaborators.filter(
      (c) => c.userId !== user?.uid
    );

    const model = editor.getModel();
    if (!model) return;

    // Build new decorations (colors come from fixed CSS classes in index.css)
    const newDecorations = remoteCollaborators.map((c) => {
      const idx = Math.max(0, PRESENCE_COLORS.indexOf(c.color));
      const pos = model.validatePosition({
        lineNumber: Math.max(1, c.cursorLine || 1),
        column: Math.max(1, c.cursorColumn || 1),
      });
      const label = (c.userName || 'User').slice(0, 20);

      return {
        range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
        options: {
          showIfCollapsed: true,
          beforeContentClassName: `rc-cursor-${idx}`,
          after: {
            content: label,
            inlineClassName: `rc-label-${idx}`,
          },
        },
      };
    });

    try {
      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        newDecorations
      );
    } catch (e) {
      console.debug('Monaco decoration update note:', e);
    }
  }, [collaborators, user]);

  // Handle Monaco Mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen to cursor position changes to broadcast presence
    // (throttled so we do not write to Firestore on every key press)
    const sendPresence = () => {
      presenceTimerRef.current = null;
      const currentUser = userRef.current;
      const pos = editor.getPosition();
      if (!currentUser || !pos) return;
      lastPresenceSentRef.current = Date.now();
      updatePresence(
        snippetId,
        currentUser,
        pos.lineNumber,
        pos.column,
        userColorRef.current
      ).catch(() => {});
    };

    editor.onDidChangeCursorPosition(() => {
      if (!userRef.current || presenceTimerRef.current) return;
      const wait = Math.max(0, PRESENCE_THROTTLE_MS - (Date.now() - lastPresenceSentRef.current));
      presenceTimerRef.current = setTimeout(sendPresence, wait);
    });
  };

  // Debounced push code to Firestore
  const queueSnippetUpdate = useCallback(
    (newCode: string) => {
      if (!snippet || !canEdit) return;
      isLocalEditRef.current = true;
      pendingCodeRef.current = newCode;
      const version = ++editVersionRef.current;
      setSavingState('saving');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        debounceTimerRef.current = null;
        let saved = false;
        try {
          await updateSnippet(
            snippetId,
            {
              code: newCode,
              lastEditedBy: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
            },
            isOwner
          );
          if (pendingCodeRef.current === newCode) pendingCodeRef.current = null;
          saved = true;
          setSavingState('synced');
        } catch (err: any) {
          console.error('Failed to sync code:', err);
          showToast('Failed to sync code update', 'error');
          setSavingState('saved');
        } finally {
          // Allow remote updates again, but only if the user did not type more meanwhile
          setTimeout(() => {
            if (editVersionRef.current !== version) return;
            isLocalEditRef.current = false;
            const latest = latestRemoteRef.current;
            if (saved && latest) applyRemoteSnippet(latest);
          }, 300);
        }
      }, 500);
    },
    [snippetId, snippet, canEdit, isOwner, user, showToast, applyRemoteSnippet]
  );

  // Save unsaved code if the user leaves the page quickly
  flushRef.current = () => {
    if (!debounceTimerRef.current || pendingCodeRef.current === null) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
    const codeToSave = pendingCodeRef.current;
    pendingCodeRef.current = null;
    const u = userRef.current;
    updateSnippet(
      snippetId,
      { code: codeToSave, lastEditedBy: u?.displayName || u?.email?.split('@')[0] || 'Anonymous' },
      isOwner
    ).catch(() => {});
  };
  useEffect(() => () => flushRef.current(), []);

  const handleCodeChange = (newVal: string | undefined) => {
    if (applyingRemoteRef.current) return; // change came from another user, not from us
    const val = newVal ?? '';
    setCode(val);
    queueSnippetUpdate(val);
  };

  // Handle Title Save
  const handleTitleBlur = async () => {
    if (!snippet || !isOwner || title === snippet.title) return;
    const cleanTitle = title.trim() || 'Untitled Snippet';
    setTitle(cleanTitle);
    try {
      await updateSnippet(snippetId, { title: cleanTitle }, true);
      showToast('Title updated', 'success');
    } catch (err: any) {
      showToast('Failed to update title', 'error');
    }
  };

  // Handle Language Change
  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    if (!snippet || !isOwner) return;
    try {
      await updateSnippet(snippetId, { language: newLang }, true);
      showToast(`Language set to ${newLang}`, 'success');
    } catch (err: any) {
      showToast('Failed to update language', 'error');
    }
  };

  // Handle Public / Private Toggle
  const handleTogglePrivacy = async () => {
    if (!snippet || !isOwner) return;
    const newStatus = !isPublic;
    setIsPublic(newStatus);
    try {
      await updateSnippet(snippetId, { isPublic: newStatus }, true);
      showToast(newStatus ? 'Snippet is now Public' : 'Snippet is now Private', 'success');
    } catch (err: any) {
      setIsPublic(!newStatus);
      showToast('Failed to update visibility', 'error');
    }
  };

  // Add Tag
  const handleAddTag = async () => {
    const clean = newTagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!clean) return;
    if (tags.includes(clean)) {
      showToast('Tag already added', 'info');
      setNewTagInput('');
      return;
    }
    if (tags.length >= 10) {
      showToast('Max 10 tags per snippet', 'error');
      return;
    }

    const nextTags = [...tags, clean];
    setTags(nextTags);
    setNewTagInput('');
    setTagInputOpen(false);

    if (snippet && isOwner) {
      try {
        await updateSnippet(snippetId, { tags: nextTags }, true);
        showToast(`Tag #${clean} added`, 'success');
      } catch (err: any) {
        showToast('Failed to save tag', 'error');
      }
    }
  };

  // Remove Tag
  const handleRemoveTag = async (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    if (snippet && isOwner) {
      try {
        await updateSnippet(snippetId, { tags: nextTags }, true);
      } catch (err: any) {
        showToast('Failed to remove tag', 'error');
      }
    }
  };

  // Copy Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    showToast('Code copied to clipboard!', 'success');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Copy Share Link
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${snippetId}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Share link copied to clipboard!', 'success');
  };

  // Delete Snippet
  const handleDeleteSnippet = async () => {
    if (!snippet || !isOwner) return;
    try {
      setIsDeleting(true);
      await deleteSnippet(snippetId);
      showToast('Snippet deleted', 'success');
      onSnippetDeleted();
    } catch (err: any) {
      showToast('Failed to delete snippet: ' + (err.message || 'Permission denied'), 'error');
      setIsDeleting(false);
    }
  };

  // Get current monaco language identifier
  const currentLangConfig = SUPPORTED_LANGUAGES.find(
    (l) => l.id === language.toLowerCase()
  );
  const monacoLanguage = currentLangConfig?.monacoLang || language.toLowerCase();

  // If loading snippet data
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Connecting to realtime snippet...</p>
      </div>
    );
  }

  // If permission error or not found
  if (permissionError) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Snippet Unavailable</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {permissionError}
        </p>
        <div className="pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Back + Title + Privacy */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            title="Back to Dashboard"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Title Editable / Readonly */}
          <div className="flex items-center gap-2 min-w-0">
            {isOwner ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Untitled Snippet"
                maxLength={100}
                className="bg-transparent text-sm sm:text-base font-semibold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5 border border-transparent hover:border-zinc-700 transition-all truncate max-w-[200px] sm:max-w-[320px]"
              />
            ) : (
              <span className="text-sm sm:text-base font-semibold text-white truncate max-w-[200px] sm:max-w-[320px]">
                {snippet?.title || 'Untitled Snippet'}
              </span>
            )}

            {/* Privacy toggle badge */}
            {isOwner ? (
              <button
                onClick={handleTogglePrivacy}
                title={isPublic ? 'Public snippet (Click to make private)' : 'Private snippet (Click to make public)'}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  isPublic
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{isPublic ? 'Public' : 'Private'}</span>
              </button>
            ) : (
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                  isPublic
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{isPublic ? 'Public' : 'Private'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Center/Right: Collaborators, Language, Actions */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Online Collaborator Avatars */}
          <div className="flex items-center -space-x-2 pl-2">
            {/* Always show current user */}
            <div
              title={`${user?.displayName || 'You'} (Active now)`}
              className="w-7 h-7 rounded-full ring-2 ring-zinc-900 bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center relative cursor-help"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'You'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{(user?.displayName || user?.email || 'Y')[0].toUpperCase()}</span>
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-zinc-900" />
            </div>

            {/* Remote online users */}
            {collaborators
              .filter((c) => c.userId !== user?.uid)
              .slice(0, 4)
              .map((collab) => (
                <div
                  key={collab.userId}
                  title={`${collab.userName} (Line ${collab.cursorLine})`}
                  style={{ borderColor: collab.color }}
                  className="w-7 h-7 rounded-full ring-2 ring-zinc-900 bg-zinc-800 text-white text-[11px] font-bold flex items-center justify-center relative cursor-help"
                >
                  {collab.userPhoto ? (
                    <img
                      src={collab.userPhoto}
                      alt={collab.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{collab.userName[0].toUpperCase()}</span>
                  )}
                  <span
                    style={{ backgroundColor: collab.color }}
                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-zinc-900"
                  />
                </div>
              ))}

            {collaborators.filter((c) => c.userId !== user?.uid).length > 4 && (
              <div className="w-7 h-7 rounded-full ring-2 ring-zinc-900 bg-zinc-800 text-zinc-300 text-[10px] font-bold flex items-center justify-center">
                +{collaborators.filter((c) => c.userId !== user?.uid).length - 4}
              </div>
            )}
          </div>

          {/* Sync indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 text-[11px] font-mono text-zinc-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                savingState === 'saving'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span>{savingState === 'saving' ? 'Syncing...' : 'Realtime Sync'}</span>
          </div>

          {/* Language dropdown */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={!isOwner}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium capitalize disabled:opacity-75"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            title="Copy code to clipboard"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            {codeCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{codeCopied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Owner options (delete) */}
          {isOwner && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              title="Delete snippet"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tags & Metadata sub-bar */}
      <div className="px-4 py-1.5 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <div className="flex items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 font-mono text-[11px] text-zinc-300"
              >
                #{t}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-400 ml-0.5"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}

            {isOwner && (
              <>
                {tagInputOpen ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTag();
                        if (e.key === 'Escape') setTagInputOpen(false);
                      }}
                      placeholder="tag (e.g. react)"
                      autoFocus
                      className="px-2 py-0.5 rounded bg-zinc-800 border border-indigo-500 text-[11px] font-mono text-white focus:outline-none w-28"
                    />
                    <button
                      onClick={handleAddTag}
                      className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 text-[10px]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setTagInputOpen(false)}
                      className="p-1 text-zinc-400 hover:text-white text-[10px]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setTagInputOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add tag</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 hidden sm:flex items-center gap-3">
          <span>Author: {snippet?.ownerName || 'Anonymous'}</span>
          {snippet?.lastEditedBy && (
            <span>Last edit: {snippet.lastEditedBy}</span>
          )}
        </div>
      </div>

      {/* Monaco Code Editor Canvas */}
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code}
          theme={monacoTheme}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          options={{
            readOnly: !canEdit,
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 2,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            renderWhitespace: 'selection',
          }}
        />
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                    Share Snippet
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {isPublic
                      ? 'Anyone with this link can view this snippet.'
                      : 'This snippet is currently Private. Only you can view it.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Link box with Copy Button */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Direct Link
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}?id=${snippetId}`}
                  className="bg-transparent text-xs text-zinc-700 dark:text-zinc-300 font-mono w-full focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Privacy reminder */}
            {!isPublic && isOwner && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  To allow others to view this link, change the visibility to{' '}
                  <button
                    onClick={handleTogglePrivacy}
                    className="font-bold underline hover:text-amber-200"
                  >
                    Public
                  </button>
                  .
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-white">
                Delete Snippet
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{title || 'Untitled Snippet'}"</strong>? All active collaborators will be disconnected immediately.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSnippet}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete Snippet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
