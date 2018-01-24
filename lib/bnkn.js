var Scraper = require('./scraper')

function Bnkn(_url, _finalCallback) {
  var url = _url
  var finalCallback = _finalCallback
  var page = null
  var doc = null
  var scraper = new Scraper()

  this.getTransactions = function() {
    // console.log('getTransactions: ' + url)
    scraper.initPhantom(url, onError, onPageReady)
  }
  
  var onError = function (err) {
    console.log('onError')
    console.log(err)
    finalCallback(err)
  }
  
  var onPageReady = function (_page, done) {
    page = _page
    // console.log('onPageReady: ' + url)
    click(function () {
      wait(200, function () {
        checkTable(function (length) {
          if (length > 0) {
            getResults(function (result) {
              // console.log(result)
              if (!result) {
                onFinish("An error has occured")
              } else {
                onFinish(null, result)
              }
              done()
            })
          } else {
            onPageReady(page, done)
          }
        })
      })
    })
  }

  var click = function (callback) {
    // console.log('click on button')
    page.evaluate(function () {
      var btn = document.getElementById('btnGenerate')
      btn && btn.click()
    }, callback)
  }

  var wait = function (time, callback) {
    // console.log('wait ' + time + ' ms')
    setTimeout(callback, time);
  }

  var checkTable = function (callback) {
    // console.log('check table')
    page.evaluate(function () {
      if (document.getElementById('fm')) {
        // console.log('table in iframe')
        doc = document.getElementById('fm').contentWindow.document
      } else {
        // console.log('table in document')
        doc = document
      }
      return doc.querySelectorAll('table tr').length
    }, function (result) {
      callback(result)
    })
  }

  var getResults = function (callback) {
    // console.log('getResults')
    page.evaluate(function () {
      var objects = []
      var trs = doc.querySelectorAll('table tr')
      if (trs.length) {
        for (i = 1, len = trs.length; i < len; i++) { // start at 1 to exclude table head
          var tr = trs[i]
          objects.push({
            account: tr.cells[0].outerText,
            transaction: tr.cells[1].outerText,
            amount: tr.cells[2].outerText.slice(0, -1),
            currency: tr.cells[2].outerText.slice(-1)
          })
        }
      }
      // console.log(objects.length + ' objects found')
      return objects
    }, function (result) {
      // console.log(url)
      // console.log(result[0])
      callback(result)
    })
  }

  var onFinish = function (err, lines) {
    // console.log('onFinish: ' + url)
    // console.log(err)
    // console.log(lines)
    if (err) {
      // console.log(err)
      // return process.exit(1)
      finalCallback(err)
    }
    // console.log(lines.length)
    var len = lines.length
    if (len) {
      // console.log(lines) // display lines on console
      // console.log(url)
      // console.log(lines[0])
      finalCallback(null, lines)
      // free memory
      url = null 
      page = null
      doc = null
      scraper = null
    } else {
      // console.log('Page returns 0 object. Let\'s retry!')
      scraper.initPhantom(url, onError, onPageReady)
    }
  }
}

module.exports = Bnkn