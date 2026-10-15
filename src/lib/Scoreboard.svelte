<script lang="ts">
  import type { Score } from './session.svelte'

  interface Props {
    score: Score
  }

  let { score }: Props = $props()
</script>

<aside class="score" aria-label="Score">
  <div class="stat you">
    <span>You</span>
    <strong>{score.you}</strong>
  </div>
  <div class="stat">
    <span>Draw</span>
    <strong>{score.draw}</strong>
  </div>
  <div class="stat">
    <span>Opponent</span>
    <strong>{score.opponent}</strong>
  </div>
</aside>

<style>
  .score {
    display: flex;
    gap: 8px;
    padding: 10px;
    background: var(--cell);
    border-radius: 14px;
  }

  .stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    min-width: 0;
  }

  span {
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  strong {
    font-size: 1.6rem;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .you strong {
    color: var(--accent);
  }

  @media (min-width: 720px) {
    .score {
      flex-direction: column;
      padding: 14px 10px;
    }

    .stat + .stat {
      border-top: 1px solid var(--border);
      padding-top: 12px;
    }
  }
</style>
