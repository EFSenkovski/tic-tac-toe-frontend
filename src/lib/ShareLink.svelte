<script lang="ts">
  interface Props {
    link: string
  }

  let { link }: Props = $props()
  let copied = $state(false)
  let input: HTMLInputElement | undefined = $state()

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      input?.select()
      document.execCommand('copy')
    }
    copied = true
    setTimeout(() => (copied = false), 2000)
  }
</script>

<div class="share">
  <p>Send this link to your friend. The game starts as soon as they open it.</p>
  <div class="row">
    <input bind:this={input} type="text" readonly value={link} onfocus={(e) => e.currentTarget.select()} />
    <button type="button" class="primary" onclick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
  </div>
</div>

<style>
  .share {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    background: var(--cell);
    border-radius: 12px;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .row {
    display: flex;
    gap: 8px;
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    font: inherit;
    font-size: 0.9rem;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
</style>
