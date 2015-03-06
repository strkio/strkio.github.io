var Vue = require('vue');
var Pikaday = require('pikaday');
var moment = require('moment');

module.exports = Vue.extend({
  template: require('../../templates/components/streak-settings.html'),
  ready: function () {
    var data = this.$data;
    data.streak || (data.streak = {data: {}});
    data.$add('update', !!data.streak.name);
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
    // fixme: 'next-with-tab' isn't working
    this.$$.datepicker.addEventListener('keydown', function (e) {
      if (e.keyCode === 46 || e.keyCode === 8) {
        pikaday.setDate(null);
        pikaday.hide();
        updateStartDate(null);
      }
      if (e.keyCode !== 9) {
        e.preventDefault();
      }
    });
    if (data.startDate) {
      pikaday.setDate(moment(data.startDate).toDate());
    }
    this._pikaday = pikaday;
    this.$$.name.focus();
  },
  beforeDestroy: function () {
    this._pikaday && this._pikaday.destroy();
  },
  methods: {
    validateName: function () {
      var msg;
      var name = (this.$data.name || '').trim();
      if (!name) {
        msg = 'Name is required.';
      } else if (name.indexOf('/') !== -1) {
        msg = 'Name cannot contain \'/\' character.';
      } else if (
        this.$data.streak.name !== name &&
          // todo: eliminate dependency on root vm
        this.$root.$data.set.streaks.some(
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
      var range = this.$data.range.slice();
      if (range.length) {
        range[0] = parseInt(range[0], 10);
        range[1] = parseInt(range[1], 10);
      }
      var updatedSettings = {
        name: this.$data.name,
        startDate: this.$data.startDate || null,
        excludedDays: [],
        range: range,
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
      this.$dispatch('streak-settings-closed', streak);
    },
    cancel: function () {
      this.$dispatch('streak-settings-closed');
    },
    toggleDayExclusion: function (index) {
      var key = 'excludeDay' + index;
      this.$data[key] = !this.$data[key];
    }
  }
});
