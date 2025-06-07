const width = 600;
const radius = width / 2;

const svg = d3.select("#donut-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", width)
    .append("g")
    .attr("transform", `translate(${radius},${radius})`);

const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, 20));

const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);

function getTextColor(backgroundColor) {
    const rgb = d3.color(backgroundColor).rgb();
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? "#000" : "#fff";
}

Promise.all([
    d3.json('/genre-data'),
    d3.csv('/context-data')
]).then(([hierarchyData, contextData]) => {

    const contextMap = {};
    contextData.forEach(d => {
        contextMap[d.Genre.toLowerCase()] = d;
    });

    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.partition().size([2 * Math.PI, radius])(root);

    svg.selectAll("path")
        .data(root.descendants())
        .join("path")
        .attr("display", d => d.depth ? null : "none")
        .attr("d", arc)
        .attr("fill", d => color((d.children ? d : d.parent).data.name))
        .on("click", (event, d) => {
            showGenreInfo(d.data.name);
        });

    svg.selectAll("text")
        .data(root.descendants().filter(d => d.depth && (d.x1 - d.x0) > 0.03))
        .join("text")
        .attr("transform", function (d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dy", "0.35em")
        .attr("text-anchor", d => (d.x0 + d.x1) / 2 < Math.PI ? "start" : "end")
        .text(d => d.data.name)
        .style("fill", d => getTextColor(color((d.children ? d : d.parent).data.name)))
        .style("font-size", "10px");

    // ✅ 替代旧的 showGenreInfo
    function showGenreInfo(genreName) {
        const genreKey = genreName.toLowerCase();
        const data = contextMap[genreKey];

        const container = d3.select("#genre-info-chart");
        container.selectAll("*").remove();

        if (!data) {
            container.append("p").text(`${genreName} 无场景数据`);
            return;
        }

        const sceneLabels = Object.keys(data).filter(k =>
            k !== "Genre" && k !== "Top Context Label"
        );

        const sceneData = sceneLabels.map(label => ({
            label: label.replace(/Good for /, ""),
            value: +data[label]
        })).sort((a, b) => b.value - a.value);

        const maxValue = d3.max(sceneData, d => d.value);

        container.append("h3")
            .text(`🎵 ${genreName} 使用场景推荐：${data["Top Context Label"]}`)
            .style("margin-bottom", "20px");

        const cards = container.selectAll("div.card")
            .data(sceneData)
            .join("div")
            .attr("class", "card")
            .style("margin-bottom", "12px")
            .style("padding", "10px 14px")
            .style("border-radius", "10px")
            .style("background", "#fff")
            .style("box-shadow", "0 2px 6px rgba(0,0,0,0.08)");

        cards.append("div")
            .style("font-weight", "bold")
            .style("margin-bottom", "1px")
            .text(d => d.label);

        cards.append("div")
            .style("height", "3px")
            .style("border-radius", "8px")
            .style("background", "#e0f2f1")
            .style("position", "relative")
            .append("div")
            .style("width", d => `${(d.value / maxValue) * 100}%`)
            .style("height", "100%")
            .style("background", "#447a9c")
            .style("border-radius", "8px");

        cards.append("div")
            .style("text-align", "right")
            .style("font-size", "12px")
            .style("color", "#666")
            .text(d => `数值: ${d.value}`);
    }
});
