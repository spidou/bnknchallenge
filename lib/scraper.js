var phantom = require('phantom')
var async = require('async')

function Scraper() {
  var initializedPage = null
  var timeout = null

  this.initPhantom = function (url, errCallback, callback) {
    // console.log('initPhantom: ' + url)
    initializedPage = false
    establishConnection(
      url,
      errCallback,
      function (page, done) {
        // console.log('connection established')
        callback(page, done)
      }
    )
  }

  var establishConnection = function (url, errCallback, callback) {
    // console.log('establishConnection')
    var attempts = 0
    async.retry(
      100,
      function (next) {
        attempts++
        // console.log('Attempt #' + attempts)
        createAndOpenPage(
          url,
          function (err) {
            errCallback(err)
            next(err)
          },
          function (page, onFinish) {
            next(null, { page: page, onFinish: onFinish })
          }
        )
        timeout = setTimeout(function () {
          if (!initializedPage) {
            // console.log('next attempt')
            next('next')
          } else {
            // console.log('page already initialized')
          }
        }, 2000)
      },
      function (err, result) {
        clearTimeout(timeout)
        timeout = null // free memory
        initializedPage = null // free memory
        callback(result.page, result.onFinish)
      }
    );
  }

  var createAndOpenPage = function (url, onError, done) {
    // console.log('createAndOpenPage: ' + url)
    phantom.create('--ssl-protocol=any', '--ignore-ssl-errors=yes', '--web-security=no', '--local-to-remote-url-access=yes', '--debug=no', function (ph) {
      ph.createPage(function (page) {
        // page.set('onCallback', function () { console.log('onCallback') })
        // page.set('onClosing', function () { console.log('onClosing') })
        // page.set('onConfirm', function () { console.log('onConfirm') })
        // page.set('onFilePicker', function () { console.log('onFilePicker') })
        // page.set('onLoadFinished', function () { console.log('onLoadFinished') })
        // page.set('onLoadStarted', function () { console.log('onLoadStarted') })
        // page.set('onPageCreated', function () { console.log('onPageCreated') })
        // page.set('onPrompt', function () { console.log('onPrompt') })
        // page.set('onResourceReceived', function () { console.log('onResourceReceived') })
        // page.set('onResourceRequested', function () { console.log('onResourceRequested') })
        // page.set('onResourceTimeout', function () { console.log('onResourceTimeout') })

        page.set('onConsoleMessage', function (msg, lineNum, sourceId) {
          // console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")')
        })
        page.set('onAlert', function (msg) {
          // console.log('ALERT: ' + msg)
        })
        page.set('onInitialized', function () {
          initializedPage = false
          // console.log('page.onInitialized')
          // page.evaluate(function () {
          //   document.addEventListener('DOMContentLoaded', function () {
          //     console.log('DOM content has loaded.');
          //   }, false);
          // });
        })
        page.set('onNavigationRequested', function (url, type, willNavigate, main) {
          // console.log('>>>>> Trying to navigate to: ' + url);
          // console.log('Caused by: ' + type);
          // console.log('Will actually navigate: ' + willNavigate);
          // console.log('Sent from the page\'s main frame: ' + main);
          page.set('navigationLocked', true) // avoid redirections
          initializedPage = true
        })
        page.set('onUrlChanged', function (targetUrl) {
          // console.log('New URL: ' + targetUrl);
        })
        page.set('onResourceError', function (resourceError) { // catch error on loading page
          if (resourceError.url == url) { // if the resource error concern the main URL, stop the chain
            console.log('> lib/scraper.js:')
            console.log('>> Unable to load resource (URL:' + resourceError.url + ')')
            console.log('>> Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString)

            var statusCode,
              statusText

            if (resourceError.status) {
              statusCode = resourceError.status
              statusText = resourceError.statusText
            } else {
              statusCode = 400
              statusText = '#' + resourceError.errorCode + ' ' + resourceError.errorString.split('server replied: ').pop()
            }
            statusText += ' (phantomjs)'

            ph.exit()
            page.phantomError = true
            onError({ error: new Error(statusText), status: statusCode, formerError: resourceError })
          }
        })
        page.set('onError', function (msg, trace) { // catch error on evaluating page
          // #TODO active on debug mode only
          var msgStack = ['ERROR: ' + msg]
          if (trace && trace.length) {
            msgStack.push('TRACE:')
            trace.forEach(function (t) {
              msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''))
            })
          }
          console.log(msgStack.join('\n'))
          console.log('exiting...')
          ph.exit()
          page.phantomError = true
          onError({ error: new Error(msg), status: 400 })
        })
        page.open(url, function (status) {
          // console.log('status: ' + status)
          if (status == 'success') {
            initializedPage = true
          }
          function checkReadyState() {
            setTimeout(function () {
              page.evaluate(function () {
                return document.readyState
              }, function (readyState) {
                if (readyState === 'complete') {
                  onPageReady()
                } else {
                  checkReadyState() // TODO exit the loop if we call to many times checkReadyState()
                }
              })
            }, 200)
          }
          checkReadyState()
        })
        function onPageReady() {
          // console.log('onPageReady')
          done(page, function () {
            ph.exit()
          })
        }
      })
    })
  }
}

module.exports = Scraper