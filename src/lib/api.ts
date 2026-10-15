export type Figure = 'X' | 'O'
export type Phase = 'WAITING_FOR_SECOND_PLAYER' | 'PLAYING' | 'FINISHED'
export type Status = 'DRAW' | 'XWINS' | 'OWINS' | 'NOT_FINISHED'
export type PlayerType = 'user' | 'easy' | 'medium' | 'hard'

export interface PlayerView {
  playerId: string
  figure: Figure
}

export interface GameView {
  gameId: string
  currentFigure: Figure | null
  myPlayer?: PlayerView | null
  phase: Phase
  status: Status
  board: string
  /** Figures of the Players who asked for a Rematch of this finished Game. */
  rematchAskedBy: Figure[]
  /** The Rematch of this Game, once every human Player has asked for it. */
  nextGameId: string | null
}

export interface CreateGameRequest {
  playerOne: PlayerType
  playerTwo: PlayerType
  myFigure: Figure
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const BASE: string = import.meta.env.VITE_API_BASE ?? ''

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server')
  }

  if (!response.ok) {
    let detail = response.statusText || `Request failed (${response.status})`
    try {
      const problem = await response.json()
      detail = problem.detail ?? problem.title ?? detail
    } catch {
      // body was not JSON; keep the status text
    }
    throw new ApiError(response.status, detail)
  }

  return (await response.json()) as T
}

export const api = {
  createGame: (body: CreateGameRequest) =>
    request<GameView>('/api/game', { method: 'POST', body: JSON.stringify(body) }),

  getGame: (gameId: string) => request<GameView>(`/api/game/${gameId}`),

  takeSeat: (gameId: string) =>
    request<GameView>('/api/game/takeseat', { method: 'POST', body: JSON.stringify({ gameId }) }),

  /**
   * Ask for a Rematch of a finished Game. Returns the finished Game while the
   * other human has not asked yet, otherwise the next Game with `myPlayer` set.
   */
  rematch: (gameId: string, playerId: string) =>
    request<GameView>('/api/game/rematch', {
      method: 'POST',
      body: JSON.stringify({ gameId, playerId }),
    }),

  makeMove: (gameId: string, playerId: string, index: number) =>
    request<GameView>('/api/game/move', {
      method: 'POST',
      body: JSON.stringify({ gameId, playerId, index }),
    }),
}
