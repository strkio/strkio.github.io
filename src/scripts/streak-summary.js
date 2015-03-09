var moment = require('moment');
var PriorityQueue = require('./priority-queue');
var IntervalTree = require('./interval-tree');

var addStreak = function (s, e) {
  if (s > e) {
    return;
  }
  var len = e - s + 1 -
    (this.countExcluded ? 0 : this.dateHelper.excludedDaysInRange(s, e));

  this.tree.add(s, e, len);
  this.queue.add(s, len, len);
};

var findStreak = function (k) {
  return this.tree.find(k);
};

var removeStreak = function (s) {
  var el = this.tree.find(s);
  if (!!el) {
    this.queue.removeByKey(el.start);
    this.tree.remove(el.start);
    return el;
  } else {
    return null;
  }
};

/**
 * Calculates metrics for the streak
 * @param o Object with properties:
 *  'data',  'excludedDays',  'startDate', 'endDate', 'range', 'inverted'
 * @constructor
 */
function StreakMetrics(o) {
  this.endDate = o.endDate || moment().startOf('day').format('YYYY-MM-DD');
  this.startDate = o.startDate ||
  moment().subtract(1, 'year').startOf('day').format('YYYY-MM-DD');

  this.excludedDays = o.excludedDays || [];
  this.dateHelper = new StreakMetrics.DateHelper(this.startDate, this.endDate,
    this.excludedDays);

  this.range = o.range && o.range.length ?
    o.range.slice() : [Number.MIN_VALUE, Number.MAX_VALUE];
  this.range.sort(function (l, r) {
    return l - r;
  });
  this.inverted = !!o.inverted;
  //this.data = clone(o.data);

  // whether to count excluded days in streak length
  this.countExcluded = false;

  this.keysCounter = {
    index : {},
    count : 0,
    add : function (k) {
      if (!(k in this.index)) {
        this.index[k] = true;
        this.count++;
      }
    },
    remove : function (k) {
      if (k in this.index) {
        delete this.index[k];
        this.count--;
      }
    }
  };

  this.tree = new IntervalTree(0, this.dateHelper.endDateInt);
  this.queue = new PriorityQueue();

  if (this.inverted) {
    addStreak.call(this, 0, this.dateHelper.endDateInt);
  }

  var data = o.data || [];
  for (var k in data) {
    if (data.hasOwnProperty(k)) {
      this.add(k, data[k]);
    }
  }
}

/**
 * Adds day to the graph. Merges streaks if necessary.
 * @param d
 */
var addDay = function (d) {
  if (!findStreak.call(this, d)) {
    var prev = this.dateHelper.nonExcludedDayBefore(d - 1) || 0;
    var next = this.dateHelper.nonExcludedDayAfter(d + 1) ||
      this.dateHelper.endDateInt;

    var startD = d;
    var endD = d;

    var s = removeStreak.call(this, prev);
    if (!!s) {
      startD = this.dateHelper.nonExcludedDayBefore(s.start);
    }
    startD = startD || 0;

    s = removeStreak.call(this, next);
    if (!!s) {
      endD = this.dateHelper.nonExcludedDayBefore(s.end);
    }
    endD = endD === null ? this.dateHelper.endDateInt : endD;

    addStreak.call(this, startD, endD);
  }
};

/**
 * Adds day to the graph. Merges streaks if necessary.
 * @param d
 */
var removeDay = function (d) {
  var el = removeStreak.call(this, d);
  if (!!el) {
    addStreak.call(this, el.start, d - 1);
    addStreak.call(this, d + 1, el.end);
  }
};

var invalidDay = function (day) {
  return (day < 0 || day > this.dateHelper.endDateInt ||
  this.dateHelper.isExcluded(day));
};

/**
 * Add day to the statistics.
 * @param key String date in format "YYYY-MM-DD"
 * @param value Number value for current day
 */
