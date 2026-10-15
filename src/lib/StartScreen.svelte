<script lang="ts">
  interface Props {
    error?: string | null
    onStart: () => void
  }

  let { error = null, onStart }: Props = $props()
</script>

<section class="start">
  <h1>Tic-Tac-Toe</h1>
  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
  <button type="button" class="primary big" onclick={onStart}>Start</button>
</section>

<style>
  .start {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 8vw, 3rem);
    letter-spacing: -0.02em;
  }
</style>
