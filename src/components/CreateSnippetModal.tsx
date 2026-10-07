import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { createSnippet } from '../services/snippetService';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/snippet';
import {
  Code2,
  Lock,
  Globe,
  Tag,
  Plus,
  X,
  Sparkles,
  Loader2,
  LogIn
} from 'lucide-react';

interface CreateSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnippetCreated: (snippetId: string) => void;
}

export const CreateSnippetModal: React.FC<CreateSnippetModalProps> = ({
  isOpen,
  onClose,
  onSnippetCreated,
}) => {
  const { user, signIn } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>(['react', 'snippet']);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!clean) return;
    if (tags.includes(clean)) {
      setTagInput('');
      return;
    }
    if (tags.length >= 10) {
      showToast('Maximum 10 tags', 'error');
      return;
    }
    setTags([...tags, clean]);
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in with Google to create a snippet', 'info');
      try {
        await signIn();
      } catch (e) {
        return;
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedOption = SUPPORTED_LANGUAGES.find((l) => l.id === language);
      const initialCode = selectedOption?.defaultCode || '// Write your code here\n';

      const snippetId = await createSnippet({
        title: title.trim() || 'Untitled Snippet',
        code: initialCode,
        language,
        isPublic,
        tags,
        user,
      });

      showToast('Snippet created!', 'success');
      onSnippetCreated(snippetId);
      onClose();
    } catch (err: any) {
      showToast('Failed to create snippet: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Create New Snippet
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Start a collaborative realtime code session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If user not logged in */}
        {!user ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                Sign in to create snippets
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                Sign in with your Google account to create, edit, save, and share your code snippets.
              </p>
            </div>
            <button
              onClick={signIn}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 inline-flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
              </svg>
              <span>Login with Google</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g., QuickSort in Python, React Hook Form helper"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Language
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {SUPPORTED_LANGUAGES.slice(0, 8).map((lang) => (
                  <button
                    type="button"
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                      language === lang.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Public vs Private */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    isPublic
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Globe
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isPublic ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-semibold block text-zinc-900 dark:text-white">
                      Public
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      Anyone with the link can view
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    !isPublic
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Lock
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      !isPublic ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-semibold block text-zinc-900 dark:text-white">
                      Private
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      Only you can view or open
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tags (e.g. react, sorting, algorithm)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="type & enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none flex-1 min-w-[80px]"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create & Open</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
