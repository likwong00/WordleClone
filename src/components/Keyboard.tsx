import React from 'react'

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

export default function Keyboard({ game }: any) {
  const { addChar, backspace, submitGuess, letterStates } = game

  function keyOnClick(letter: string) {
    addChar(letter.toLowerCase())
  }

  return (
    <div className="keyboard">
      {ROWS.map((r) => (
        <div key={r} className="kb-row">
          {Array.from(r).map((c) => {
            const st = letterStates ? letterStates[c.toLowerCase()] : undefined
            return (
              <button key={c} onClick={() => keyOnClick(c)} className={st || ''}>{c}</button>
            )
          })}
        </div>
      ))}
      <div className="kb-controls">
        <button onClick={backspace}>BACK</button>
        <button onClick={submitGuess}>ENTER</button>
      </div>
    </div>
  )
}
