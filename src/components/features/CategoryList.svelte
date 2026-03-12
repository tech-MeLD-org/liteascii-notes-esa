<script lang="ts">
  // 确保路径正确，引入你定义的统一逻辑
  import { isVisibleNote } from '../../utils/note-logic';

  interface Props {
    allNotes?: any[];
    currentCategory?: string;
  }

  let { allNotes = [], currentCategory = "" }: Props = $props();

  // ── 状态管理 ──────────────────────────────────────────────────────────
  let sidebarWidth = $state(260);
  let isResizing = $state(false);
  let sidebarRef = $state<HTMLElement>();
  
  let startX = 0;
  let startWidth = 0;

  // ── 逻辑修复：正确的 $derived 使用方式 ──────────────────────────────────
  // 1. 先过滤出可见笔记
  const validNotes = $derived(allNotes.filter(isVisibleNote));

  // 2. 直接在 $derived 内部进行逻辑计算，不要写成立即执行函数
  const categories = $derived.by(() => {
    const map = new Map<string, number>();
    
    validNotes.forEach(note => {
      const cat = note.data?.category || '未分类';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  // ── 交互逻辑 (保持不变) ───────────────────────────────────────────────
  function startResize(e: MouseEvent) {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function stopResize() {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('category-sidebar-width', sidebarWidth.toString());
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isResizing) return;
    const deltaX = e.clientX - startX;
    sidebarWidth = Math.min(Math.max(startWidth + deltaX, 180), 600);
  }

  $effect(() => {
    const saved = localStorage.getItem('category-sidebar-width');
    if (saved) sidebarWidth = parseInt(saved, 10);
  });
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={stopResize} />

<aside 
  class="relative h-full border-r border-border bg-bg shrink-0 z-10"
  style="width: {sidebarWidth}px"
>
  <div 
    bind:this={sidebarRef}
    class="sticky top-[52px] p-6 max-h-[calc(100vh-52px)] overflow-y-auto overscroll-contain scrollbar-none"
  >
    <div class="text-[10px] font-bold text-text-muted mb-6 tracking-[0.2em] uppercase opacity-60">
      Category Explorer
    </div>

    <ul class="space-y-1">
      {#each categories as cat}
        {@const isActive = currentCategory === cat.name}
        <li>
          <a 
            href={cat.name === '未分类' ? '/notes' : `/category/${cat.name}`}
            class="group flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all
                   {isActive 
                     ? 'bg-primary/10 text-primary font-medium' 
                     : 'text-text-secondary hover:bg-bg-secondary hover:text-text-main'}"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-1.5 h-1.5 rounded-full {isActive ? 'bg-primary' : 'bg-border group-hover:bg-primary/50'} transition-colors"></div>
              <span class="truncate">{cat.name}</span>
            </div>
            
            <span class="font-mono text-[10px] opacity-40 group-hover:opacity-100">
              {cat.count.toString().padStart(2, '0')}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div 
    onmousedown={startResize}
    class="absolute right-[-2px] inset-y-0 w-1 cursor-col-resize z-20 transition-colors
      {isResizing ? 'bg-primary opacity-50' : 'hover:bg-primary/30'}"
  ></div>
</aside>

<style>
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
</style>