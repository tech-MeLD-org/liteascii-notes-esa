<script>
  /**
   * TypeWriter ASCII animation
   * Shows a typewriter effect with site title and decorative ASCII art
   * To swap animations: replace this import in AsciiArt.svelte
   */
  import { onMount, onDestroy } from 'svelte';

  let { noteCount = 0 } = $props();

  const lines = [
    '┌─────────────────────────────┐',
    '│                             │',
    '│   LiteASCII                 │',
    '│                             │',
    '│   Knowledge as a living     │',
    '│   graph of connected ideas  │',
    '│                             │',
    '└─────────────────────────────┘',
  ];

  const subtitles = [
    '探索知识的边界 · Explore the edge of knowledge',
    '连接思想的星图 · Connect the star map of ideas',
    '沉淀思考的深度 · Deepen the depth of thinking',
  ];

  let displayedLines = $state([]);
  let cursorVisible = $state(true);
  let subtitleIdx = $state(0);
  let subtitleText = $state('');
  let subtitleDone = $state(false);

  let timers = [];

  function delay(ms) {
    return new Promise(r => { timers.push(setTimeout(r, ms)); });
  }

  async function animate() {
    // Reveal lines one by one
    for (let i = 0; i < lines.length; i++) {
      displayedLines = lines.slice(0, i + 1);
      await delay(80);
    }
    await delay(300);

    // Type subtitle
    const sub = subtitles[subtitleIdx];
    for (let i = 0; i <= sub.length; i++) {
      subtitleText = sub.slice(0, i);
      await delay(35);
    }
    subtitleDone = true;
    await delay(3500);

    // Fade subtitle, pick next
    subtitleDone = false;
    subtitleText = '';
    await delay(300);
    subtitleIdx = (subtitleIdx + 1) % subtitles.length;

    // Repeat subtitle loop
    while (true) {
      const s = subtitles[subtitleIdx];
      for (let i = 0; i <= s.length; i++) {
        subtitleText = s.slice(0, i);
        await delay(35);
      }
      subtitleDone = true;
      await delay(3500);
      subtitleDone = false;
      subtitleText = '';
      await delay(300);
      subtitleIdx = (subtitleIdx + 1) % subtitles.length;
      await delay(150);
    }
  }

  let cursorTimer;
  onMount(() => {
    animate();
    cursorTimer = setInterval(() => { cursorVisible = !cursorVisible; }, 530);
  });

  onDestroy(() => {
    timers.forEach(clearTimeout);
    clearInterval(cursorTimer);
  });
</script>

<div class="ascii-wrap">
  <!-- ASCII box -->
  <pre class="ascii-pre">{#each displayedLines as line, i}
{line}{/each}{#if displayedLines.length < lines.length}<span class="cursor" class:visible={cursorVisible}>█</span>{/if}</pre>

  <!-- Subtitle typewriter -->
  <div class="subtitle">
    <span class="subtitle-text">{subtitleText}</span>
    {#if !subtitleDone}
      <span class="cursor" class:visible={cursorVisible}>|</span>
    {/if}
  </div>

  <!-- Stats -->
  {#if noteCount > 0}
    <div class="stats">
      <span>{noteCount} notes</span>
    </div>
  {/if}
</div>

<style>
  .ascii-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    height: 100%;
    padding: 2rem;
    user-select: none;
  }

  .ascii-pre {
    font-family: 'Courier New', Courier, monospace;
    font-size: clamp(0.7rem, 1.2vw, 0.95rem);
    line-height: 1.5;
    color: var(--text);
    background: transparent;
    border: none;
    margin: 0;
    white-space: pre;
    position: relative;
  }

  .subtitle {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.78rem;
    color: var(--text-2);
    letter-spacing: 0.04em;
    min-height: 1.4em;
    text-align: center;
  }

  .subtitle-text { color: var(--text-2); }

  .cursor {
    color: var(--red);
    opacity: 0;
    transition: opacity 0.1s;
  }
  .cursor.visible { opacity: 1; }

  .stats {
    font-family: 'Courier New', monospace;
    font-size: 0.72rem;
    color: var(--text-3);
    letter-spacing: 0.05em;
  }
</style>
