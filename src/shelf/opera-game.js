// Morphy vs Duke of Brunswick and Count Isouard, Paris 1858. Built once at import.
import { Chess } from 'chess.js'

const SAN = 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#'

const board = (fen) => fen.split(' ')[0]

function build() {
  const game = new Chess()
  const list = [{ fen: board(game.fen()), san: '', from: '', to: '' }]
  for (const san of SAN.split(' ')) {
    const m = game.move(san)
    list.push({ fen: board(game.fen()), san: m.san, from: m.from, to: m.to })
  }
  return list
}

export const OPERA_GAME = build()
