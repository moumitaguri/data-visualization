const drawBuildings = (buildings) => {
  const chartSize = { width: 600, height: 400 };
  const margin = { left: 100, right: 10, top: 10, bottom: 150 };
  const width = chartSize.width - margin.left - margin.right;
  const height = chartSize.height - margin.top - margin.bottom;

  const y = d3.scaleLinear()
    .domain([0, _.maxBy(buildings, 'height').height])
    .range([height, 0]);

  const x = d3.scaleBand()
    .range([0, width])
    .domain(_.map(buildings, 'name'))
    .padding(0.3);

  const yAxis = d3.axisLeft(y)
    .tickFormat(d => d + 'm')
    .ticks(3);

  const xAxis = d3.axisBottom(x);

  const chartContainer = d3.select('#chart-area');
  const svg = chartContainer.append("svg")
    .attr("height", chartSize.height)
    .attr("width", chartSize.width);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const rectangles = g.selectAll("rect")
    .data(buildings);

  const newRectangles = rectangles.enter()
    .append("rect")
    .attr("y", b => y(b.height))
    .attr("x", b => x(b.name))
    .attr("width", x.bandwidth)
    .attr("height", b => y(0) - y(b.height));

  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("Tall buildings");

  g.append("text")
    .attr("class", "y axis-label")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("Height (m)");

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  g.selectAll(".x-axis text")
    .attr("transform", `rotate(-40)`)
    .attr("text-anchor", "end")
    .attr('x', -5)
    .attr('y', 10);
}

const main = () => {
  d3.json('data/buildings.json')
    .then(drawBuildings);
}
window.onload = main;