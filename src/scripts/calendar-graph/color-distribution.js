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
      return {color: color, interval: interval};
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
    color: ci.color,
    intensity: colorIndex ?
      (inverted ? maxColorIndex - colorIndex : colorIndex) : 0
  };
};

module.exports = ColorDistribution;
