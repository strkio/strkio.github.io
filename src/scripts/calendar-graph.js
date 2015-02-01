var d3 = require('d3');
var moment = require('moment');

function ColorDistribution(options) {
  var mapping = options.mapping;
  this._intervals = Object.keys(mapping)
    .map(function (color) {
      var interval = mapping[color];
      if (typeof interval === 'number') {
        interval = [interval, interval];
      } else if (interval.length !== 2 ||
        isNaN(interval[0]) || isNaN(interval[1])) {
        throw new Error(interval + ' is not a valid interval');
      }
      return {id: color, interval: interval};
    });
  if (!this._intervals.length) {
    throw new Error('At least one interval must be defined');
  }
  this._maxColorIndex = options.maxColorIndex || 4;
}

ColorDistribution.prototype._findInterval = function (v) {
  var intervals = this._intervals;
  for (var i = 0, end = intervals.length, ci; i < end; i++) {
    ci = intervals[i];
    if (ci.interval[0] <= v && v <= ci.interval[1]) {
      return ci;
    }
  }
  return null;
};

ColorDistribution.prototype.colorAt = function (v) {
  var ci = this._findInterval(v);
  if (!ci) {
    return null;
  }
  var i = [ci.interval[0], ci.interval[1]];
  var inverted;
  if (i[0] > i[1]) {
    var i0 = i[0]; i[0] = i[1];	i[1] = i0; // swap
    inverted = true;
  }
  var maxColorIndex = this._maxColorIndex;
  var intervalLength = Math.abs(i[1] - i[0]);
  var cv = v - (v > 0 ? i[0] - 1 : i[1] + 1);
  var colorIndex = intervalLength ?
    Math.min(
      maxColorIndex,
      Math.ceil(((maxColorIndex + 1) / intervalLength) * Math.abs(cv))
    ) : 1;
  return {
    id: ci.id,
    intensity: colorIndex ?
      (inverted ? maxColorIndex - colorIndex : colorIndex) : 0
  };
};

function EventEmitter() {
  this._ls = {};
}

EventEmitter.prototype.on = function (eventName, listener) {
  (this._ls[eventName] || (this._ls[eventName] = [])).push(listener);
  return this;
};

EventEmitter.prototype.off = function (eventName, listener) {
  var ls = this._ls[eventName];
  if (ls) {
    if (listener) {
      var index = ls.indexOf(listener);
      if (~index) {
        ls.splice(index, 1);
      }
    } else {
      this._ls[eventName] = [];
    }
  }
  return this;
};

EventEmitter.prototype.trigger = function (eventName, payload) {
  var ls = this._ls[eventName];
  if (ls) {
    ls.forEach(function (listener) {
      listener.call(null, payload);
    });
  }
  return this;
};

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
  EventEmitter.call(this);
}

CalendarGraph.prototype = Object.create(EventEmitter.prototype);

function nf(f) {
  return function () {return +f.apply(null, arguments);};
}

//CalendarGraph.prototype.fitsIn = function (el, trail) {
//	var width = el.getBoundingClientRect().width;
//	return trail === ~~(trail * width /
//		this._svg.getComputedStyle('width'));
//};

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
    var boundingClientRect = el.getBoundingClientRect();
    trail = ~~(boundingClientRect.width /
      ((cellSize + strokeSize) * 5));
    if (trail < 12) {
      clientRect = this.determineClientRect(endDate, trail + 1);
      if (clientRect.width < boundingClientRect.width) {
        trail++;
      }
    }
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

  svg.selectAll('.label-x')
    .data([startDate].concat(d3.time.months(startDate, endDate))).enter()
    .append('text')
    .text(monthNameFormat)
    .attr('class', 'label-x')
    .attr('x', function (d, i) {
      var shift = i === 1 ? cellSize * 2 + strokeSize * 2 : 0;
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
  var colorDistribution = this._colorDistribution ||
    (this._colorDistribution =
      new ColorDistribution({mapping: this.options.coloring}));
  this._daySelector
    .filter(function (d) {
      return data.hasOwnProperty(d);
    })
    .attr('class', function (d) {
      if (disableDay && disableDay(d)) {
        return 'day disabled';
      }
      var c = colorDistribution.colorAt(+data[d]);
      return 'day' + (c ? ' ' + c.id + ' cg-color-' + c.intensity : '');
    });
};

module.exports = CalendarGraph;
