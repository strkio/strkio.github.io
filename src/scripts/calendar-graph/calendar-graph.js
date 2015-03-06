var d3 = require('d3');
var moment = require('moment');
var ColorDistribution = require('./color-distribution');
var EventEmitter = require('./event-emitter');

function extend(l, r) {
  Object.keys(r).forEach(function (key) {
    l[key] || (l[key] = r[key]);
  });
  return l;
}

function CalendarGraph(options) {
  this.options = extend(options || {}, {
    dataKeyFormat: d3.time.format('%Y-%m-%d'),
    data: {},
    cellSize: 15, strokeSize: 1,
    trail: 12,
    use: [],
    readOnly: false
  });
  if (this.options.monthSpacing == null) {
    this.options.monthSpacing = ~~(this.options.cellSize / 2);
  }
  this._colorDistribution =
    options.colorDistribution instanceof ColorDistribution ?
    options.colorDistribution :
    new ColorDistribution({mapping: this.options.colorDistribution});
  EventEmitter.call(this);
}

CalendarGraph.prototype = Object.create(EventEmitter.prototype);

function nf(f) {
  return function () {return +f.apply(null, arguments);};
}

function diffInWeeks(startDate, endDate) {
  return Math.ceil((
      moment(endDate).add(1, 'd').diff(moment(startDate), 'days') +
      startDate.getDay()
    ) / 7);
}

CalendarGraph.prototype.determineClientRect = function (endDate, trail) {
  var o = this.options;
  var startDate = moment(endDate).subtract(trail, 'months').toDate();
  var weeksInDiff = diffInWeeks(startDate, endDate);
  var width = (o.cellSize + o.strokeSize) *
    (weeksInDiff + 1 /* compensate for label-y */) +
    3 /* label-y margins */ +
    (trail * o.monthSpacing);
  var height = (o.cellSize + o.strokeSize) * 7 /* days in a week */ +
    20 /* compensate for label-x */;
  return {width: width, height: height};
};

CalendarGraph.prototype.calculateTrail = function (el, endDate) {
  var cellSize = this.options.cellSize;
  var strokeSize = this.options.strokeSize;

  var boundingClientRect = el.getBoundingClientRect();
  var trail = ~~(boundingClientRect.width / ((cellSize + strokeSize) * 5));
  if (trail < 12) {
    var clientRect = this.determineClientRect(endDate, trail + 1);
    if (clientRect.width < boundingClientRect.width) {
      trail++;
    }
  }
  return Math.min(trail, 12);
};

function debounce(fn, timeout) {
  var h;
  return function () {
    h && clearTimeout(h);
    h = setTimeout(function () {fn();}, timeout);
  };
}

CalendarGraph.prototype.attach = function (el) {
  var day = nf(d3.time.format('%w'));
  var	week = nf(d3.time.format('%U'));
  var monthNameFormat = d3.time.format('%b');

  var dateFormat = this.options.dataKeyFormat;
  var trail = this.options.trail;
  var cellSize = this.options.cellSize;
  var strokeSize = this.options.strokeSize;
  var monthSpacing = this.options.monthSpacing;
  var data = this.options.data;

  var disableDay = this.options.disableDay;

  var endDate = new Date();
  var clientRect;

  if (trail === 'auto') {
    trail = this.calculateTrail(el, endDate);
    var resizeListener = debounce(function () {
      if (this.calculateTrail(el, endDate) !== trail) {
        this.detach();
        window.removeEventListener('resize', resizeListener);
        this.attach(el);
      }
    }.bind(this), 300);
    window.addEventListener('resize', resizeListener);
  }

  clientRect = this.determineClientRect(endDate, trail);

  var startDate = moment(endDate)
    .subtract(trail, 'months')
    .hours(0).minutes(0).seconds(0).milliseconds(0)
    .toDate();

  var width = clientRect.width;
  var height = clientRect.height;

  var containerSelector = this._containerSelector = d3.select(el);

  var shiftXByWeek = d3.time.weeks(startDate, endDate)
    .reduce(function (obj, d, i) {
      obj[d.getFullYear() + '-' + week(d)] = i +
        (startDate.getDay() === 0 ? 0 : 1);
      return obj;
    }, {});

  var shiftXByMonth = d3.time.months(startDate, endDate)
    .reduce(function (obj, d, i) {
      obj[d.getFullYear() + '' + d.getMonth()] = i + 1;
      return obj;
    }, {});

  var svg = containerSelector
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'cg')
    .append('g');

  var dayX = function (d) {
    var m = moment(d);
    m.subtract(m.day(), 'days');
    d = m.toDate();
    var x = shiftXByWeek[d.getFullYear() + '-' + week(d)] || 0;
    var shiftByMonth = shiftXByMonth[d.getFullYear() + '' + d.getMonth()] || 0;
    return (x + 1) * (cellSize + strokeSize) + 3 +
      (shiftByMonth * monthSpacing);
  };
  var dayY = function (d) {
    return day(d) * (cellSize + strokeSize) + 1;
  };

  this._daySelector = svg.selectAll('.day')
    .data(d3.time.days(startDate, endDate)).enter()
    .append('rect')
    .attr('class', function (d) {
      if (disableDay && disableDay(d)) {
        return 'day disabled';
      }
      return 'day';
    })
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('x', dayX)
    .attr('y', dayY);

  var days = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
  svg.selectAll('.label-y').data([0, 2, 4]).enter()
    .append('text')
    .text(function (d) {return days[d];})
    .attr('class', 'label-y')
    .attr('x', 1)
    .attr('y', function (d) {
      return d * (cellSize + strokeSize) + 2 * cellSize;
    });

  var months = [startDate].concat(d3.time.months(startDate, endDate));
  svg.selectAll('.label-x')
    .data(months).enter()
    .append('text')
    .text(monthNameFormat)
    .attr('class', 'label-x')
    .attr('x', function (d, i) {
      var shift = i === 1 ? cellSize * 2 + strokeSize * 2 : 0;
      i === months.length - 1 && (shift -= 7);
      return dayX(d) + shift + strokeSize * 2 + 1;
    })
    .attr('y', function () {
      return 8 * (cellSize + strokeSize) + 1;
    });

  this._data = Object.keys(data).reduce(function (obj, key) {
    obj[dateFormat.parse(key)] = data[key];
    return obj;
  }, {});

  this._applyColoring(this._data);

  this.options.use.forEach(function (plugin) {
    plugin.onAttach(this);
  }.bind(this));

  return this;
};

CalendarGraph.prototype.detach = function () {
  this._containerSelector.selectAll('svg').remove();
};

CalendarGraph.prototype.updateValue = function (date, value) {
  if (this.options.readOnly) {
    return;
  }
  var key = this.options.dataKeyFormat(date);
  var previousValue = this.options.data[key];
  var data = {};
  data[date] = this._data[date] = this.options.data[key] = value;
  this._applyColoring(data);
  this.trigger('change',
    {key: key, previousValue: previousValue, value: value});
};

CalendarGraph.prototype._applyColoring = function (data) {
  var disableDay = this.options.disableDay;
  var colorDistribution = this._colorDistribution;
  this._daySelector
    .filter(function (d) {
      return data.hasOwnProperty(d);
    })
    .attr('class', function (d) {
      if (disableDay && disableDay(d)) {
        return 'day disabled';
      }
      var c = colorDistribution.colorAt(+data[d]);
      return 'day' + (c ? ' ' + c.color + ' cg-color-' + c.intensity : '');
    });
};

module.exports = CalendarGraph;
