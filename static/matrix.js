document.addEventListener("DOMContentLoaded", function () {
  d3.json('/matrix-data').then(function (data) {
    const fields = data.fields;
    const matrix = data.matrix;

    const cellSize = 45;
    const margin = { top: 20, right: 80, bottom: 60, left: 30 };
    const width = fields.length * cellSize;
    const height = fields.length * cellSize;

    const svg = d3.select("#matrix-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const colorScale  = d3.scaleLinear()
      .domain([-1, 0, 1])
      .range(["#A6D1E6", "#F0F0F0", "#F4B6C2"]);

    // 添加浮动 tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "heatmap-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(255, 255, 255, 0.9)")
      .style("padding", "6px 10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("font-family", "sans-serif")
      .style("pointer-events", "none")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)");

    // 绘制热力图格子
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll("rect")
      .data(fields.flatMap((row, i) =>
        fields.map((col, j) => ({
          x: j,
          y: i,
          value: matrix[i][j],
          row: row,
          col: col
        }))
      ))
      .join("rect")
      .attr("x", d => d.x * cellSize)
      .attr("y", d => d.y * cellSize)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", d => colorScale(d.value))
      .attr('stroke', '#333')
      .attr('stroke-width', 1.0)
      .attr("rx", 4)
      .attr("ry", 4)
      .on("mouseover", function (event, d) {
        tooltip.style("visibility", "visible")
          .text(`${d.row} 与 ${d.col} 相关性: ${d.value.toFixed(3)}`);
        d3.select(this).attr("stroke", "#222").attr("stroke-width", 2);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
        d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.0);
      });

    // 添加数值文本
    g.selectAll("text")
      .data(fields.flatMap((row, i) =>
        fields.map((col, j) => ({
          x: j,
          y: i,
          value: matrix[i][j]
        }))
      ))
      .join("text")
      .attr("x", d => d.x * cellSize + cellSize / 2)
      .attr("y", d => d.y * cellSize + cellSize / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", d => Math.abs(d.value) > 0.5 ? "white" : "black")
      .style("font-size", "8px")
      .text(d => d.value.toFixed(2));

    // 添加 x 轴标签
    svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top - 5})`)
      .selectAll("text")
      .data(fields)
      .join("text")
      .attr("transform", (d, i) => {
        const x = i * cellSize + cellSize / 2;
        const y = 360;
        return `translate(${x},${y}) rotate(-45)`;
      })
      .attr("text-anchor", "end")
      .style("font-size", "8px")
      .text(d => d);

    // 添加 y 轴标签
//    svg.append("g")
//      .attr("transform", `translate(${margin.left - 5},${margin.top})`)
//      .selectAll("text")
//      .data(fields)
//      .join("text")
//      .attr("x", 0)
//      .attr("y", (d, i) => i * cellSize + cellSize / 2)
//      .attr("text-anchor", "end")
//      .attr("dominant-baseline", "middle")
//      .style("font-size", "8px")
//      .text(d => d);

    // 图例尺寸
    const legendHeight = 315;
    const legendWidth = 12;

    const legendScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".1f"));

    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 140}, ${margin.top})`);

    // 渐变定义
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%").attr("y1", "100%")
      .attr("x2", "0%").attr("y2", "0%");

    gradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.01))
      .enter()
      .append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => colorScale(-1 + d * 2));  // -1 ~ 1

    // 绘制 legend 色条
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("filter", "drop-shadow(1px 1px 2px rgba(0,0,0,0.2))")
      .style("fill", "url(#legend-gradient)");

    // 添加包围色条的边框线
    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "none")         // 透明填充
      .attr("stroke", "#666")       // 轴线颜色
      .attr("stroke-width", 1);     // 线宽

    // 添加刻度
    legend.append("g")
      .attr("transform", `translate(${legendWidth + 5}, 0)`)  // 轴位于色条右侧
      .call(legendAxis)
      .call(g => {
        g.select(".domain").remove();               // 移除坐标轴主线
        g.selectAll(".tick line").remove();         // 移除所有 tick 小短线
      })
      .selectAll("text")
      .style("font-family", "Segoe UI, Roboto, sans-serif")
      .style("font-size", "10px")
      .style("fill", "#333")
      .style("font-weight", "500");

  }).catch(e => console.error("加载失败", e));
});
