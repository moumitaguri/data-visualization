const chartSize = { width: 1200, height: 700 };
const margin = { left: 100, right: 10, top: 10, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const initChart = (quotes) => {

  const firstDate = new Date(_.first(quotes).Date);
  const lastDate = new Date(_.last(quotes).Date);

  const chartContainer = d3.select('#chart-area svg')
    .attr("height", chartSize.height)
    .attr("width", chartSize.width);

  const g = chartContainer.append("g")
    .attr("class", "prices")
    .attr("transform", `translate(${margin.left},${margin.top})`);

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
    .attr("class", "y-axis");

  const startTime = firstDate.getTime();
  const lastTime = lastDate.getTime();

  const slider = createD3RangeSlider(startTime, lastTime, "#slider-container");

  slider.onChange(function (newRange) {
    let beginDate = dateFormat(newRange.begin);
    let endDate = dateFormat(newRange.end);

    d3.select("#slider-label")
      .text(beginDate + " - " + endDate);
    let newQuotes = getSliderQuotes(quotes, beginDate, endDate);
    updateChart(newQuotes);
  });

  slider.range(startTime, lastTime);

}

const dateFormat = date => new Date(date).toJSON().split("T")[0];
const getSliderQuotes = (quotes, begin, end) => quotes.filter(q => q.Date >= begin && q.Date <= end);

const updateChart = (quotes, blocks) => {
  const maxClose = _.maxBy(quotes, 'Close').Close;
  const minClose = _.minBy(quotes, 'Close').Close;
  const firstDate = new Date(_.first(quotes).Date);
  const lastDate = new Date(_.last(quotes).Date);

  const y = d3.scaleLinear()
    .domain([minClose, maxClose])
    .range([height, 0]);

  const x = d3.scaleTime()
    .range([0, width])
    .domain([firstDate, lastDate]);

  const closeLine = d3.line()
    .x(q => x(q.Time))
    .y(q => y(q.Close));

  const smaLine = d3.line()
    .x(q => x(q.Time))
    .y(q => y(q.SMA));

  const yAxis = d3.axisLeft(y).ticks(8);
  const xAxis = d3.axisBottom(x);

  const svg = d3.select('#chart-area svg')
  const g = svg.select(".prices");

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)

  svg.select(".y-axis")
    .call(yAxis);

  svg.select(".x-axis")
    .call(xAxis);

  svg.select("path.close")
    .remove();
  svg.select("path.sma")
    .remove();

  g.append("path")
    .attr("class", "close")
    .attr("d", closeLine(quotes));

  g.append("path")
    .attr("class", "sma")
    .attr("d", smaLine(_.drop(quotes, blocks)));

  svg.selectAll(".x-axis text")
    .attr("transform", `rotate(-40)`)
    .attr("text-anchor", "end")
    .attr('x', -5)
    .attr('y', 10);
}

const parseData = ({ Date, Volume, AdjClose, ...numerics }) => {
  _.forEach(numerics, (v, k) => numerics[k] = +v);
  const Time = new window.Date(Date);
  return { Date, Time, ...numerics };
}

const addSMA = (quotes, smaPeriod) => {
  const offset = +d3.select("#offset").property("value");
  quotes.map((val, i) => {
    val.SMA = 0;
    let blocks = smaPeriod + offset;
    if (i >= blocks)
      val.SMA =
        quotes.slice(i - blocks, i - offset + 1).reduce((init, val) => init + val.Close, 0) /
        smaPeriod;
  });

};

const changeGraph = (quotes, smaPeriod) => {
  const offset = +d3.select("#offset").property("value");
  const blocks = offset + smaPeriod;
  addSMA(quotes, smaPeriod);
  updateChart(quotes, blocks)
}

const userInputs = (quotes) => {
  d3.select("#sma-period")
    .on("input", function () { changeGraph(quotes, +this.value) });
  d3.select("#offset")
    .on("input", function () {
      const smaPeriod = +d3.select("#sma-period").property("value");
      changeGraph(quotes, smaPeriod)
    });
}

const analyzeData = quotes => {
  addSMA(quotes, 100);
}

const visualize = quotes => {

  updateChart(quotes, 101)
  userInputs(quotes);
}

const main = () => {
  d3.csv('data/nifty.csv', parseData)
    .then((quotes) => {
      analyzeData(quotes)
      initChart(quotes)
      visualize(quotes)
    })
}

window.onload = main;