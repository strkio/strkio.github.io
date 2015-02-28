var d3 = require('d3');

function CalendarGraphTooltip(options) {
  this.options = options || {};
}

CalendarGraphTooltip.prototype.onAttach = function (cg) {
  var tooltipFormat = d3.time.format('%e %b, %Y');

  var containerSelector = cg._containerSelector;
  var daySelector = cg._daySelector;
  var data = cg._data;

  var cellSize = cg.options.cellSize;
  var type = this.options.type;

  var updateValue = function (key, value) {
    cg.updateValue(key, parseInt(value, 10));
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
    var hideItself = hideTooltip.bind(this);
    d3.select(this).classed('active', true);
    tooltip
      .html(tooltipFormat(d) + (type === 'numeric' ?
      '<input type="number" value="' + (data[d] || 0) + '" ' +
      (cg.options.readOnly ? 'disabled ' : '') +
      '></input>' : ''));
    var tooltipEL = tooltip[0][0];
    var offsetParentBCR = tooltipEL.offsetParent.getBoundingClientRect();
    var BCR = this.getBoundingClientRect();
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
          d3.select(this).classed('active', true);
        });
    }
    tooltipShown = true;
  };

  var keepInPlace;
  var hideTooltip = function () {
    if (tooltipShown) {
      d3.select(this).classed('active', false);
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
      if (d3.select(this).classed('disabled')) {
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
        updateValue(d, data[d] ? 0 : 1);
      }
    })
    .on('mouseover', function (d) {
      // todo: eliminate
      if (d3.select(this).classed('disabled') || keepInPlace) {
        return;
      }
      showTooltip.call(this, d);
    })
    .on('mouseout', function () {
      // todo: eliminate
      if (d3.select(this).classed('disabled') || keepInPlace) {
        return;
      }
      hideTooltip.call(this);
    });
};

module.exports = CalendarGraphTooltip;
