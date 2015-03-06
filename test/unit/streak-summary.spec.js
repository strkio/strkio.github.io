var expect = require('chai').expect;

var StreakSummary = require('../../src/scripts/streak-summary');

describe('streak-summary', function () {

  describe('#totalEntries()', function () {

    it('should return zero in case of no entries', function () {
      expect(new StreakSummary({data: {}}).totalEntries()).to.be.equal(0);
    });

    it('should count in only != null & !== 0 values', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 0,
        '2015-03-06': -1,
        '2015-03-07': 1,
        '2015-03-08': null,
        '2015-03-09': undefined
      }}).totalEntries()).to.be.equal(2);
    });

    it('should take "start date" into account', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 1,
        '2015-03-06': 1,
        '2015-03-07': 1,
        '2015-03-08': 1,
        '2015-03-09': 1
      }, startDate: '2015-03-07'}).totalEntries()).to.be.equal(3);
    });

    it('should take "excluded days" into account', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 1, // Th
        '2015-03-06': 1,
        '2015-03-07': 1,
        '2015-03-08': 1,
        '2015-03-09': 1
      }, excludedDays: [0/* Su */,/* Sa */ 6]}).totalEntries()).to.be.equal(3);
    });

  });

  describe('#longestStreak()', function () {

    it('should choose longest streak among available', function () {
      expect(new StreakSummary({data: {
        '2015-03-03': 1,
        // break
        '2015-03-05': 1,
        '2015-03-06': 1,
        '2015-03-07': 1,
        // break
        '2015-03-09': 1,
        '2015-03-10': 1
      }, endDate: '2015-03-10'}).longestStreak()).to.be.equal(3);
    });

    it('should take "start date" into account', function () {
      expect(new StreakSummary({data: {
        '2015-03-03': 1,
        '2015-03-04': 1,
        // break
        '2015-03-06': 1
      }, startDate: '2015-03-05', endDate: '2015-03-10'}).longestStreak())
        .to.be.equal(1);
    });

    it('should take "excluded days" into account', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 1, // Th
        '2015-03-06': 1,
        '2015-03-09': 1
      }, excludedDays: [0/* Su */,/* Sa */ 6], endDate: '2015-03-10'})
        .longestStreak()).to.be.equal(3);
    });

    it('should include values from the "range" only (if numeric)', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 4,
        '2015-03-06': 5,
        '2015-03-07': 10,
        '2015-03-08': 11
      }, range: [5, 10], endDate: '2015-03-10'}).longestStreak())
        .to.be.equal(2);
    });

    it('should be calculated differently if "inverted"', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 4,
        '2015-03-07': 10
      }, inverted: true, startDate: '2015-03-05', endDate: '2015-03-10'})
        .longestStreak()).to.be.equal(3);
    });

    it('should be equal 0 if value is set and start/end date match',
      function () {
        expect(new StreakSummary({data: {
          '2015-03-10': 1
        }, inverted: true, startDate: '2015-03-10', endDate: '2015-03-10'})
          .longestStreak()).to.be.equal(0);
      });

  });

  describe('#currentStreak()', function () {

    it('should not be affected by other streaks', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 1,
        '2015-03-06': 1,
        '2015-03-07': 1,
        // break
        '2015-03-09': 1,
        '2015-03-10': 1
      }, endDate: '2015-03-10'}).currentStreak()).to.be.equal(2);
    });

    it('should take "start date" into account', function () {
      expect(new StreakSummary({data: {
        '2015-03-03': 1,
        '2015-03-04': 1,
        // break
        '2015-03-06': 1
      }, startDate: '2015-03-03', endDate: '2015-03-06'}).currentStreak())
        .to.be.equal(1);
    });

    it('should take "excluded days" into account', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 1, // Th
        '2015-03-06': 1,
        '2015-03-09': 1
      }, excludedDays: [0/* Su */,/* Sa */ 6], endDate: '2015-03-09'})
        .currentStreak()).to.be.equal(3);
    });

    it('should include values from the "range" only (if numeric)', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 4,
        '2015-03-06': 5,
        '2015-03-07': 10
      }, range: [5, 10], endDate: '2015-03-07'}).currentStreak())
        .to.be.equal(2);
    });

    it('should be calculated differently if "inverted"', function () {
      expect(new StreakSummary({data: {
        '2015-03-05': 4,
        '2015-03-07': 10
      }, inverted: true, startDate: '2015-03-05', endDate: '2015-03-10'})
        .currentStreak()).to.be.equal(3);
    });

  });

});
