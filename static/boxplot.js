document.addEventListener("DOMContentLoaded", function () {
  d3.json('/boxplot-data').then(function (raw) {
    const customColors = ['#85edff', '#c7ffe7', '#fff8eb', '#ffdbdd', '#f9f7e7', '#d0f0fd', '#a0e7d9'];

    const data = Object.entries(raw).map(([key, values], i) => {
      values = values.filter(v => v != null).sort(d3.ascending);
      const q1 = d3.quantile(values, 0.25);
      const median = d3.quantile(values, 0.5);
      const q3 = d3.quantile(values, 0.75);
      const iqr = q3 - q1;
      const lowerFence = q1 - 3.0 * iqr;
      const upperFence = q3 + 3.0 * iqr;
      const min = d3.min(values.filter(v => v >= lowerFence));
      const max = d3.max(values.filter(v => v <= upperFence));
      return { key, values, stats: { min, q1, median, q3, max, lowerFence, upperFence }, color: customColors[i % customColors.length] };
    });
    // 按中位数从小到大排序
    data.sort((a, b) => a.stats.median - b.stats.median);

    const margin = { top: 40, right: 30, bottom: 30, left: 10 };
    const width = 500 - margin.left - margin.right;
    const height = data.length * 52;

    const svg = d3.select("#boxplot-chart")
      .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
      .domain(data.map(d => d.key))
      .range([0, height])
      .padding(0.3);

    const allValues = data.flatMap(d => d.values);
    const x = d3.scaleLinear()
      .domain([0, d3.max(allValues) * 1.05])
      .range([0, width]);

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d => d.toFixed(1)))
      .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#999");

    svg.selectAll(".domain").remove();

    svg.append("g")
      .call(d3.axisBottom(x)
        .tickSize(height)
        .tickFormat("")
      )
      .attr("class", "x-grid")
      .selectAll("line")
        .style("stroke", "#aaa")
        .style("stroke-dasharray", "2,2")
        .style("opacity", 0.3);

    svg.selectAll(".domain").remove();

    // 图表标题
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("2010年代音频特征箱线图");

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

    const boxHeight = y.bandwidth();

    data.forEach(d => {
      const cy = y(d.key) + boxHeight / 2;

      // 须线与帽子（横向）
      svg.append('line').attr('y1', cy).attr('y2', cy).attr('x1', x(d.stats.min)).attr('x2', x(d.stats.q1)).attr('stroke', d.color).attr("stroke-width", 1.2);
      svg.append('line').attr('y1', cy).attr('y2', cy).attr('x1', x(d.stats.q3)).attr('x2', x(d.stats.max)).attr('stroke', d.color).attr("stroke-width", 1.2);
      svg.append('line').attr('y1', cy - boxHeight/4).attr('y2', cy + boxHeight/4).attr('x1', x(d.stats.min)).attr('x2', x(d.stats.min)).attr('stroke', d.color);
      svg.append('line').attr('y1', cy - boxHeight/4).attr('y2', cy + boxHeight/4).attr('x1', x(d.stats.max)).attr('x2', x(d.stats.max)).attr('stroke', d.color);

      // 箱体
      svg.append('rect')
        .attr('x', x(d.stats.q1))
        .attr('y', y(d.key))
        .attr('width', x(d.stats.q3) - x(d.stats.q1))
        .attr('height', boxHeight)
        .attr('fill', d.color)
        .attr('stroke', '#333')
        .attr('stroke-width', 1.5)
        .attr('rx', 4);

      // 中位线
      svg.append('line')
        .attr('x1', x(d.stats.median))
        .attr('x2', x(d.stats.median))
        .attr('y1', y(d.key))
        .attr('y2', y(d.key) + boxHeight)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);

      // 异常点
      const outliers = d.values.filter(v => v < d.stats.lowerFence || v > d.stats.upperFence);
      svg.selectAll(`.outlier-${d.key}`)
        .data(outliers)
        .enter()
        .append('circle')
        .attr('cx', d => x(d))
        .attr('cy', cy)
        .attr('r', 3)
        .attr('fill', d.color)
        .on("mouseover", function (event, v) {
          tooltip.style("visibility", "visible").text(`异常值: ${v.toFixed(3)}`);
          d3.select(this).attr("r", 5).attr("opacity", 1);
        })
        .on("mousemove", function (event) {
          tooltip.style("top", (event.pageY - 10) + "px")
                 .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
          d3.select(this).attr("r", 3).attr("opacity", 0.6);
        });
    });
  });
});
