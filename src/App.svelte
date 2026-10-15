<script lang="ts">
  import { onMount } from 'svelte'
  import GameScreen from './lib/GameScreen.svelte'
  import SetupScreen from './lib/SetupScreen.svelte'
  import StartScreen from './lib/StartScreen.svelte'
  import { session } from './lib/session.svelte'

  const POLL_INTERVAL_MS = 1000
  const GAME_PATH = /^\/game\/([0-9a-f-]{36})\/?$/i

  // Map the URL to a screen. A /game/{id} link joins (or resumes) that game.
  function route() {
    const match = GAME_PATH.exec(location.pathname)
    if (match) {
      void session.open(match[1])
    } else if (session.screen === 'game') {
      session.reset()
    }
  }

  // Leave the game for the setup screen, so a new opponent can be picked.
  function startNewGame() {
    session.reset()
    if (location.pathname !== '/') history.pushState({}, '', '/')
    session.start()
  }

  onMount(() => {
    route()
    window.addEventListener('popstate', route)
    return () => window.removeEventListener('popstate', route)
  })

  // Poll GET /api/game/{id} every second whenever we are waiting on someone else.
  $effect(() => {
    if (!session.shouldPoll) return
    const id = setInterval(() => void session.refresh(), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  })
</script>

<main class="card" class:wide={session.screen === 'game'}>
  {#if session.screen === 'start'}
    <StartScreen error={session.error} onStart={() => session.start()} />
  {:else if session.screen === 'setup'}
    <SetupScreen
      busy={session.busy}
      error={session.error}
      onPlay={(opponent, figure) => session.create(opponent, figure)}
      onBack={() => session.reset()}
    />
  {:else}
    <GameScreen {session} onMenu={startNewGame} />
  {/if}
</main>
