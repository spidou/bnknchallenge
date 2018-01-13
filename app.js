var scraper = require('./lib/scraper')
var url = 'https://web.bankin.com/challenge/index.html'
// console.log(url)

var onPageReady = function(page, done) {
  // console.log('onPageReady')
  page.evaluate(function () {
    var btn = document.getElementById('btnGenerate')
    $(btn).click()

    var objects = []
    var trs = document.querySelectorAll('#dvTable tr')
    if (trs.length) {
      for (i = 0, len = trs.length; i < len; i++) {
        var tr = trs[i]
        objects.push({
          account: tr.cells[0].outerText,
          transaction: tr.cells[1].outerText,
          amount: tr.cells[2].outerText.slice(0, -1),
          currency: tr.cells[2].outerText.slice(-1)
        })
      }
    }

    return {
      btn: btn,
      objects: objects
    }
  }, function (result) {
    if (!result) {
      onFinish("An error has occured")
    } else {
      onFinish(null, result)
    }
    done()
  })
}

var onError = function (err) {
  console.log('onError')
  console.log(err)
}

var onFinish = function (err, result) {
  console.log('onFinish')
  if (err) {
    console.log(err)
    return process.exit(1)
  }
  // console.log(result)
  if (result.objects.length) {
    console.log(result.objects)
    process.exit()
  } else {
    console.log('Page returns 0 object. Let\'s retry!')
    scraper.initPhantom(url, onError, onPageReady)
  }
}

scraper.initPhantom(url, onError, onPageReady)
