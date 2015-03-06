var moment = require('moment');

/*
 * todo: complete rewrite. Current version is extremely inefficient and was
 * never meant to be used for anything other than PoF.
 */

function StreakMetrics(o) {
  this.endDate = o.endDate || moment().startOf('day').format('YYYY-MM-DD');
  this.startDate = o.startDate;
  this.excludedDays = o.excludedDays || [];
  this.range = o.range && o.range.length ?
    o.range.slice() : [Number.MIN_VALUE, Number.MAX_VALUE];
  this.range.sort(function (l, r) { return l - r; });
  this.inverted = !!o.inverted;
  this.data = o.data;
}

StreakMetrics.prototype.totalEntries = function () {
  var data = this.data;
  var startDate = this.startDate;
  var excludedDays = this.excludedDays;
  return Object.keys(data).reduce(
    function (v, key) {
      return v + ((!startDate || startDate <= key) && data[key] &&
        !~excludedDays.indexOf(moment(key).day()) ? 1 : 0);
    }, 0);
};

StreakMetrics.prototype.longestStreak = function () {
  var data = this.data;
  var endDate = moment(this.endDate);
  var startDate = this.startDate ? moment(this.startDate) : null;
  var excludedDays = this.excludedDays;
  var range = this.range;
  var inverted = this.inverted;
  var keys = Object.keys(data).sort();
  var entries = [];
  if (inverted) {
    entries.push(moment(startDate));
  }
  var dayBeforeStartDate = moment(startDate).subtract(1, 'day');
  var dayAfterEndDate = moment(endDate).add(1, 'day');
  keys.forEach(function (key) {
    var d = moment(key);
    if (data[key] &&
        (!startDate || d.isAfter(dayBeforeStartDate)) &&
        d.isBefore(dayAfterEndDate) &&
        !~excludedDays.indexOf(moment(key).day()) &&
        range[0] <= data[key] && data[key] <= range[1]) {
      entries.push(d);
    }
  });
  if (inverted) {
    entries.push(endDate);
  }
  if (entries.length === (inverted ? 2 : 0)) {
    return inverted ? endDate.diff(startDate, 'days') + 1 : 0;
  }
  var longest = 0;
  var streak = 1;
  for (var i = 0, j, end = entries.length - 1; i < end; i++) {
    j = 0;
    var nextDay = moment(entries[i]);
    do {
      nextDay.add(1, 'day');
      j++;
    } while (~excludedDays.indexOf(nextDay.day()));
    if (inverted) {
      streak = entries[i + 1].diff(entries[i], 'days') - j + 1;
      if (longest < streak) {
        longest = streak;
      }
    } else {
      if (moment(entries[i]).add(j, 'day').isSame(entries[i + 1])) {
        streak++;
      } else {
        if (longest < streak) {
          longest = streak;
        }
        streak = 1;
      }
    }
  }
  if (longest < streak) {
    longest = streak;
  }
  return longest;
};

StreakMetrics.prototype.currentStreak = function () {
  var data = this.data;
  var endDate = moment(this.endDate);
  var startDate = this.startDate ? moment(this.startDate) : null;
  var excludedDays = this.excludedDays;
  var range = this.range;
  var inverted = this.inverted;
  var result = 0;
  var countDown = startDate ? endDate.diff(startDate, 'days') + 1 :
    Number.MAX_VALUE;
  var dayBeforeStartDate = moment(startDate).subtract(1, 'day');
  var dayAfterEndDate = moment(endDate).add(1, 'day');
  var dataSpecified = function (key) {
    var d = moment(key);
    return (data[key] &&
      (!startDate || d.isAfter(dayBeforeStartDate)) &&
      d.isBefore(dayAfterEndDate) &&
      range[0] <= data[key] && data[key] <= range[1]) ||
      ~excludedDays.indexOf(d.day());
  };
  while ((dataSpecified(endDate.format('YYYY-MM-DD')) ^ inverted) &&
    countDown--) {
    if (!~excludedDays.indexOf(endDate.day())) {
      result++;
    }
    endDate.subtract(1, 'day');
  }
  return result;
};

module.exports = StreakMetrics;
