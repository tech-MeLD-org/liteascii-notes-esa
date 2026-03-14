<script lang="ts">
  import NoteCard from './NoteCard.svelte';

  interface Note {
    title: string;
    href: string;
    date?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }

  interface Props {
    notes: Note[];
    emptyText?: string;
    emptyHint?: string;
    highlightTag?: string;
    highlightCategory?: string;
  }

  let { 
    notes, 
    emptyText = '暂无笔记',
    emptyHint,
    highlightTag,
    highlightCategory
  }: Props = $props();
</script>

<div class="flex flex-col gap-4">
  {#each notes as note}
    <NoteCard
      title={note.title}
      href={note.href}
      date={note.date}
      description={note.description}
      category={note.category}
      tags={note.tags}
      {highlightTag}
      {highlightCategory}
    />
  {/each}
  
  {#if notes.length === 0}
    <div class="text-center py-12 border border-dashed border-border-color rounded-xl">
      <p class="text-text-muted">{emptyText}</p>
      {#if emptyHint}
        <p class="text-sm text-text-muted mt-2">{emptyHint}</p>
      {/if}
    </div>
  {/if}
</div>