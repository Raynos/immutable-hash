var test = require("tape")
var ImmutableHash = require("../index")

test("can patch over values", function (assert) {
    var hash = ImmutableHash({ foo: "bar" })
    var hash2 = hash.patch("foo.bar", "baz")

    assert.equal(hash2.get("foo.bar"), "baz")

    assert.end()
})

test("patch() with array or string", function (assert) {
    var hash = ImmutableHash({
        foo: {
            bar: {
                baz: "fuux"
            }
        }
    })
    var hash2 = hash.patch("foo.bar.hello", "world")
    var hash3 = hash2.patch(["foo", "bar", "baz", "test"], "fuux")

    assert.equal(hash.get("foo.bar.baz"), "fuux")
    assert.equal(hash2.get("foo.bar.hello"), "world")
    assert.equal(hash2.get("foo.bar.baz"), "fuux")
    assert.deepEqual(hash3.get("foo.bar.baz").toJSON(), { "test": "fuux" })

    assert.end()
})

test("patch(key, value) with empty string", function (assert) {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })
    var hash2 = hash.patch("", "hello world")

    assert.deepEqual(hash2.toJSON(),
        { foo: "bar", baz: "fuux", "": "hello world" })

    assert.end()
})

test("patch(key, value) with a simple key", function (assert) {
    var hash = ImmutableHash({ foo: "bar", baz: "fuux" })
    var hash2 = hash.patch("bar", "foo")

    assert.equal(hash2.get("bar"), "foo")

    assert.end()
})

test("patch(key, value) a nested property", function (assert) {
    var hash = ImmutableHash({ foo: "bar" })
    // case where there is no ImHash at bar
    var hash2 = hash.patch(["bar", "baz"], "fuux")
    // case where there is a value at foo
    var hash3 = hash2.patch(["foo", "baz"], "fuux")
    // case where there is an ImHash at foo
    var hash4 = hash3.patch(["foo", "bar"], "fuux")

    assert.deepEqual(hash2.get("bar").toJSON(), { baz: "fuux" })
    assert.equal(hash2.get("bar.baz"), "fuux")
    assert.deepEqual(hash3.get("foo").toJSON(), { baz: "fuux" })
    assert.equal(hash3.get("foo.baz"), "fuux")
    assert.deepEqual(hash4.get("foo").toJSON(), { baz: "fuux", bar: "fuux" })
    assert.equal(hash4.get("foo.bar"), "fuux")

    assert.end()
})

test("patch(object) works for many props & nested objects", function (assert) {
    var hash = ImmutableHash({
        one: {
            one1: "one1"
        },
        two: {
            two1: {
                two11: "two11",
                two12: "two12"
            },
            two2: {
                two21: "two21",
                two22: "two22"
            }
        }
    })

    var hash2 = hash.patch({
        one: { one2: "one2" },
        two: { two3: "two3", two2: { two23: "two23" } }
    })

    assert.equal(hash2.get("one.one2"), "one2")
    assert.equal(hash2.get("two.two3"), "two3")
    assert.equal(hash2.get("two.two2.two23"), "two23")

    assert.end()
})

test("associating values", function (assert) {
    var hash = ImmutableHash()

    var hash2 = hash.patch("key", "primitive")
    assert.equal(hash2.get("key"), "primitive")
    assert.equal(hash2.has("key"), true)

    var hash3 = hash2.patch("key", null)
    assert.equal(hash3.get("key"), undefined)
    assert.equal(hash3.has("key"), false)

    var hash4 = hash3.patch("key", hash)
    assert.equal(hash4.get("key"), hash)
    assert.equal(hash4.has("key"), true)

    var hash5 = hash4.patch(["key", "foo"], "bar")
    assert.equal(hash5.get("key.foo"), "bar")
    assert.deepEqual(hash5.get("key").toJSON(), { foo: "bar" })

    var hash6 = hash3.patch(["key", "foo"], "bar")
    assert.equal(hash6.get("key.foo"), "bar")
    assert.deepEqual(hash6.get("key").toJSON(), { foo: "bar" })

    var hash7 = hash4.patch("key", { "foo": "bar" })
    assert.equal(hash7.get("key.foo"), "bar")
    assert.deepEqual(hash7.get("key").toJSON(), { foo: "bar" })

    var hash8 = hash3.patch("key", { "foo": "bar" })
    assert.equal(hash8.get("key.foo"), "bar")
    assert.deepEqual(hash8.get("key").toJSON(), { foo: "bar" })

    assert.end()
})
