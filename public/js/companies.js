const chartSize = { width: 800, height: 600 };
const margin = { left: 100, right: 10, top: 10, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const drawCompanies = (companies) => {

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

  const chartContainer = d3.select('#chart-area svg')
    .attr("height", chartSize.height)
    .attr("width", chartSize.width);

  const g = chartContainer.append("g")
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

  const changeHandler = (yField) => {
    newRectangles
      .attr("y", co => y(co.yField))
      .attr("x", co => x(co.Name))
      .attr("width", x.bandwidth)
      .attr("height", co => y(0) - y(co.yField))
      .attr('fill', co => c(co.Name))
  }

  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("Companies");

  //change  
  g.append("text")
    .attr("class", "y axis-label")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("CMP (Rs.)");

  //change  
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

const percentageFormat = d => `${d}%`;
const rsFormat = d => `₹${d}`;
const kCroresFormat = d => `₹${d / 1000}K Cr.`

const formats = {
  CMP: rsFormat,
  MarketCap: kCroresFormat,
  PE: rsFormat,
  DivYld: percentageFormat,
  QNetProfit: kCroresFormat,
  QSales: kCroresFormat,
  ROCE: percentageFormat,
};

const updateCompanies = (companies, field) => {
  const svg = d3.select('#chart-area svg');
  svg.select(".y.axis-label")
    .text(field);

  const y = d3.scaleLinear()
    .domain([0, _.maxBy(companies, field)[field]])
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
    .domain(_.map(companies, 'Name'))
    .padding(0.3);

  const xAxis = d3.axisBottom(x);

  svg.select(".x-axis")
    .call(xAxis);

  //remove
  // svg.selectAll("rect")
  //   .data(companies, c => c.Name)
  //   .exit()
  //   .transition(t)
  //   .remove();


  svg.selectAll("rect")
    .data(companies, c => c.Name)
    .transition(t)
    .attr("y", c => y(c[field]))
    .attr("x", c => x(c.Name))
    .attr("height", c => y(0) - y(c[field]))
}

const parseCompany = ({ Name, ...numerics }) => {
  _.forEach(numerics, (v, k) => numerics[k] = +v);
  return { Name, ...numerics };
}

const main = () => {
  d3.csv('data/companies.csv', parseCompany)
    .then((companies) => {
      const fields = ['CMP', 'MarketCap', 'PE', 'DivYld', 'QNetProfit', 'QSales', 'ROCE'];
      let step = 1;
      drawCompanies(companies);
      setInterval(() => updateCompanies(companies, fields[step++ % fields.length]), 2000)
    });
}
window.onload = main;