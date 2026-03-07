<script>
  /**
   * ObsidianGraph.svelte — D3-force driven knowledge graph (Quartz-style).
   *
   * Props:
   *   nodes — { id, label, href }[]
   *   edges — { source, target }[]   (source/target are numeric indices)
   *   size  — diameter in px (default 280)
   */
  import { onMount, onDestroy } from 'svelte';

  let { nodes = [], edges = [], size = 280 } = $props();

  let containerEl;    // bind:this target (the circle div)
  let simulation = null;

  // Node visual radius
  const R = 5;
  // Link rest length
  const LINK_DIST = 55;

  onMount(() => {
    const arr = Array.isArray(nodes) ? nodes : [];
    if (!arr.length || !containerEl) return;

    let cleanupFn = () => {};

    // Dynamic import — keeps d3 out of the SSR bundle
    Promise.all([
      import('d3-force'),
      import('d3-selection'),
      import('d3-zoom'),
      import('d3-drag'),
    ]).then(([
      { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide },
      { select },
      { zoom },
      { drag },
    ]) => {
      const w = size, h = size;
      // Circular boundary: nodes stay within this radius from (0,0)
      const clipR = w / 2 - R - 8;

      // Deep-copy props so d3 can attach x/y/vx/vy without mutating original
      const nodeData = arr.map(n => ({ ...n }));
      const linkData = (Array.isArray(edges) ? edges : [])
        .map(e => ({ source: e.source, target: e.target }));

      // ── SVG ──────────────────────────────────────────────────────────────
      // Centred coordinate system: (0,0) at centre of SVG
      const svg = select(containerEl)
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .attr('viewBox', `${-w / 2} ${-h / 2} ${w} ${h}`)
        .style('display', 'block');

      // A single <g> that receives zoom/pan transforms
      const g = svg.append('g');

      // ── Zoom / Pan ────────────────────────────────────────────────────────
      const zoomFn = zoom()
        .scaleExtent([0.4, 4])
        .on('zoom', evt => g.attr('transform', evt.transform));

      // Attach zoom to SVG, disable double-click zoom to avoid nav conflicts
      svg.call(zoomFn).on('dblclick.zoom', null);

      // ── Edges ─────────────────────────────────────────────────────────────
      const linkSel = g.append('g')
        .attr('class', 'edges')
        .selectAll('line')
        .data(linkData)
        .join('line')
        .attr('stroke', 'var(--border, #3a3a3a)')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.45);

      // ── Nodes ─────────────────────────────────────────────────────────────
      // Each node is a <g> containing a <circle> and a <text> label
      const nodeSel = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodeData)
        .join('g')
        .attr('cursor', 'pointer')
        .call(
          // Drag behaviour — also reheats simulation on drag start
          drag()
            .on('start', (evt, d) => {
              if (!evt.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x; d.fy = d.y;
            })
            .on('drag', (evt, d) => { d.fx = evt.x; d.fy = evt.y; })
            .on('end',  (evt, d) => {
              if (!evt.active) simulation.alphaTarget(0);
              d.fx = null; d.fy = null;
            })
        );

      // Circle fill
      nodeSel.append('circle')
        .attr('r', R)
        .attr('fill', 'var(--red, #c0392b)');

      // Text label — hidden by default, shown on hover
      nodeSel.append('text')
        .text(d => d.label)
        .attr('dx', R + 3)
        .attr('dy', '0.35em')
        .attr('font-size', '9px')
        .attr('font-family', '"Courier New", monospace')
        .attr('fill', 'var(--text-2, #aaa)')
        .attr('pointer-events', 'none')
        .style('opacity', 0)
        .style('user-select', 'none');

      // ── Hover interaction ─────────────────────────────────────────────────
      nodeSel
        .on('mouseenter', function(_, d) {
          // Highlight this node
          select(this).select('circle')
            .attr('r', R + 2)
            .attr('fill', 'var(--red-2, #e74c3c)')
            .style('filter', 'drop-shadow(0 0 4px var(--red, #c0392b))');
          select(this).select('text').style('opacity', 1);

          // Dim unconnected nodes (reference comparison after d3 resolves links)
          nodeSel.attr('opacity', nd => {
            if (nd === d) return 1;
            const adjacent = linkData.some(l =>
              (l.source === d && l.target === nd) ||
              (l.target === d && l.source === nd)
            );
            return adjacent ? 1 : 0.2;
          });

          // Highlight connected edges, dim others
          linkSel
            .attr('stroke', l =>
              (l.source === d || l.target === d)
                ? 'var(--red, #c0392b)'
                : 'var(--border, #3a3a3a)'
            )
            .attr('opacity', l =>
              (l.source === d || l.target === d) ? 0.9 : 0.08
            )
            .attr('stroke-width', l =>
              (l.source === d || l.target === d) ? 1.6 : 0.8
            );
        })
        .on('mouseleave', function() {
          // Reset all visuals
          nodeSel.attr('opacity', 1);
          nodeSel.select('circle')
            .attr('r', R)
            .attr('fill', 'var(--red, #c0392b)')
            .style('filter', null);
          nodeSel.select('text').style('opacity', 0);
          linkSel
            .attr('stroke', 'var(--border, #3a3a3a)')
            .attr('opacity', 0.45)
            .attr('stroke-width', 0.8);
        })
        .on('click', (_, d) => {
          window.location.href = d.href;
        });

      // ── D3-force simulation ───────────────────────────────────────────────
      simulation = forceSimulation(nodeData)
        // Electric repulsion: push nodes apart
        .force('charge', forceManyBody().strength(-60))
        // Spring tension: pull linked nodes together
        .force('link',   forceLink(linkData).distance(LINK_DIST))
        // Gravity: keep the graph centred
        .force('center', forceCenter(0, 0))
        // Collision: prevent node overlap
        .force('collide', forceCollide(R + 4))
        // Tick: update SVG positions each simulation step
        .on('tick', () => {
          // Enforce circular boundary (project nodes back inside clipR)
          nodeData.forEach(d => {
            const dist = Math.hypot(d.x ?? 0, d.y ?? 0);
            if (dist > clipR) {
              d.x = (d.x / dist) * clipR;
              d.y = (d.y / dist) * clipR;
            }
          });

          // Update edge positions
          linkSel
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

          // Update node positions (translate the <g>)
          nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
        });

      // ── Cleanup ───────────────────────────────────────────────────────────
      cleanupFn = () => {
        if (simulation) simulation.stop();
        // Remove d3-created SVG from DOM
        if (containerEl) select(containerEl).select('svg').remove();
      };
    });

    // Return cleanup so Svelte calls it on destroy
    return () => cleanupFn();
  });

  onDestroy(() => {
    if (simulation) simulation.stop();
  });
