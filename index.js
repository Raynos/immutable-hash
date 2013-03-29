var persistent = require("persistent-hash-trie")
var isObject = require("is-object")
var Trie = persistent.Trie
var assoc = persistent.assoc
var get = persistent.get
var has = persistent.has
var dissoc = persistent.dissoc
var transient = persistent.transient

function ImHash(trie, diff, parts, parent) {
    this._trie = trie || Trie()
    this._diff = diff || null
    this._parts = parts || null
    this._parent = parent || null
}

var proto = ImHash.prototype

/*  patch :: ImHash -> [String] parts -> Delta value -> ImHash
    patch :: ImHash -> String path -> Delta value -> ImHash
    patch :: ImHash -> Object<String, Delta> delta -> ImHash

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
*/
proto.patch = function ImHash_patch(parts, value) {
    if (typeof parts === "string") {
        parts = parts.split(".")
    }

    if (Array.isArray(parts)) {
        var len = parts.length
        var trie = assocKey(this._trie, parts, value)

        return new ImHash(trie, value, parts, this)
    } else if (isObject(parts)) {
        return new ImHash(assocObject(this._trie, parts), parts, null, this)
    }
}

/*  toJSON :: ImHash -> Object

    Returns a normal JavaScript object representation of the ImHash

    ```js
    var hash = ImHash({ foo: "1", bar: { baz: "2" } })
    var res = hash.toJSON() // { foo: "1", bar: { baz: "2" } }
    ```
*/
proto.toJSON = function ImHash_toJSON() {
    var res = transient(this._trie)
    var keys = Object.keys(res)
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var value = res[key]

        if (value.toJSON) {
            res[key] = value.toJSON()
        }
    }

    return res
}

/*  get :: ImHash -> String -> Any

    Returns the value associated with the key. Can either be a key or a nested
        query key.

    ```js
    var hash = ImHash({ foo: "1", bar: { baz: "2" } })
    var foo = hash.get("foo") // "1"
    var bar = hash.get("bar") // <ImHash>
    var baz1 = bar.get("baz") // "2"
    var baz2 = hash.get("bar.baz") // "2"
    ```
*/
proto.get = function ImHash_get(key) {
    var parts = key.split(".")
    var trie = this._trie

    for (var i = 0; i < parts.length -1; i++) {
        var hash = get(trie, parts[i])
        if (!hash) {
            return undefined
        }
        trie = hash._trie
    }

    return get(trie, parts[i])
}

/*  has :: ImHash -> String -> Boolean

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
*/
proto.has = function ImHash_has(key) {
    var parts = key.split(".")
    var trie = this._trie

    for (var i = 0; i < parts.length - 1; i++) {
        var hash = get(trie, parts[i])
        if (!hash) {
            return false
        }
        trie = hash._trie
    }

    return has(trie, parts[i])
}

/*  map :: ImHash<String, A> -> (A -> B) lambda -> ImHash<String, B>
    map :: ImHash -> String query -> (A -> B) -> ImHash

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
*/
proto.map = function ImHash_map(query, lambda) {
    if (typeof query === "function") {
        lambda = query
        query = ""
    }

    var hash = query === "" ? this : this.get(query)
    var hashAsObject = hash.toJSON()
    var keys = Object.keys(hashAsObject)

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var value = hash.get(key)
        var res = lambda(value, key)

        hash = hash.patch(key, res)
    }

    return query === "" ? hash : this.patch(query, hash)
}

/*  filter :: ImHash<String, A> -> (A -> Boolean) lambda -> ImHash<String, A>
    filter :: ImHash -> String query -> (A -> Boolean) -> ImHash

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
*/
proto.filter = function ImHash_filter(query, lambda) {
    if (typeof query === "function") {
        lambda = query
        query = ""
    }

    var hash = query === "" ? this : this.get(query)

    var hashAsObject = hash.toJSON()
    var keys = Object.keys(hashAsObject)

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var value = hash.get(key)
        var keep = lambda(value, key)
        if (!keep) {
            hash = hash.patch(key, null)
        }
    }

    return query === "" ? hash : this.patch(query, hash)
}
proto.type = "immutable-hash@ImmutableHash"

module.exports = createHash

/*  createHash :: Object<String, Delta> initial -> ImHash

    ```js
    var hash = ImHash().patch({ foo: "1", bar: { baz: "2" } })
    var res = hash.toJSON() // { foo: "1", bar: { baz: "2" } }
    var hash2 = ImHash({ foo: "1", bar: { baz: "2" } })
    var res2 = hash2.toJSON() // { foo: "1", bar: { baz: "2" } }
    ```
*/
function createHash(initial) {
    if (!initial) {
        return new ImHash()
    }

    var trie = assocObject(Trie(), initial)

    return new ImHash(trie)
}

/*  assocKey :: Trie trie -> [String] parts -> Any value -> Trie

    Given a list of keys and a value return a new trie with
        the value inserted in that nested key
*/
function assocKey(trie, parts, value) {
    var part = parts[0]
    var len = parts.length

    // if parts.length === 1 then just assoc
    if (parts.length === 1) {
        trie = assocValue(trie, part, value)
    }
    // else we must create a placeholder if it does not exist
    else {
        var existingHash = get(trie, part) || new ImHash()
        existingHash = existingHash.patch(parts.slice(1), value)

        trie = assoc(trie, part, existingHash)
    }

    return trie
}

/*  assocObject :: Trie -> Object<String, Delta> -> Trie

    Given an object with keys and deltas return a new trie with
        the deltas applied to it.
*/
function assocObject(trie, object) {
    var keys = Object.keys(object)
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var value = object[key]
        trie = assocValue(trie, key, value)
    }
    return trie
}

/* assocValue :: Trie -> String key -> Any Value -> Trie

    Given a key and a value that's either an object or a simple value we return
        new Trie with the value updated at that key
*/
function assocValue(trie, key, value) {
    // if it's a primitive or as ImHash we can put it in the Trie
    if (!isObject(value) || value.type === proto.type) {
        if (value === null) {
            trie = dissoc(trie, key)
        } else {
            trie = assoc(trie, key, value)
        }
    // else we must merge it with the existingHash or create it
    } else {
        var existingHash = get(trie, key)
        var hash
        if (existingHash && existingHash.type === proto.type) {
            hash = existingHash.patch(value)
        } else {
            hash = createHash(value)
        }
        trie = assoc(trie, key, hash)
    }

    return trie
}
