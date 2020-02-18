const chartSize = { width: 800, height: 600 };
const margin = { left: 100, right: 10, top: 10, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const initChart = (quotes) => {

  const maxClose = _.maxBy(quotes, 'Close').Close;
  const minClose = _.minBy(quotes, 'Close').Close;

  const firstDate = _.first(quotes).Date;
  const lastDate = _.last(quotes).Date;

  const chartContainer = d3.select('#chart-area svg')
    .attr("height", chartSize.height)
    .attr("width", chartSize.width);

  const g = chartContainer.append("g")
    .attr("class", "prices")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const y = d3.scaleLinear()
    .domain([minClose, maxClose])
    .range([height, 0]);

  const x = d3.scaleTime()
    .range([0, width])
    .domain([new Date(firstDate), new Date(lastDate)]);

  const line = d3.line()
    .x(q => x(new Date(q.Date)))
    .y(q => y(q.Close));

  const yAxis = d3.axisLeft(y).ticks(8);

  const xAxis = d3.axisBottom(x);

  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - margin.top)
    .text("Time");

  g.append("text")
    .attr("class", "y axis-label")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("Prices");

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  g.append("path")
    .attr("class", "close")
    .attr("d", line(quotes));

  g.selectAll(".x-axis text")
    .attr("transform", `rotate(-40)`)
    .attr("text-anchor", "end")
    .attr('x', -5)
    .attr('y', 10);
}

const updateChart = (quotes, field) => {
  const svg = d3.select('#chart-area svg');
  svg.select(".y.axis-label")
    .text(field);

  const y = d3.scaleLinear()
    .domain([0, _.maxBy(quotes, field)[field]])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y)
    .tickFormat(formats[field])
    .ticks(10);

  svg.select(".y-axis")
    .call(yAxis);

  const t = d3.transition()
    .duration(1000)
    .ease(d3.easeLinear);


  const x = d3.scaleBand()
    .range([0, width])
    .domain(_.map(quotes, 'Name'))
    .padding(0.3);

  const xAxis = d3.axisBottom(x);

  svg.select(".x-axis")
    .call(xAxis);

  svg.selectAll("rect")
    .data(quotes, c => c.Name)
    .transition(t)
    .attr("y", c => y(c[field]))
    .attr("x", c => x(c.Name))
    .attr("height", c => y(0) - y(c[field]))
}

const parseData = ({ Date, Volume, AdjClose, ...numerics }) => {
  _.forEach(numerics, (v, k) => numerics[k] = +v);
  return { Date, ...numerics };
}

const main = () => {
  d3.csv('data/nifty.csv', parseData)
    .then(initChart);
}
window.onload = main;