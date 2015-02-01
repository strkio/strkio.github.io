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
    this.$data.$add('existing', this.$data.existing);
    ['name', 'startDate', 'days', 'range'].forEach(function (field) {
      this.$data.$add(field + 'ValidationResult');
    }.bind(this));
    this.$data.$add('name', this.$data.streak.name);
    this.$data.$add('startDate', this.$data.streak.startDate);
    var excludedDays = this.$data.streak.excludedDays || [];
    for (var i = 0; i < 7; i++) {
      this.$data.$add('excludeDay' + i, ~excludedDays.indexOf(i));
    }
    var range = this.$data.streak.range || [];
    this.$data.$add('range', range);
    this.$data.$add('type', range.length ? 'number' : 'toggle');
    this.$data.$add('inverted', !!this.$data.streak.inverted);
    // initialize "start date" selector
    var updateStartDate = function (d) {
      this.$data.startDate = d ? moment(d).format('YYYY-MM-DD') : '';
    }.bind(this);
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
    if (this.$data.startDate) {
      pikaday.setDate(moment(this.$data.startDate).toDate());
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
        name: this.name,
        startDate: this.startDate || null,
        excludedDays: [],
        range: this.range,
        inverted: this.inverted
      };
      for (var i = 0; i < 7; i++) {
        if (this['excludeDay' + i]) {
          updatedSettings.excludedDays.push(i);
        }
      }
      var streak = this.$data.streak;
      Object.keys(updatedSettings).forEach(function (key) {
        streak.$add(key);
        streak[key] = updatedSettings[key];
      });
      this.$dispatch('streak-updated');
      // @fixme: dispatch event instead
      this.$parent.restoreDefaultView({targetVM: this.$parent});
    },
    toggleDayExclusion: function (index) {
      var key = ('excludeDay' + index);
      this.$data[key] = !this.$data[key];
    }
  }
});
