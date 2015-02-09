var PREFIX = 'strkio-';

var session = module.exports = {
  set: function (key, value) {
    localStorage.setItem(PREFIX + key, value);
    return session;
  },
  get: function (key) {
    return localStorage.getItem(PREFIX + key);
  },
  remove: function (key) {
    localStorage.removeItem(PREFIX + key);
    return session;
  },
  keys: function () {
    var r = [];
    for (var i = localStorage.length - 1, key; i > -1; i--) {
      key = localStorage.key(i);
      if (!key.indexOf(PREFIX)) {
        r.push(localStorage.key(i).slice(PREFIX.length));
      }
    }
    return r;
  },
  destroy: function () {
    session.keys().forEach(function (key) {
      localStorage.removeItem(PREFIX + key);
    });
  }
};
