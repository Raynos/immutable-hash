var patch = require("diffpatcher/patch")
var ImmutableHash = require("../index")
var keys = require('object-keys);

var suite = require("./index")
var generateData = require("./generateData")

suite("ImmutableHash patch()", function (benchmark) {
    benchmark("patch(foo.bar, baz)", function () {
        var hash = ImmutableHash().patch("foo.bar", "baz")
    })

    benchmark("patch([foo, bar], baz)", function () {
        var hash = ImmutableHash().patch(["foo", "bar"], "baz")
    })

    benchmark("patch({ foo: { bar: baz } })", function () {
        var hash = ImmutableHash().patch({ foo: { bar: "baz" } })
    })
})

suite("ImmutableHash patch(key, value)", 100 * 1000, function (benchmark) {
    var initial_0 = ImmutableHash(generateData(0))
    var initial_10 = ImmutableHash(generateData(10))
    var initial_100 = ImmutableHash(generateData(100))
    var initial_1000 = ImmutableHash(generateData(1000))

    benchmark("patch(foo, bar) at 0", function () {
        var hash = initial_0.patch("foo", "bar")
    })

    benchmark("patch(foo, bar) at 10", function () {
        var hash = initial_10.patch("foo", "bar")
    })

    benchmark("patch(foo, bar) at 100", function () {
        var hash = initial_100.patch("foo", "bar")
    })

    benchmark("patch(foo, bar) at 1000", function () {
        var hash = initial_1000.patch("foo", "bar")
    })

    benchmark("nested patch(foo, bar) at 1000", function () {
        var hash = initial_1000.patch({
            foo: {
                bar: { baz: true, foz: false }
                , fuux: 42
            }
        })
    })
})

;[
    [0, 10000],
    [10, 5000],
    [100, 1000],
    [1000, 200]
].forEach(function (tuple) {
    var size = tuple[0]
    var iterations = tuple[1]
    suite("integration(" + size + ")", iterations, function (benchmark) {
        var initial = generateData(size)

        benchmark("ImmutableHash", function () {
            var hash = ImmutableHash(initial)

            var hash2 = hash.patch(["foo"], "bar")

            var hash3 = hash2.patch(["foo"], "baz")

            var hash4 = hash3.patch(["foo"], null)

            var hash5 = hash4.patch(["bar", "baz"], true)

            var hash6 = hash5.patch(["bar", "fuux"], false)

            var hash7 = hash6.patch(["bar", "baz"], "hello world")

            var hash8 = hash7.map("bar", function (x) {
                return String(x)
            })

            var hash9 = hash8.patch(["baz"], { one: "hello", two: "world" })
        })

        benchmark("diffpatcher", function() {
            var hash = patch(initial, {})

            var hash2 = patch(hash, { foo: "bar" })

            var hash3 = patch(hash2, { "foo": "baz" })

            var hash4 = patch(hash3, { "foo": null })

            var hash5 = patch(hash4, { bar: { baz: true } })

            var hash6 = patch(hash5, { bar: { fuux: false } })

            var hash7 = patch(hash6, { bar: { baz: "hello world" } })

            var hash8 = patch(hash7, {
                bar: keys(hash7.bar).reduce(function (acc, k) {
                    acc[k] = String(hash7.bar[k])
                    return acc
                }, {})
            })

            var hash9 = patch(hash8, { baz: { one: "hello", two: "world" } })
        })
    })
})
