import React from 'react'
import { useEffect } from 'react'
import { useGame } from './game'
import Board from './components/Board'
import Keyboard from './components/Keyboard'
import Settings from './components/Settings'
import Stats from './components/Stats'

export default function App() {
  const game = useGame()

  // physical keyboard handling
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (game.gameOver) return
      const k = e.key
      if (k === 'Enter') return game.submitGuess()
      if (k === 'Backspace') return game.backspace()
      if (/^[a-zA-Z]$/.test(k)) return game.addChar(k.toLowerCase())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [game])

  return (
    <div className="app">
      <h1>Wordle Clone</h1>
      <Settings game={game} />
      <Board game={game} />
      <Keyboard game={game} />
      <Stats stats={game.stats} />

      {game.gameOver && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>{game.lastResult === 'win' ? 'You win!' : 'Game over'}</h2>
            <p>Answer: <strong>{game.answer}</strong></p>
            {game.lastResult === 'win' && game.guessesUsed != null && (
              <p>Guesses used: <strong>{game.guessesUsed}</strong></p>
            )}
            <div className="overlay-actions">
              <button onClick={game.reset}>Play again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
