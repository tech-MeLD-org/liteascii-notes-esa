<script lang="ts">
  import Pill from '../ui/Pill.svelte';

  interface Props {
    title: string;
    href: string;
    date?: string;
    description?: string;
    category?: string;
    tags?: string[];
    maxTags?: number;
    highlightTag?: string;
    highlightCategory?: string;
  }

  let {
    title,
    href,
    date,
    description,
    category,
    tags = [],
    maxTags = 3,
    highlightTag,
    highlightCategory
  }: Props = $props();

  const displayedTags = $derived(tags.slice(0, maxTags));
  const hiddenTagCount = $derived(tags.length - maxTags);
</script>

<article class="interactive-card ui-card ui-card-hover flex flex-col p-5 group relative">
  {#if date}
    <time class="text-xs text-[#565658] font-mono block mb-2 relative z-10 pointer-events-none">
      {date}
    </time>
  {/if}

  <h3 class="text-lg font-semibold mb-2 transition-colors duration-200">
    <a 
      href={href} 
      class="text-[#e8e8e6] group-hover:text-[#e74c3c] before:absolute before:inset-0 before:z-0 outline-none"
    >
      {title}
    </a>
  </h3>

  {#if description}
    <p class="text-sm text-[#a8a8a6] line-clamp-2 mb-3 leading-relaxed relative z-10 pointer-events-none">
      {description}
    </p>
  {/if}

  <div class="flex items-center gap-2 flex-wrap mt-auto relative z-10">
    {#if category}
      <Pill 
        variant={category === highlightCategory ? 'category-active' : 'category'} 
        size="sm" 
        label={category} 
        autoLink={true} 
      />
    {/if}

    {#each displayedTags as tag}
      <Pill 
        variant={tag === highlightTag ? 'tag-active' : 'tag'} 
        size="sm" 
        label={tag} 
        autoLink={true} 
      />
    {/each}

    {#if hiddenTagCount > 0}
      <span class="ui-pill ui-pill-sm ui-pill-default text-[#565658]">
        +{hiddenTagCount}
      </span>
    {/if}
  </div>
</article>