document.addEventListener("DOMContentLoaded", function () {
  const width = 500;
  const height = 500;
  const arcThickness = 30;
  const secondCircleRadius = 0.3 * width / 2;
  const container = d3.select("#explicit-arc-chart");

  // 渐变颜色配置
  const gradients = [
    ['#85edff', '#c7ffe7'], ['#c7ffe7', '#fff8eb'], ['#fff8eb', '#ffdbdd'],
    ['#ffdbdd', '#f9f7e7'], ['#f9f7e7', '#d0f0fd'], ['#d0f0fd', '#a0e7d9'],
    ['#a0e7d9', '#fff0ca'], ['#fff0ca', '#ffc6c7'], ['#ffc6c7', '#f9d5e5'],
    ['#f9d5e5', '#85edff']
  ];

  // 封装绘图函数
  function drawArcChart(data) {
    container.selectAll("*").remove(); // 清空画布

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible")
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // 创建渐变
    gradients.forEach((colors, i) => {
      const grad = svg.append("defs")
        .append("linearGradient")
        .attr("id", `grad-${i}`)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%");

      grad.append("stop").attr("offset", "0%").attr("stop-color", colors[0]);
      grad.append("stop").attr("offset", "100%").attr("stop-color", colors[1]);
    });

    const decades = Object.keys(data).sort((a, b) => data[a].explicit_percentage - data[b].explicit_percentage);

    decades.forEach((decade, i) => {
      const percent = data[decade].explicit_percentage / 100;
      const reversedIndex = decades.length - 1 - i;

      const innerR = secondCircleRadius + reversedIndex * arcThickness + 5;
      const outerR = innerR + arcThickness * 0.8;

      const startAngle = -Math.PI;
      const endAngle = -Math.PI + Math.PI * (1 - percent);

      const arc = d3.arc()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .startAngle(startAngle);

      const path = svg.append("path")
        .datum({ endAngle: startAngle }) // 起始角度初始化
        .attr("fill", `url(#grad-${i % gradients.length})`)
        .attr("stroke", "none")
        .attr("opacity", 1)
        .style("cursor", "pointer");

      // 创建比例标签文本元素，初始隐藏
      const labelGroup = svg.append("g").style("pointer-events", "none").style("opacity", 0);
      labelGroup.append("rect")
        .attr("width", 60)
        .attr("height", 24)
        .attr("x", -30)
        .attr("y", -12)
        .attr("rx", 6)
        .attr("fill", "#fff")
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .attr("opacity", 0.9);

      const labelText = svg.append("text")
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", "13px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("fill", "#333")
        .style("text-shadow", "1px 1px 2px #fff")
        .style("opacity", 0);

      // 鼠标事件
      path.on("mouseover", function (event) {
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        const midRadius = (innerR + outerR) / 2 + 12;
        const x = midRadius * Math.cos(midAngle);
        const y = midRadius * Math.sin(midAngle);

        labelGroup
          .attr("transform", `translate(${x}, ${y})`)
          .style("opacity", 1);
        labelText.attr("x", x)
          .attr("y", y)
          .text(`${(100 - data[decade].explicit_percentage).toFixed(1)}%`)
          .transition().duration(200).style("opacity", 1);

        d3.select(this)
          .transition().duration(200)
          .attr("opacity", 0.7)
          .attr("stroke", "#333")
          .attr("stroke-width", 2)
          .attr("d", d3.arc()
            .innerRadius(innerR)
            .outerRadius(outerR + 4)
            .startAngle(startAngle)
            .endAngle(endAngle)());
      })
      .on("mouseout", function () {
        labelGroup.transition().duration(200).style("opacity", 0);
        labelText.transition().duration(200).style("opacity", 0);

        d3.select(this)
          .transition().duration(200)
          .attr("opacity", 1)
          .attr("stroke", "none")
          .attr("stroke-width", 0)
          .attr("d", d3.arc()
            .innerRadius(innerR)
            .outerRadius(outerR)
            .startAngle(startAngle)
            .endAngle(endAngle)());
      });

      // 动画过渡
      path.transition()
        .duration(1200)
        .attrTween("d", function (d) {
          const interpolate = d3.interpolate(d.endAngle, endAngle);
          return function (t) {
            d.endAngle = interpolate(t);
            return arc(d);
          };
        });

      // Decade 标签
      svg.append("path")
        .attr("id", `arc-path-${i}`)
        .attr("d", d3.arc()
          .innerRadius((innerR + outerR) / 2)
          .outerRadius((innerR + outerR) / 2)
          .startAngle(endAngle)
          .endAngle(startAngle)())
        .style("fill", "none")
        .style("stroke", "none");

      svg.append("text")
        .attr("font-family", "Georgia, serif")
        .attr("font-size", "14px")
        .attr("fill", "#444")
        .attr("font-weight", "600")
        .attr("letter-spacing", "10.5px")
        .append("textPath")
        .attr("xlink:href", `#arc-path-${i}`)
        .attr("startOffset", "50%")
        .attr("text-anchor", "middle")
        .text(decade);
    });
  }

  // 从服务器加载数据，首次绘制
  d3.json("/arc-data").then(function (data) {
    drawArcChart(data);

    let hasLoaded = true; // 初始已加载

    function getVisibleRatio(rect) {
      const windowHeight = window.innerHeight;
      if (rect.bottom <= 0 || rect.top >= windowHeight) return 0; // 完全不可见
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      return visibleHeight / rect.height; // 可见高度占元素高度比例
    }

    window.addEventListener("scroll", () => {
      const rect = container.node().getBoundingClientRect();
      const visibleRatio = getVisibleRatio(rect);

      if (visibleRatio >= 0.3) {
        // 元素进入视口30%以上
        if (!hasLoaded) {
          drawArcChart(data);
          hasLoaded = true;
        }
      } else {
        // 元素未进入视口30%
        hasLoaded = false;
      }
    });
  });
});
