var expect = require('chai').expect;

var PriorityQueue = require('../../src/scripts/priority-queue');

describe('priority-queue', function () {


  it('should work on happy path', function () {
    var q = new PriorityQueue();
    q.add(1, 1, 1);
    expect(q.elements[0].k).to.be.equal(1);

    q.add(2, 2, 2);
    expect(q.elements[0].k).to.be.equal(2);

    q.add(3, 3, 3);
    expect(q.elements[0].k).to.be.equal(3);

    expect(q.pollMax().key).to.be.equal(3);
    expect(q.elements[0].k).to.be.equal(2);

    expect(q.pollMax().key).to.be.equal(2);
    expect(q.elements[0].k).to.be.equal(1);

    expect(q.pollMax().key).to.be.equal(1);
    expect(q.elements).to.be.eql([]);
  });


  it('should be able to remove element by key', function () {
    var q = new PriorityQueue();
    q.add('1', 1, 1);
    q.add('2', 2, 2);
    q.add('3', 3, 3);

    q.removeByKey('2');
    expect(q.pollMax().key).to.be.equal('3');
    expect(q.pollMax().key).to.be.equal('1');
  });


  it('should be able work on larger queue', function () {
    var q = new PriorityQueue();

    var etaArr = [];
    var seed = 2134;
    var uuid = 0;

    for (var i = 0; i < 500; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      var el = Math.floor(seed / 233280 * 100);

      etaArr[etaArr.length] = el;
      q.add(uuid++, el, el);
    }

    etaArr.sort(function(a, b){return b-a});

    for (var i = 0; i < etaArr.length; i++) {
      var el = etaArr[i];
      var pollEl = q.pollMax();

      expect(pollEl.value).to.be.equal(el,
        'i : ' + i + '\n   eta: ' + JSON.stringify(etaArr, null, 2) +
        '\nq: '+ JSON.stringify(q, null, 2));
    }
  });
});
