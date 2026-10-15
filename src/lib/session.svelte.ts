import { api, ApiError, type Figure, type GameView, type PlayerType } from './api'
import { recallSeat, rememberSeat, type Seat } from './seats'

export type Opponent = 'human' | 'easy' | 'medium' | 'hard'
export type Screen = 'start' | 'setup' | 'game'

export const OPPONENT_LABEL: Record<Opponent, string> = {
  human: 'a friend',
  easy: 'Easy AI',
  medium: 'Medium AI',
  hard: 'Hard AI',
}

export interface Score {
  you: number
  draw: number
  opponent: number
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function describe(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong'
}

function seatOf(game: GameView, opponent: Opponent | null): Seat | null {
  if (!game.myPlayer) return null
  return {
    playerId: game.myPlayer.playerId,
    figure: game.myPlayer.figure,
    ...(opponent ? { opponent } : {}),
  }
}

export function gamePath(gameId: string): string {
  return `/game/${gameId}`
}

/**
 * All client state for one visit, written with Svelte 5 runes.
 * Polling itself is driven from App.svelte through `shouldPoll` + `refresh()`.
 */
export class GameSession {
  screen = $state<Screen>('start')
  game = $state<GameView | null>(null)
  seat = $state<Seat | null>(null)
  opponent = $state<Opponent | null>(null)
  busy = $state(false)
  pendingIndex = $state<number | null>(null)
  error = $state<string | null>(null)
  /** Games finished in this run of Rematches. Lives only in memory: a reload or the menu starts over. */
  score = $state<Score>({ you: 0, draw: 0, opponent: 0 })

  /** Bumped by every state-changing request so a stale poll can never overwrite it. */
  private version = 0
  /** Games already added to `score`, so a finished Game seen on many polls counts once. */
  private counted = new Set<string>()

  readonly cells = $derived.by<(Figure | null)[]>(() => {
    const board = this.game?.board ?? '_________'
    return Array.from({ length: 9 }, (_, i) => {
      const c = board[i]
      if (c === 'X' || c === 'O') return c
      if (this.pendingIndex === i && this.seat) return this.seat.figure
      return null
    })
  })

  readonly waitingForSeat = $derived(this.game?.phase === 'WAITING_FOR_SECOND_PLAYER')
  readonly playing = $derived(this.game?.phase === 'PLAYING')
  readonly finished = $derived(this.game?.phase === 'FINISHED')
  readonly spectating = $derived(this.game !== null && this.seat === null)
  readonly againstMachine = $derived(this.opponent !== null && this.opponent !== 'human')

  readonly myTurn = $derived(
    this.playing && this.seat !== null && this.game?.currentFigure === this.seat.figure,
  )

  /** I asked for a Rematch and my friend has not answered yet. */
  readonly rematchAsked = $derived(
    this.finished &&
      this.seat !== null &&
      (this.game?.rematchAskedBy ?? []).includes(this.seat.figure),
  )

  /** My friend asked for a Rematch and is waiting on me. The machine never asks; it just agrees. */
  readonly rematchOffered = $derived(
    this.finished &&
      this.seat !== null &&
      !this.rematchAsked &&
      (this.game?.rematchAskedBy ?? []).some((f) => f !== this.seat?.figure),
  )

  /**
   * A finished Game is still polled when a Rematch can come out of it: so a
   * human sees their friend ask, and a spectator can follow to the next Game.
   * Against the machine nothing changes after the end, so polling stops.
   */
  readonly shouldPoll = $derived(
    this.game !== null && !this.busy && (this.finished ? !this.againstMachine : !this.myTurn),
  )

  readonly shareLink = $derived(
    this.game ? `${location.origin}${gamePath(this.game.gameId)}` : '',
  )

  readonly winner = $derived<Figure | null>(
    this.game?.status === 'XWINS' ? 'X' : this.game?.status === 'OWINS' ? 'O' : null,
  )

  readonly winningLine = $derived.by<number[] | null>(() => {
    if (!this.winner) return null
    const board = this.game?.board ?? ''
    return WINNING_LINES.find((line) => line.every((i) => board[i] === this.winner)) ?? null
  })

  readonly resultText = $derived.by(() => {
    if (!this.finished) return ''
    if (!this.winner) return "It's a draw"
    if (!this.seat) return `${this.winner} wins`
    return this.winner === this.seat.figure ? 'You won!' : 'You lost'
  })

  start(): void {
    this.error = null
    this.screen = 'setup'
  }

  async create(opponent: Opponent, figure: Figure): Promise<void> {
    if (this.busy) return
    this.busy = true
    this.error = null
    this.version++
    try {
      const other: PlayerType = opponent === 'human' ? 'user' : opponent
      const game = await api.createGame({
        playerOne: figure === 'X' ? 'user' : other,
        playerTwo: figure === 'O' ? 'user' : other,
        myFigure: figure,
      })
      const seat = seatOf(game, opponent)
      if (seat) rememberSeat(game.gameId, seat)
      this.enter(game, seat, opponent)
      history.pushState({}, '', gamePath(game.gameId))
    } catch (e) {
      this.error = describe(e)
    } finally {
      this.busy = false
    }
  }

