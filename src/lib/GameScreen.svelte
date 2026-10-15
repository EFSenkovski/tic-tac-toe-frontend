<script lang="ts">
  import Board from './Board.svelte'
  import Scoreboard from './Scoreboard.svelte'
  import ShareLink from './ShareLink.svelte'
  import { OPPONENT_LABEL, type GameSession } from './session.svelte'

  interface Props {
    session: GameSession
    onMenu: () => void
  }

  let { session, onMenu }: Props = $props()

  // Leaving a running game against a friend strands them, so ask first.
  const leavingStrandsFriend = $derived(
    session.seat !== null &&
      session.opponent === 'human' &&
      (session.waitingForSeat || session.playing),
  )

  function leave() {
    if (leavingStrandsFriend && !confirm("Leave this game? Your friend won't be notified.")) return
    onMenu()
  }

  const againLabel = $derived.by(() => {
    if (session.rematchAsked) return 'Waiting for your friend…'
    if (session.busy) return 'Starting…'
    if (session.rematchOffered) return 'Accept rematch'
    return 'Play again'
  })

  const subtitle = $derived.by(() => {
    if (session.spectating) return 'Watching this game'
    if (!session.seat) return ''
    const vs = session.opponent ? ` vs ${OPPONENT_LABEL[session.opponent]}` : ''
    return `You are ${session.seat.figure}${vs}`
  })

  const statusText = $derived.by(() => {
    if (session.finished) return ''
    if (session.waitingForSeat) return 'Waiting for your friend to join…'
    if (session.busy && session.pendingIndex !== null) {
      return session.opponent && session.opponent !== 'human'
        ? 'Opponent is thinking…'
        : 'Sending your move…'
    }
    if (session.spectating) return `${session.game?.currentFigure ?? '?'} to move`
    if (session.myTurn) return 'Your turn'
    return "Opponent's turn…"
  })

  const boardDisabled = $derived(!session.myTurn || session.busy)
</script>

<section class="game">
  <nav class="topbar">
    <button type="button" class="ghost menu" onclick={leave}>← Menu</button>
  </nav>

  {#if session.finished}
    <div class="banner" class:won={session.winner !== null && session.winner === session.seat?.figure} role="status">
      <strong>{session.resultText}</strong>
      <span>
        {#if session.winner}
          {session.winner} takes the game.
        {:else}
          Nobody wins this one.
        {/if}
      </span>
    </div>
  {/if}

  <header>
    <p class="subtitle">{subtitle}</p>
    {#if statusText}
      <p class="status" class:active={session.myTurn} aria-live="polite">
        {#if !session.myTurn && !session.finished}
          <span class="dot" aria-hidden="true"></span>
        {/if}
        {statusText}
      </p>
    {/if}
  </header>

  <div class="play" class:scored={session.seat !== null}>
    {#if session.seat}
      <Scoreboard score={session.score} />
    {/if}
    <div class="board-slot">
      {#if session.game === null}
        <p class="loading">Joining game…</p>
      {:else}
        <Board
          cells={session.cells}
          disabled={boardDisabled}
          highlight={session.winningLine}
          onCell={(i) => session.move(i)}
        />
      {/if}
    </div>
  </div>

  {#if session.waitingForSeat}
    <ShareLink link={session.shareLink} />
  {/if}

  {#if session.error}
    <p class="error" role="alert">{session.error}</p>
  {/if}

  {#if session.finished && session.seat}
    {#if session.rematchOffered}
      <p class="offer" role="status">Your friend wants a rematch</p>
    {/if}
    <div class="again">
      <button
        type="button"
        class="primary big"
        disabled={session.busy || session.rematchAsked}
        onclick={() => session.rematch()}
      >
        {againLabel}
      </button>
    </div>
  {/if}
</section>

<style>
  .game {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .topbar {
    display: flex;
    margin: -12px 0 -4px -8px;
  }

  .menu {
    padding: 6px 12px;
    font-size: 0.9rem;
    border-color: transparent;
    color: var(--muted);
  }

  .menu:hover:not(:disabled) {
    color: var(--text);
  }

  .play {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .board-slot {
    min-width: 0;
  }

  /* Wide screens: the score sits left of the board; an empty right column keeps the board centred. */
  @media (min-width: 720px) {
    .play.scored {
      display: grid;
      grid-template-columns: 132px minmax(0, 1fr) 132px;
      align-items: center;
      gap: 16px;
    }
  }

  header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  .subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    min-height: 1.6em;
  }

  .status.active {
    color: var(--accent);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }

  .loading {
    text-align: center;
    color: var(--muted);
  }

  .banner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 16px;
    border-radius: 14px;
    background: var(--cell);
    text-align: center;
  }

  .banner.won {
    background: var(--win);
  }

  .banner strong {
    font-size: 1.5rem;
  }

  .banner span {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .offer {
    margin: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    font-weight: 600;
    text-align: center;
  }

  .again {
    display: flex;
    justify-content: center;
  }
</style>
