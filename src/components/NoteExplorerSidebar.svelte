<script>
  import { pathToSlug } from '../lib/core/note-logic.ts';
  
  let { allNotes = [], currentSlug = "" } = $props();

  // 状态管理
  let sidebarWidth = $state(260); 
  let isResizing = $state(false);
  let sidebarRef = $state();
  
  // 记录拖拽起始点，防止“跳变”
  let startX = 0;
  let startWidth = 0;

  function buildTree(notes) {
    const root = { name: 'root', children: {}, files: [] };
    notes.forEach(note => {
      const parts = note.id.split('/');
      const fileName = parts.pop();
      let current = root;
      parts.forEach(dir => {
        if (!current.children[dir]) current.children[dir] = { name: dir, children: {}, files: [] };
        current = current.children[dir];
      });
      current.files.push({ name: note.data.title || fileName.replace(/\.md$/, ''), slug: pathToSlug(note.id) });
    });
    return root;
  }
  const tree = $derived(buildTree(allNotes));

  // 1. 拖拽开始
  function startResize(e) {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX; // 记录点下时的鼠标位置
    startWidth = sidebarWidth; // 记录点下时的宽度
    document.body.classList.add('is-resizing');
  }

  // 2. 拖拽停止
  function stopResize() {
    if (!isResizing) return;
    isResizing = false;
    document.body.classList.remove('is-resizing');
    // 拖拽结束才存入本地，减少性能损耗
    localStorage.setItem('sidebar-width', sidebarWidth.toString());
  }

  // 3. 拖拽中：计算偏移量
  function handleMouseMove(e) {
    if (!isResizing) return;
    const deltaX = e.clientX - startX; // 计算鼠标移动了多少距离
    const newWidth = Math.min(Math.max(startWidth + deltaX, 180), 600);
    sidebarWidth = newWidth;
  }

  $effect(() => {
    // 页面加载时恢复宽度
    const saved = localStorage.getItem('sidebar-width');
    if (saved) sidebarWidth = parseInt(saved, 10);
    
    if (sidebarRef) {
      const savedScroll = sessionStorage.getItem('explorer-scroll-pos');
      if (savedScroll) sidebarRef.scrollTop = parseInt(savedScroll, 10);
      const savePos = () => sessionStorage.setItem('explorer-scroll-pos', sidebarRef.scrollTop.toString());
      sidebarRef.addEventListener('scroll', savePos, { passive: true });
      return () => sidebarRef.removeEventListener('scroll', savePos);
    }
  });
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={stopResize} />

<aside class="explorer-sidebar" style="width: {sidebarWidth}px">
  <div class="sidebar-inner" bind:this={sidebarRef}>
    <div class="sidebar-label">EXPLORER</div>
    <div class="tree-root">
      {#snippet renderNode(node, depth = 0)}
        {#each Object.values(node.children) as child}
          <details open style="--depth: {depth}">
            <summary class="folder-label" title={child.name}>{child.name}</summary>
            {@render renderNode(child, depth + 1)}
          </details>
        {/each}
        {#each node.files as file}
          <a 
            href={`/notes/${file.slug}`} 
            class="tree-file" 
            class:active={currentSlug === file.slug} 
            style="--depth: {depth}"
            title={file.name}
          >
            <span class="file-text">{file.name}</span>
          </a>
        {/each}
      {/snippet}
      {@render renderNode(tree)}
    </div>
  </div>

  <div class="resizer" onmousedown={startResize} class:active={isResizing}></div>
</aside>

<style>
  .explorer-sidebar { 
    position: relative; 
    height: 100%; 
    border-right: 1px solid var(--border); 
    flex-shrink: 0; 
    background: var(--bg);
    z-index: 10;
  }
  
  .sidebar-inner { 
    position: sticky; top: var(--nav-h); padding: 2rem 1.25rem; 
    max-height: calc(100vh - var(--nav-h)); overflow-y: auto;
    overscroll-behavior: contain; scrollbar-width: none;
  }
  .sidebar-inner::-webkit-scrollbar { display: none; }

  .resizer {
    position: absolute; right: -2px; top: 0; bottom: 0; width: 4px;
    cursor: col-resize; z-index: 20; transition: background 0.2s;
  }
  .resizer:hover, .resizer.active { background: var(--red); opacity: 0.6; }

  .folder-label, .tree-file { 
    display: flex; align-items: center; padding: 0.35rem 0.6rem; 
    font-size: 0.82rem; border-radius: 4px; 
    text-decoration: none; cursor: pointer;
  }
  
  /* 文件夹保持原来的颜色 */
  .folder-label {
    color: var(--text-3);
  }
  
  /* 文档文件更亮一些，方便区分 */
  .tree-file {
    color: var(--text-2);
  }
  
  .folder-label, .file-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
  .folder-label:hover, .tree-file:hover { background: var(--bg-2); color: var(--text); }
  .tree-file.active { background: var(--red-faint); color: var(--red); font-weight: 600; }
  
  .folder-label { padding-left: calc(var(--depth) * 0.8rem + 0.5rem); font-weight: 500; }
  .tree-file { padding-left: calc(var(--depth) * 0.8rem + 1.4rem); }
  
  summary { list-style: none; outline: none; }
  .sidebar-label { font-size: 0.65rem; font-weight: 700; color: var(--text-3); margin-bottom: 1.2rem; letter-spacing: 0.12em; opacity: 0.7; }

  :global(body.is-resizing) { cursor: col-resize !important; user-select: none !important; }
</style>