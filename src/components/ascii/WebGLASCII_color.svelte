<script>
  import { onMount, onDestroy } from 'svelte';

  let { videoUrl = "/video/test.mp4", noteCount = 0 } = $props();

  let container;
  let canvas;
  let video;
  let gl;
  let program;
  let raf;

  const vs = `
    attribute vec2 position;
    varying vec2 vTexCoord;
    void main() {
      vTexCoord = position * 0.5 + 0.5;
      vTexCoord.y = 1.0 - vTexCoord.y;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fs = `
    precision mediump float;
    uniform sampler2D uVideo;
    uniform vec2 uResolution; // 实际屏幕分辨率
    uniform float uCols;      // 设定的列数，比如 160.0
    varying vec2 vTexCoord;

    void main() {
      // 1. 计算均匀的网格尺寸
      float dx = 1.0 / uCols;
      float dy = dx * (uResolution.x / uResolution.y);
      vec2 gridSize = vec2(dx, dy);

      // 2. 对齐 UV 到网格中心采样，确保像素点均匀
      vec2 gridUv = (floor(vTexCoord / gridSize) + 0.5) * gridSize;
      
      // 3. 采样颜色
      vec3 color = texture2D(uVideo, gridUv).rgb;
      
      // 4. 计算圆点掩码 (Dot Mask)
      vec2 charUV = fract(vTexCoord / gridSize);
      float dist = distance(charUV, vec2(0.5));
      // 边缘平滑度调整，0.48 让点与点之间有极小的缝隙且绝对均匀
      float mask = smoothstep(0.5, 0.48, dist);

      gl_FragColor = vec4(color * mask, 1.0);
    }
  `;

  function initGL() {
    gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) return;

    const createShader = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };

    program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  function handleResize() {
    if (!container || !canvas || !gl) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // 关键：物理像素必须同步，否则会变小或模糊
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render() {
    if (!gl || video.paused || video.ended) {
      raf = requestAnimationFrame(render);
      return;
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);

    const resLoc = gl.getUniformLocation(program, "uResolution");
    gl.uniform2f(resLoc, canvas.width, canvas.height);

    const colLoc = gl.getUniformLocation(program, "uCols");
    gl.uniform1f(colLoc, 160.0); // 这里控制点阵的精细度

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    raf = requestAnimationFrame(render);
  }

  onMount(() => {
    initGL();
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    video.addEventListener('loadedmetadata', () => {
      handleResize();
      video.play();
      render();
    });
  });

  onDestroy(() => {
    cancelAnimationFrame(raf);
  });
</script>

<div class="ascii-container" bind:this={container}>
  <video bind:this={video} src={videoUrl} muted loop playsinline crossorigin="anonymous" style="display: none;"></video>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .ascii-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px; /* 确保有足够高度 */
    background: #000;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  canvas {
    width: 100%;
    height: 100%;
    display: block;
    image-rendering: pixelated;
  }
</style>