var Benchmark = require("benchmark")
var Suite = Benchmark.Suite
var console = require("console")
var suite = new Suite("benchmark!")

module.exports = benchmark

suite.on("complete", function () {
    this.map(function (results) {
        if (results.error) {
            return console.error("Error!", results.error)
        }

        console.log("# " + String(results))
    })

    console.log("# benchmark completed")
})

require("./immutable-hash")

suite.run({})

function benchmark(name, fn) {
    suite.add(name, fn)
}
