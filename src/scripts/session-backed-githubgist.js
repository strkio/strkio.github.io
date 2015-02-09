var session = require('./session');
var GitHubGist = require('strkio-storage-githubgist');

function SessionBackedGitHubGist() {
  var args = Array.prototype.slice.call(arguments);
  this.gist = new (Function.prototype.bind.apply(GitHubGist,
    [null].concat(args)))();
}

SessionBackedGitHubGist.prototype.fetch = function (o, callback) {
  if (typeof o === 'function') {
    callback = o;
    o = {};
  }
  var cachedItemKey = 'gist-' + this.gist.data.id;
  if (!o.force) {
    var cachedItem = session.get(cachedItemKey + '-updated') ||
      session.get(cachedItemKey);
    if (cachedItem) {
      var data = JSON.parse(cachedItem);
      if (data.owner === session.get('user')) {
        return callback(null, data);
      }
    }
  }
  this.gist.fetch(function (err, self) {
    // do not cache Gist unless it belongs to the current user,
    // this way we will always get the latest snapshot
    if (err) {
      return callback(err);
    }
    var data = self.data;
    var owner = data.owner === session.get('user');
    if (owner) {
      session.set(cachedItemKey, JSON.stringify(data));
    }
    callback(null, data);
  });
};

SessionBackedGitHubGist.prototype.save = function (data, callback) {
  var gistId = this.gist.data.id;
  if (gistId) {
    // update existing gist
    var cachedItemKey = 'gist-' + gistId;
    if (typeof data === 'function') {
      callback = data;
      data = JSON.parse(session.get(cachedItemKey + '-updated') ||
        session.get(cachedItemKey));
    } else {
      session.set(cachedItemKey + '-updated', JSON.stringify(data));
    }
    this.gist.data = JSON.parse(session.get(cachedItemKey));
    this.gist.save(data, function (err, self) {
      if (err) {
        callback(err);
      } else {
        session.set(cachedItemKey, JSON.stringify(self.data));
        session.remove(cachedItemKey + '-updated');
        callback(null, self.data);
      }
    });
  } else {
    // create a new gist
    if (typeof data === 'function') {
      callback = data;
    } else {
      this.gist.data = data;
    }
    this.gist.save(function (err, self) {
      if (err) {
        callback(err);
      } else {
        session.set(cachedItemKey, JSON.stringify(self.data));
        callback(null, self.data);
      }
    });
  }
};

SessionBackedGitHubGist.prototype.updatePending = function () {
  var gistId = this.gist.data.id;
  return gistId ? !!session.get('gist-' + gistId + '-updated') : false;
};

module.exports = SessionBackedGitHubGist;
