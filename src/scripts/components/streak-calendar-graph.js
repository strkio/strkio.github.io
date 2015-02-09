var Vue = require('vue');
var moment = require('moment');
var CalendarGraph = require('../calendar-graph');
var CalendarGraphTooltip = require('../calendar-graph-tooltip');

module.exports = Vue.extend({
  ready: function () {
    var vm = this;
    var data = this.$data.data;
    var startDateTime = this.$data.startDate ?
      moment(this.$data.startDate).startOf('day').toDate().getTime() : 0;
    var excludedDays = this.$data.excludedDays || [];
    var coloring = {};
    var range = this.$data.range || [];
    coloring[this.$data.inverted ? 'red' : 'green'] =
      range.length ? range : [1, 1];
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
      use: [
        new CalendarGraphTooltip()
      ]
    }).on('change', function (e) {
        var key = e.key;
        if (e.value) {
          data.$add(key, e.value);
        } else {
          data.$delete(key);
        }
        vm.$dispatch('set-updated');
      }).attach(this.$el);
  }
});
