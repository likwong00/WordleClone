# Wordle Clone

This is a small Wordle clone built with React + TypeScript + Vite.

Features:
- Uses a configurable word list (`src/words.json`) you can edit or extend.
- Configurable max guesses via the Settings UI.

Run locally:

```powershell
npm install
npm run dev
```

Notes:
- This is a minimal implementation for assessment/demo purposes. It doesn't persist state between page reloads.

Decisions/Trade-offs:
- Checking if submitted word is an actual word in the english dictionary. Tried using `is-word` package for speed (using trie trees) and multi-language options, but package is outdated and integrating it is not worth the hassle. Using `check-english` for Task 1 as it is lightweight and compatible for browser to load, but not 100% correct