</script>

<!-- ── Template ─────────────────────────────────────────────────────────── -->
<div class="graph-wrap">
  <div
    class="graph-circle"
    bind:this={containerEl}
    style="width:{size}px; height:{size}px"
  >
    {#if !nodes.length}
      <div class="empty">
        <span>No links yet</span>
        <small>Add [[wikilinks]] in notes</small>
      </div>
    {/if}
  </div>
  <p class="label">Knowledge Graph · {nodes.length} notes</p>
</div>

<!-- ── Styles ────────────────────────────────────────────────────────────── -->
<style>
  .graph-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .graph-circle {
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg-2);
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }

  /* d3 creates the <svg> inside .graph-circle — keep it block-level */
  .graph-circle :global(svg) {
    display: block;
  }

  .empty {
    position: absolute; inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    pointer-events: none;
  }
  .empty span {
    font-size: 0.8rem;
    color: var(--text-2);
    font-family: 'Courier New', monospace;
  }
  .empty small {
    font-size: 0.65rem;
    color: var(--text-3);
    font-family: 'Courier New', monospace;
    text-align: center;
    padding: 0 1rem;
  }

  .label {
    font-size: 0.7rem;
    color: var(--text-3);
    font-family: 'Courier New', monospace;
    letter-spacing: 0.04em;
    margin: 0;
    text-align: center;
  }
</style>
