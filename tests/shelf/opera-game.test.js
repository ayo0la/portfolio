import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { OPERA_GAME } from '../../src/shelf/opera-game.js'

describe('OPERA_GAME', () => {
  it('has 34 entries starting from the initial position', () => {
    expect(OPERA_GAME.length).toBe(34)
    expect(OPERA_GAME[0].san).toBe('')
    expect(OPERA_GAME[0].fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
  })
  it('ends in checkmate with Rd8#', () => {
    const last = OPERA_GAME.at(-1)
    expect(last.san).toBe('Rd8#')
    expect(new Chess(last.fen + ' b - - 0 17').isCheckmate()).toBe(true)
  })
  it('stores from/to squares and only the board part of the FEN', () => {
    expect(OPERA_GAME[1]).toMatchObject({ san: 'e4', from: 'e2', to: 'e4' })
    for (const m of OPERA_GAME) expect(m.fen.includes(' ')).toBe(false)
  })
})
