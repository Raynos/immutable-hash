var assert = require("assert")

var ImmutableHash = require("../index")

var hash = ImmutableHash()

var hash2 = hash.patch({ foo: "bar" })
assert.equal(hash2.get("foo"), "bar")

var hash3 = hash2.patch("foo", "baz")
assert.equal(hash3.get("foo"), "baz")

var hash4 = hash3.patch("foo", null)
assert.equal(hash4.get("foo"), undefined)
assert.equal(hash4.has("foo"), false)

var hash5 = hash4.patch({ bar: { baz: true } })
assert.deepEqual(hash5.get("bar").toJSON(), { baz: true })
assert.equal(hash5.get("bar.baz"), true)

var hash6 = hash5.patch({ bar: { fuux: false } })
assert.equal(hash6.get("bar.fuux"), false)
assert.equal(hash6.get("bar.baz"), true)

var hash7 = hash6.patch("bar.baz", "hello world")
assert.equal(hash7.get("bar.baz"), "hello world")


var hash8 = hash7.map("bar", function (x) {
    return String(x)
})
assert.equal(hash8.get("bar.fuux"), "false")

var hash9 = hash8.patch({ baz: { one: "hello", two: "world" } })
assert.deepEqual(hash9.get("baz").toJSON(), { one: "hello", two: "world" })

var hash10 = hash9.map(function (x) {
    return x.patch("prop", { live: 42 })
})
assert.deepEqual(hash10.toJSON(), {
    bar: {
        prop: {
            live: 42
        },
        fuux: "false",
        baz: "hello world"
    },
    baz: {
        one: "hello",
        two: "world",
        prop: {
            live: 42
        }
    }
})
