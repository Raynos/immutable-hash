# immutable-hash

[![build status][1]][2] [![dependency status][3]][4]

[![browser support][5]][6]

An immutable hash structure with delta journaling

## Example

```js
var assert = require("assert")
var ImmutableHash = require("immutable-hash")

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
```

## Todo

 - `diff()`
 - ~~Make `map()` and `filter()` call `patch()` once.~~
 - Improve performance & benchmarks
 - Make integration() test at least as fast as diffpatcher

## Benchmark

```
$ npm run bench

> immutable-hash@0.1.0 bench /home/raynos/Documents/immutable-hash
> node ./benchmarks

# Creating a hash x 638,901 ops/sec ±3.37% (87 runs sampled)
# Calling toJSON() x 260,465 ops/sec ±3.27% (88 runs sampled)
# Calling get() x 362,460 ops/sec ±3.98% (79 runs sampled)
# Calling has() x 434,228 ops/sec ±2.61% (90 runs sampled)
# Calling patch(<object>) x 249,979 ops/sec ±3.85% (87 runs sampled)
# Calling patch(key, value) x 215,578 ops/sec ±4.49% (88 runs sampled)
# Calling patch(key, null) x 253,226 ops/sec ±1.55% (92 runs sampled)
# ImmutableHash integration() x 16,233 ops/sec ±1.93% (92 runs sampled)
# diffpatcher integration() x 30,395 ops/sec ±1.56% (94 runs sampled)
# benchmark completed
```

ImmutableHash is half as fast as diffpatcher.

## Documentation

### `ImmutableHash(initialState)`

```hs
ImmutableHash :: initial:Object<String, Any> -> ImHash
```

Creates an ImmutableHash with optionally initial state.

```js
var hash = ImHash().patch({ foo: "1", bar: { baz: "2" } })
var res = hash.toJSON() // { foo: "1", bar: { baz: "2" } }
var hash2 = ImHash({ foo: "1", bar: { baz: "2" } })
var res2 = hash2.toJSON() // { foo: "1", bar: { baz: "2" } }
```

### `hash().patch(path, value)`

```hs
patch :: ImHash -> parts:[String] -> value:Any -> ImHash
patch :: ImHash -> path:String -> value:Any -> ImHash
patch :: ImHash -> delta:Object<String, Any> -> ImHash
```

Returns a new ImHash with the patch applied to it

```js
var hash = ImHash()
var hash2 = hash.patch(["bar", "baz"], "2")
var res2 = hash2.toJSON() // { bar: { baz: "2" } }
var hash3 = hash.patch("bar.baz", "2")
var res3 = hash3.toJSON() // { bar: { baz: "2" } }
var hash4 = hash.patch({ foo: "1", baz: { baz: "2" } })
var res4 = hash4.toJSON() // { foo: "1", baz: { baz: "2" } }
```

### `hash().toJSON()`

```hs
toJSON :: ImHash -> Object
```

Returns a normal JavaScript object representation of the ImHash

```js
var hash = ImHash({ foo: "1", bar: { baz: "2" } })
var res = hash.toJSON() // { foo: "1", bar: { baz: "2" } }
```

### `hash().get(key)`

```hs
get :: ImHash -> String -> Any
```

Returns the value associated with the key. Can either be a key or a nested
    query key.

```js
var hash = ImHash({ foo: "1", bar: { baz: "2" } })
var foo = hash.get("foo") // "1"
var bar = hash.get("bar") // <ImHash>
var baz1 = bar.get("baz") // "2"
var baz2 = hash.get("bar.baz") // "2"
```

### `hash().has(key)`

```hs
has :: ImHash -> String -> Boolean
```

Returns a boolean indicating whether the key is found. Can either be a key
    or a nested query key.

```js
var hash = ImHash({ foo: "1", bar: { baz: "2" } })
var foo1 = hash.has("foo") // true
var foo2 = hash.has("foo.not-exist") // false
var bar = hash.has("bar") // true
var baz1 = hash.has("baz") // false
var baz2 = bar.has("baz") // true
var baz3 = hash.has("bar.baz") // true
var baz4 = hash.has("bar.non-exist") // false
```

### `hash().map(path, lambda)`

```hs
map :: ImHash<String, A> -> lambda:(A -> B) -> ImHash<String, B>
map :: ImHash -> path:String -> (A -> B) -> ImHash
```

Takes a path, get's the ImHash `hash` at that location. Then patches it
    by calling a lambda function on each value in it and replacing
    that key with the returned value.

Returns an ImHash with `hash` replaced with the patched hash.

```js
var state = ImmutableHash({
    todos: {
        1: { title: "do work", completed: false },
        2: { title: "do more work", completed: true }
    }
})
var toggled = Math.random() < 0.5 ? true : false
var newState = state.map("todos", function (todo) {
    return todo.patch("completed", toggled)
})
```

### `hash().filter(path, lambda)`

```hs
filter :: ImHash<String, A> -> lambda:(A -> Boolean) -> ImHash<String, A>
filter :: ImHash -> path:String -> (A -> Boolean) -> ImHash
```

Takes a path, get's the ImHash `hash` at that location. It then patches
    it by calling a lambda function on each value in it and if the lambda
    returns false that value get's removed.

Returns an ImHash with `hash` replaced with the patched hash.

```js
var hash = ImmutableHash({
    todos: {
        "1": { title: "do work", completed: false },
        "2": { title: "do more work", completed: false },
        "3": { title: "implement immutable", completed: true }
    }
})
var newState = state.filter("todos", function (todo) {
    return !todo.get("completed")
})
```

## Installation

`npm install immutable-hash`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/immutable-hash.png
  [2]: https://travis-ci.org/Raynos/immutable-hash
  [3]: https://david-dm.org/Raynos/immutable-hash.png
  [4]: https://david-dm.org/Raynos/immutable-hash
  [5]: https://ci.testling.com/Raynos/immutable-hash.png
  [6]: https://ci.testling.com/Raynos/immutable-hash
