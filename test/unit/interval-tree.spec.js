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
    expect(function () {
      new IntervalTree(-1, -1).find('');
    }).to.throw();
    expect(function () {
      new IntervalTree(-1, -1).remove('');
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


  describe('searching', function () {
    it('should find elements in a small tree', function () {
      var tree = new IntervalTree(0, 1);
      expect(tree.find(1)).to.be.equal(null);
      expect(tree.find(0)).to.be.equal(null);
      expect(tree.find(-2)).to.be.equal(null);

      tree.add(0, 1, '0');
      expect(tree.find(0)).to.be.eql({'start': 0, 'end': 1, 'value': '0'});
      expect(tree.find(1)).to.be.eql({'start': 0, 'end': 1, 'value': '0'});
    });

    it('should find elements in a large tree', function () {
      var tree = new IntervalTree(0, 255);
      tree.add(0, 0, '0');
      expect(tree.find(0)).to.be.eql({'start': 0, 'end': 0, 'value': '0'});

      tree.add(5, 23, '5-23');

      for (var i = 1; i <= 255; i++) {
        if (i < 5 || i > 23) {
          expect(tree.find(i)).to.be.equal(null);
        } else {
          expect(tree.find(i)).to.be.eql({'start': 5, 'end': 23, 'value': '5-23'});
        }
      }
    });
  });


  describe('removing', function () {
    it('should not find anything after removal in a small tree', function () {
      var tree = new IntervalTree(0, 1);
      tree.add(0, 1, '0');
      expect(tree.find(0)).to.be.eql({'start': 0, 'end': 1, 'value': '0'});

      tree.remove(1);
      expect(tree.find(0)).to.be.equal(null);

      expect(tree.root.left).to.be.equal(null);
      expect(tree.root.right).to.be.equal(null);
    });


    it('should not find anything after removal in a mid-size tree', function () {
      var tree = new IntervalTree(0, 10);
      tree.add(7, 7, '7');
      expect(tree.find(7)).to.not.be.equal(null);

      tree.remove(7);
      expect(tree.find(7)).to.be.equal(null);

      expect(tree.root.left).to.be.equal(null);
      expect(tree.root.right).to.be.equal(null);
    });

    it('should correctly preserve the hierarchy when deleting value from the node with children', function () {
      var tree = new IntervalTree(0, 10);
      tree.add(7, 7, '7');
      tree.add(5, 5, '5');
      tree.add(8, 8, '8');
      tree.add(3, 3, '3');
      expect(tree.find(7)).to.not.be.equal(null);
      expect(tree.find(5)).to.not.be.equal(null);
      expect(tree.find(8)).to.not.be.equal(null);
      expect(tree.find(3)).to.not.be.equal(null);

      tree.remove(5);
      tree.remove(8);
      tree.remove(3);
      expect(tree.find(7)).to.not.be.equal(null);
      expect(tree.find(5)).to.be.equal(null);
      expect(tree.find(8)).to.be.equal(null);
      expect(tree.find(3)).to.be.equal(null);

      expect(tree.root.right.left).to.not.be.equal(null);
    });
  });


  describe('range expansion test', function () {
    it('should tolerate the expansion', function () {
      var tree = new IntervalTree(0, 5);
      tree.add(1, 2, '1-2');
      tree.add(3, 4, '3-4');

      tree.add(5, 10, '5-10');

      expect(tree.find(1)).to.be.eql({start: 1, end:2, value: '1-2'});
      expect(tree.find(4)).to.be.eql({start: 3, end:4, value: '3-4'});
      expect(tree.find(5)).to.be.eql({start: 5, end:10, value: '5-10'});
      expect(tree.find(7)).to.be.eql({start: 5, end:10, value: '5-10'});
    });
  });



  describe('testing against non-tree implementation', function () {

    function SeededRandom(seed) {
      this.next = function (min, max) {
        seed = (seed * 9301 + 49297) % 233280;
        var rnd = seed / 233280;
        return Math.floor(min + rnd * (max - min));
      }
    }

    function EtaIntervalMap() {
      var map = this;
      this.elements = [];
      this.add = function (s, e, value) {
        if (!(find(s, e) === null)) {
          throw new Error('intersects');
        }
        this.elements.push({s: s, e: e, v: value});
      };
      this.remove = function (key) {
        var i = find(key, key);
        if (!(i === null)) {
          this.elements.splice(i, 1);
        }
      };

      this.find = function (key) {
        var i = find(key, key);
        if (i === null) {
          return null;
        } else {
          var el = this.elements[i];
          return {
            'start': el.s,
            'end': el.e,
            'value': el.v
          };
        }
      };

      function find(s, e) {
        for (var i = 0; i < map.elements.length; i++) {
          var el = map.elements[i];
          if (intersects(s, e, el.s, el.e)) {
            return i;
          }
        }
        return null;
      }

      function intersects(i1s, i1e, i2s, i2e) {
        return !(i1e < i2s || i2e < i1s);
      }
    }


    it('should behave identically to array-backed implementation', function () {
      var rand = new SeededRandom(1);

      var eta = new EtaIntervalMap();
      var tst = new IntervalTree(0, 10);
      var callStack = [];

      var check = function (msg, eta, tst) {
        callStack.push(msg);

        try {
          var res = eta();
          var tstres = tst();
          expect(tstres).to.be.eql(res, callStack.join('\n-------------\n'));
        } catch (e) {
          expect(tst).to.throw(null, null, callStack.join('\n-------------\n'));
        }
      };


      for (var i = 0; i < 10000; i++) {
        var act = rand.next(0, 100);

        switch (true) {
          case (act < 10):
            var s = rand.next(0, 100);
            var e = s + rand.next(0, 100);
            var v = rand.next(0, 100);
            check('>>adding (' + s + ', ' + e + '), v: ' + v + '\n\n' +
              'eta:' + JSON.stringify(eta.elements, null, 2) +
              '\n tst:' + JSON.stringify(tst, null, 2) + '\n',
              function () {
                eta.add(s, e, v);
                return 0;
              },
              function () {
                tst.add(s, e, v);
                return 0;
              });
            break;

          case (act >= 10 && act < 80):
            var k = rand.next(0, 100);
            check(
              '>>searching ' + k + '\n\n' +
              'eta:' + JSON.stringify(eta.elements, null, 2) +
              '\n tst:' + JSON.stringify(tst, null, 2) + '\n',

              function () {
                return eta.find(k);
              },
              function () {
                return tst.find(k);
              });
            break;

          case (act >= 80 && act < 98):
            var k = rand.next(0, 100);
            check(
              '>>removing ' + k + '\n\n' +
              'eta:' + JSON.stringify(eta.elements, null, 2) +
              '\n tst:' + JSON.stringify(tst, null, 2) + '\n',

              function () {
                eta.remove(k);
                return 0;
              },
              function () {
                tst.remove(k);
                return 0;
              });
            break;

          default:
            //starting over
            eta = new EtaIntervalMap();
            tst = new IntervalTree(0, rand.next(0, 50));
            callStack = [];
        }
      }
    });
  });
});