StreakMetrics.prototype.add = function (key, value) {
  var day = this.dateHelper.asInt(key);
  if (invalidDay.call(this, day)) {
    return;
  }

  var inRange = this.range[0] <= value && value <= this.range[1];

  if (value) {
    this.keysCounter.add(day);
  } else {
    this.keysCounter.remove(day);
  }
  // I feel the lack of logical XOR here
  if (!this.inverted && inRange || this.inverted && !inRange) {
    addDay.call(this, day);
  } else {
    removeDay.call(this, day);
  }
};

/**
 * Removes day from the statistics
 * @param key String date in format "YYYY-MM-DD"
 */
StreakMetrics.prototype.remove = function (key) {
  var day = this.dateHelper.asInt(key);
  if (invalidDay.call(this, day)) {
    return;
  }
  this.keysCounter.remove(day);
  if (!this.inverted) {
    removeDay.call(this, day);
  } else {
    addDay.call(this, day);
  }
};

StreakMetrics.prototype.totalEntries = function () {
  return this.keysCounter.count;
};

StreakMetrics.prototype.longestStreak = function () {
  var el = this.queue.peekMax();
  return el ? el.value : 0;
};

StreakMetrics.prototype.currentStreak = function () {
  var el = findStreak.call(this, this.dateHelper.endDateInt);
  return el ? el.value : 0;
};

StreakMetrics.DateHelper =
  function (startDate, endDate, excludeDays) {
    var startDateMoment = moment(startDate);

    /**
     * Returns date as number of days since startDate:
     *  0 - start Date
     *  1 - day after start date and so on
     * @param date
     * @returns Int date as int
     */
    this.asInt = function (date) {
      return moment(date).diff(startDateMoment, 'days');
    };

    this.endDateInt = this.asInt(endDate);

    var startDateDay = startDateMoment.day();
    var excludeDaysIndex = excludeDays.reduce(function (obj, k) {
      obj[k] = true;
      return obj;
    }, {});

    /**
     * number of excluded days from the beginning of the week to the current
     * index
     */
    var excludedDaysSum = [];
    for (var i = 0, exDays = 0; i < 7; i++) {
      exDays += (i in excludeDaysIndex) ? 1 : 0;
      excludedDaysSum[i] = exDays;
    }

    /**
     * Returns day of week for given day.
     * Sunday is 0
     * Monday is 1
     * ....
     * Saturday is 6
     * @param intDate Int
     * @returns {number}  0..6
     */
    this.dayOf = function (intDate) {
      return (intDate + startDateDay + 7) % 7;
    };

    /**
     * Checks whether provided day is marked as excluded
     * @param d Int
     * @returns {boolean} true if this day in in list of excluded
     */
    this.isExcluded = function (d) {
      return this.dayOf(d) in excludeDaysIndex;
    };

    /**
     * Returns the number of excluded days in range.
     * Takes start and and as numbers (see asInt method).
     * @param start Int
     * @param end Int
     */
    this.excludedDaysInRange = function (start, end) {
      var weekExDays = excludeDays.length;

      var partials = excludedDaysSum[this.dayOf(end)] -
        excludedDaysSum[this.dayOf(start - 1)];

      if (this.dayOf(start - 1) >= this.dayOf(end)) {
        partials += weekExDays;
      }

      return partials + Math.floor((end - start) / 7) * weekExDays;
    };

    /**
     * Returns first non-excluded day before argument
     * @param d  Int day
     * @returns Int if there is such day in range, null otherwise
     */
    this.nonExcludedDayBefore = function (d) {
      if (excludeDays.length >= 7) {
        return null;
      }
      while (d >= 0 && this.isExcluded(d)) {
        d--;
      }
      return d >= 0 ? d : null;
    };

    /**
     * Returns next non-excluded day before argument
     * @param d  Int day
     * @returns Int if there is such day in range, false otherwise
     */
    this.nonExcludedDayAfter = function (d) {
      if (excludeDays.length >= 7) {
        return null;
      }
      while (d <= this.endDateInt && this.isExcluded(d)) {
        d++;
      }
      return d <= this.endDateInt ? d : null;
    };
  };

module.exports = StreakMetrics;
