function drawNightingaleRose(data, containerId, colorScheme = 'cool') {
  const width = 300, height = 450, innerRadius = 20, outerRadius = 200;

  const container = d3.select(containerId)
    .style('display', 'flex')
    .style('flex-direction', 'row')
    .style('align-items', 'center');

  // 图表区域容器
  const svgContainer = container.append('div');

  // 图表（SVG）
  const svg = svgContainer.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.3))')
    .style('margin-top', '80px')
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  const angleScale = d3.scaleBand()
    .domain(data.labels)
    .range([0, 2 * Math.PI])
    .align(0);

  const radiusScale = d3.scaleLinear()
    .domain([0, d3.max(data.values)])
    .range([innerRadius, outerRadius]);

  const isCustomColorArray = Array.isArray(colorScheme);
  const colorInterp = isCustomColorArray ? null :
    (colorScheme === 'warm' ? d3.interpolateWarm : d3.interpolateCool);

  const zipped = data.labels.map((label, i) => ({
    label,
    value: data.values[i]
  }));

  // 按 value 从小到大排序
  zipped.sort((a, b) => b.value - a.value);

  const arcsData = zipped.map((d, i) => ({
    ...d,
    color: isCustomColorArray
      ? colorScheme[i % colorScheme.length]
      : colorInterp(i / zipped.length)
  }));

  // 更新 angleScale 的 domain 顺序
  angleScale.domain(arcsData.map(d => d.label));

  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => radiusScale(d.value))
    .startAngle(d => angleScale(d.label))
    .endAngle(d => angleScale(d.label) + angleScale.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius);

  // Draw arcs
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

  // Draw arcs
  svg.selectAll('path')
    .data(arcsData)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', d => d.color)
    .attr('stroke', '#333')
    .attr('stroke-width', 1)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition().duration(200)
        .attr("transform", "scale(1.05)");

      tooltip
        .html(`<strong>${d.label}</strong><br/>数量: ${d.value}`)
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px")
        .style("opacity", 1);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition().duration(200)
        .attr("transform", "scale(1)");

      tooltip
        .style("opacity", 0);
    });

//  // 添加图例
//  const legend = container.append('div')
//    .style('margin-left', '16px')
//    .style('display', 'flex')
//    .style('flex-direction', 'column')
//    .style('font-size', '12px')
//    .style('color', '#444');
//
//  // 创建图例项
//  arcsData.forEach(d => {
//    const item = legend.append('div')
//      .style('display', 'flex')
//      .style('align-items', 'center')
//      .style('margin-bottom', '4px');
//
//    item.append('div')
//      .style('width', '12px')
//      .style('height', '12px')
//      .style('margin-right', '6px')
//      .style('background-color', d.color);
//
//    item.append('span').text(d.label);
//  });

}

const customColors = [
  '#d0f0fd', '#a0e7d9', '#fff0ca', '#ffc6c7', '#f9d5e5', "#d2ddf8", "#c6d9f2", "#ecdff0", "#dce0f8"
];


// 音乐场景，使用暖色调
const musicScenes = {
  "Good for Party": 7451,
  "Good for Work/Study": 11002,
  "Good for Relaxation/Meditation": 4313,
  "Good for Exercise": 34796,
  "Good for Running": 9487,
  "Good for Yoga/Stretching": 2733,
  "Good for Driving": 9228,
  "Good for Social Gatherings": 1293,
  "Good for Morning Routine": 11821
};
const sceneFeatures = {
  labels: Object.keys(musicScenes),
  values: Object.values(musicScenes)
};
drawNightingaleRose(sceneFeatures, '#nightingale-rose', customColors);
