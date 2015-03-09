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


  it('should handle startDate = 0', function () {
    var ss = new StreakSummary({
      data: {
        '2015-02-25': -1,
        '2015-02-26': -2
      }, inverted: true, startDate: '2015-02-22', endDate: '2015-03-09'
    });

    expect(ss.totalEntries()).to.be.equal(2);
    expect(ss.currentStreak()).to.be.equal(16);
    expect(ss.longestStreak()).to.be.equal(16);
  });


  it('should handle sequence of operations', function () {
    var ss = new StreakSummary({
      data: {
      }, inverted: true, startDate: '2015-03-05', endDate: '2015-03-09'
    });

    expect(ss.totalEntries()).to.be.equal(0);
    expect(ss.currentStreak()).to.be.equal(5);
    expect(ss.longestStreak()).to.be.equal(5);

    ss.add('2015-03-05', 1);
    ss.add('2015-03-06', 1);
    ss.add('2015-03-07', 1);
    ss.add('2015-03-08', 1);
    ss.add('2015-03-09', 1);

    expect(ss.totalEntries()).to.be.equal(5);
    expect(ss.currentStreak()).to.be.equal(0);
    expect(ss.longestStreak()).to.be.equal(0);


    ss.remove('2015-03-05');
    expect(ss.longestStreak()).to.be.equal(1);

    ss.remove('2015-03-06');
    ss.remove('2015-03-07');
    ss.remove('2015-03-08');
    ss.remove('2015-03-09');

    expect(ss.totalEntries()).to.be.equal(0);
    expect(ss.currentStreak()).to.be.equal(5);
    expect(ss.longestStreak()).to.be.equal(5);
  });



  describe('DateHelper', function () {

    it('should correctly convert date to int', function () {
      var dateHelper = new StreakSummary.DateHelper("2013-03-05",
        "2016-01-10", [1, 3, 5]); // Mon, Wed, Fri

      expect(dateHelper.asInt("2013-03-05")).to.be.equal(0);
      expect(dateHelper.asInt("2013-03-06")).to.be.equal(1);
      expect(dateHelper.asInt("2013-08-10")).to.be.equal(158);


      expect(dateHelper.dayOf(dateHelper.asInt("2013-03-05"))).to.be.equal(2);
      expect(dateHelper.dayOf(dateHelper.asInt("2015-03-08"))).to.be.equal(0);
      expect(dateHelper.dayOf(dateHelper.asInt("2015-03-09"))).to.be.equal(1);
    });


    it('should correctly count excluded days', function () {
      //0 Sun
      //1 Mon
      //2 Tue
      //3 Wed
      //4 Thu
      //5 Fri
      //6 Sat

      var dateHelper = new StreakSummary.DateHelper("2013-03-05",
        "2016-01-10", [1, 3, 5]); // Mon, Wed, Fri

      expect(dateHelper.excludedDaysInRange(
        dateHelper.asInt("2015-03-08"),
        dateHelper.asInt("2015-03-15")
      )).to.be.equal(3);

      expect(dateHelper.excludedDaysInRange(
        dateHelper.asInt("2015-03-08"),
        dateHelper.asInt("2015-03-22")
      )).to.be.equal(6);

      expect(dateHelper.excludedDaysInRange(
        dateHelper.asInt("2015-03-08"),
        dateHelper.asInt("2015-03-08")
      )).to.be.equal(0);

      expect(dateHelper.excludedDaysInRange(
        dateHelper.asInt("2015-03-09"),
        dateHelper.asInt("2015-03-09")
      )).to.be.equal(1);

      expect(dateHelper.excludedDaysInRange(
        dateHelper.asInt("2015-03-10"),
        dateHelper.asInt("2015-03-17")
      )).to.be.equal(3);

      expect(dateHelper.excludedDaysInRange(
        dateHelper.asInt("2015-03-11"),
        dateHelper.asInt("2015-03-13")
      )).to.be.equal(2);

      expect(dateHelper.excludedDaysInRange(
        dateHelper.asInt("2015-03-13"),
        dateHelper.asInt("2015-03-17")
      )).to.be.equal(2);

      expect(dateHelper.excludedDaysInRange(
        dateHelper.asInt("2015-03-13"),
        dateHelper.asInt("2015-03-25")
      )).to.be.equal(6);
    });



    it('should always return zero if there are no excluded days', function () {
      var dateHelper = new StreakSummary.DateHelper("2015-01-01",
        "2016-01-10", []); // Mon, Wed, Fri

      for (var i = 0; i < 100; i++) {
        for (var j = 0; i < 20; i++) {
          expect(dateHelper.excludedDaysInRange(
            i, i + j
          )).to.be.equal(0, "Interval between " + i + " and " + (i + j));
        }
      }
    });

    it('should always work correctly even if all days are excluded',
      function () {
        var dateHelper = new StreakSummary.DateHelper("2015-01-01",
          "2016-01-10", [0, 1, 2, 3, 4, 5, 6]); // Mon, Wed, Fri

        for (var i = 0; i < 100; i++) {
          for (var j = 0; i < 20; i++) {
            expect(dateHelper.excludedDaysInRange(
              i, i + j
            )).to.be.equal(j + 1, "Interval between " + i + " and " + (i + j));
          }
        }
      });
  });

});
