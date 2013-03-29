var benchmark = require("./index")
var patch = require("diffpatcher/patch")
var ImmutableHash = require("../index")

benchmark("Creating a hash", function () {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })
})

benchmark("Calling toJSON()", function () {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })

    var res = hash.toJSON()
})

benchmark("Calling get()", function () {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })

    var res = hash.get("foo")
})

benchmark("Calling has()", function () {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })

    var res = hash.has("foo")
})

benchmark("Calling patch(<object>)", function () {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })

    var res = hash.patch({ foo: "baz" })
})

benchmark("Calling patch(key, value)", function () {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })

    var res = hash.patch("foo", "baz")
})

benchmark("Calling patch(key, null)", function () {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })

    var res = hash.patch("foo", null)
})

benchmark("ImmutableHash integration()", function () {
    var hash = ImmutableHash()

    var hash2 = hash.patch({ foo: "bar" })

    var hash3 = hash2.patch("foo", "baz")

    var hash4 = hash3.patch("foo", null)

    var hash5 = hash4.patch({ bar: { baz: true } })

    var hash6 = hash5.patch({ bar: { fuux: false } })

    var hash7 = hash6.patch("bar.baz", "hello world")

    var hash8 = hash7.map("bar", function (x) {
        return String(x)
    })

    var hash9 = hash8.patch({ baz: { one: "hello", two: "world" } })

    var hash10 = hash9.map(function (x) {
        return x.patch("prop", { live: 42 })
    })
})

benchmark("diffpatcher integration()", function() {
    var hash = {}

    var hash2 = patch(hash, { foo: "bar" })

    var hash3 = patch(hash2, { "foo": "baz" })

    var hash4 = patch(hash3, { "foo": null })

    var hash5 = patch(hash4, { bar: { baz: true } })

    var hash6 = patch(hash5, { bar: { fuux: false } })

    var hash7 = patch(hash6, { bar: { baz: "hello world" } })

    var hash8 = patch(hash7, {
        bar: Object.keys(hash7.bar).reduce(function (acc, k) {
            acc[k] = String(hash7.bar[k])
            return acc
        }, {})
    })

    var hash9 = patch(hash8, { baz: { one: "hello", two: "world" } })

    var hash10 = Object.keys(hash9).reduce(function (acc, k) {
        acc[k] = patch(hash9[k], { prop: { live: 42 } })
        return acc
    }, {})
})
