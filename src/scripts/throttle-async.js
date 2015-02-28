module.exports = function (fn, wait) {
  var pending = false;
  var waiting = false;
  var invokeRightAfterCompletion = false;
  var timestamp;
  var wrapper = function () {
    if (pending) {
      invokeRightAfterCompletion = true;
      return false;
    }
    if (Date.now() - timestamp < wait) {
      if (waiting) {
        return false;
      }
      waiting = true;
      setTimeout(Function.prototype.bind.apply(wrapper,
          [null].concat(Array.prototype.slice.call(arguments))),
        Math.max(wait - (Date.now() - timestamp), 0));
      return true;
    }
    pending = true;
    waiting = false;
    timestamp = Date.now();
    var args = Array.prototype.slice.call(arguments);
    var cb = args[args.length - 1];
    fn.apply(null, args.slice(0, args.length - 1).concat(function (err) {
      var invoke = invokeRightAfterCompletion;
      pending = false;
      invokeRightAfterCompletion = false;
      if (invoke && !err) {
        setTimeout(Function.prototype.bind.apply(wrapper, [null].concat(args)),
          Math.max(wait - (Date.now() - timestamp), 0));
      } else {
        cb.apply(null, Array.prototype.slice.call(arguments));
      }
    }));
    return true;
  };
  return wrapper;
};
