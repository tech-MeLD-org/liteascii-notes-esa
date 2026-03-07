<script>
  import { onMount, onDestroy } from 'svelte';

  let canvas;
  let animationId;
  let containerEl;

  // ASCII art frames for morphing title
  const titleLines = [
    '// KNOWLEDGE SPACE',
    'LiteASCII',
    'UNDERSTANDING ROOTS IN REALITY',
  ];

  onMount(() => {
    const ctx = canvas.getContext('2d');

    let w = containerEl.offsetWidth;
    let h = containerEl.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    const fontSize = 13;
    const cols = Math.floor(w / fontSize);
    // Initialize drop positions randomly
    const drops = Array.from({ length: cols }, () => Math.random() * -50);

    // Character sets for the rain
    const charSet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*[]{}|;:,.?/\\~`ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθRUNΔΣΦΩあいうえおかきくけこさしすせそなにぬねのはひふへほ';

    let frame = 0;
    let lastTime = 0;
    const fps = 20;
    const interval = 1000 / fps;

    const draw = (timestamp) => {
      if (timestamp - lastTime < interval) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;
      frame++;

      // Fade trail
      ctx.fillStyle = 'rgba(8, 8, 8, 0.06)';
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${fontSize}px 'Courier New', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = charSet[Math.floor(Math.random() * charSet.length)];
        const y = drops[i] * fontSize;

        // Color variation: bright head, gradient body
        if (drops[i] < 1) {
          ctx.fillStyle = '#ff9999';
        } else {
          const alpha = Math.random() * 0.7 + 0.2;
          ctx.fillStyle = `rgba(229, 62, 62, ${alpha})`;
        }

        ctx.fillText(char, i * fontSize, y);

        // Reset after reaching bottom
        if (y > h && Math.random() > 0.978) {
          drops[i] = 0;
        }
        drops[i] += 0.7;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    // Resize handler
    const resize = () => {
      w = containerEl.offsetWidth;
      h = containerEl.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      drops.length = Math.floor(w / fontSize);
      for (let i = drops.length - 1; i >= 0; i--) {
        if (drops[i] === undefined) drops[i] = Math.random() * -50;
      }
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
  });
</script>

<div class="ascii-wrap" bind:this={containerEl}>
  <canvas bind:this={canvas} class="ascii-canvas"></canvas>

  <!-- Overlay content -->
  <div class="overlay">
    <div class="center-content">
      <div class="prefix-line">_ _ _ _ _ _ _ _ _ _ _ _ _ _ _</div>

      <div class="main-title">LiteASCII</div>

      <div class="sub-line">
        <span class="bracket">[</span>
        <span class="sub-text">UNDERSTANDING ROOTS IN REALITY</span>
        <span class="bracket">]</span>
      </div>

      <div class="code-block">
        <span class="code-comment">// Knowledge grows through connection</span>
      </div>

      <div class="stats-row">
        <div class="stat">
          <span class="stat-val">∞</span>
          <span class="stat-label">Ideas</span>
        </div>
        <div class="stat-sep">·</div>
        <div class="stat">
          <span class="stat-val">Σ</span>
          <span class="stat-label">Connections</span>
        </div>
        <div class="stat-sep">·</div>
        <div class="stat">
          <span class="stat-val">Δ</span>
          <span class="stat-label">Growth</span>
        </div>
      </div>

      <div class="scroll-hint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
        <span>探索文章</span>
      </div>
    </div>
  </div>

  <!-- Corner decorations -->
  <div class="corner corner-tl">┌</div>
  <div class="corner corner-tr">┐</div>
  <div class="corner corner-bl">└</div>
  <div class="corner corner-br">┘</div>
</div>

<style>
  .ascii-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #080808;
  }

  .ascii-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .center-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    text-align: center;
    padding: 2rem;
    background: rgba(8, 8, 8, 0.6);
    border: 1px solid rgba(229, 62, 62, 0.15);
    box-shadow: 0 0 40px rgba(229, 62, 62, 0.08), inset 0 0 40px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    max-width: 520px;
    width: 90%;
  }

  .prefix-line {
    font-family: 'Courier New', monospace;
    font-size: 0.6rem;
    color: rgba(229, 62, 62, 0.3);
    letter-spacing: 4px;
    white-space: nowrap;
    overflow: hidden;
  }

  .main-title {
    font-family: 'Georgia', serif;
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: bold;
    color: #f0f0f0;
    text-shadow:
      0 0 30px rgba(229, 62, 62, 0.6),
      0 0 60px rgba(229, 62, 62, 0.2);
    line-height: 1;
    letter-spacing: 0.1em;
  }

  .sub-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Courier New', monospace;
    font-size: 0.65rem;
    letter-spacing: 3px;
    color: #e53e3e;
    opacity: 0.7;
  }

  .bracket {
    color: #7a1a1a;
    font-size: 0.9rem;
  }

  .sub-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
  }

  .code-block {
    padding: 6px 14px;
    background: rgba(229, 62, 62, 0.06);
    border-left: 2px solid #e53e3e;
  }

  .code-comment {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: #888;
    font-style: italic;
  }

  .stats-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    font-family: 'Courier New', monospace;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .stat-val {
    font-size: 1.2rem;
    color: #e53e3e;
    font-weight: bold;
  }

  .stat-label {
    font-size: 0.55rem;
    color: #555;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .stat-sep {
    color: #333;
    font-size: 1.2rem;
  }

  .scroll-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(229, 62, 62, 0.5);
    font-family: 'Courier New', monospace;
    font-size: 0.65rem;
    letter-spacing: 2px;
    animation: float 2s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(4px); }
  }

  /* Corner decorations */
  .corner {
    position: absolute;
    font-family: 'Courier New', monospace;
    font-size: 1.2rem;
    color: rgba(229, 62, 62, 0.3);
    pointer-events: none;
    line-height: 1;
  }

  .corner-tl { top: 8px; left: 10px; }
  .corner-tr { top: 8px; right: 10px; }
  .corner-bl { bottom: 8px; left: 10px; }
  .corner-br { bottom: 8px; right: 10px; }
</style>
