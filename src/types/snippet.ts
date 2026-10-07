export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  isPublic: boolean;
  tags: string[];
  ownerId: string;
  ownerName: string;
  ownerPhoto?: string;
  ownerEmail?: string;
  createdAt: any;
  updatedAt: any;
  lastEditedBy?: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  userPhoto?: string;
  cursorLine: number;
  cursorColumn: number;
  color: string;
  lastActive: any;
}

export type SupportedLanguage =
  | 'javascript'
  | 'java'
  | 'python'
  | 'cpp'
  | 'html'
  | 'css'
  | 'typescript'
  | 'json'
  | 'markdown'
  | 'sql'
  | 'go'
  | 'rust';

export interface LanguageOption {
  id: SupportedLanguage;
  name: string;
  monacoLang: string;
  extension: string;
  defaultCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    monacoLang: 'javascript',
    extension: '.js',
    defaultCode: `// DevCollab - Realtime Collaborative Code
function greetCollaborators(team) {
  console.log("Welcome to live coding with " + team.join(", "));
  return team.map(member => ({ name: member, status: "ready" }));
}

const team = ["Alice", "Bob", "Charlie"];
greetCollaborators(team);
`,
  },
  {
    id: 'python',
    name: 'Python',
    monacoLang: 'python',
    extension: '.py',
    defaultCode: `# DevCollab - Realtime Collaborative Code
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

numbers = [38, 27, 43, 3, 9, 82, 10]
print("Sorted:", quicksort(numbers))
`,
  },
  {
    id: 'java',
    name: 'Java',
    monacoLang: 'java',
    extension: '.java',
    defaultCode: `// DevCollab - Realtime Collaborative Code
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, DevCollab!");
        for (int i = 1; i <= 5; i++) {
            System.out.println("Collab pulse: " + i);
        }
    }
}
`,
  },
  {
    id: 'cpp',
    name: 'C++',
    monacoLang: 'cpp',
    extension: '.cpp',
    defaultCode: `// DevCollab - Realtime Collaborative Code
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> nums = {5, 2, 9, 1, 5, 6};
    std::sort(nums.begin(), nums.end());
    std::cout << "Sorted in C++: ";
    for (int n : nums) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    return 0;
}
`,
  },
  {
    id: 'html',
    name: 'HTML',
    monacoLang: 'html',
    extension: '.html',
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Preview</title>
  <style>
    body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .badge { background: #6366f1; padding: 4px 8px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>DevCollab Canvas</h1>
  <p>Real-time collaborative editing in action! <span class="badge">Live</span></p>
</body>
</html>
`,
  },
  {
    id: 'css',
    name: 'CSS',
    monacoLang: 'css',
    extension: '.css',
    defaultCode: `/* DevCollab - Collaborative Styles */
:root {
  --primary-accent: #6366f1;
  --bg-surface: #0f172a;
  --glow-effect: 0 0 20px rgba(99, 102, 241, 0.4);
}

.snippet-card {
  border-radius: 12px;
  background: var(--bg-surface);
  box-shadow: var(--glow-effect);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.snippet-card:hover {
  transform: translateY(-2px);
}
`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monacoLang: 'typescript',
    extension: '.ts',
    defaultCode: `// DevCollab - TypeScript Definitions
interface SnippetMetadata<T> {
  id: string;
  title: string;
  payload: T;
  readonly isLocked: boolean;
}

type EditorState = "syncing" | "idle" | "conflict";

const state: EditorState = "idle";
console.log("DevCollab TS ready:", state);
`,
  },
  {
    id: 'json',
    name: 'JSON',
    monacoLang: 'json',
    extension: '.json',
    defaultCode: `{
  "app": "DevCollab",
  "version": "1.0.0",
  "features": [
    "realtime-sync",
    "live-cursors",
    "presence-avatars",
    "google-auth"
  ],
  "monacoEnabled": true
}
`,
  },
  {
    id: 'markdown',
    name: 'Markdown',
    monacoLang: 'markdown',
    extension: '.md',
    defaultCode: `# DevCollab Collaboration

Welcome to the shared document.

### Features
- 🚀 **Realtime typing sync**
- 👥 **Live cursor positions**
- 🔒 **Public & Private permissions**

> "Code together, build faster."
`,
  },
  {
    id: 'go',
    name: 'Go',
    monacoLang: 'go',
    extension: '.go',
    defaultCode: `package main

import (
    "fmt"
    "time"
)

func main() {
    fmt.Printf("DevCollab Go session started at %v\\n", time.Now())
}
`,
  },
  {
    id: 'rust',
    name: 'Rust',
    monacoLang: 'rust',
    extension: '.rs',
    defaultCode: `fn main() {
    let devcollab = "Realtime code sync";
    println!("Welcome to {devcollab}!");
}
`,
  },
];

export const PRESENCE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
];

export function getRandomColor(seedString?: string): string {
  if (!seedString) {
    return PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];
  }
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESENCE_COLORS.length;
  return PRESENCE_COLORS[index];
}
