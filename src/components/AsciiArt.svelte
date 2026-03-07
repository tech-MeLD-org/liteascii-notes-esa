<script>
  /**
   * AsciiArt.svelte — Swappable ASCII animation container.
   *
   * To use a different animation, change the import below:
   *   import Animation from './ascii/TypeWriter.svelte';   ← current
   *   import Animation from './ascii/VideoASCII_BlackWhite.svelte';   ← video ascii black and white
   *   import Animation from './ascii/VideoASCII_color.svelte';   ← video ascii color
   *   import Animation from './ascii/WebGLASCII_color.svelte';   ← WebGL ascii color
  
   */
  
  import Animation from './ascii/WebGLASCII_color.svelte';
  

  let { noteCount = 0 } = $props();
</script>

<div class="ascii-container">
  <Animation {noteCount} />
</div>

<style>
  .ascii-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-2);
    border-radius: 8px;
    border: 1px solid var(--border);
    overflow: hidden;
    min-height: 280px;
  }
</style>
