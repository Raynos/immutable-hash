var test = require("tape")
var ImmutableHash = require("../index")

test("ImmutableHash is a function", function (assert) {
    assert.equal(typeof ImmutableHash, "function")
    assert.end()
})

test("can create hash", function (assert) {
    var hash = ImmutableHash()

    assert.deepEqual(hash.toJSON(), {})
    assert.end()
})

test("can create hash with initial state", function (assert) {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })

    assert.deepEqual(hash.toJSON(), { foo: "bar", baz: "fuux" })
    assert.equal(hash.get("foo"), "bar")
    assert.equal(hash.get("baz"), "fuux")
    assert.end()
})

test("can patch a hash with an object", function (assert) {
    var hash = ImmutableHash()
    var hash2 = hash.patch({ foo: "bar" })

    assert.equal(hash.get("foo"), undefined)
    assert.equal(hash.has("foo"), false)
    assert.equal(hash2.get("foo"), "bar")

    assert.end()
})

test("can patch a hash with key, value", function (assert) {
    var hash = ImmutableHash()
    var hash2 = hash.patch("foo", "baz")

    assert.equal(hash.get("foo"), undefined)
    assert.equal(hash.has("foo"), false)
    assert.equal(hash2.get("foo"), "baz")

    assert.end()
})

test("can patch a hash with a null value", function (assert) {
    var hash = ImmutableHash({ foo: "baz" })
    var hash2 = hash.patch("foo", null)
    var hash3 = hash2.patch({ bar: "foo" })
    var hash4 = hash3.patch({ bar: null })

    assert.equal(hash.get("foo"), "baz")
    assert.equal(hash2.get("foo"), undefined)
    assert.equal(hash2.has("foo"), false)
    assert.equal(hash3.get("bar"), "foo")
    assert.equal(hash4.get("bar"), undefined)
    assert.equal(hash4.has("bar"), false)

    assert.end()
})

test("can patch with nested object", function (assert) {
    var hash = ImmutableHash()
    var hash2 = hash.patch({ bar: { baz: true } })
    var hash3 = hash2.patch({ bar: { baz: false } })

    assert.equal(hash.get("bar"), undefined)
    assert.equal(hash.has("bar.baz"), false)
    assert.equal(hash.get("bar.baz"), undefined)
    assert.deepEqual(hash2.get("bar").toJSON(), { baz: true })
    assert.equal(hash2.has("bar.baz"), true)
    assert.equal(hash2.get("bar.baz"), true)
    assert.equal(hash3.get("bar.baz"), false)
    assert.deepEqual(hash3.toJSON(), { bar: { baz: false } })

    assert.end()
})

test("can patch with nested object & shares", function (assert) {
    var hash = ImmutableHash()
    var hash2 = hash.patch({ bar: { baz: true } })
    var hash3 = hash2.patch({ bar: { fuux: false } })

    assert.equal(hash.get("bar"), undefined)
    assert.equal(hash2.get("bar.fuux"), undefined)
    assert.equal(hash3.get("bar.fuux"), false)
    assert.equal(hash3.get("bar.baz"), true)

    assert.end()
})

test("can patch with path query & value", function (assert) {
    var hash = ImmutableHash()
    var hash2 = hash.patch("bar.baz", "hello world")
    var hash3 = hash2.patch("bar.baz", {
        "hello": "world"
    })

    assert.equal(hash.get("bar"), undefined)
    assert.equal(hash2.get("bar.baz"), "hello world")
    assert.equal(hash3.get("bar.baz.hello"), "world")
    assert.deepEqual(hash3.get("bar.baz").toJSON(), {
        "hello": "world"
    })

    assert.end()
})

test("can patch with nested objects & multiple keys", function (assert) {
    var hash = ImmutableHash()
    var hash2 = hash.patch({ baz: { one: "hello", two: "world"} })

    assert.deepEqual(hash2.get("baz").toJSON(), { one: "hello", two: "world" })
    assert.end()
})

test("can call map to map all props", function (assert) {
    var hash = ImmutableHash({ bar: { fuux: false, baz: "hello world" } })
    var hash2 = hash.map("bar", function (x) {
        return String(x)
    })

    assert.equal(hash2.get("bar.fuux"), "false")
    assert.equal(hash2.get("bar.baz"), "hello world")
    assert.equal(hash.get("bar.fuux"), false)

    assert.end()
})

test("can call map to update lots of things", function (assert) {
    var hash = ImmutableHash({
        bar: { fuux: "false", baz: "hello world" },
        baz: { one: "hello", two: "world" }
    })

    var hash2 = hash.map(function (x) {
        return x.patch("prop", { live: 42 })
    })

    assert.deepEqual(hash2.toJSON(), {
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

    assert.end()
})

test("can call filter to remove items", function (assert) {
    var hash = ImmutableHash({
        "1": { title: "do work", completed: false },
        "2": { title: "do more work", completed: false },
        "3": { title: "implement immutable", completed: true }
    })

    var hash2 = hash.filter(function (x) {
        return !x.get("completed")
    })
    assert.deepEqual(hash2.toJSON(), {
        "1": { title: "do work", completed: false },
        "2": { title: "do more work", completed: false }
    })

    assert.end()
})
