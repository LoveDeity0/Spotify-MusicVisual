document.addEventListener("DOMContentLoaded", function () {
  d3.json('/sankey-data').then(function (data) {
    const width = 500;
    const height = 300;

    const svg = d3.select("#sankey-chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const sankey = d3.sankey()
      .nodeId(d => d.name)
      .nodeWidth(15)
      .nodePadding(10)
      .nodeSort((a, b) => {
        const priority = {
          "Good for Exercise": 1,
          "Good for Morning Routine": 2,
          "Good for Work/Study": 3,
          "Good for Running": 4,
          "Good for Driving": 5,
          "Good for Party": 6,
          "Good for Relaxation/Meditation": 7,
          "Good for Yoga/Stretching": 8,
          "Good for Social Gatherings": 9
        };
        return d3.ascending(priority[a.name], priority[b.name]);
      })
      .extent([[1, 1], [width - 1, height - 6]]);

    const graph = sankey({
      nodes: data.nodes.map(d => Object.assign({}, d)),
      links: data.links.map(d => Object.assign({}, d))
    });

    // 定义颜色
    const startColor = d3.lab("#FADADD");  // 浅粉
    const endColor = d3.lab("#F5C1E2");    // 柔和淡紫粉

    const color = d3.scaleOrdinal()
      .domain(data.nodes.map(d => d.name))
      .range(d3.quantize(t => d3.interpolateLab(startColor, endColor)(t), data.nodes.length));

    // 创建渐变
    const defs = svg.append("defs");
    graph.links.forEach((link, i) => {
      const gradientID = `gradient-${i}`;
      const grad = defs.append("linearGradient")
        .attr("id", gradientID)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", link.source.x1)
        .attr("x2", link.target.x0)
        .attr("y1", (link.source.y0 + link.source.y1) / 2)
        .attr("y2", (link.target.y0 + link.target.y1) / 2);

      grad.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", link.source.color || "#ccc");

      grad.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", link.target.color || "#ccc");

      link.gradientID = gradientID;
    });

    // 绘制 link
    svg.append("g")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", d => `url(#${d.gradientID})`)
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("opacity", 0.6)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke-width", d.width + 2);
        tooltip.style("opacity", 1)
          .html(`<strong>${d.source.name} → ${d.target.name}</strong><br>Value: ${d.value}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mousemove", function (event) {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.6).attr("stroke-width", d => Math.max(1, d.width));
        tooltip.style("opacity", 0);
      });

    // 绘制 node
    const node = svg.append("g")
      .selectAll("g")
      .data(graph.nodes)
      .join("g");

    node.append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", d => d.color || "#ccc")
      .attr("stroke", "#000");

    node.append("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .style("font-size", "12px")
      .style("font-family", "sans-serif")
      .style("fill", "#333")
      .text(d => d.name);


    // 添加 tooltip
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("padding", "6px 12px")
      .style("background", "rgba(255, 255, 255, 0.9)")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("font-family", "sans-serif")
      .style("opacity", 0)
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)");
  }).catch(e => console.error("加载失败", e));
});
