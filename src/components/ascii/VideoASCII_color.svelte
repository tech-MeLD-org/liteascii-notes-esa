<script>
  import { onMount, onDestroy } from 'svelte';

  let { videoUrl = "/video/test01.webm", noteCount = 0 } = $props();

  let video;
  let canvas; // 用于最终显示的画布
  let bufferCanvas; // 隐藏的采样画布
  let ctx;
  let bCtx;
  let raf;

  const charset = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";
  
  // 采样分辨率（根据性能调整，100 左右是平衡点）
  const cols = 100;
  const fontSize = 10; // 每个字符占据的像素宽度

  function render() {
    if (!video || video.paused || video.ended) return;

    const rows = Math.floor((cols * video.videoHeight) / video.videoWidth);
    
    // 1. 在缓冲画布上绘制缩小后的视频
    bCtx.drawImage(video, 0, 0, cols, rows);
    const pixels = bCtx.getImageData(0, 0, cols, rows).data;

    // 2. 清除主画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. 设置字体
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        const charIdx = Math.floor((gray / 255) * (charset.length - 1));
        const char = charset[charIdx];

        // 直接在 Canvas 上绘制彩色字符，不创建 DOM
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(char, x * fontSize + fontSize / 2, y * fontSize + fontSize);
      }
    }

    raf = requestAnimationFrame(render);
  }

  onMount(() => {
    ctx = canvas.getContext('2d', { alpha: false });
    bCtx = bufferCanvas.getContext('2d', { willReadFrequently: true });

    video.addEventListener('loadedmetadata', () => {
      // 根据视频比例调整画布大小
      const aspect = video.videoHeight / video.videoWidth;
      const rows = Math.floor(cols * aspect);
      canvas.width = cols * fontSize;
      canvas.height = rows * fontSize;
      video.play();
      render();
    });
  });

  onDestroy(() => {
    cancelAnimationFrame(raf);
  });
</script>

<div class="video-ascii-container">
  <video bind:this={video} src={videoUrl} muted loop playsinline crossorigin="anonymous" style="display: none;"></video>
  <canvas bind:this={bufferCanvas} width={cols} height={60} style="display: none;"></canvas>

  <canvas bind:this={canvas} class="display-canvas"></canvas>

  <div class="overlay">
    <div class="title">CORE_ENGINE: CANVAS_ACCELERATED</div>
    {#if noteCount > 0}<div class="stats">SYNC_NODES: {noteCount}</div>{/if}
  </div>
</div>

<style>
  .video-ascii-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .display-canvas {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    /* 增加锐利感，防止缩放模糊 */
    image-rendering: pixelated;
  }

  .overlay {
    position: absolute;
    bottom: 1rem;
    background: rgba(0, 0, 0, 0.6);
    padding: 0.4rem 1rem;
    border: 1px solid #333;
    backdrop-filter: blur(4px);
    pointer-events: none;
  }

  .title { font-family: monospace; font-size: 0.7rem; color: #ff4500; }
  .stats { font-family: monospace; font-size: 0.6rem; color: #888; }
</style>