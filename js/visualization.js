'use strict';

const LEFT_MARGIN = 50;
const RIGHT_MARGIN = 0;
const BOTTOM_MARGIN = 30;
const TOP_MARGIN = 20;

class Visualization {
  constructor(options) {
    this.element = options.element;
    this.chart = null;
    this.region = 'USA';
    this.fetchData();
  }

  setRegion(region) {
    this.region = region;
    this.updateChart();
  }

  fetchData() {
    this.dataLoading = new Promise((resolve, reject) => {
      d3.csv('./csv/uber.csv', (data) => {
        data.forEach((d) => {
          d['share'] = Number(d['share']);
          d['_date'] = new Date(d['date']);
        });
        data.sort((a, b) => a['_date'] - b['_date']);

        var dates = _.uniqBy(data, 'date').map((d) => d['date']);
        var regions = _.uniqBy(data, 'region').map((d) => d['region']);

        var regionData = {};
        regions.forEach((region) => {
          var lines = [];
          var rData = data.filter((d) => d['region'] === region);
          var apps = _.uniqBy(rData, 'app').map((d) => d['app']);
          var lines = apps.map((app) => {
            var line = [app];
            var appData = rData.filter((d) => d['app'] === app).map((d) => d['share']);
            return line.concat(appData);
          });
          regionData[region] = lines;
        });

        this.dates = dates;
        this.data = regionData;
        resolve();
      });
    });
  }

  getColumns() {
    return this.data[this.region];
  }

  initChart() {
    this.chart = c3.generate({
      bindto: this.element,
      x: 'x',
      data: {
        columns: this.getColumns()
      },
      axis: {
        x: {
          type: 'category',
          categories: this.dates,
        },
        y: {
          tick: {
            count: 6,
            format: d3.format(',.1%'),
          }
        }
      }
    });
  }

  updateChart() {
    var columns = this.getColumns();
    var existingColumnNames = this.chart.data().map((d) => d.id);
    var newColumnNames = columns.map((row) => row[0]);

    this.chart.load({
      columns: this.getColumns(),
      unload: _.difference(existingColumnNames, newColumnNames),
    });
  }

  render() {
    this.dataLoading.then(() => {
      this.initChart();
      $(window).resize(() => {
        this.updateChart();
      })
    });
  }
}