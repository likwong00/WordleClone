# Design Decisions
This documment describes some thoughts and design choices I made while I was implementing this project, along with some thoughts and ideas of what can be further expanded.

Tech Stack
- 
- Due to the nature of this project, it was intuitive to use TypeScript for its strong typing, and ease of prototyping and access to numerous libraries.
- Knowing that I will need to have a backend that supports real-time multiplayer, using web sockets makes the most sense, and Sockets.IO works nicely out of the box for this use case. More on this next section.
- Started with just React + CSS for styling the client side. But as progress was made, switched to Material UI for a smoother and cleaner looking components. Especially when multiple dialogs were involved with choosing gamemodes and configurations. 

Technical Decisions
- 
- Finding the right package for english word validation. Ended with a lightweight `is-word` package for speed (using trie tree data structure) and supports multi-language options. Can also deal with edge case scenarios where British and American English have different spellings of certain words. 
- Before the server was setup, used another package for english word validation, `check-english`. Even smaller (56.5KB) and also fast, but it lacked in accuracy as it uses a fixed list of English words to predict if a string is valid, excelling in longer texts rather than just single short words. Also compatible with ESM module which is used client side.
- When choosing how the server was going to be structured. Initially decided upon a simple REST API approach, where game logic is split up into different endpoints. But after giving it more thought with Task 4 in mind, chose web sockets with Sockets.IO instead for real-time communication between player and server.

Bells and Whistles
- 

Implemented:
- Proper web UI with animations: tiles flipping after every guess, and current row on board will shake if guess is invalid. Making it more visually appealing for users.
- Game start dialog to let players choose between different gamemodes. Allowing players more flexibility and smoother UX experience.

Ideas to be implemented:
- Adding a time limit per game, could also expand the duel mode to choose a winner based on time taken instead of guesses used.
- Adding a proper dictionary of words, lazily loaded server side to provide a much more enhanced single player gameplay. Doing so also enables the word length configuration to work properly.
- Duel matchmaking, making it more seamless by searching player name rather than invite code.
- Have a database linked up with the server (Redis). Doing so allows many new features to be added such as:
    - Accounts - games are no longer stored in memory client side, when the user refreshes or leaves the app, game states will be cached and stored.
    - Stats - along with saved accounts, game stats can be tracked and displayed. Making it a more personalised experience by displaying stats such as win streaks or high scores.