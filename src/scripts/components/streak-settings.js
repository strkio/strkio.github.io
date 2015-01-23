var moment = require('moment');

var Vue = require('vue');
var Pikaday = require('pikaday');

function cloneObject(o) {
  return JSON.parse(JSON.stringify(o));
}

function arraysEqual(l, r) {
  return JSON.stringify(l) === JSON.stringify(r);
}

function objectsDeepEqual(l, r) {
  return JSON.stringify(l) === JSON.stringify(r);
}

module.exports = Vue.extend({
  template: require('../../templates/components/streak-settings.html'),
  compiled: function () {
    var excludedDays = this.$data.streak.excludedDays || [];
    for (var i = 0; i < 7; i++) {
      this.$data.$add('excludeDay' + i, ~excludedDays.indexOf(i));
    }
    this.$data.$add('startDate', this.$data.streak.startDate);
    var coloring = this.$data.streak.coloring || {
        green: [1, 1]
      };
    this.$data.$add('coloring', cloneObject(coloring));
    this.$data.$add('numeric',
      // fixme: this is only one case of a many
      !objectsDeepEqual(coloring, {red: [1, 1]}) &&
      !objectsDeepEqual(coloring, {green: [1, 1]})
    );
    this.$data.$add('inverted', objectsDeepEqual(coloring, {red: [1, 1]}));
    var updateStartDate = function (d) {
      this.$data.startDate = d ? moment(d).format('YYYY-MM-DD') : '';
    }.bind(this);
    var pikaday = new Pikaday({
      field: this.$$.datepicker,
      onSelect: updateStartDate
    });
    this.$$.datepicker.addEventListener('keydown', function (e) {
      if (e.keyCode === 46 || e.keyCode === 8) {
        pikaday.setDate(null);
        pikaday.hide();
        updateStartDate(null);
      }
      e.preventDefault();
    });
    if (this.$data.startDate) {
      pikaday.setDate(this.$data.startDate);
    }
  },
  data: function () {
    return {
      startDate: '',
      excludedDays: [],
      coloring: {
        'green': [1, 1],
        'red': []
      }
    };
  },
  methods: {
    applyChanges: function () {
      var updatedSettings = {
        startDate: this.startDate || null,
        excludedDays: [],
        coloring: this.coloring // todo: clone
      };
      for (var i = 0; i < 7; i++) {
        if (this['excludeDay' + i]) {
          updatedSettings.excludedDays.push(i);
        }
      }
      var settings = this.$data.streak;
      Object.keys(updatedSettings).forEach(function (key) {
        settings.$add(key);
        settings[key] = updatedSettings[key];
      });
      this.$dispatch('streak-updated');
      this.$parent.restoreDefaultView({targetVM: this.$parent});
    },
    toggleDayExclusion: function (index) {
      var key = ('excludeDay' + index);
      this.$data[key] = !this.$data[key];
      // todo: sync excludedDays[]
    },
    toggleRG: function (e) {
      //this.$data.inverted = e.target.checked;
      this.$data.coloring = e.target.checked ?
        {red: [1, 1]} : {green: [1, 1]};
    },
    toggleAdvancedMode: function () {
      var off = this.numeric;
      if (off) {
        var $data = this.$data;
        var coloring = $data.coloring;
        $data.inverted = !coloring.green &&
          arraysEqual(coloring.red, [1, 1]);
        if ($data.inverted) {
          $data.coloring = {red: [1, 1]};
        }
      }
    }
/*
    cancel: function () {
      this.$parent.cancel();
    }
*/
  }
});
