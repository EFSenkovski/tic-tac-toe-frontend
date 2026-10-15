<script lang="ts">
  import type { Figure } from './api'
  import type { Opponent } from './session.svelte'

  interface Props {
    busy?: boolean
    error?: string | null
    onPlay: (opponent: Opponent, figure: Figure) => void
    onBack: () => void
  }

  let { busy = false, error = null, onPlay, onBack }: Props = $props()

  let opponent = $state<Opponent>('human')
  let figure = $state<Figure>('X')

  const opponents: { value: Opponent; title: string; hint: string }[] = [
    { value: 'human', title: 'A friend', hint: 'Share a link and play together' },
    { value: 'easy', title: 'Easy AI', hint: 'Plays random moves' },
    { value: 'medium', title: 'Medium AI', hint: 'Takes wins and blocks yours' },
    { value: 'hard', title: 'Hard AI', hint: 'Never loses' },
  ]
</script>

<section class="setup">
  <h2>Who do you want to play against?</h2>

  <div class="options" role="radiogroup" aria-label="Opponent">
    {#each opponents as o (o.value)}
      <button
        type="button"
        class="option"
        class:selected={opponent === o.value}
        role="radio"
        aria-checked={opponent === o.value}
        onclick={() => (opponent = o.value)}
      >
        <strong>{o.title}</strong>
        <span>{o.hint}</span>
      </button>
    {/each}
  </div>

  {#if opponent === 'human'}
    <p class="hint">You create the game, so you play as X and open. Your friend gets O.</p>
  {:else}
  <h2>Which figure do you want?</h2>

  <div class="figures" role="radiogroup" aria-label="Figure">
    {#each ['X', 'O'] as const as f (f)}
      <button
        type="button"
        class="figure"
        class:selected={figure === f}
        class:x={f === 'X'}
        class:o={f === 'O'}
        role="radio"
        aria-checked={figure === f}
        onclick={() => (figure = f)}
      >
        {f}
      </button>
    {/each}
  </div>
  <p class="hint">X always opens.</p>
  {/if}

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  <div class="actions">
    <button type="button" class="ghost" onclick={onBack} disabled={busy}>Back</button>
    <button type="button" class="primary" onclick={() => onPlay(opponent, opponent === 'human' ? 'X' : figure)} disabled={busy}>
      {busy ? 'Creating game…' : 'Play'}
    </button>
  </div>
</section>

<style>
  .setup {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h2 {
    margin: 0.5rem 0 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px;
    text-align: left;
    font: inherit;
    color: var(--text);
    background: var(--cell);
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
  }

  .option span {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .option:hover,
  .figure:hover {
    background: var(--cell-hover);
  }

  .selected {
    border-color: var(--accent) !important;
    background: var(--cell-hover);
  }

  .figures {
    display: flex;
    gap: 10px;
  }

  .figure {
    flex: 1;
    padding: 12px;
    font: inherit;
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    color: var(--text);
    background: var(--cell);
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
  }

  .figure.x {
    color: var(--x);
  }

  .figure.o {
    color: var(--o);
  }

  .hint {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 0.5rem;
  }

  @media (max-width: 420px) {
    .options {
      grid-template-columns: 1fr;
    }
  }
</style>
