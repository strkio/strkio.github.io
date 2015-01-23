var d3 = require('d3');

function CalendarGraphTooltip() {}

function minmax(coloring) {
  var b = [];
  Object.keys(coloring).forEach(function (k) {
    var v = coloring[k];
    if (typeof v === 'number') {
      b.push(v);
    } else {
      Array.prototype.push.apply(b, v);
    }
  });
  b.sort(function (l, r) {return l - r;});
  return [b[0], b[b.length - 1]];
}

CalendarGraphTooltip.prototype.onAttach = function (cg) {
  var tooltipFormat = d3.time.format('%e %b, %Y');

  var containerSelector = cg._containerSelector;
  var daySelector = cg._daySelector;
  var data = cg._data;

  var mm = minmax(cg.options.coloring);
  var lowerBoundary = mm[0];
  var upperBoundary = mm[1];

  var cellSize = cg.options.cellSize;
  var type = upperBoundary - lowerBoundary ? 'numeric' : 'boolean';

  var updateValue = function (key, value) {
    var v = parseInt(value, 10);
    if (!v || (lowerBoundary <= v && v <= upperBoundary)) {
      cg.updateValue(key, v);
    }
  };

  var tooltip = containerSelector
    .attr('style', function () {
      var current = containerSelector.attr('style');
      return (current || '') + 'position:relative;';
    })
    .append('div')
    .attr('class', 'cg-tooltip');

  var tooltipShown;

  var showTooltip = function (d) {
    var self = this;
    var hideItself = hideTooltip.bind(this);
    this.classList.add('active');
    tooltip
      .html(tooltipFormat(d) + (type === 'numeric' ?
      '<input type="number" value="' + (data[d] || 0) + '" ' +
      'min="' + lowerBoundary + '" ' +
      'max="' + upperBoundary + '" ' +
      (cg.options.readOnly ? 'disabled ' : '') +
      '></input>' : ''));
    //.attr('style', 'display: block;');
    var tooltipEL = tooltip[0][0];
    var offsetParentBCR = this.offsetParent.getBoundingClientRect();
    var BCR = this.getBoundingClientRect();
    /*
     tooltip
     .attr('style',
     'display: block;' +
     'left: ' + (BCR.left - offsetParentBCR.left -
     tooltipEL.offsetWidth / 2 + cellSize / 2) + 'px;' +
     'top: ' + (BCR.top - offsetParentBCR.top -
     cellSize - tooltipEL.offsetHeight) + 'px;');
     */
    var style = tooltipEL.style;
    style.left = (BCR.left - offsetParentBCR.left -
    tooltipEL.offsetWidth / 2 + cellSize / 2) + 'px';
    style.top = (BCR.top - offsetParentBCR.top -
    cellSize - tooltipEL.offsetHeight) + 'px';
    style.visibility = 'visible';

    if (type === 'numeric') {
      tooltip
        .select('input')
        .on('keypress', function () {
          var keyCode = d3.event.keyCode;
          if (keyCode === 13) {
            updateValue(d, this.value);
            hideItself();
          }
        })
        .on('blur', hideItself)
        .on('change', function () {
          // todo: throttle
          updateValue(d, this.value);
          self.classList.add('active');
        });
    }
    tooltipShown = true;
  };

  var keepInPlace;
  var hideTooltip = function () {
    if (tooltipShown) {
      this.classList.remove('active');
      tooltip[0][0].style.visibility = 'hidden';
      // causes flicker:
      // tooltip.attr('style', 'display: none').html('');
      keepInPlace = false;
      tooltipShown = false;
    }
  };

  var prevD;
  daySelector
    .on('click', function (d) {
      if (this.classList.contains('disabled')) {
        return;
      }
      if (type === 'numeric') {
        if (prevD === d) {
          prevD = null;
          return;
        }
        showTooltip.call(this, d);
        tooltip.select('input')[0][0].focus();
        keepInPlace = true;
        prevD = d;
      } else {
        updateValue(d, data[d] ? 0 : upperBoundary);
      }
    })
    .on('mouseover', function (d) {
      // todo: eliminate
      if (this.classList.contains('disabled') || keepInPlace) {
        return;
      }
      showTooltip.call(this, d);
    })
    .on('mouseout', function () {
      // todo: eliminate
      if (this.classList.contains('disabled') || keepInPlace) {
        return;
      }
      hideTooltip.call(this);
    });
};

module.exports = CalendarGraphTooltip;
