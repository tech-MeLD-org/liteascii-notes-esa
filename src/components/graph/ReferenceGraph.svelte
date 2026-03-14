<script>
  import { onMount, onDestroy } from "svelte";

  let { nodes = [], edges = [], size = 280 } = $props();

  let containerEl;
  let simulation = null;

  const BASE_R = 4;
  const LINK_DIST = 45;

  onMount(() => {
    const arr = Array.isArray(nodes) ? nodes : [];
    if (!arr.length || !containerEl) return;

    let cleanupFn = () => {};

    Promise.all([
      import("d3-force"),
      import("d3-selection"),
      import("d3-zoom"),
      import("d3-drag"),
    ]).then(
      ([
        {
          forceSimulation,
          forceLink,
          forceManyBody,
          forceX,
          forceY,
          forceCollide,
        },
        { select },
        { zoom },
        { drag },
      ]) => {
        const w = size,
          h = size;
        const innerRadius = size / 2;

        const linkData = (Array.isArray(edges) ? edges : []).map((e) => ({
          source: e.source,
          target: e.target,
        }));

        // 计算每个节点的出度（引用其他文档的数量）
        const outDegrees = arr.map(
          (_, i) =>
            linkData.filter((l) => l.source === i).length,
        );
        // 计算总度数（用于大小计算）
        const totalDegrees = arr.map(
          (_, i) =>
            linkData.filter((l) => l.source === i || l.target === i).length,
        );
        const maxOutDegree = Math.max(...outDegrees, 1);

        const nodeData = arr.map((n, i) => ({
          ...n,
          index: i,
          outDegree: outDegrees[i],
          totalDegree: totalDegrees[i],
          r: BASE_R + totalDegrees[i] * 2.5,
          fx: null,
          fy: null,
        }));

        // 颜色逻辑：使用 CSS 变量
        const colorScale = (d) => {
          if (d.outDegree === 0) {
            return 'var(--text-muted, #565658)';
          }
          const ratio = d.outDegree / maxOutDegree;
          const lightness = 70 - ratio * 45;
          const saturation = 60 + ratio * 30;
          return `hsl(6, ${saturation}%, ${lightness}%)`;
        };

        const svg = select(containerEl)
          .append("svg")
          .attr("width", w)
          .attr("height", h)
          .attr("viewBox", `${-w / 2} ${-h / 2} ${w} ${h}`)
          .style("display", "block")
          .style("background-color", "var(--color-bg-secondary)");

        const defs = svg.append("defs");
        defs
          .append("clipPath")
          .attr("id", "graph-clip")
          .append("circle")
          .attr("r", innerRadius);

        const mainG = svg.append("g").attr("clip-path", "url(#graph-clip)");
        const g = mainG.append("g");

        const zoomFn = zoom()
          .scaleExtent([0.3, 10])
          .on("zoom", (evt) => g.attr("transform", evt.transform));
        svg.call(zoomFn).on("dblclick.zoom", null);

        const linkSel = g
          .append("g")
          .selectAll("line")
          .data(linkData)
          .join("line")
          .attr("stroke", "var(--color-border-light)")
          .attr("opacity", 0.7)
          .attr(
            "stroke-width",
            (l) =>
              2.0 +
              (nodeData[l.source].totalDegree + nodeData[l.target].totalDegree) * 0.2,
          );

        const nodeSel = g
          .append("g")
          .selectAll("g")
          .data(nodeData)
          .join("g")
          .attr("cursor", "pointer")
          .call(
            drag()
              .on("start", (evt, d) => {
                if (!evt.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
              })
              .on("drag", (evt, d) => {
                const dist = Math.hypot(evt.x, evt.y);
                if (dist < 1) {
                  d.fx = 0;
                  d.fy = 0;
                } else {
                  const limit = 80;
                  const slowedDist =
                    dist <= limit ? dist : limit + Math.log(dist / limit) * 40;
                  const ratio = slowedDist / dist;
                  d.fx = evt.x * ratio;
                  d.fy = evt.y * ratio;
                }
              })
              .on("end", (evt, d) => {
                if (!evt.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
              }),
          );

        nodeSel
          .append("circle")
          .attr("r", (d) => d.r)
          .attr("fill", (d) => colorScale(d))
          .attr("stroke", "var(--border-color)")
          .attr("stroke-width", 2);

        nodeSel
          .append("text")
          .text((d) => d.label)
          .attr("dx", (d) => d.r + 3)
          .attr("dy", "0.35em")
          .attr("font-size", "9px")
          .attr("fill", "var(--color-text)")
          .style("opacity", 0)
          .style("pointer-events", "none");

        nodeSel
          .on("mouseenter", function (_, d) {
            select(this).select("circle").attr("fill", "hsl(6, 80%, 85%)");
            select(this).select("text").style("opacity", 1);
            nodeSel.attr("opacity", (nd) => {
              if (nd.index === d.index) return 1;
              const isNeighbor = linkData.some(
                (l) =>
                  (l.source.index === d.index && l.target.index === nd.index) ||
                  (l.target.index === d.index && l.source.index === nd.index),
              );
              return isNeighbor ? 1 : 0.1;
            });
          })
          .on("mouseleave", function () {
            nodeSel
              .attr("opacity", 1)
              .select("circle")
              .attr("fill", (d) => colorScale(d));
            nodeSel.select("text").style("opacity", 0);
          })
          .on("click", (_, d) => {
            window.location.href = d.href;
          });

        simulation = forceSimulation(nodeData)
          .force(
            "charge",
            forceManyBody().strength((d) => -20 - d.totalDegree * 20),
          )
          .force(
            "link",
            forceLink(linkData)
              .id((d) => d.index)
              .distance(30)
              .strength(1),
          )
          .force("x", forceX(0).strength(0.18))
          .force("y", forceY(0).strength(0.18))
          .force(
            "collide",
            forceCollide()
              .radius((d) => d.r + 4)
              .strength(1),
          )
          .on("tick", () => {
            linkSel
              .attr("x1", (d) => d.source.x)
              .attr("y1", (d) => d.source.y)
              .attr("x2", (d) => d.target.x)
              .attr("y2", (d) => d.target.y);
            nodeSel.attr(
              "transform",
              (d) => `translate(${d.x || 0},${d.y || 0})`,
            );
          });

        cleanupFn = () => {
          if (simulation) simulation.stop();
          if (containerEl) select(containerEl).select("svg").remove();
        };
      },
    );
    return () => cleanupFn();
  });
</script>

<div class="flex flex-col items-center gap-2">
  <div
    class="rounded-full border border-border-color bg-bg-secondary overflow-hidden relative"
    bind:this={containerEl}
    style="width:{size}px; height:{size}px"
  >
    {#if !nodes.length}
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-text-muted text-sm">Void Universe</span>
      </div>
    {/if}
  </div>
  <p class="text-xs text-text-muted font-mono">Smooth Gravity System · {nodes.length} nodes</p>
</div>