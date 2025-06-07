let hasAnimated = false;

const popularityMap = {
    "Dance": 0.3571408428638571,
    "Electronic": 0.3237114636336426,
    "Folk/Country": 0.3166745354528523,
    "Hip-hop/Rap": 0.2946891903453652,
    "Metal": 0.33451686813620923,
    "Pop": 0.3542745627421059,
    "R&B/Soul": 0.350784015375991,
    "Rock": 0.3280845256157566,
    "Special": 0.29068572129538767,
    "World": 0.37498325722983256
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
            d3.json("/data").then(data => {
                drawLevel1(data);
            });
        }
    });
}, {
    threshold: 0.3
});

observer.observe(document.getElementById('level1-observer-wrapper'));

function drawLevel1(data) {
    const colorScale = d3.scaleOrdinal([
        '#85edff', '#c7ffe7', '#fff8eb', '#ffdbdd', '#f9f7e7',
        '#d0f0fd', '#a0e7d9', '#fff0ca', '#ffc6c7', '#f9d5e5'
    ]);

    function getColor(name) {
        return colorScale(name);
    }

    const level1Data = data.children;

    // 排序
    level1Data.sort((a, b) => {
        const aTotal = d3.sum(a.children.map(c => d3.sum(c.children, d => d.value)));
        const bTotal = d3.sum(b.children.map(c => d3.sum(c.children, d => d.value)));
        return aTotal - bTotal;
    });

    const maxTotal = d3.max(level1Data.map(category =>
        d3.sum(category.children.map(c => d3.sum(c.children, d => d.value)))
    ));
    const maxBarHeight = 800;

    const wrapper = d3.select("#level1-wrapper")
        .style("position", "relative")
        .style("width", "100%")
        .style("height", "100vh");

    wrapper.html("");  // 清空

    const svgOverlay = wrapper.append("svg")
        .attr("id", "popularity-line-svg")
        .style("position", "absolute")
        .style("top", 0)
        .style("left", 0)
        .style("pointer-events", "none")
        .attr("width", window.innerWidth)
        .attr("height", window.innerHeight);

    // --- 生成类别中心点数组 ---
    const popularityPoints = level1Data.map((category, i) => {
        const x = i * (120 + 20) + 90;  // 原类别中心点横坐标
        const popularity = popularityMap[category.name];
        const y = (1 - popularity) * maxBarHeight;
        return { x, y, value: popularity };
    });

    // --- 线性插值函数，计算任意x的y值 ---
    function interpolateY(x, points) {
        for (let i = 0; i < points.length - 1; i++) {
            if (x >= points[i].x && x <= points[i + 1].x) {
                const ratio = (x - points[i].x) / (points[i + 1].x - points[i].x);
                return points[i].y * (1 - ratio) + points[i + 1].y * ratio;
            }
        }
        if (x < points[0].x) return points[0].y;
        return points[points.length - 1].y;
    }

    // --- 生成平滑均匀分布的点，覆盖整个页面宽度 ---
    const N = 20; // 点数越多，曲线越平滑

    // 用d3.scaleLinear构建x->y映射
    const xDomain = popularityPoints.map(p => p.x);
    const yDomain = popularityPoints.map(p => p.y+50);
    const yScale = d3.scaleLinear()
        .domain(xDomain)
        .range(yDomain);

    // 生成平滑点数组
    const smoothPoints = [];
    const svgWidth = window.innerWidth;

    for (let i = 0; i < N; i++) {
        const x = (svgWidth / (N - 1)) * i;
        // 用d3.scaleLinear自动插值y值，更平滑
        const y = yScale(x);
        smoothPoints.push({ x, y, value: 0 });
    }

    // 画静态折线
    function drawStaticLine(svgOverlay, points) {
        const line = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveCatmullRom.alpha(0.5));  // alpha控制曲线张力，0.5是常用值

        const path = svgOverlay.append("path")
            .datum(points)
            .attr("fill", "none")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .attr("d", line);

        const totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        return path;
    }

    // 画波浪动画线
    function drawWaveLine(svgOverlay, points) {
        let t = 0;

        const layers = [
            { amplitude: 10, frequency: 0.04, phaseOffset: 0, strokeWidth: 2, stroke: "#ffffff", fill: "rgba(255, 255, 255, 0.55)" },
            { amplitude: 6, frequency: 0.06, phaseOffset: Math.PI / 2, strokeWidth: 1.5, stroke: "#ffffff", fill: "rgba(255, 255, 255, 0.52)" },
            { amplitude: 4, frequency: 0.08, phaseOffset: Math.PI, strokeWidth: 1, stroke: "#ffffff", fill: "rgba(255, 255, 255, 0.50)" },
            { amplitude: 2, frequency: 0.10, phaseOffset: Math.PI * 1.5, strokeWidth: 0.8, stroke: "#ffffff", fill: "rgba(255, 255, 255, 0.48)" }
        ];

        svgOverlay.selectAll("path.wave").remove();
        svgOverlay.selectAll("path.wave-fill").remove();

        const area = d3.area()
            .x(d => d.x)
            .y0(window.innerHeight)
            .y1(d => d.y)
            .curve(d3.curveCatmullRom.alpha(0.5));

        const paths = layers.map(layer => ({
            strokePath: svgOverlay.append("path")
                .datum(points)
                .attr("class", "wave")
                .attr("fill", "none")
                .attr("stroke", layer.stroke)
                .attr("stroke-width", layer.strokeWidth)
                .attr("stroke-opacity", 0.6),
            fillPath: svgOverlay.append("path")
                .datum(points)
                .attr("class", "wave-fill")
                .attr("fill", layer.fill)
                .attr("stroke", "none")
                .attr("opacity", 0.4)
        }));

        const line = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveCatmullRom.alpha(0.5));  // alpha控制曲线张力，0.5是常用值

        const timer = d3.timer(() => {
            t += 1;
            layers.forEach((layer, i) => {
                const wavePoints = points.map((p, idx) => ({
                    x: p.x,
                    y: p.y + layer.amplitude * Math.sin(layer.frequency * t + idx + layer.phaseOffset)
                }));
                paths[i].strokePath.attr("d", line(wavePoints));
                paths[i].fillPath.attr("d", area(wavePoints));
            });
        });

        return timer;
    }

    // 控制动画切换
    let waveTimer = null;
    let staticPath = null;

    function setupLineAnimation(svgOverlay, points) {
        staticPath = drawStaticLine(svgOverlay, points);

        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                if (waveTimer) {
                    waveTimer.stop();
                    waveTimer = null;
                    svgOverlay.selectAll("path.wave").remove();
                    if (staticPath) staticPath.style("display", null);
                } else {
                    if (staticPath) staticPath.style("display", "none");
                    waveTimer = drawWaveLine(svgOverlay, points);
                }
            }
        });
    }

    // 使用平滑点绘制波浪动画（覆盖整个宽度）
    setupLineAnimation(svgOverlay, smoothPoints);

    // 画圆点和文本，使用类别中心点（popularityPoints）
    svgOverlay.selectAll("circle")
        .data(popularityPoints)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y+50)
        .attr("r", 8)   // 改成8测试
        .attr("fill", "#ffffff")
        .on("mouseover", function(event, d) {
            d3.select(this)
              .transition()
              .duration(300)
              .attr("r", 12)
              .attr("fill", "#bce6ff");
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
              .transition()
              .duration(300)
              .attr("r", 8)
              .attr("fill", "#bce6ff");
        });

    svgOverlay.selectAll("text")
        .data(popularityPoints)
        .enter()
        .append("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y + 38)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#00334d") // 深蓝灰色，更清晰
        .attr("stroke", "white") // 添加浅色描边，提升可读性
        .attr("stroke-width", 0.2)
        .style("opacity", 0)
        .text(d => d.value.toFixed(2))
        .transition()
        .delay((d, i) => 100 + i * 100 + 200)
        .duration(300)
        .style("opacity", 1);

    // 以下是你已有的柱状图绘制代码，保持不变
    level1Data.forEach((category, i) => {
        const total = d3.sum(category.children.map(c => d3.sum(c.children, d => d.value)));

        const block = wrapper.append("div")
            .style("display", "inline-flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("width", "120px")
            .style("margin", "0 10px");

        const bar = block.append("div")
            .style("width", "40px")
            .style("height", "0px")
            .style("border-radius", "6px")
            .style("background", () => {
                const color = d3.color(getColor(category.name));
                return `linear-gradient(to top, rgba(${color.r}, ${color.g}, ${color.b}, 1) 100%, rgba(${color.r}, ${color.g}, ${color.b}, 0) 0%)`;
            })
            .style("box-shadow", "0 4px 6px rgba(0,0,0,0.2)")
            .style("margin-bottom", "5px");

        bar.style("cursor", "pointer")
            .style("transition", "transform 0.3s")
            .on("click", () => {
                drawLevel2(category);
                document.getElementById('level3-popup').style.display = 'block';
            })
            .on("mouseover", function () {
                d3.select(this).style("transform", "scaleY(1.05)");
            })
            .on("mouseout", function () {
                d3.select(this).style("transform", "scaleY(1)");
            })

        bar.transition()
            .duration(800)
            .style("height", `${(total / maxTotal) * maxBarHeight}px`);

        block.append("div")
            .style("font-size", "14px")
            .style("color", "#333")
            .style("font-weight", "bold")
            .style("text-align", "center")
            .text(category.name);

        block.append("div")
            .style("font-size", "12px")
            .style("color", "#666")
            .style("text-align", "center")
            .text(total);
    });
}

