/**
 * Priority queue backed by binary heap.
 * Also provides Map interface
 * (the ability to manipulate elements referenced by key)
 * @constructor
 */
function PriorityQueue() {
  // using zero-starting heap array
  // childe nodes: i * 2 + 1,   i * 2 + 2
  // parent node:  (i - 1) / 2
  this.elements = [];
  this.index = {};
}

function wrapToReturn(el) {
  return {
    key: el.k,
    priority: el.p,
    value: el.v
  };
}

/**
 * "private method"
 * to be called as deleteLast.call(this)
 *
 * @returns {*} wrapped element
 */
var deleteLast = function () {
  var el = this.elements.pop();
  delete this.index[el.k];
  return wrapToReturn(el);
};

/**
 * "private method" to be called as swap.call(this, i, j)
 * swaps elements on the indexes i and j,
 * @param i
 * @param j
 */
var swap = function (i, j) {
  var iEl = this.elements[i];
  var jEl = this.elements[j];

  this.index[iEl.k] = j;
  this.index[jEl.k] = i;

  this.elements[i] = jEl;
  this.elements[j] = iEl;
};

var heapifyUp = function (index) {
  if (index < 0 || index >= this.elements.length) {
    return;
  }

  var parent = Math.floor((index - 1) / 2);
  if (parent >= 0 && this.elements[parent].p < this.elements[index].p) {
    swap.call(this, index, parent);
    heapifyUp.call(this, parent);
  }
};

var heapifyDown = function (index) {
  if (index < 0 || index >= this.elements.length) {
    return;
  }

  var n = this.elements.length;
  var l = index * 2 + 1;
  var r = index * 2 + 2;
  var lP = l < n ? this.elements[l].p : false;
  var rP = r < n ? this.elements[r].p : false;
  var p = this.elements[index].p;

  if (lP !== false && lP > p && (rP === false || lP >= rP)) {
    swap.call(this, l, index);
    heapifyDown.call(this, l);
  } else if (rP !== false && rP > p && (lP === false || rP >= lP)) {
    swap.call(this, r, index);
    heapifyDown.call(this, r);
  }
};

var removeByIndex = function (idx) {
  if (idx >= 0 && idx < this.elements.length) {
    swap.call(this, idx, this.elements.length - 1);
    var elWrapped = deleteLast.call(this);
    heapifyDown.call(this, idx);
    return elWrapped;
  } else {
    return null;
  }
};

/**
 * Returns current size of the queue.
 * @returns {Number} size
 */
PriorityQueue.prototype.size = function () {
  return this.elements.length;
};

/**
 * Removes element that corresponds to the provided key.
 * Part of the Map interface.
 * @param key
 * @returns {*}
 */
PriorityQueue.prototype.removeByKey = function (key) {
  if (key in this.index) {
    var idx = this.index[key];
    return removeByIndex.call(this, idx);
  } else {
    return null;
  }
};

/**
 * Removes element that corresponds to the provided key.
 * Part of the Map interface.
 * @param key
 * @returns {*}
 */
PriorityQueue.prototype.removeByKey = function (key) {
  if (key in this.index) {
    var idx = this.index[key];
    return removeByIndex.call(this, idx);
  } else {
    return null;
  }
};

/**
 * Returns element that corresponds to the given key;
 * Part of the Map interface.
 * @param key
 * @returns {*}
 */
PriorityQueue.prototype.getByKey = function (key) {
  if (key in this.index) {
    var idx = this.index[key];
    return wrapToReturn(this.elements[idx]);
  } else {
    return null;
  }
};

/**
 * Returns the element with highest priority without removing it
 * from the queue.
 * @returns {*}
 */
PriorityQueue.prototype.peekMax = function () {
  if (this.elements.length > 0) {
    return wrapToReturn(this.elements[0]);
  } else {
    return null;
  }
};

/**
 * Returns the element with highest priority and removes it
 * from the queue.
 * @returns {*}
 */
PriorityQueue.prototype.pollMax = function () {
  return removeByIndex.call(this, 0);
};

/**
 * Adds the element to the queue.
 * @param key  key to reference the element in the future
 * @param priority
 * @param value
 */
PriorityQueue.prototype.add = function (key, priority, value) {
  if (key in this.index) {
    this.removeByKey(key);
  }
  var n = this.elements.length;
  this.elements[n] = {
    k: key, p: priority, v: value
  };
  this.index[key] = n;
  heapifyUp.call(this, n);
};

module.exports = PriorityQueue;
