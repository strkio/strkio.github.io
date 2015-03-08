var expect = require('chai').expect;

var IntervalTree = require('../../src/scripts/interval-tree');

describe('interval-tree', function () {

  describe('parameters validation', function () {
    expect(function () {
      new IntervalTree(0, -1);
    }).to.throw();

    expect(function () {
      new IntervalTree(0, '');
    }).to.throw();

    expect(function () {
      new IntervalTree({}, 0);
    }).to.throw();

    expect(function () {
      new IntervalTree(-1, -1).add({}, -1, -1);
    }).to.throw();

    expect(function () {
      new IntervalTree(-1, -1).add(-1, '', -1);
    }).to.throw();
  });


  describe('construction', function () {

    it('should work on 1 element range', function () {
      var tree = new IntervalTree(0, 0);
      tree.add(0, 0, '0');
      expect(tree.root.key).to.be.equal(0);
      expect(tree.root.value).to.not.be.equal(null);
      expect(tree.root.left).to.be.equal(null);
      expect(tree.root.right).to.be.equal(null);

      expect(function () {
        tree.add(0, 0, 'err');
      }).to.throw(/.*Already contains.*/);
    });


    it('should work on 2 element range', function () {
      var tree = new IntervalTree(-1, 0);
      tree.add(0, 0, '0');
      expect(tree.root.key).to.be.equal(-1);
      expect(tree.root.value).to.be.equal(null);
      expect(tree.root.left).to.be.equal(null);
      expect(tree.root.right).to.not.be.equal(null);
      expect(tree.root.right.key).to.be.equal(0);
      expect(tree.root.right.value).to.not.be.equal(null);

      expect(function () {
        tree.add(0, 0, 'err');
      }).to.throw(/.*Already contains.*/);

      tree.add(-1, -1, '-1');
      expect(tree.root.value).to.not.be.equal(null);
    });


    it('should work on 3 element range', function () {
      var tree = new IntervalTree(1, 3);
      tree.add(1, 1, '1');
      expect(tree.root.key).to.be.equal(2);
      expect(tree.root.value).to.be.equal(null);
      expect(tree.root.right).to.be.equal(null);
      expect(tree.root.left).to.not.be.equal(null);
      expect(tree.root.left.key).to.be.equal(1);
      expect(tree.root.left.value).to.not.be.equal(null);

      expect(function () {
        tree.add(1, 1, 'err');
      }).to.throw(/.*Already contains.*/);

      tree.add(3, 3, '-1');
      expect(tree.root.value).to.be.equal(null);
      expect(tree.root.right.key).to.be.equal(3);
      expect(tree.root.right.value).to.not.be.equal(null);
    });


    it('should work on 4 elements range', function () {

      var tree = new IntervalTree(0, 3);

      expect(tree.root.key).to.be.equal(1);
      expect(tree.root.left).to.be.equal(null);
      expect(tree.root.right).to.be.equal(null);

      tree.add(0, 0, '0-0');

      expect(tree.root.right).to.be.equal(null);
      expect(tree.root.left).to.not.be.equal(null);
      expect(tree.root.left.key).to.be.equal(0);
      expect(tree.root.value).to.be.equal(null);

      //console.log(JSON.stringify(tree, null, 2));

      tree.add(1, 1, '1-1');
      //console.log(JSON.stringify(tree, null, 2));

      expect(tree.root.right).to.be.equal(null);
      expect(tree.root.value).to.not.be.equal(null);

      expect(function () {
        tree.add(0, 1, 'err');
      }).to.throw(/.*Already contains.*/);

      tree.add(3, 3, '3-3');
      //console.log(JSON.stringify(tree, null, 2));

      expect(tree.root.right).to.not.be.equal(null);
      expect(tree.root.right.key).to.be.equal(2);

      expect(tree.root.right.right).to.not.be.equal(null);
      expect(tree.root.right.left).to.be.equal(null);
      expect(tree.root.right.right.key).to.be.equal(3);
    });

    it('should work on large tree', function () {
      var tree = new IntervalTree(10, 50);
      tree.add(33, 33, '33');
      //console.log(JSON.stringify(tree, null, 2));
      expect(tree.root.right.left.left.key).to.be.equal(33);
    });
  });


  describe('intersection validation', function () {
    it('should detect intersection on one element range', function () {
      var tree = new IntervalTree(33, 2314);
      tree.add(111, 111, 111);
      expect(function () {
        tree.add(111, 111, 111);
      }).to.throw(/.*Already contains.*/);
    });


    it('should detect intersection of wide range with narrow range ', function () {
      var tree = new IntervalTree(0, 33);
      tree.add(2, 14, '');

      for (var i = 2; i <= 14; i++) {
        expect(function () {
          tree.add(i, i, '');
        }).to.throw(null, /.*Already contains.*/, 'Failed on interval (' + i + ',' + i + ')');
      }
    });

    it('should detect intersection of narrow range with wide range', function () {
      var tree = new IntervalTree(0, 33);
      tree.add(5, 5, '');
      function check(s, e) {
        expect(function () {
          tree.add(s, e, 'err');
        }).to.throw(/.*Already contains.*/);
      }

      check(0, 5);
      check(0, 10);
      check(0, 33);
      check(2, 33);
      check(2, 6);
      check(5, 33);
      check(5, 5);
    });
  });
});
