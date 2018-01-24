var async = require('async')
var csv = require('fast-csv')
var ProgressBar = require('progress');

var Bnkn = require('./lib/bnkn')
var url = 'https://web.bankin.com/challenge/index.html'

var startedAt = new Date()
var endedAt = null
var outputFile = "output.csv"
var starts = [...Array(5000).keys()].filter(function (s) { return s % 50 == 0 }) // [0, 50, 100, 150, ..., 4950]
console.log('Let\'s scrape ' + starts.length + ' pages')
var transactions = []
var unorderedTransactions = {}

var bar = new ProgressBar('  scraping [:bar] :percent ETA: :etas', {
  total: starts.length,
  complete: '=',
  incomplete: ' ',
  width: 50,
});
bar.tick(0)

async.eachLimit(
  starts,
  10, // maximum number of async operations at a time
  function(start, next) {
    var pageUrl = url + '?start=' + start
    var bnkn = new Bnkn(pageUrl, function finalCallback(err, transactions) {
      unorderedTransactions[start] = transactions
      bar.tick(1);
      next(err)
    })
    bnkn.getTransactions()
  },
  function(err) {
    if (err) {
      console.log(err)
      return process.exit(1)
    }

    var indexes = Object.keys(unorderedTransactions)
    indexes.sort(function(a, b) { return parseInt(a) > parseInt(b) })
    indexes = indexes.filter(function(a, pos) { return indexes.indexOf(a) == pos })
    for (i = 0; i < indexes.length; i++) {
      transactions = transactions.concat(unorderedTransactions[indexes[i]])
    }

    csv.writeToPath(
      outputFile,
      transactions,
      {
        headers: true,
        delimiter: ';',
        quote: '"' }
    ).on(
      'finish',
      function () {
        console.log(transactions)
        console.log('Yay! The file ' + outputFile + ' has been updated successfully')
        endedAt = new Date()
        console.log(transactions.length + " results found in " + (endedAt - startedAt) / 1000 + " seconds")
        process.exit()
      }
    )
  }
)
