import { useEffect, useRef } from 'react'
import { mountChessGame } from '../../sections/projects.js'

// The game restarts on every mount (flip away and back, or switch project): intended.
// The playable board laid over the open Chess Rivals record. The game itself is shared with the 2D card.
export function ChessOverlay() {
  const playRef = useRef(null)
  useEffect(() => {
    const game = mountChessGame(playRef.current)
    return () => game.destroy()
  }, [])
  return (
    <div className="chess-overlay" data-testid="chess-overlay">
      <div className="cover-motif chess-play" ref={playRef}>
        <div className="chess-board" aria-label="Playable chess board" />
        <span className="chess-status" aria-live="polite" />
        <button className="chess-reset" type="button" aria-label="Reset the game" title="Reset">{'↺'}</button>
      </div>
    </div>
  )
}
