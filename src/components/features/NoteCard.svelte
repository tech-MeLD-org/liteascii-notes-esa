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
    maxTags = 6,
    highlightTag,
    highlightCategory
  }: Props = $props();

  const displayedTags = $derived(tags.slice(0, maxTags));
  const hiddenTagCount = $derived(tags.length - maxTags);
</script>

<article class="interactive-card ui-card ui-card-hover flex flex-col p-5 group">
  {#if date}
    <time class="ui-card-time">
      {date}
    </time>
  {/if}

  <h3 class="ui-card-title">
    <a href={href} class="ui-card-link">
      {title}
    </a>
  </h3>

  {#if description}
    <p class="ui-card-desc">
      {description}
    </p>
  {/if}

  <div class="ui-card-footer">
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
      <span class="ui-pill ui-pill-sm ui-pill-default">
        +{hiddenTagCount}
      </span>
    {/if}
  </div>
</article>