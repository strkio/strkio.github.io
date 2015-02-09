var Vue = require('vue');
var Pikaday = require('pikaday');
var moment = require('moment');

module.exports = Vue.extend({
  template: require('../../templates/components/streak-settings.html'),
  data: function () {
    return {
      name: null,
      startDate: null,
      excludedDays: [],
      range: [],
      inverted: false
    };
  },
  ready: function () {
    var data = this.$data;
    data.$add('existing', data.existing);
    ['name', 'startDate', 'days', 'range'].forEach(function (field) {
      data.$add(field + 'ValidationResult');
    });
    data.$add('name', data.streak.name);
    data.$add('startDate', data.streak.startDate);
    var excludedDays = data.streak.excludedDays || [];
    for (var i = 0; i < 7; i++) {
      data.$add('excludeDay' + i, ~excludedDays.indexOf(i));
    }
    var range = data.streak.range || [];
    data.$add('range', range);
    data.$add('type', range.length ? 'number' : 'toggle');
    data.$add('inverted', !!data.streak.inverted);
    // initialize "start date" selector
    var updateStartDate = function (d) {
      data.startDate = d ? moment(d).format('YYYY-MM-DD') : '';
    };
    var pikaday = new Pikaday({
      field: this.$$.datepicker,
      maxDate: new Date(),
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
    if (data.startDate) {
      pikaday.setDate(moment(data.startDate).toDate());
    }
  },
  methods: {
    validateName: function () {
      var msg;
      var name = this.$data.name;
      if (!name) {
        msg = 'Name is required.';
      } else if (name.indexOf('/') !== -1) {
        msg = 'Name cannot contain \'/\' character.';
      } else if (
        this.$data.streak.name !== name &&
          // @fixme: no need to say how bad this is
        this.$parent.$parent.$data.streaks.some(
          function (streak) {return streak.name === name;})) {
        msg = 'Name is already taken.';
      }
      return !(this.$data.nameValidationResult = msg);
    },
    validateStartDate: function () {
      var msg;
      if (this.$data.inverted && !this.$data.startDate) {
        msg = 'Start date is required (for inverted streak only).';
      }
      return !(this.$data.startDateValidationResult = msg);
    },
    validateDays: function () {
      var msg = 'At least one day must be selected.';
      for (var i = 0; i < 7; i++) {
        if (!this['excludeDay' + i]) {
          msg = null;
          break;
        }
      }
      return !(this.$data.daysValidationResult = msg);
    },
    validateRange: function () {
      var msg;
      if (this.$data.type === 'number') {
        var range = this.$data.range;
        if (range[0] && range[1]) {
          if ((range[0] <= 0 && 0 <= range[1]) ||
            (range[1] <= 0 && 0 <= range[0])) {
            msg = 'Range cannot contain 0.';
          }
        } else {
          msg = 'Range is required.';
        }
      }
      return !(this.$data.rangeValidationResult = msg);
    },
    applyChanges: function () {
      var valid = ['name', 'startDate', 'days', 'range']
        .every(function (field) {
          return this['validate' +
            field.charAt(0).toUpperCase() + field.slice(1)]();
        }.bind(this));
      if (!valid) {
        return;
      }
      var updatedSettings = {
        name: this.$data.name,
        startDate: this.$data.startDate || null,
        excludedDays: [],
        range: this.$data.range,
        inverted: this.$data.inverted
      };
      for (var i = 0; i < 7; i++) {
        if (this.$data['excludeDay' + i]) {
          updatedSettings.excludedDays.push(i);
        }
      }
      var streak = this.$data.streak;
      Object.keys(updatedSettings).forEach(function (key) {
        streak.$add(key);
        streak[key] = updatedSettings[key];
      });
      this.$dispatch('set-updated');
      // @fixme: dispatch event instead
      this.$parent.restoreDefaultView({targetVM: this.$parent});
    },
    toggleDayExclusion: function (index) {
      var key = 'excludeDay' + index;
      this.$data[key] = !this.$data[key];
    }
  }
});
