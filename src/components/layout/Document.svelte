<script lang="ts">
  import { useDocument, type DocumentHeading } from '../../lib/hooks/useDocument.svelte';
  //文档目录
  interface Props {
    headings: DocumentHeading[];
  }

  let { headings }: Props = $props();
  
  const { activeHeadingId, passingHeadingIds, scrollToHeading } = useDocument(headings);
</script>

<aside class="w-[240px] flex-shrink-0 sticky top-[calc(52px+2rem)] h-fit max-h-[calc(100vh-52px-4rem)] overflow-y-auto scrollbar-none hidden lg:block">
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

<style>
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  /* 仅保留错位差异 */
  .doc-outline-level-1 {
    padding-left: 0.5rem;
  }
  
  .doc-outline-level-2 {
    padding-left: 1.5rem;
  }
  
  .doc-outline-level-3 {
    padding-left: 2.5rem;
  }
</style>
