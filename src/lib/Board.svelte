<script lang="ts">
  import type { Figure } from './api'

  interface Props {
    cells: (Figure | null)[]
    disabled?: boolean
    highlight?: number[] | null
    onCell?: (index: number) => void
  }

  let { cells, disabled = false, highlight = null, onCell }: Props = $props()
</script>

<div class="board" class:disabled role="grid" aria-label="Tic-tac-toe board">
  {#each cells as cell, i (i)}
    <button
      type="button"
      class="cell"
      class:x={cell === 'X'}
      class:o={cell === 'O'}
      class:win={highlight?.includes(i)}
      disabled={disabled || cell !== null}
      aria-label={cell ? `Cell ${i + 1}: ${cell}` : `Cell ${i + 1}: empty`}
      onclick={() => onCell?.(i)}
    >
      {cell ?? ''}
    </button>
  {/each}
</div>

<style>
  .board {
    container-type: inline-size;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 12px;
    width: min(100%, 55vh, 420px);
    aspect-ratio: 1;
    margin: 0 auto;
  }

  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    font: inherit;
    font-size: 20cqw;
    font-weight: 700;
    line-height: 1;
    border: 0;
    border-radius: 18px;
    background: var(--cell);
    color: var(--text);
    cursor: pointer;
    transition:
      background 0.15s ease,
      transform 0.1s ease;
  }

  .cell:not(:disabled):hover {
    background: var(--cell-hover);
  }

  .cell:not(:disabled):active {
    transform: scale(0.96);
  }

  .cell:disabled {
    cursor: default;
  }

  .cell.x {
    color: var(--x);
  }

  .cell.o {
    color: var(--o);
  }

  .cell.win {
    background: var(--win);
  }

  .board.disabled .cell:not(.x):not(.o) {
    cursor: not-allowed;
  }
</style>
