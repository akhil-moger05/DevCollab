import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { SnippetEditor } from './components/SnippetEditor';
import { CreateSnippetModal } from './components/CreateSnippetModal';
import { Snippet } from './types/snippet';
import {
  subscribeToUserSnippets,
  subscribeToPublicSnippets
} from './services/snippetService';

function DevCollabMain() {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'editor'>('landing');
  const [activeTab, setActiveTab] = useState<'my-snippets' | 'explore'>('my-snippets');
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [mySnippets, setMySnippets] = useState<Snippet[]>([]);
  const [publicSnippets, setPublicSnippets] = useState<Snippet[]>([]);
  const [snippetsLoading, setSnippetsLoading] = useState(true);

  // 1. Check URL parameters on mount (?id=...)
  useEffect(() => {
    const handleUrlState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const idFromUrl = searchParams.get('id');

      if (idFromUrl) {
        setActiveSnippetId(idFromUrl);
        setCurrentView('editor');
      } else {
        // If no snippet in URL and user is logged in, show dashboard, otherwise landing
        if (user) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('landing');
        }
      }
    };

    handleUrlState();
    window.addEventListener('popstate', handleUrlState);
    return () => window.removeEventListener('popstate', handleUrlState);
  }, [user]);

  // 2. Subscribe to user's snippets if signed in
  useEffect(() => {
    if (!user) {
      setMySnippets([]);
      return;
    }

    const unsub = subscribeToUserSnippets(
      user.uid,
      (snippets) => {
        setMySnippets(snippets);
        setSnippetsLoading(false);
      },
      (err) => {
        console.error('Failed to load user snippets:', err);
        setSnippetsLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // 3. Subscribe to public snippets
  useEffect(() => {
    const unsub = subscribeToPublicSnippets(
      (snippets) => {
        setPublicSnippets(snippets);
        setSnippetsLoading(false);
      },
      (err) => {
        console.error('Failed to load public snippets:', err);
        setSnippetsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Navigation handlers
  const handleNavigate = (view: 'landing' | 'dashboard', tab: 'my-snippets' | 'explore' = 'my-snippets') => {
    setActiveSnippetId(null);
    setCurrentView(view);
    setActiveTab(tab);
    // Clear URL query
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.pathname);
  };

  const handleOpenSnippet = (snippetId: string) => {
    setActiveSnippetId(snippetId);
    setCurrentView('editor');
    // Update URL query
    const url = new URL(window.location.href);
    url.searchParams.set('id', snippetId);
    window.history.pushState({}, '', url.toString());
  };

  const handleSnippetDeleted = () => {
    handleNavigate('dashboard', 'my-snippets');
  };

  const handleSnippetCreated = (snippetId: string) => {
    handleOpenSnippet(snippetId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        currentView={currentView}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onNewSnippet={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 flex flex-col">
        {currentView === 'editor' && activeSnippetId ? (
          <SnippetEditor
            snippetId={activeSnippetId}
            onBack={() => handleNavigate('dashboard', activeTab)}
            onSnippetDeleted={handleSnippetDeleted}
          />
        ) : currentView === 'dashboard' ? (
          <Dashboard
            snippets={mySnippets}
            publicSnippets={publicSnippets}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOpenSnippet={handleOpenSnippet}
            onNewSnippet={() => setIsCreateModalOpen(true)}
            loading={snippetsLoading}
          />
        ) : (
          <LandingPage
            onExplorePublic={() => handleNavigate('dashboard', 'explore')}
            onNewSnippet={() => setIsCreateModalOpen(true)}
          />
        )}
      </main>

      <CreateSnippetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSnippetCreated={handleSnippetCreated}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <DevCollabMain />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
