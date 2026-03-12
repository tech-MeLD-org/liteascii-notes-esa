<script lang="ts">
  import Pill from '../ui/Pill.svelte';

  interface Props {
    title: string;
    href: string;
    date?: string;
    description?: string;
    category?: string;
    tags?: string[];
    /** 最多显示的标签数量 */
    maxTags?: number;
  }

  let {
    title,
    href,
    date,
    description,
    category,
    tags = [],
    maxTags = 3
  }: Props = $props();

  // 截断后的标签列表
  const displayedTags = $derived(tags.slice(0, maxTags));
  const hiddenTagCount = $derived(tags.length - maxTags);
</script>

<a
  {href}
  class="interactive-card ui-card ui-card-hover block p-5 group"
>
  <!-- 日期 -->
  {#if date}
    <time class="text-xs text-[#565658] font-mono block mb-2">
      {date}
    </time>
  {/if}

  <!-- 标题 -->
  <h3 class="text-lg font-semibold text-[#e8e8e6] mb-2 group-hover:text-[#e74c3c] transition-colors duration-200">
    {title}
  </h3>

  <!-- 描述 -->
  {#if description}
    <p class="text-sm text-[#a8a8a6] line-clamp-2 mb-3 leading-relaxed">
      {description}
    </p>
  {/if}

  <!-- 分类 & 标签 -->
  <div class="flex items-center gap-2 flex-wrap mt-auto">
    {#if category}
      <Pill variant="category" size="sm" label={category} autoLink={true} />
    {/if}

    {#each displayedTags as tag}
      <Pill variant="tag" size="sm" label={`#${tag}`} autoLink={true} />
    {/each}

    {#if hiddenTagCount > 0}
      <span class="ui-pill ui-pill-sm ui-pill-default text-[#565658]">
        +{hiddenTagCount}
      </span>
    {/if}
  </div>
</a>