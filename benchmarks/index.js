var Benchmark = require("benchmark")
var console = require("console")
var timer = require("./timer")()
var formatNumber = require("format-number")()
var ITERATIONS = 1000 * 1000

module.exports = suite

require("./immutable-hash")

function suite(name, iterations, callback) {
    if (typeof iterations === "function") {
        callback = iterations
        iterations = null
    }

    iterations = iterations || ITERATIONS

    console.log("# " + name)
    var results = []

    function benchmark(name, callback) {
        var time = bench(callback, iterations)

        results.push([name, time])
    }

    callback(benchmark)

    // name x count ops / sec variance (n samples)

    results.forEach(function (result) {
        var time = result[1]
        // console.log("time?", time)
        var frequency = Math.round(iterations / (time / 1000)) + ""
        var hz = formatNumber(frequency)


        console.log("# --- " + result[0] + " x " + hz + " ops/sec @ " +
            time + " milliseconds elapsed")
    })

    console.log("# " + name + " completed")
}

function bench(fn, iterations) {
    var result = []
    var i = 0
    timer("start")
    for (var i = 0; i < iterations; i++) {
        result.push(fn())
    }

    return timer("stop");
}
