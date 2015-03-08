/**
 * This is simple implementation of the interval tree,
 * specially modified for non-intersecting intervals.
 * Thus it's simpler and more efficient comparing to generic interval BST.
 * Also it accepts only integers as keys.
 *
 * Params rangeStart and rangeEnd specify the domain for
 * future 'add' operation. However nothing critical will happen if
 * 'add' would be called with the value out of range. In this case
 * the range of the tree will be expanded and the tree will be rebuilt.
 *
 * @param rangeStart integer minimum possible key value
 * @param rangeEnd  integer maximum possible key value
 * @throws IllegalArgumentException if rangeStart or rangeEnd is not integer
 *    or rangeStart > rangeEnd
 */
function IntervalTree(rangeStart, rangeEnd) {
  if (!isInt(rangeStart) || !isInt(rangeEnd)) {
    throw new IllegalArgumentException('rangeStart or rangeEnd is not an integer');
  }
  if (rangeStart > rangeEnd) {
    throw new IllegalArgumentException('rangeStart should be less than rangeEnd');
  }

  this.rangeStart = rangeStart;
  this.rangeEnd = rangeEnd;

  this.root = new Node(Math.floor((rangeEnd + rangeStart) / 2));
}

/**
 * Visits all elements of the tree.
 * Calls callback with tree arguments,
 *   first is lower interval boundary for current element,
 *   second is high interval boundary for current element,
 *   third is element value itself
 * @param callback  function to call for each element
 */
IntervalTree.prototype.visit = function (callback) {
  function recIter(node) {
    !node.value || callback(node.value.s, node.value.e, node.value.v);
    !node.left || recIter(node.left);
    !node.right || recIter(node.right);
  }

  recIter(this.root);
};

/**
 * Adds element to the three.
 * Key is the interval that consists of low and high boundaries (inclusive), both integers.
 * Value can be anything.
 *
 * @param keyStart integer low boundary of the key
 * @param keyEnd  integer high boundary of the key
 * @param value  any value for the key
 * @return IntervalTree this, for chaining
 * @throws IllegalArgumentException if keyStart or keyEnd is not an integer
 *    or keyStart > keyEnd,
 *    or there is already the interval that intersects with the argument
 */
IntervalTree.prototype.add = function (keyStart, keyEnd, value) {
  if (!isInt(keyStart) || !isInt(keyEnd) || keyStart > keyEnd) {
    throw new IllegalArgumentException('keyStart and keyEnd should be numbers and keyStart <= keyAnd');
  }

  if (keyStart < this.rangeStart || this.rangeEnd < keyEnd) {
    var extendedTree = new IntervalTree(Math.min(this.rangeStart, keyStart), Math.max(this.rangeEnd, keyEnd));
    this.visit(function (s, e, v) {
      extendedTree.add(s, e, v);
    });
    extendedTree.add(keyStart, keyEnd, value);
    this.rangeStart = extendedTree.rangeStart;
    this.rangeEnd = extendedTree.rangeEnd;
    this.root = extendedTree.root;
    return this;
  }

  var nodeInRange = findInRange(this.root, keyStart, keyEnd);
  if (!!nodeInRange) {
    throw new IllegalArgumentException('Already contains interval that intersects with given range ' +
    '(' + keyStart + ',' + keyEnd + ') ' + JSON.stringify(nodeInRange.value));
  }

  function recAdd(node, leftBond, rightBond) {
    if (keyStart <= node.key && node.key <= keyEnd) {
      if (!!node.value) {
        throw new Error('Asserting failed. Interval for insertion ' +
        '(' + leftBond + ', ' + rightBond + ') should be clear, ' +
        'but got element: ' + JSON.stringify(node.value));
      }
      node.value = {s: keyStart, e: keyEnd, v: value};
    } else if (keyEnd < node.key) {
      node.left = node.left || new Node(Math.floor((node.key + leftBond) / 2));
      recAdd(node.left, leftBond, node.key - 1);
    } else {
      node.right = node.right || new Node(Math.floor((node.key + rightBond + 1) / 2));
      recAdd(node.right, node.key + 1, rightBond);
    }
  }

  recAdd(this.root, this.rangeStart, this.rangeEnd);
  return this;
};

/**
 * Finds the element that corresponds to the provided key.
 * @param key integer key
 * @returns Object interval with properties 'start' 'end' and 'value'
 *  if found interval that corresponds the key, or null otherwise
 * @throws IllegalArgumentException if key is not an integer
 */
IntervalTree.prototype.find = function (key) {
  if (!isInt(key)) {
    throw new IllegalArgumentException('key should be integer');
  }
  var element = findInRange(this.root, key, key);
  if (!!element) {
    return {
      'start': element.value.s,
      'end': element.value.e,
      'value': element.value.v
    };
  } else {
    return null;
  }
};

/**
 * Removed interval that contains the given key.
 * @param key integer key
 * @throws IllegalArgumentException if key is not an integer
 */
IntervalTree.prototype.remove = function (key) {
  if (!isInt(key)) {
    throw new IllegalArgumentException('key should be integer');
  }

  function recRm(node) {
    if (!!node.value && intersects(key, key, node.value.s, node.value.e)) {
      node.value = null;
    } else if (!!node.left && key < node.key) {
      if (recRm(node.left)) {
        node.left = null;
      }
    } else if (!!node.right && key > node.key) {
      if (recRm(node.right)) {
        node.right = null;
      }
    }
    return !node.left && !node.right && !node.value;
  }

  recRm(this.root);
};

function Node(key) {
  this.left = null;
  this.right = null;
  this.key = key;
  this.value = null;
}

function IllegalArgumentException(message) {
  this.message = message;
}

function isInt(n) {
  return n === +n && n === (n | 0);
}

function intersects(i1s, i1e, i2s, i2e) {
  return !(i1e < i2s || i2e < i1s);
}

function findInRange(node, leftBond, rightBond) {
  return ((!!node.value && intersects(leftBond, rightBond, node.value.s, node.value.e)) ? node : null) ||
    ((!!node.left && node.key > leftBond) ? findInRange(node.left, leftBond, rightBond) : null) ||
    ((!!node.right && node.key < rightBond) ? findInRange(node.right, leftBond, rightBond) : null);
}

module.exports = IntervalTree;
