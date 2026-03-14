<script lang="ts">
  //import NoteCard from './NoteCard.svelte';
  import Pill from '../ui/Pill.svelte';
  import type { TimelineYear, UndatedNote } from '../../lib/hooks/useTimeline.svelte';

  interface Props {
    years: TimelineYear[];
    undated: UndatedNote[];
  }

  let { years, undated }: Props = $props();
</script>

<!-- 时间轴内容 -->
{#if years.length > 0}
  <div class="relative">
    <!-- 垂直时间线 -->
    <div class="timeline-line"></div>

    {#each years as year}
      <section class="mb-12 relative">
        <!-- 年份标题 -->
        <div class="flex items-center gap-4 mb-6">
          <div class="z-10 bg-[var(--color-bg)] py-1 font-mono font-bold text-[var(--color-primary)] tracking-wider">
            {year.year}
          </div>
          <div class="flex-1 h-px bg-[var(--color-border)] opacity-50"></div>
        </div>

        <!-- 该年份的笔记列表 -->
        <div class="space-y-6">
          {#each year.notes as note}
            <article class="timeline-item relative flex gap-4 sm:gap-8">
              <!-- 左侧日期和圆点 -->
              <div class="flex flex-col items-center w-14 flex-shrink-0 pt-3">
                <time class="text-xs text-[var(--color-text-muted)] font-mono whitespace-nowrap mb-2">
                  {note.monthDay}
                </time>
                <div class="timeline-dot"></div>
              </div>

              <!-- 右侧卡片 -->
              <div class="flex-1 pb-2">
                <div class="interactive-card ui-card ui-card-hover relative flex flex-col p-4">
                  <h3 class="text-[0.95rem] font-semibold mb-3">
                    <a 
                      href={note.href} 
                      class="text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors before:absolute before:inset-0 before:z-0 outline-none"
                    >
                      {note.title}
                    </a>
                  </h3>

                  <div class="flex items-center gap-2 flex-wrap relative z-10">
                    {#if note.category}
                      <Pill variant="category" size="sm" label={note.category} autoLink={true} />
                    {/if}

                    {#each note.tags.slice(0, 3) as tag}
                      <Pill variant="tag" size="sm" label={tag} autoLink={true} />
                    {/each}

                    {#if note.tags.length > 3}
                      <span class="ui-pill ui-pill-sm ui-pill-default">
                        +{note.tags.length - 3}
                      </span>
                    {/if}

                    <span class="timeline-read-more">
                      READ →
                    </span>
                  </div>
                </div>
              </div>
            </article>
          {/each}
        </div>
      </section>
    {/each}
  </div>
{/if}

<!-- 无日期笔记 -->
{#if undated.length > 0}
  <section class="mt-16 pt-8 border-t border-[var(--color-border)]">
    <h2 class="text-xs font-mono uppercase tracking-widest text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
      <span class="w-2 h-2 bg-[var(--color-border)] rounded-full"></span>
      Undated Notes
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each undated as note}
        <a 
          href={note.href} 
          class="flex flex-col p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary-soft)] transition-all"
        >
          <span class="text-[0.9rem] font-medium text-[var(--color-text)]">{note.title}</span>
          <span class="text-[10px] font-mono text-[var(--color-text-muted)] mt-2 uppercase tracking-tight">
            {note.path}
          </span>
        </a>
      {/each}
    </div>
  </section>
{/if}