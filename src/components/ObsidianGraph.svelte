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
          r: BASE_R + totalDegrees[i] * 2.5, // 总连接数决定大小
          fx: null,
          fy: null,
        }));

        // 颜色逻辑：只有引用其他文档时才变红，无引用为灰色
        const colorScale = (d) => {
          if (d.outDegree === 0) {
            return 'var(--text-3, #7a7a7a)'; // 无引用 = 灰色
          }
          // 引用越多，红色越深
          const ratio = d.outDegree / maxOutDegree;
          // 从浅红到深红的过渡
          const lightness = 70 - ratio * 45; // 70% -> 25%
          const saturation = 60 + ratio * 30; // 60% -> 90%
          return `hsl(6, ${saturation}%, ${lightness}%)`;
        };

        const svg = select(containerEl)
          .append("svg")
          .attr("width", w)
          .attr("height", h)
          .attr("viewBox", `${-w / 2} ${-h / 2} ${w} ${h}`)
          .style("display", "block");

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
          .attr("stroke", "var(--text-3, #7a7a7a)")
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
                // 【丝滑拖拽修复】：对数映射，消除坐标回跳
                const dist = Math.hypot(evt.x, evt.y);
                if (dist < 1) {
                  d.fx = 0;
                  d.fy = 0;
                } else {
                  const limit = 80; // 超过 80px 开始产生阻力
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
          .attr("stroke", 'var(--border, #303032)')
          .attr("stroke-width", 2);

        nodeSel
          .append("text")
          .text((d) => d.label)
          .attr("dx", (d) => d.r + 3)
          .attr("dy", "0.35em")
          .attr("font-size", "9px")
          .attr("fill", "var(--text-2, #aaa)")
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

        // ... 之前的代码保持不变，仅修改 simulation 部分 ...

        simulation = forceSimulation(nodeData)
          // 1. 【核心修改】：降低斥力系数
          // 基础斥力从 -50 降到 -20，系数从 50 降到 20
          // 这样既能保证大球推开周围，又不会让整个系统飞散
          .force(
            "charge",
            forceManyBody().strength((d) => -20 - d.totalDegree * 20),
          )

          // 2. 缩短连线距离：从 45 缩短到 30，让结构更紧凑
          .force(
            "link",
            forceLink(linkData)
              .id((d) => d.index)
              .distance(30)
              .strength(1),
          )

          // 3. 增强中心引力：强度从 0.12 提升到 0.18，让球体更倾向于聚拢在圆心
          .force("x", forceX(0).strength(0.18))
          .force("y", forceY(0).strength(0.18))

          // 4. 碰撞半径微调：保持球体间的呼吸感
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

<div class="graph-wrap">
  <div
    class="graph-circle"
    bind:this={containerEl}
    style="width:{size}px; height:{size}px"
  >
    {#if !nodes.length}
      <div class="empty"><span>Void Universe</span></div>
    {/if}
  </div>
  <p class="label">Smooth Gravity System · {nodes.length} nodes</p>
</div>

<style>
  .graph-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .graph-circle {
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg-2, #1a1a1a);
    overflow: hidden;
    position: relative;
  }
  .label {
    font-size: 0.7rem;
    color: var(--text-3);
    font-family: "Courier New", monospace;
    margin: 0;
  }
</style>