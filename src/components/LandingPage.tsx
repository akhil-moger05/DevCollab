import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  Users2,
  Zap,
  Lock,
  Share2,
  Tags,
  Sparkles,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Eye,
  Laptop
} from 'lucide-react';

interface LandingPageProps {
  onExplorePublic: () => void;
  onNewSnippet: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExplorePublic,
  onNewSnippet,
}) => {
  const { user, signIn, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'javascript' | 'python' | 'cpp'>('javascript');

  const demoSnippets = {
    javascript: `// Realtime Pair Programming on DevCollab
import { createServer } from 'node:http';

export function handleRealtimeSync(client) {
  client.on('keystroke', (event) => {
    // Broadcast instantly to all online collaborators
    broadcastCursorPosition(client.userId, event.cursor);
  });
}
`,
    python: `# Realtime collaborative Python algorithm
def find_optimal_path(graph, start, goal):
    visited = set()
    queue = [[start]]
    while queue:
        path = queue.pop(0)
        node = path[-1]
        if node == goal:
            return path
        for neighbor in graph.get(node, []):
            new_path = list(path)
            new_path.append(neighbor)
            queue.append(new_path)
`,
    cpp: `// High-performance concurrency snippet
#include <iostream>
#include <thread>
#include <vector>

void worker(int id) {
    std::cout << "Collaborator thread " << id << " active\\n";
}

int main() {
    std::vector<std::thread> team;
    for(int i = 0; i < 4; ++i) team.emplace_back(worker, i);
    for(auto& t : team) t.join();
}
`,
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Realtime Code Snippet Sharing & Live Collaboration</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Code Together in Realtime with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">
              DevCollab
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Share code instantly, collaborate with live cursors, and keep your snippets organized. 
            Powered by Monaco Editor and Firestore real-time sync.
          </p>

          {/* Call to Action */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {!user ? (
              <button
                onClick={signIn}
                disabled={loading}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                </svg>
                <span>Login with Google</span>
              </button>
            ) : (
              <button
                onClick={onNewSnippet}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <span>Create New Snippet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onExplorePublic}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium text-sm bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-zinc-400" />
              <span>Explore Public Snippets</span>
            </button>
          </div>

          {/* Social Proof / Security Badges */}
          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No credit card needed
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Live cursor sync
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Monaco Editor engine
            </span>
          </div>
        </div>

        {/* Live Interactive Mockup Showcase */}
        <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Top Window Bar */}
          <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-400">devcollab-session.live</span>
            </div>

            {/* Language Switcher preview tabs */}
            <div className="flex items-center gap-1 bg-zinc-900 px-1 py-0.5 rounded-lg border border-zinc-800 text-xs">
              {(['javascript', 'python', 'cpp'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`px-2.5 py-1 rounded capitalize font-mono text-xs transition-colors ${
                    activeTab === lang
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lang === 'cpp' ? 'C++' : lang}
                </button>
              ))}
            </div>

            {/* Simulated Collaborators Avatars */}
            <div className="flex items-center -space-x-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-zinc-950">
                A
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-zinc-950">
                M
              </div>
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-zinc-950">
                S
              </div>
              <span className="pl-3 text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 3 online
              </span>
            </div>
          </div>

          {/* Simulated Code Body with simulated live cursor */}
          <div className="p-5 font-mono text-xs sm:text-sm text-zinc-300 bg-zinc-950/60 overflow-x-auto relative min-h-[220px]">
            {/* Live Cursor Flag 1 */}
            <div className="absolute top-12 left-64 hidden sm:flex items-center gap-1 pointer-events-none">
              <div className="w-0.5 h-5 bg-cyan-400 animate-pulse" />
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500 text-zinc-950 rounded shadow">
                Alex (typing...)
              </span>
            </div>

            {/* Live Cursor Flag 2 */}
            <div className="absolute bottom-12 right-48 hidden sm:flex items-center gap-1 pointer-events-none">
              <div className="w-0.5 h-5 bg-purple-400 animate-pulse" />
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-500 text-white rounded shadow">
                Sarah
              </span>
            </div>

            <pre className="text-zinc-300 leading-relaxed">
              <code>{demoSnippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered for Fast, Frictionless Collaboration
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-2">
            Everything you need to share, review, and hack on code with colleagues in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-white">Realtime Keystroke Sync</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              When one person types, everyone sees the code change instantly. No refresh, no Git merge conflicts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-white">Live Cursors & Presence</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              See who is currently active on the snippet, along with their avatar and exact cursor position highlighted in real-time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-white">Monaco Editor Power</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Built on the same engine that powers VS Code. Full syntax highlighting for JS, Java, Python, C++, HTML, CSS, and more.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-white">Public & Private Vaults</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Toggle between Public (viewable by anyone with the link) and Private (accessible strictly by you). Enforced by Firestore rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-white">One-Click Share Links</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Generate instant shareable URLs with a dedicated Copy Link button. Send snippets to teammates via Slack, Discord, or email.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Tags className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-white">Tags & Instant Search</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Tag your code with keywords like "react", "sorting", or "auth". Quickly search through snippets by title, tag, or language.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} DevCollab • Realtime Collaborative Code Snippets</p>
      </footer>
    </div>
  );
};
