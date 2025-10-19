import React from 'react'

export default function Stats({ stats }: any) {
  if (!stats) return null
  return (
    <div className="stats">
      <div>Played: {stats.played}</div>
      <div>Wins: {stats.wins}</div>
      <div>Current Streak: {stats.currentStreak}</div>
      <div>Max Streak: {stats.maxStreak}</div>
    </div>
  )
}
