import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { Snippet, SUPPORTED_LANGUAGES } from '../types/snippet';
import { deleteSnippet } from '../services/snippetService';
import {
  Search,
  Plus,
  FolderGit2,
  Globe,
  Lock,
  Share2,
  Copy,
  Trash2,
  Tag,
  Code2,
  Calendar,
  ExternalLink,
  Filter,
  Check,
  ChevronRight,
  User as UserIcon,
  Layers,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  snippets: Snippet[];
  publicSnippets: Snippet[];
  activeTab: 'my-snippets' | 'explore';
  onTabChange: (tab: 'my-snippets' | 'explore') => void;
  onOpenSnippet: (snippetId: string) => void;
  onNewSnippet: () => void;
  loading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  snippets,
  publicSnippets,
  activeTab,
  onTabChange,
  onOpenSnippet,
  onNewSnippet,
  loading,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Active dataset based on tab
  const activeDataset = activeTab === 'my-snippets' ? snippets : publicSnippets;

  // Extract all unique tags with count
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeDataset.forEach((s) => {
      s.tags?.forEach((t) => {
        const clean = t.toLowerCase().trim();
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeDataset]);

  // Extract language counts
  const langCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeDataset.forEach((s) => {
      const l = s.language?.toLowerCase() || 'other';
      counts[l] = (counts[l] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeDataset]);

  // Filter snippets by search query, tag, and language
  const filteredSnippets = useMemo(() => {
    return activeDataset.filter((snippet) => {
      // Search term matches title, language, or tags
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = snippet.title.toLowerCase().includes(q);
        const matchesLang = snippet.language.toLowerCase().includes(q);
        const matchesTag = snippet.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesAuthor = snippet.ownerName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLang && !matchesTag && !matchesAuthor) {
          return false;
        }
      }

      // Tag filter
      if (selectedTag) {
        if (!snippet.tags?.some((t) => t.toLowerCase().trim() === selectedTag)) {
          return false;
        }
      }

      // Language filter
      if (selectedLanguage) {
        if (snippet.language.toLowerCase() !== selectedLanguage) {
          return false;
        }
      }

      return true;
    });
  }, [activeDataset, searchQuery, selectedTag, selectedLanguage]);

  const handleCopyLink = (snippet: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?id=${snippet.id}`;
    navigator.clipboard.writeText(url);
    showToast('Share link copied to clipboard!', 'success');
  };

  const handleCopyCode = (snippet: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.code);
    setCopiedSnippetId(snippet.id);
    showToast('Code copied to clipboard!', 'success');
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await deleteSnippet(deleteTargetId);
      showToast('Snippet deleted successfully', 'success');
      setDeleteTargetId(null);
    } catch (err: any) {
      showToast('Failed to delete snippet: ' + (err.message || 'Permission denied'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'typescript':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'python':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'java':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'cpp':
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'html':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'css':
        return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar for snippet list, tabs, and tag filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          {/* Main Action */}
          <button
            onClick={onNewSnippet}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Snippet</span>
          </button>

          {/* Navigation Tabs */}
          <div className="bg-zinc-100 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 space-y-1">
            <button
              onClick={() => {
                onTabChange('my-snippets');
                setSelectedTag(null);
                setSelectedLanguage(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'my-snippets'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-500" />
                <span>My Snippets</span>
              </div>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {snippets.length}
              </span>
            </button>

            <button
              onClick={() => {
                onTabChange('explore');
                setSelectedTag(null);
                setSelectedLanguage(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'explore'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>Explore Public</span>
              </div>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {publicSnippets.length}
              </span>
            </button>
          </div>

          {/* Languages filter list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span>Languages</span>
              {selectedLanguage && (
                <button
                  onClick={() => setSelectedLanguage(null)}
                  className="text-indigo-500 lowercase text-[11px] hover:underline"
                >
                  reset
                </button>
              )}
            </div>
            <div className="space-y-1">
              {langCounts.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No snippets yet</p>
              ) : (
                langCounts.map(([lang, count]) => (
                  <button
                    key={lang}
                    onClick={() =>
                      setSelectedLanguage(selectedLanguage === lang ? null : lang)
                    }
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors capitalize ${
                      selectedLanguage === lang
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5" />
                      {lang === 'cpp' ? 'C++' : lang}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">{count}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Tags filter list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span>Tags</span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-indigo-500 lowercase text-[11px] hover:underline"
                >
                  clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagCounts.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No tags created yet</p>
              ) : (
                tagCounts.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1 ${
                      selectedTag === tag
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Search bar & filter feedback */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search snippets by title, tag, language, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {(selectedTag || selectedLanguage || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Active filters:</span>
              {selectedLanguage && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Lang: {selectedLanguage}
                  <button
                    onClick={() => setSelectedLanguage(null)}
                    className="hover:text-indigo-800 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono">
                  #{selectedTag}
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="hover:text-indigo-800 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Query: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-zinc-900 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedLanguage(null);
                  setSearchQuery('');
                }}
                className="text-xs text-indigo-500 hover:underline ml-2"
              >
                Reset all
              </button>
            </div>
          )}

          {/* Snippets Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : filteredSnippets.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
              <Code2 className="w-12 h-12 text-zinc-400 mx-auto mb-3 opacity-60" />
              <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
                {searchQuery || selectedTag || selectedLanguage
                  ? 'No snippets match your filters'
                  : activeTab === 'my-snippets'
                  ? 'No snippets yet'
                  : 'No public snippets yet'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedTag || selectedLanguage
                  ? 'Try broadening your search criteria or resetting filters.'
                  : activeTab === 'my-snippets'
                  ? 'Start by creating your first realtime code snippet to share with others.'
                  : 'Be the first to share a public snippet with the community!'}
              </p>
              <div className="mt-5">
                {searchQuery || selectedTag || selectedLanguage ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag(null);
                      setSelectedLanguage(null);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={onNewSnippet}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                  >
                    + Create Snippet
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSnippets.map((snippet) => {
                const isOwner = user?.uid === snippet.ownerId;
                return (
                  <div
                    key={snippet.id}
                    onClick={() => onOpenSnippet(snippet.id)}
                    className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                  >
                    {/* Header info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-semibold text-sm text-zinc-900 dark:text-white group-hover:text-indigo-400 transition-colors truncate">
                            {snippet.title || 'Untitled Snippet'}
                          </h4>
                          <div className="flex items-center gap-2 text-xs">
                            {/* Language Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-medium border capitalize ${getLanguageColor(
                                snippet.language
                              )}`}
                            >
                              {snippet.language === 'cpp' ? 'C++' : snippet.language}
                            </span>

                            {/* Public/Private Badge */}
                            {snippet.isPublic ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <Globe className="w-3 h-3" /> Public
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded border border-zinc-500/20">
                                <Lock className="w-3 h-3" /> Private
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Copy Link */}
                          <button
                            onClick={(e) => handleCopyLink(snippet, e)}
                            title="Copy share link"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy Code */}
                          <button
                            onClick={(e) => handleCopyCode(snippet, e)}
                            title="Copy code"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            {copiedSnippetId === snippet.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete (owner only) */}
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(snippet.id);
                              }}
                              title="Delete snippet"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Code preview banner */}
                      <div className="p-2.5 rounded-lg bg-zinc-950/80 font-mono text-[11px] text-zinc-300 overflow-hidden line-clamp-3 leading-relaxed border border-zinc-800/60 select-none">
                        {snippet.code.slice(0, 200) || '// empty snippet'}
                      </div>

                      {/* Tags */}
                      {snippet.tags && snippet.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {snippet.tags.map((t) => (
                            <span
                              key={t}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(t.toLowerCase().trim());
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 hover:text-indigo-400 transition-colors"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer metadata */}
                    <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5 truncate">
                        {snippet.ownerPhoto ? (
                          <img
                            src={snippet.ownerPhoto}
                            alt={snippet.ownerName}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="truncate">
                          {isOwner ? 'You' : snippet.ownerName || 'Anonymous'}
                        </span>
                      </div>
                      <span className="shrink-0">{formatRelativeTime(snippet.updatedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTargetId && (
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
              Are you sure you want to delete this snippet? This action is permanent and cannot be undone. Collaborators will lose access immediately.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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
