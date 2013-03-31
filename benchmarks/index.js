var console = require("console")
var formatNumber = require("format-number")()
var ITERATIONS = 1000 * 1000

module.exports = suite

require("./immutable-hash")

function suite(name, iterations, callback) {
    if (typeof iterations === "function") {
        callback = iterations
        iterations = null
    }

    var results = []
    iterations = iterations || ITERATIONS

    console.log("# " + name)
    callback(benchmark)
    printResult(iterations, results)
    console.log("# " + name + " completed")

    function benchmark(name, callback) {
        var time = bench(callback, iterations)

        results.push([name, time])
    }
}

function printResult(iterations, results) {
    results.forEach(function (result) {
        var time = result[1]
        // console.log("time?", time)
        var frequency = Math.round(iterations / (time / 1000)) + ""
        var hz = formatNumber(frequency)


        console.log("# --- " + result[0] + " x " + hz + " ops/sec @ " +
            time + " milliseconds elapsed")
    })
}

function bench(fn, iterations) {
    var result = []
    var i = 0
    var start = Date.now()
    for (var i = 0; i < iterations; i++) {
        result.push(fn())
    }

    var end = Date.now()

    return end - start;
}
