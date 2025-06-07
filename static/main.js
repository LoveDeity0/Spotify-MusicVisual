d3.json("/static/genre_hierarchy.json").then(function(data) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3.select("#chart1")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font-family", "sans-serif")
    .style("font-size", "12px");

  // 创建根节点的层次结构
  const root = d3.hierarchy(data);

  // 创建树布局，宽度是x轴，纵向排列用y轴作为纵坐标
  const treeLayout = d3.tree()
    .size([width, height - 100]);  // 高度留点边距

  treeLayout(root);

  // 绘制连线，纵向树使用 linkVertical()
  svg.selectAll('path.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 2)
    .attr('d', d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y)
    );

  // 绘制节点组，位置根据计算的 x, y
  const node = svg.selectAll('g.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x},${d.y})`);

  // 节点圆圈
  node.append('circle')
    .attr('r', 6)
    .attr('fill', d => d.children ? "#fbcc8e" : "#f1e1b6");

  // 节点文本标签，显示 name 字段
  node.append('text')
      .attr('dy', 4)              // 垂直方向微调，让文字垂直居中点对齐圆圈
      .attr('x', 10)              // 水平方向偏移，避免文字和圆圈重叠
      .attr('text-anchor', 'start') // 文字从左边开始排
      .attr('transform', 'rotate(-45)')  // 文字逆时针旋转45度
      .text(d => d.data.name);

  showSection(currentSectionIndex);
});

const loadedScripts = new Set();

function loadEraScript(era) {
    const scriptId = `era-script-${era}`;
    if (loadedScripts.has(scriptId)) return;

    const script = document.createElement('script');
    script.src = `/static/linechart-era${era}.js`;
    script.id = scriptId;
    document.body.appendChild(script);

    loadedScripts.add(scriptId);
}

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.viz-section');
    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            // section3 ~ section8 映射到 era1 ~ era6
            if (index >= 1 && index <= 6) {
                const era = index; // section2 是 index 1 -> era1
                loadEraScript(era);
            }
        }
    });
});
