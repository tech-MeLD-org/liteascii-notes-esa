<script lang="ts">
  import { useExpandableList } from '../../lib/hooks/useExpandableList.svelte';
  //文件夹目录
  interface Category {
    name: string;
    href: string;
    count: number;
  }

  interface Props {
    categories: Category[];
    current?: string;
  }

  let { categories, current }: Props = $props();

  const expandable = useExpandableList({ 
    items: categories, 
    defaultShow: 6 
  });
</script>

<nav class="flex flex-col gap-1">
    {#each expandable.displayItems as category}
    {@const isActive = current === category.name}
    {@const displayName = category.name === '未分类' ? '全部' : category.name}
    {@const href = category.name === '未分类' ? '/notes' : category.href}
    <a 
      href={href}
      class="flex items-center justify-between py-2 px-3 rounded-lg text-sm transition-colors
        {isActive
          ? 'bg-[var(--color-primary-faint)] text-[var(--color-primary)] font-semibold' 
          : 'text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary-light)]'}"
    >
      <span>{displayName}</span>
      <span class="text-xs text-[var(--color-text-muted)] font-mono">{category.count}</span>
    </a>
  {/each}
  
  {#if expandable.hasMore}
    <button 
      onclick={expandable.toggle}
      class="flex items-center justify-center py-2 px-3 rounded-lg text-sm transition-colors
             text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] font-medium"
    >
      {expandable.showAll ? '收起 ↑' : `展开全部 (${expandable.remainingCount}) ↓`}
    </button>
  {/if}
</nav>