<script>
  import { onMount } from "svelte";

  // 接收由 Astro 处理好的树状结构数组
  export let data = [];

  let containerEl;
  let simulation;

  // 状态控制：默认只展开 root
  let expanded = new Set(["root"]);

  onMount(() => {
    if (!containerEl || !data.length) return;

    let cleanupFn = () => {};

    Promise.all([
      import("d3-force"),
      import("d3-selection"),
      import("d3-zoom"),
      import("d3-drag"),
    ]).then(([d3Force, { select }, { zoom }, { drag }]) => {
      const width = containerEl.clientWidth;
      const height = containerEl.clientHeight;

      // 建立快速查找字典
      const nodeMap = new Map();
      const childrenMap = new Map();
      const depthMap = new Map();

      // 计算每个节点的深度
      const getDepth = (nodeId) => {
        if (nodeId === 'root') return 0;
        const parts = nodeId.split('/');
        return parts.length;
      };

      data.forEach((d) => {
        const depth = getDepth(d.id);
        depthMap.set(d.id, depth);
        
        nodeMap.set(d.id, { ...d, x: 0, y: 0, vx: 0, vy: 0, depth });
        if (!childrenMap.has(d.parentId))
          childrenMap.set(d.parentId, []);
        childrenMap.get(d.parentId).push(d.id);
      });

      const maxDepth = Math.max(...Array.from(depthMap.values()));

      const svg = select(containerEl)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("background-color", "var(--color-bg-secondary)");

      const g = svg.append("g");
      const linkGroup = g.append("g");
      const nodeGroup = g.append("g");

      const zoomFn = zoom()
        .scaleExtent([0.2, 5])
        .on("zoom", (e) => g.attr("transform", e.transform));
      svg.call(zoomFn).on("dblclick.zoom", null);

      // 物理引擎配置
      simulation = d3Force
        .forceSimulation()
        .force(
          "link",
          d3Force
            .forceLink()
            .id((d) => d.id)
            .distance(80)
            .strength(1),
        )
        .force("charge", d3Force.forceManyBody().strength(-300))
        .force(
          "collide",
          d3Force
            .forceCollide()
            .radius((d) => getRadius(d) + 3)
            .strength(0.8),
        )
        .force("x", d3Force.forceX(0).strength(0.05))
        .force("y", d3Force.forceY(0).strength(0.05));

      // 半径计算逻辑
      function getRadius(d) {
        const children = childrenMap.get(d.id) || [];
        const childCount = children.length;

        if (d.id === "root") {
          return 30 + Math.min(childCount * 2, 15);
        }

        if (d.type === "folder") {
          const baseSize = Math.max(20 - d.depth * 3, 12);
          return baseSize + Math.min(childCount * 1.5, 12);
        }

        return 5;
      }

      // 颜色计算逻辑：使用 Tailwind CSS 变量
      function getColor(d) {
        if (d.type === "file") {
          return 'var(--text-muted, #565658)';
        }

        const depthRatio = d.depth / maxDepth;
        const lightness = 30 + depthRatio * 40;
        const saturation = 80 - depthRatio * 40;
        return `hsl(6, ${saturation}%, ${lightness}%)`;
      }

      // 核心动态更新函数
      function updateGraph() {
        let visibleNodes = [];
        let visibleLinks = [];
        let queue = ["root"];

        while (queue.length > 0) {
          let currId = queue.shift();
          let node = nodeMap.get(currId);
          if (!node) continue;

          visibleNodes.push(node);

          if (expanded.has(currId)) {
            let children = childrenMap.get(currId) || [];
            children.forEach((cid) => {
              let cnode = nodeMap.get(cid);
              if (
                !visibleNodes.includes(cnode) &&
                (!cnode.x || (cnode.x === 0 && cnode.y === 0))
              ) {
                cnode.x = node.x + (Math.random() - 0.5) * 10;
                cnode.y = node.y + (Math.random() - 0.5) * 10;
              }
              visibleLinks.push({ source: currId, target: cid });
              queue.push(cid);
            });
          }
        }

        // 渲染连线
        const linkSel = linkGroup
          .selectAll("line")
          .data(visibleLinks, (d) =>
            d.source.id
              ? d.source.id + "-" + d.target.id
              : d.source + "-" + d.target,
          )
          .join("line")
          .attr("stroke", "var(--color-border-light)")
          .attr("stroke-width", 2)
          .attr("opacity", 0.6);

        // 渲染节点
        const nodeSel = nodeGroup
          .selectAll("g.node-group")
          .data(visibleNodes, (d) => d.id)
          .join(
            (enter) => {
              const el = enter
                .append("g")
                .attr("class", "node-group")
                .attr("cursor", "pointer")
                .call(
                  drag()
                    .on("start", (evt, d) => {
                      if (!evt.active)
                        simulation.alphaTarget(0.3).restart();
                      d.fx = d.x;
                      d.fy = d.y;
                    })
                    .on("drag", (evt, d) => {
                      d.fx = evt.x;
                      d.fy = evt.y;
                    })
                    .on("end", (evt, d) => {
                      if (!evt.active) simulation.alphaTarget(0);
                      d.fx = null;
                      d.fy = null;
                    }),
                );

              el.append("circle")
                .attr("r", (d) => getRadius(d))
                .attr("fill", (d) => getColor(d))
                .attr("stroke", 'var(--border-color)')
                .attr("stroke-width", 2);

              el.append("text")
                .text((d) => d.label)
                .attr("dy", (d) =>
                  d.type === "folder" ? getRadius(d) + 15 : 18,
                )
                .attr("text-anchor", "middle")
                .attr("fill", "var(--color-text)")
                .attr("font-family", "'Courier New', monospace")
                .attr("font-size", (d) =>
                  d.type === "folder" ? "11px" : "9px",
                );

              el.on("click", (evt, d) => {
                if (d.type === "file") {
                  window.location.href = d.href;
                } else {
                  if (expanded.has(d.id)) {
                    expanded.delete(d.id);
                  } else {
                    expanded.add(d.id);
                  }
                  updateGraph();
                }
              });

              return el;
            },
            (update) => {
              update.select("circle")
                .attr("r", (d) => getRadius(d))
                .attr("fill", (d) => getColor(d));
              return update;
            },
            (exit) => exit.remove(),
          );

        simulation.nodes(visibleNodes).on("tick", () => {
          linkSel
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);
          nodeSel.attr(
            "transform",
            (d) => `translate(${d.x},${d.y})`,
          );
        });

        simulation.force("link").links(visibleLinks);
        simulation.alpha(1).restart();
      }

      updateGraph();

      cleanupFn = () => {
        simulation.stop();
        select(containerEl).select("svg").remove();
      };
    });

    return () => cleanupFn();
  });
</script>

<div class="w-full h-full absolute inset-0" bind:this={containerEl}></div>