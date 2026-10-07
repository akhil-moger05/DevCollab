import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Code2,
  Plus,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Globe,
  FolderGit2,
  Menu,
  X,
  Wifi,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'editor';
  activeTab?: 'my-snippets' | 'explore';
  onNavigate: (view: 'landing' | 'dashboard', tab?: 'my-snippets' | 'explore') => void;
  onNewSnippet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeTab,
  onNavigate,
  onNewSnippet,
}) => {
  const { user, signIn, signOut, loading, isFirestoreConnected } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
                  DevCollab
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono -mt-0.5 hidden sm:block">
                realtime code studio
              </p>
            </div>
          </button>

          {/* Nav links on desktop */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('dashboard', 'my-snippets')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentView === 'dashboard' && activeTab === 'my-snippets'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                My Snippets
              </button>
              <button
                onClick={() => onNavigate('dashboard', 'explore')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentView === 'dashboard' && activeTab === 'explore'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Explore Public
              </button>
            </nav>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* New Snippet button */}
          <button
            onClick={onNewSnippet}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Snippet</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* User Auth */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate hidden sm:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-1.5 z-40 text-xs animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate">
                        {user.displayName || 'Developer'}
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 truncate text-[11px]">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('dashboard', 'my-snippets');
                      }}
                      className="w-full px-3 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      My Snippets
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('dashboard', 'explore');
                      }}
                      className="w-full px-3 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Explore Public
                    </button>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={signIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login with Google</span>
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-2">
          {user && (
            <>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('dashboard', 'my-snippets');
                }}
                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-900 dark:text-white"
              >
                <FolderGit2 className="w-4 h-4" />
                My Snippets
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('dashboard', 'explore');
                }}
                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-900 dark:text-white"
              >
                <Globe className="w-4 h-4" />
                Explore Public
              </button>
            </>
          )}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNewSnippet();
            }}
            className="w-full px-3 py-2 text-left text-sm rounded-lg bg-indigo-600 text-white flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Snippet
          </button>
        </div>
      )}
    </header>
  );
};
