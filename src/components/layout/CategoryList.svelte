<script lang="ts">
  import { buildNoteTree, type TreeNode } from '../../lib/utils/note-tree';
  import { createSidebar } from '../../lib/hooks/useCategoryList.svelte';
//文档内左侧栏
  // 接收 Props (遵循你的定义)
  interface Note {
    id: string;
    data: { title?: string };
  }
  interface Props {
    allNotes?: Note[];
    currentSlug?: string;
    minWidth?: number;
    maxWidth?: number;
    defaultWidth?: number;
  }

  let { 
    allNotes = [], 
    currentSlug = '',
    minWidth = 180,
    maxWidth = 600,
    defaultWidth = 260
  }: Props = $props();

  // 使用封装的逻辑状态
  const sidebar = createSidebar({ minWidth, maxWidth, defaultWidth });

  // 派生数据：树结构
  const tree = $derived(buildNoteTree(allNotes));

  // 滚动位置恢复逻辑 (由于涉及 DOM 绑定，保留在组件内)
  let sidebarRef = $state<HTMLDivElement>();
  $effect(() => {
    if (!sidebarRef) return;
    const savedScroll = sessionStorage.getItem('explorer-scroll-pos');
    if (savedScroll) sidebarRef.scrollTop = parseInt(savedScroll, 10);
    
    const savePos = () => {
      if (sidebarRef) {
        sessionStorage.setItem('explorer-scroll-pos', sidebarRef.scrollTop.toString());
      }
    };
    
    sidebarRef.addEventListener('scroll', savePos, { passive: true });
    return () => sidebarRef?.removeEventListener('scroll', savePos);
  });
</script>

<svelte:window 
  onmousemove={sidebar.actions.handleMouseMove} 
  onmouseup={sidebar.actions.stopResize} 
/>

<aside 
  class="relative h-full border-r border-[var(--color-border)] flex-shrink-0 bg-[var(--color-bg)] z-10"
  style="width: {sidebar.width}px"
>
  <div 
    bind:this={sidebarRef}
    class="sticky top-[var(--nav-h)] px-5 py-8 max-h-[calc(100vh-var(--nav-h))] overflow-y-auto scrollbar-none"
  >
    <div class="text-[0.65rem] font-bold text-[var(--color-text-muted)] mb-5 tracking-[0.12em] opacity-70">
      EXPLORER
    </div>
    
    <div class="tree-root">
      {@render renderNode(tree)}
    </div>
  </div>

  <div 
    class="absolute -right-0.5 top-0 bottom-0 w-1 cursor-col-resize z-20 transition-colors duration-200
           hover:bg-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] {sidebar.isResizing ? 'bg-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]' : ''}"
    onmousedown={sidebar.actions.startResize}
    role="separator"
    aria-orientation="vertical"
    aria-label="调整侧边栏宽度"
  ></div>
</aside>

{#snippet renderNode(node: TreeNode, depth = 0)}
  {#each Object.values(node.children) as child}
    <details open style="--depth: {depth}">
      <summary 
        class="flex items-center px-2.5 py-1.5 text-[0.82rem] rounded cursor-pointer text-[var(--color-primary)]
               hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary-light)] whitespace-nowrap overflow-hidden text-ellipsis w-full"
        title={child.name}
      >
        {child.name}
      </summary>
      {@render renderNode(child, depth + 1)}
    </details>
  {/each}
  
  {#each node.files as file}
    <a 
      href={`/notes/${file.slug}`} 
      class="flex items-center px-2.5 py-1.5 text-[0.82rem] rounded no-underline cursor-pointer
             text-[var(--color-text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis w-full
             hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]
             {currentSlug === file.slug ? 'bg-[var(--color-primary-faint)] text-[var(--color-primary)] font-semibold' : ''}"
      style="padding-left: calc(var(--depth) * 0.8rem + 1.4rem)"
      title={file.name}
    >
      <span class="w-full overflow-hidden text-ellipsis">{file.name}</span>
    </a>
  {/each}
{/snippet}

<style>
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  :global(body.is-resizing) {
    cursor: col-resize !important;
    user-select: none !important;
  }
  
  details > summary {
    list-style: none;
    outline: none;
  }
  
  details > summary::-webkit-details-marker {
    display: none;
  }
</style>