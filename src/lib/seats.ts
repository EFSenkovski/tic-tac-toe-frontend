import type { Figure } from './api'
import type { Opponent } from './session.svelte'

/**
 * The backend hands out a player id exactly once (on create or on takeseat).
 * We keep it per game in localStorage so a page reload, or the creator
 * opening their own share link, resumes the seat instead of losing it.
 * The opponent is kept too, since the backend never says who sits opposite.
 */
export interface Seat {
  playerId: string
  figure: Figure
  opponent?: Opponent
}

const KEY = 'tic-tac-toe.seats'

function load(): Record<string, Seat> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function rememberSeat(gameId: string, seat: Seat): void {
  try {
    const all = load()
    all[gameId] = seat
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // storage unavailable: the seat lives only in memory for this page
  }
}

export function recallSeat(gameId: string): Seat | null {
  return load()[gameId] ?? null
}
