# DevCollab – Review Report

## Fixed in this version
| # | Problem | Fix |
|---|---------|-----|
| 1 | `npm install` failed (esbuild version clash with Vite 8) | Removed unused `esbuild` |
| 2 | Unused packages (express, dotenv, @google/genai, motion, tsx, autoprefixer) | Removed |
| 3 | Signed-out visitors could type in public snippets, then got "Failed to sync" errors | Editing needs sign-in |
| 4 | Remote text pushed into Monaco triggered a save back (echo writes) | Guard flag added |
| 5 | Remote updates ignored while typing, editor could stay stale | Latest remote update applied after save |
| 6 | Unsaved code lost if you left within 500 ms | Flush on leave |
| 7 | A write on every cursor move (cost + quota) | Throttled to 1 per 1.5 s |
| 8 | Remote cursor color/name label were not applied | Fixed CSS classes per color |
| 9 | Listener error callbacks threw errors | Now only log |
| 10 | Owner email stored in public snippet documents | No longer saved |
| 11 | Public query had no limit | `limit(100)` |
| 12 | Wrong README claims, no `firebase.json` | Fixed, files added |
| 13 | Vite config warning (`__dirname`), package name `react-example` | Fixed |

## Still to do (not changed)
1. Delete the old `ownerEmail` field from existing snippets in Firestore.
2. Real conflict-free editing (Yjs) – current sync is last-write-wins.
3. Owner switch: who can edit a public snippet.
4. Sorted + paginated Explore list (needs Firestore index).
5. Restrict API key by domain in Google Cloud Console; add budget alert.
6. Presence `userName` / `userPhoto` are client-supplied: keep sanitising them.
7. Add tests, ESLint, GitHub Actions CI, screenshots + live demo link in README.
8. Accessibility: aria-labels on icon buttons, Escape key to close modals.

## Not tested
Checked by reading code, `tsc --noEmit`, and `vite build` (all pass).
Not tested in a browser with your live Firebase. Please test with two browsers.
