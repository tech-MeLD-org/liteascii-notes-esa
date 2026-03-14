<script lang="ts">
  import Pill from '../ui/Pill.svelte';
  import type { TimelineYear, UndatedNote } from '../../lib/hooks/useTimeline.svelte';

  interface Props {
    years: TimelineYear[];
    undated: UndatedNote[];
  }

  let { years, undated }: Props = $props();
</script>

{#if years.length > 0}
  <div class="relative">
    <div class="timeline-line"></div>

    {#each years as year}
      <section class="timeline-year-section">
        <div class="timeline-year-header">
          <div class="timeline-year-badge">
            {year.year}
          </div>
          <div class="timeline-year-divider"></div>
        </div>

        <div class="timeline-notes-list">
          {#each year.notes as note}
            <article class="timeline-item">
              <div class="timeline-date-wrapper">
                <time class="timeline-date-text">
                  {note.monthDay}
                </time>
                <div class="timeline-dot"></div>
              </div>

              <div class="timeline-card-wrapper">
                <div class="interactive-card ui-card ui-card-hover p-4 group flex flex-col relative">
                  <h3 class="ui-card-title text-[0.95rem]">
                    <a href={note.href} class="ui-card-link">
                      {note.title}
                    </a>
                  </h3>

                  <div class="ui-card-footer">
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

{#if undated.length > 0}
  <section class="undated-section">
    <h2 class="undated-header">
      <span class="undated-dot"></span>
      Undated Notes
    </h2>
    <div class="undated-grid">
      {#each undated as note}
        <a href={note.href} class="undated-card">
          <span class="undated-title">{note.title}</span>
          <span class="undated-path">{note.path}</span>
        </a>
      {/each}
    </div>
  </section>
{/if}