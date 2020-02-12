const drawCompanies = (companies) => {
  const chartSize = { width: 800, height: 600 };
  const margin = { left: 100, right: 10, top: 10, bottom: 150 };
  const width = chartSize.width - margin.left - margin.right;
  const height = chartSize.height - margin.top - margin.bottom;

  const maxCmp = _.maxBy(companies, 'CMP').CMP;

  const y = d3.scaleLinear()
    .domain([0, maxCmp])
    .range([height, 0]);

  const x = d3.scaleBand()
    .range([0, width])
    .domain(_.map(companies, 'Name'))
    .padding(0.3);

  const c = d3.scaleOrdinal(d3.schemeCategory10);

  const yAxis = d3.axisLeft(y)
    .tickFormat(d => '₹' + d)
    .ticks(10);

  const xAxis = d3.axisBottom(x);

  const chartContainer = d3.select('#chart-area');
  const svg = chartContainer.append("svg")
    .attr("height", chartSize.height)
    .attr("width", chartSize.width);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const rectangles = g.selectAll("rect")
    .data(companies);

  const newRectangles = rectangles.enter()
    .append("rect")
    .attr("y", co => y(co.CMP))
    .attr("x", co => x(co.Name))
    .attr("width", x.bandwidth)
    .attr("height", co => y(0) - y(co.CMP))
    .attr('fill', co => c(co.Name));

  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("Companies");

  g.append("text")
    .attr("class", "y axis-label")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("CMP (Rs.)");

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

const parseCompany = ({ Name, ...numerics }) => {
  _.forEach(numerics, (v, k) => numerics[k] = +v);
  return { Name, ...numerics };
}

const main = () => {
  d3.csv('data/companies.csv', parseCompany)
    .then(drawCompanies);
}
window.onload = main;