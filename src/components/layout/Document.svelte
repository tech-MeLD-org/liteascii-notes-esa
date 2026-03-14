<script lang="ts">
  import { useDocument, type DocumentHeading } from '../../lib/hooks/useDocument.svelte';

  interface Props {
    headings: DocumentHeading[];
  }

  let { headings }: Props = $props();
  
  const { activeHeadingId, scrollToHeading } = useDocument(headings);
</script>

<aside class="w-[240px] flex-shrink-0 sticky top-[calc(52px+2rem)] h-fit max-h-[calc(100vh-52px-4rem)] overflow-y-auto scrollbar-hide overscroll-contain hidden lg:block">
  <div class="border-l border-[var(--color-border)] pl-2 ml-4">
    <div class="text-[0.65rem] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-5 pl-3 opacity-50">
      ON THIS PAGE
    </div>
    
    <nav id="doc-nav">
      {#each headings as heading}
        <a
          href={`#${heading.slug}`}
          class="doc-outline-link"
          class:doc-outline-link-active={activeHeadingId === heading.slug}
          class:doc-outline-level-1={heading.depth === 1}
          class:doc-outline-level-2={heading.depth === 2}
          class:doc-outline-level-3={heading.depth === 3}
          title={heading.text}
          onclick={(e) => {
            e.preventDefault();
            scrollToHeading(heading.slug);
          }}
        >
          <span class="overflow-hidden text-ellipsis whitespace-nowrap">
            {heading.text}
          </span>
        </a>
      {/each}
    </nav>
  </div>
</aside>