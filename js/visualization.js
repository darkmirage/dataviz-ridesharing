'use strict';

const LEFT_MARGIN = 50;
const RIGHT_MARGIN = 0;
const BOTTOM_MARGIN = 30;
const TOP_MARGIN = 20;

class Visualization {
  constructor(options) {
    this.element = options.element;
    this.updateDimensions();
    this.region = 'USA';
    this.maxValue = 2.5;
    this.fetchData();
  }

  updateDimensions() {
    this.containerHeight = $(this.element).height();
    this.containerWidth = $(this.element).width();
    this.height = this.containerHeight - BOTTOM_MARGIN - TOP_MARGIN;
    this.width = this.containerWidth - LEFT_MARGIN - RIGHT_MARGIN;
  }

  setMode(region) {
    this.region = region;
    this.updateChart();
  }

  fetchData() {
    this.dataLoading = new Promise((resolve, reject) => {
      d3.csv('./csv/uber.csv', (data) => {
        data.forEach((d) => {
          d['share'] = Number(d['share']);
          d['date'] = new Date(d['date']);
        });
        var apps = _.uniqBy(data, 'app').map((d) => d['app']);
        this.data = data;
        this.apps = apps;
        resolve();
      });
    });
  }

  initChart() {
    d3.select(this.element).selectAll('svg').remove();

    var svg = d3.select(this.element).append('svg')
      .attr('width', this.containerWidth)
      .attr('height', this.containerHeight);

    svg.append('g')
      .attr('class', 'axis y-axis left-axis');

    svg.append('g')
      .attr('class', 'axis x-axis bottom-axis');

    svg.append('g')
      .attr('class', 'lines-container');
  }

  getBottomScale() {
    return d3.scale.ordinal()
      .domain(d3.time.months(new Date(2014, 12), new Date(2015, 5, 1)))
      .rangePoints([0, this.width], 1.0);
  }

  getLeftScale() {
    var maxValue = Math.ceil(this.maxValue * 100) / 100;
    return d3.scale.linear()
      .domain([0, maxValue])
      .range([0, this.height]);
  }

  getColors() {
    return d3.scale.category10()
      .domain(this.apps);
  }

  getDefaultAxis() {
    return d3.svg.axis()
      .innerTickSize(5)
      .outerTickSize(1)
      .tickPadding(5);
  }

  getBottomAxis() {
    return this.getDefaultAxis()
      .scale(this.getBottomScale())
      .tickFormat(d3.time.format('%b %y'))
      .outerTickSize(1);
  }

  getLeftAxis() {
    return this.getDefaultAxis()
      .scale(this.getLeftScale().range([this.height, 0]))
      .tickFormat(d3.format(",.2%"))
      .orient('left');
  }

  getLine() {
    var x = this.getBottomScale();
    var leftOffset = LEFT_MARGIN;

    var y = this.getLeftScale();
    var topOffset = this.height + TOP_MARGIN;

    return d3.svg.line()
      .interpolate('linear')
      .x((d) => leftOffset + x(d['date']))
      .y((d) => topOffset - y(d['share']));
  }

  updateAxes() {
    var svg = d3.select(this.element).select('svg');
    var topOffset = this.height + TOP_MARGIN;
    var rightOffset = this.width + LEFT_MARGIN;

    svg
      .attr('width', this.containerWidth)
      .attr('height', this.containerHeight);

    svg.select('g.bottom-axis')
      .attr('transform', 'translate(' + LEFT_MARGIN + ',' + topOffset + ')')
      .transition()
      .ease('sin-in-out')
      .call(this.getBottomAxis());
    svg.select('g.left-axis')
      .attr('transform', 'translate(' + LEFT_MARGIN + ',' + TOP_MARGIN + ')')
      .attr('visibility', this.mode !== 2 ? 'visible' : 'hidden')
      .transition()
      .ease('sin-in-out')
      .call(this.getLeftAxis());
  }

  updateLines() {
    var data = this.data.filter((d) => d['region'] === this.region);
    console.log(data);
    console.log(this.apps);

    var svg = d3.select(this.element).select('svg');
    var container = svg.select('g.lines-container');
    var colors = this.getColors();

    this.maxValue = Math.max(...data.map((d) => d['share']));
    this.updateAxes();

    this.apps.forEach((app) => {
      console.log(colors(app));
      var datum = data.filter((d) => d['app'] === app);
      var className = app.toLowerCase();
      var path = container.select('path.' + className)
        .datum(datum, (d) => d['date']);

      if (path.empty()) {
        path = container.append('path')
          .datum(datum, (d) => d['date'])
          .attr('class', 'line ' + className)
          .attr('stroke', colors(app))
          .attr('d', this.getLine());
      }

      path.transition()
        .attr('d', this.getLine());
    })

    // var paths = container.selectAll('.line')
    //   .data(data, (d) => d['app']);

    // console.log(paths);

    // var pathsEnter = paths.enter().append('path')
    //   .attr('class', 'line')
    //   .attr('d', this.getLine());

    // paths.exit().remove();
  }

  updateChart() {
    this.updateAxes();
    this.updateLines();
  }

  render() {
    this.dataLoading.then(() => {
      this.initChart();
      this.updateChart();
      $(window).resize(() => {
        this.updateDimensions();
        this.updateChart();
      })
    });
  }
}