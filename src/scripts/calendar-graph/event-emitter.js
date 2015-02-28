function EventEmitter() {
  this._ls = {};
}

EventEmitter.prototype.on = function (eventName, listener) {
  (this._ls[eventName] || (this._ls[eventName] = [])).push(listener);
  return this;
};

EventEmitter.prototype.off = function (eventName, listener) {
  var ls = this._ls[eventName];
  if (ls) {
    if (listener) {
      var index = ls.indexOf(listener);
      if (~index) {
        ls.splice(index, 1);
      }
    } else {
      this._ls[eventName] = [];
    }
  }
  return this;
};

EventEmitter.prototype.trigger = function (eventName, payload) {
  var ls = this._ls[eventName];
  if (ls) {
    ls.forEach(function (listener) {
      listener.call(null, payload);
    });
  }
  return this;
};

module.exports = EventEmitter;