  /** Called when the page is opened on a /game/{id} link. */
  async open(gameId: string): Promise<void> {
    if (this.game?.gameId === gameId) return
    this.busy = true
    this.error = null
    this.version++
    this.screen = 'game'
    this.game = null
    this.seat = null
    this.opponent = null
    this.clearScore()
    try {
      const known = recallSeat(gameId)
      if (known) {
        this.enter(await api.getGame(gameId), known, known.opponent ?? null, true)
        return
      }
      try {
        const game = await api.takeSeat(gameId)
        const seat = seatOf(game, 'human')
        if (seat) rememberSeat(gameId, seat)
        this.enter(game, seat, 'human')
      } catch (e) {
        // 409: both seats are taken (or it is an AI game). Watch instead.
        if (e instanceof ApiError && e.status === 409) {
          this.enter(await api.getGame(gameId), null, null, true)
        } else {
          throw e
        }
      }
    } catch (e) {
      this.error = describe(e)
      this.game = null
      this.screen = 'start'
      history.replaceState({}, '', '/')
    } finally {
      this.busy = false
    }
  }

  /** One poll of GET /api/game/{id}. Safe to call on an interval. */
  async refresh(): Promise<void> {
    const gameId = this.game?.gameId
    if (!gameId || this.busy) return
    const version = this.version
    try {
      const game = await api.getGame(gameId)
      if (this.version === version && this.game?.gameId === gameId) {
        this.show(game)
        this.error = null
        if (game.nextGameId) await this.followRematch(game.nextGameId)
      }
    } catch (e) {
      if (this.version === version) this.error = describe(e)
    }
  }

  async move(index: number): Promise<void> {
    if (!this.game || !this.seat || !this.myTurn || this.busy || this.cells[index]) return
    const { gameId } = this.game
    this.busy = true
    this.error = null
    this.pendingIndex = index
    this.version++
    try {
      this.show(await api.makeMove(gameId, this.seat.playerId, index))
    } catch (e) {
      this.error = describe(e)
      // A rule rejection means our view was stale; resync from the server.
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) {
        try {
          this.show(await api.getGame(gameId))
        } catch {
          // keep the error we already have
        }
      }
    } finally {
      this.pendingIndex = null
      this.busy = false
    }
  }

  /**
   * Ask for a Rematch of the finished Game. Against the machine, or when the
   * friend already asked, this lands in the next Game. Otherwise we stay on the
   * finished Game and polling picks up the next Game once the friend agrees.
   */
  async rematch(): Promise<void> {
    if (!this.game || !this.seat || !this.finished || this.busy) return
    this.busy = true
    this.error = null
    this.version++
    try {
      const view = await api.rematch(this.game.gameId, this.seat.playerId)
      if (view.myPlayer) {
        this.continueIn(view, seatOf(view, this.opponent))
      } else {
        this.show(view)
      }
    } catch (e) {
      this.error = describe(e)
    } finally {
      this.busy = false
    }
  }

  /** Back to the very first screen, forgetting the current game and the score. */
  reset(): void {
    this.version++
    this.game = null
    this.seat = null
    this.opponent = null
    this.pendingIndex = null
    this.error = null
    this.busy = false
    this.screen = 'start'
    this.clearScore()
  }

  /**
   * The finished Game has a next Game. A Player who asked collects their seat
   * in it with the same rematch call; a spectator just starts watching it.
   */
  private async followRematch(nextGameId: string): Promise<void> {
    if (this.seat) {
      if (this.rematchAsked) await this.rematch()
      return
    }
    this.busy = true
    this.version++
    try {
      this.continueIn(await api.getGame(nextGameId), null)
    } catch (e) {
      this.error = describe(e)
    } finally {
      this.busy = false
    }
  }

  /** Move into the next Game of the run, keeping the score and replacing the URL. */
  private continueIn(game: GameView, seat: Seat | null): void {
    if (seat) rememberSeat(game.gameId, seat)
    this.seat = seat
    this.show(game)
    history.replaceState({}, '', gamePath(game.gameId))
  }

  private enter(
    game: GameView,
    seat: Seat | null,
    opponent: Opponent | null,
    resumed = false,
  ): void {
    // A Game that was already over when the page opened is not part of the run.
    if (resumed && game.phase === 'FINISHED') this.counted.add(game.gameId)
    this.seat = seat
    this.opponent = opponent
    this.show(game)
    this.screen = 'game'
  }

  private show(game: GameView): void {
    this.game = game
    this.tally(game)
  }

  private tally(game: GameView): void {
    if (game.phase !== 'FINISHED' || !this.seat || this.counted.has(game.gameId)) return
    this.counted.add(game.gameId)
    if (game.status === 'DRAW') this.score.draw++
    else if (game.status === (this.seat.figure === 'X' ? 'XWINS' : 'OWINS')) this.score.you++
    else this.score.opponent++
  }

  private clearScore(): void {
    this.counted.clear()
    this.score = { you: 0, draw: 0, opponent: 0 }
  }
}

export const session = new GameSession()
