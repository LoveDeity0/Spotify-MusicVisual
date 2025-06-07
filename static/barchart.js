Promise.all([
  d3.json('/era-genre-data'),
  d3.json('/new-genres-data')
]).then(([data, newGenres]) => {
  const width = 1400, height = 800;
  const margin = { top: 50, right: 20, bottom: 50, left: 20 };

  const svg = d3.select("#chart2").append("svg")
    .attr("width", width)
    .attr("height", height);

  const keys = Object.keys(data[0]).filter(d => d !== "year");

  // 计算每个类别的总和
  const totalByKey = {};
  keys.forEach(key => {
    totalByKey[key] = d3.sum(data, d => d[key]);
  });

  // 按面积从小到大排序，最大的在最后，保证显示时层级正确
  const sortedKeys = keys.slice().sort((a, b) => totalByKey[a] - totalByKey[b]);

  // stack函数，按照排序顺序绘制
  const stack = d3.stack().keys(sortedKeys);
  const series = stack(data);

  // 横坐标比例尺：点位
  const x = d3.scalePoint()
    .domain(data.map(d => d.year))
    .range([margin.left, width - margin.right]);

  // 纵坐标比例尺：线性，高度对应最大堆叠值
  const y = d3.scaleLinear()
    .domain([0, d3.max(series[series.length - 1], d => d[1])])
    .range([height - margin.bottom, margin.top]);

  // 颜色比例尺
  const color = d3.scaleOrdinal()
    .domain(sortedKeys)
    .range(d3.schemeSet3);

  // 面积生成器
  const area = d3.area()
    .x((d, i) => x(data[i].year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  // 初始路径：0高度，方便动画展开
  const area0 = d3.area()
    .x((d, i) => x(data[i].year))
    .y0(y(0))
    .y1(y(0));

  // 绘制堆叠面积路径，初始为高度0
  svg.selectAll("path.area")
    .data(series)
    .enter().append("path")
    .attr("class", "area")
    .attr("fill", d => color(d.key))
    .attr("d", area0) // 初始为0高度
    .append("title")
    .text(d => d.key);

  // 画年代标签
  // 绘制底部统一年份横条背景
  const barHeight = 40;
  const barMargin = 10;
  svg.append("rect")
    .attr("class", "year-bar")
    .attr("x", margin.left)
    .attr("y", height - barHeight - barMargin)
    .attr("width", width - margin.left - margin.right)
    .attr("height", barHeight);

  // 添加每个年份标签（对齐每个数据点）
  svg.selectAll("text.year-label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "year-label")
    .attr("x", d => x(d.year))
    .attr("y", height - barHeight / 2 - barMargin)
    .text(d => d.year)
    .style("opacity", 0)
    .transition()
    .delay((d, i) => i * 70)
    .duration(500)
    .style("opacity", 1);

  // tooltip部分，鼠标悬停显示信息
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg.append("rect")
    .attr("fill", "transparent")
    .attr("width", width)
    .attr("height", height)
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const year = x.domain().reduce((a, b) =>
        Math.abs(x(b) - mx) < Math.abs(x(a) - mx) ? b : a
      );
      const record = data.find(d => d.year === year);
      const yPos = event.pageY;
      const xPos = event.pageX;

      // 找到鼠标悬停的类别
      const my = event.offsetY;
      let hoveredKey = null;
      for (let s of series) {
        const i = x.domain().indexOf(year);
        const range = s[i];
        if (y(range[0]) >= my && y(range[1]) <= my) {
          hoveredKey = s.key;
          break;
        }
      }

      if (hoveredKey) {
        tooltip.style("opacity", 1)
          .html(`<strong>${hoveredKey}</strong><br>${year}: ${record[hoveredKey]}`)
          .style("left", `${xPos + 10}px`)
          .style("top", `${yPos - 30}px`);
      } else {
        tooltip.style("opacity", 0);
      }
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // 整理每个年代的新类别列表
  const newGenresByYear = {};
  newGenres.forEach(d => {
    if (!newGenresByYear[d.year]) {
      newGenresByYear[d.year] = [];
    }
    newGenresByYear[d.year].push(d);
  });

  function drawNewGenreLabels() {
  const topLabelStartY = 40;
  const labelPaddingX = 8;
  const labelPaddingY = 4;
  const labelHeight = 20;
  const dotRadius = 5;

  Object.entries(newGenresByYear).forEach(([year, genres]) => {
    const yearIndex = data.findIndex(d => d.year === year);
    if (yearIndex === -1) return;

    const xPos = x(year);
    const topStackValue = series[series.length - 1][yearIndex][1];
    const topStackY = y(topStackValue);

    let genreOffsetY = 0;

    genres.forEach((d, i) => {
      const labelY = topLabelStartY + genreOffsetY;

      // 文字宽度测量临时元素
      const tempText = svg.append("text")
        .attr("x", -9999).attr("y", -9999)
        .attr("font-size", 12)
        .text(d.genre);
      const textWidth = tempText.node().getBBox().width;
      tempText.remove();

      const labelWidth = dotRadius * 2 + 4 + textWidth + labelPaddingX * 2;

      // 创建一个分组方便整体移动和动画
      const labelGroup = svg.append("g")
        .attr("transform", `translate(${xPos - labelWidth / 2},${labelY - labelHeight / 2})`)
        .style("opacity", 0);

      // 背景矩形
      labelGroup.append("rect")
        .attr("width", labelWidth)
        .attr("height", labelHeight)
        .attr("rx", 10)  // 圆角
        .attr("ry", 10)
        .attr("fill", "rgba(255, 255, 255, 0.7)")
        .attr("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.15))");

      // 小圆点，填充颜色用类别颜色
      labelGroup.append("circle")
        .attr("cx", dotRadius + labelPaddingX)
        .attr("cy", labelHeight / 2)
        .attr("r", dotRadius)
        .attr("fill", color(d.genre) || "#ffcc00");  // fallback黄色

      // 文字
      labelGroup.append("text")
        .attr("x", dotRadius * 2 + labelPaddingX + 4)
        .attr("y", labelHeight / 2 + 4)  // baseline 调整
        .attr("font-size", 12)
        .attr("fill", "#333")
        .text(d.genre);

      // 动画渐显
      labelGroup.transition()
        .duration(600)
        .delay(i * 200)
        .style("opacity", 1);

      // 连线
      // 只给最后一个标签画虚线且虚线到底部标签的上边缘
      if (i === genres.length - 1) {
        svg.append("line")
          .attr("x1", xPos)
          .attr("y1", topStackY)
          .attr("x2", xPos)
          .attr("y2", labelY + labelHeight / 2)  // 精准连到标签上边缘
          .attr("stroke", "rgba(150, 100, 40, 0.6)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3")
          .style("opacity", 0)
          .transition()
          .duration(600)
          .delay(i * 200)
          .style("opacity", 1);
      }
      genreOffsetY += labelHeight + 6;  // 间距加大些
    });
  });
}

  // 动画函数，先重置路径为0高度，再过渡到真实面积
  function playAnimation() {
    svg.selectAll("path.area")
      .data(series)
      .attr("d", area0);

    svg.selectAll("path.area")
      .transition()
      .duration(1500)
      .delay((d, i) => i * 1)
      .attr("d", area)
      .on("end", (_, i, nodes) => {
        if (i === nodes.length - 1) {
          // 最后一条路径动画完成后加载顶部标签
          drawNewGenreLabels();
        }
      });
    }

  // IntersectionObserver 监听容器进入视口，触发动画
  const chartContainer = document.querySelector('#chart2');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playAnimation();
      }
    });
  }, { threshold: 0.3 });

  observer.observe(chartContainer);
});
