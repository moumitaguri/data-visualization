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
  _.forEach(numerics, (v, k) => numerics[k] = _.round(+v));
  const Time = new window.Date(Date);
  return { Date, Time, ...numerics };
}

const addSMA = (quotes, smaPeriod) => {
  const offset = +d3.select("#offset").property("value");
  quotes.map((val, i) => {
    val.SMA = 0;
    let blocks = smaPeriod + offset - 2;
    if (i >= blocks)
      val.SMA =
        _.round(quotes.slice(i - smaPeriod - offset + 1, i - offset + 1).reduce((init, val) => init + val.Close, 0) /
          smaPeriod);
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

const drawTransactionTable = (transactions) => {
  const table = d3.select("#transactions-table");
  const rows = d3.csvParseRows(d3.csvFormat(transactions));
  const columnNames = ["Buying Date", "Buy Close", "Buy SMA", "Saling Date", "Sale Close", "Sale SMA", "Profit", "Verdict"];
  table.append("thead")
    .append("tr")
    .selectAll("th")
    .data(columnNames)
    .enter().append("th")
    .text(function (columnNames) { return columnNames; })
    .attr("class", "transactions-table-columns");

  table.append("tbody")
    .selectAll("tr")
    .data(rows.slice(1))
    .enter()
    .append("tr")
    .selectAll("td")
    .data(function (d) { return d; })
    .enter()
    .append("td")
    .attr("class", "transactions")
    .on("mouseover", function () {
      d3.select(this)
        .style("background-color", "powderblue");
    })
    .on("mouseout", function () {
      d3.select(this).style("background-color", "white");
    })
    .text(function (d) { return d; })
    .style("font-size", "12px");

}

const algorithm = quotes => {
  //when to buy => not bought or sold -> findNextDateToBuy => close > sma
  //when to sell => sma > close
  //1 transaction => buy -> sell

  let transactions = [];
  let buys = [];
  let sales = [];
  let bought = false;
  let sold = false;
  const testableQuotes = _.drop(quotes, 100);

  for (let i = 0; i < testableQuotes.length; i++) {
    if (bought && testableQuotes[i].SMA > testableQuotes[i].Close) {
      sales.push(testableQuotes[i]);
      sold = true;
      bought = false;
      transactions.push({ buy: _.last(buys), sale: _.last(sales) });
    }
    if ((!bought || sold) && testableQuotes[i].Close > testableQuotes[i].SMA) {
      buys.push(testableQuotes[i]);
      bought = true;
      sold = false;
    }
  }

  let lastTransactionDate = _.last(transactions).buy.Date;
  let lastBuyingDate = _.last(buys).Date;

  if (lastTransactionDate != lastBuyingDate) {
    transactions.push({ buy: _.last(buys), sale: _.last(testableQuotes) })
  }
  return parseTransactions(transactions);
  // const parsedTransactions = parseTransactions(transactions);
  // drawTransactionTable(parsedTransactions);
}

const analyzeData = quotes => {
  addSMA(quotes, 100);
}

const parseTransactions = (transactions) => {
  return transactions.map(t => {
    return {
      buyingDate: t.buy.Date,
      buyClose: t.buy.Close,
      buySma: t.buy.SMA,
      salingDate: t.sale.Date,
      saleClose: t.sale.Close,
      saleSma: t.sale.SMA,
      profit: t.sale.Close - t.buy.Close,
      verdict: (t.sale.Close - t.buy.Close) > 0 ? "win" : "loss"
    }
  })
}

const observe = (transactions) => {
  const noOfTransactions = transactions.length;
  const wins = transactions.filter(t => t.verdict == "win");
  const losses = transactions.filter(t => t.verdict == "loss");
  const totalWins = wins.length;
  const totalLosses = losses.length;
  const winPercentage = _.round(totalWins / noOfTransactions * 100, 2);
  const lossPercentage = _.round(totalLosses / noOfTransactions * 100, 2);
  const totalWinAmount = wins.reduce((amount, transaction) => amount + transaction.profit, 0);
  const totalLossAmount = losses.reduce((amount, transaction) => amount - transaction.profit, 0);
  const avgWinSize = _.round(totalWinAmount / totalWins);
  const avgLossSize = _.round(totalLossAmount / totalLosses);
  const net = totalWinAmount - totalLossAmount;
  const winMultiple = _.round((avgWinSize / avgLossSize), 2);
  const lossMultiple = _.round((totalLosses / totalWins), 2);
  const expectancy = _.round(totalWinAmount / noOfTransactions);

  const observations = {
    noOfTransactions,
    wins,
    losses,
    totalWins,
    totalLosses,
    winPercentage,
    lossPercentage,
    totalWinAmount,
    totalLossAmount,
    avgWinSize,
    avgLossSize,
    net,
    winMultiple,
    lossMultiple,
    expectancy
  }
  // console.log(noOfTransactions, "no. of transactions");
  // console.log(totalWins, "no. of wins");
  // console.log(totalLosses, "no. of losses");
  // console.log(winPercentage, "win %");
  // console.log(lossPercentage, "loss %");
  // console.log(totalWinAmount, "total win amount");
  // console.log(totalLossAmount, "total loss amount");
  // console.log(avgWinSize, "avg win size");
  // console.log(avgLossSize, "avg loss size");
  // console.log(net, "net amount");
  // console.log(winMultiple, "win multiple");
  // console.log(lossMultiple, "loss multiple");
  // console.log(expectancy, "expectancy");

  return observations;
}


const visualize = quotes => {
  updateChart(quotes, 101)
  userInputs(quotes);
  const transactions = algorithm(quotes);
  drawTransactionTable(transactions);
  const observations = observe(transactions);
  console.log(observations)
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