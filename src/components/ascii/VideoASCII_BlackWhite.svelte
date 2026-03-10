<script>
  /**
   * VideoAscii.svelte
   * 实时将视频流转换为 ASCII 字符动画
   */
  import { onMount, onDestroy } from 'svelte';


  let { videoUrl = "/video/test03.webm", noteCount = 0 } = $props();

  let video;
  let canvas;
  let ctx;
  let asciiText = $state('');
  let raf;

  // 字符密度映射表（从暗到亮）
  const charset = "@#S%?*+;:,.. "; 
  // 如果想要更细腻的效果，可以用: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,\"^`'. "

  const width = 80;  // 字符宽度（列数），越大越清晰但性能消耗越高
  const height = 45; // 字符高度（行数）

  function getAscii() {
    if (!video || video.paused || video.ended) return;

    // 1. 将视频帧绘制到微型 Canvas 上进行采样
    ctx.drawImage(video, 0, 0, width, height);
    
    // 2. 获取像素数据
    const pixels = ctx.getImageData(0, 0, width, height).data;
    let ascii = "";

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // 3. 计算亮度 (灰度值)
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // 4. 映射字符
      const charIdx = Math.floor((gray / 255) * (charset.length - 1));
      ascii += charset[charIdx];

      // 换行处理
      if ((i / 4 + 1) % width === 0) {
        ascii += "\n";
      }
    }

    asciiText = ascii;
    raf = requestAnimationFrame(getAscii);
  }

  onMount(() => {
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    video.play();
    getAscii();
  });

  onDestroy(() => {
    cancelAnimationFrame(raf);
  });
</script>

<div class="video-ascii-wrap">
  <video 
    bind:this={video} 
    src={videoUrl} 
    muted 
    loop 
    playsinline
    style="display: none;"
  ></video>

  <canvas bind:this={canvas} {width} {height} style="display: none;"></canvas>

  <pre class="ascii-render">{asciiText}</pre>

  <div class="overlay">
    <div class="title">LIVE_STREAM: ACTIVE</div>
    {#if noteCount > 0}<div class="stats">{noteCount} NOTES FOUND</div>{/if}
  </div>
</div>

<style>
  .video-ascii-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--bg-2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .ascii-render {
    font-family: 'Courier New', monospace;
    font-size: 6px; /* 字体必须非常小才能看到整体轮廓 */
    line-height: 1;
    letter-spacing: 2px;
    color: var(--text);
    white-space: pre;
    text-align: center;
    transform: scale(1.5); /* 放大以填满容器 */
    filter: brightness(1.2) contrast(1.5);
  }

  .overlay {
    position: absolute;
    bottom: 1.5rem;
    text-align: center;
    background: rgba(var(--bg-2-rgb), 0.7);
    padding: 0.5rem 1rem;
    border: 1px solid var(--border);
    backdrop-filter: blur(4px);
  }

  .title {
    font-size: 0.7rem;
    font-family: 'Courier New', monospace;
    color: var(--red);
    font-weight: bold;
  }

  .stats {
    font-size: 0.6rem;
    color: var(--text-3);
  }
</style>