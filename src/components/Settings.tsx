import React, { useState } from 'react'

export default function Settings({ game }: any) {
  const [max, setMax] = useState(game.maxGuesses || 6)
  const [wordText, setWordText] = useState('')

  function apply() {
    const words = wordText.split(/\s*,\s*/).filter(Boolean)
    game.setConfig({ maxGuesses: Number(max), words: words.length ? words : undefined })
    game.reset()
  }

  return (
    <div className="settings">
      <label>Max guesses: <input type="number" value={max} min={1} max={10} onChange={(e) => setMax(Number(e.target.value))} /></label>
      <label>Additional words (comma separated): <input value={wordText} onChange={(e) => setWordText(e.target.value)} /></label>
      <button onClick={apply}>Apply</button>
    </div>
  )
}
