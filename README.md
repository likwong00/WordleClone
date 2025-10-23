# Wordle Clone

This is a small Wordle clone built with mostly with Typescript, a client/app in React + Vite and a server with Express + Socket.IO.

Features
- 
- On top of the classic Wordle we all know and love, this clone also has a 1v1 dual game mode. Where each player provides a word for the other to guess, player with the least number of guesses win!
- Configurable settings include: word list (currently only 'apple' and 'hello' for testing purposes), maximum number of guesses and word length
- UI with animation similar to the original.


Installation
-
- App:
```
npm install
npm run dev
```
```
// to run tests
npm run test
```

- Server:
```
npm install
npm run build
npm run dev
```

Notes:
- This is a implementation for assessment/demo purposes. Game is reset everytime client is refreshed.

Documentumentation detailing the design decisions and trade-offs considered for this project: [design.md](design.md)