// 颜色方案
let currentColorScheme = 'schemeAccent';

// 颜色方案映射表
const colorSchemes = {
  schemeCategory10: d3.schemeCategory10,
  schemeSet3: d3.schemeSet3,
  schemeDark2: d3.schemeDark2,
  schemeAccent: d3.schemeAccent
};

function drawLevel2(category) {
  const container = d3.select("#chart");
  container.html("");

  container.append("h3").text(`类别: ${category.name}`);

  const maxTotal = d3.max(category.children.map(s => d3.sum(s.children, d => d.value)));

  const softPastelColors = [
    '#85edff', '#c7ffe7', '#fff8eb', '#ffdbdd', '#ffadd5',
    '#d0f0fd', '#a0e7d9', '#fff0ca', '#ffc6c7', '#ffb6b9'
  ];
  const colorScale = d3.scaleOrdinal(softPastelColors);

  category.children.forEach((sub, i) => {
    const total = d3.sum(sub.children, d => d.value);
    const percent = maxTotal ? (total / maxTotal) * 100 : 0;

    const subBox = container.append("div")
      .attr("class", "sub-box")
      .style("cursor", "pointer")
      .on("click", () => {
        drawLevel3(sub);
      });

    subBox.append("div")
      .attr("class", "sub-bar")
      .style("width", `${percent}%`)
      .style("background-color", colorScale(i));

    const textContainer = subBox.append("div").attr("class", "sub-text");
    textContainer.append("div")
      .attr("class", "sub-title")
      .text(sub.name);

    textContainer.append("div")
      .attr("class", "sub-desc")
      .text(`总数量: ${total}`);
  });
}


function drawLevel3(subCategory, colorSchemeName = currentColorScheme) {
  const container = d3.select("#chart");
  container.html("");

  container.append("h3").text(`子类别详情: ${subCategory.name}`);

  const maxValue = d3.max(subCategory.children, d => d.value);
  const softPastelColors = [
    '#85edff', '#c7ffe7', '#fff8eb', '#ffdbdd', '#ffadd5',
    '#d0f0fd', '#a0e7d9', '#fff0ca', '#ffc6c7', '#ffb6b9'
  ];
  const colorScale = d3.scaleOrdinal(softPastelColors);

  subCategory.children.forEach((d, i) => {
    const percent = maxValue ? (d.value / maxValue) * 100 : 0;

    const subBox = container.append("div")
      .attr("class", "sub-box");

    subBox.append("div")
      .attr("class", "sub-bar")
      .style("width", `${percent}%`)
      .style("background-color", colorScale(i));

    const textContainer = subBox.append("div").attr("class", "sub-text");
    textContainer.append("div")
      .attr("class", "sub-title")
      .text(d.name);

    textContainer.append("div")
      .attr("class", "sub-desc")
      .text(`数量: ${d.value}`);
  });
}


