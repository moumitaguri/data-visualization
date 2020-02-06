const drawBuildings = (buildings) => {
  const height = 400;
  const width = 400;

  y = d3.scaleLinear()
    .domain([0, d3.max(_.map(buildings, 'height'))])
    .range([0, height]);

  x = d3.scaleBand()
    .range([0, width])
    .domain(_.map(buildings, 'name'))
    .padding(0.3);

  const chartContainer = d3.select('#chart-container');
  const svg = chartContainer.append("svg")
    .attr("height", height)
    .attr("width", width);

  const rectangles = svg.selectAll("rect")
    .data(buildings);

  const newRectangles = rectangles.enter()
    .append("rect")
    .attr("y", 0)
    .attr("x", (b) => x(b.name))
    .attr("width", x.bandwidth)
    .attr("height", b => y(b.height));
}

const main = () => {
  d3.json('data/buildings.json')
    .then(drawBuildings);
}
window.onload = main;