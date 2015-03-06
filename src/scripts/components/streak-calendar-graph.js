var Vue = require('vue');
var moment = require('moment');
var CalendarGraph = require('../calendar-graph/calendar-graph');
var ColorDistribution = require('../calendar-graph/color-distribution');
var CalendarGraphTooltip = require('../calendar-graph/calendar-graph-tooltip');

module.exports = Vue.extend({
  ready: function () {
    // todo: update endDate after 11.59PM
    var vm = this;
    var data = this.$data.data;
    var startDateTime = this.$data.startDate ?
      moment(this.$data.startDate).startOf('day').toDate().getTime() : 0;
    var excludedDays = this.$data.excludedDays || [];
    var coloring = {};
    var range = this.$data.range || [];
    coloring[this.$data.inverted ? 'red' : 'green'] =
      range.length ? range : [1, 1];
    var colorDistribution = new ColorDistribution({mapping: coloring});
    colorDistribution.colorAt = function (v) {
      var c = ColorDistribution.prototype.colorAt.call(this, v);
      return c === null ?
        (v ? {color: 'yellow', intensity: 1} : null) : c;
    };
    new CalendarGraph({
      readOnly: !this.$root.$data.owner,
      trail: 'auto',
      disableDay: function (d) {
        return d.getTime() < startDateTime ||
          ~excludedDays.indexOf(d.getDay());
      },
      monthSpacing: 0,
      data: Object.keys(data).reduce(function (obj, key) {
        obj[key] = data[key];
        return obj;
      }, {}),
      coloring: coloring,
      colorDistribution: colorDistribution,
      use: [
        new CalendarGraphTooltip({
          type: range.length ? 'numeric' : 'boolean'
        })
      ]
    }).on('change', function (e) {
        var key = e.key;
        if (e.value) {
          data.$add(key, e.value);
          data[key] = e.value;
        } else {
          data.$delete(key);
        }
        vm.$dispatch('set-updated');
      }).attach(this.$el);
  }
});
