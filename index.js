var persistent = require("persistent-hash-trie")
var isObject = require("is-object")
var Keys = require("object-keys")
var uuid = require("uuid")

var Trie = persistent.Trie
var assoc = persistent.assoc
var get = persistent.get
var has = persistent.has
var dissoc = persistent.dissoc
var persistentKeys = persistent.keys
var mutable = persistent.mutable

var guid = 0

/*  ImHash {
        trie: Trie,
        diff: Delta,
        diffPath: [String],
        parent: UUID,
        id: UUID
    }

    an ImHash is a data structure that wraps a Trie containing it's
        data.

    It also has a `<diffPath, diff>` which represents the diff that was
        patched to the previous `ImHash` to create this `ImHash`. The
        diffPath may be empty which means the diff was applied at the root
        instead of at a nested part of the data structure.

    It also has a `parent` property which is the id of the previous `ImHash`
        used to create this ImHash
*/
function ImHash(trie, diff, diffPath, parentId) {
    this._trie = trie || Trie()
    this._diff = diff || null
    this._diffPath = diffPath || []
    this._parentId = parentId || ""
    this._id = guid++
}

var proto = ImHash.prototype

/*  patch :: ImHash -> parts:[String] -> value:Any -> ImHash
    patch :: ImHash -> path:String -> value:Any -> ImHash
    patch :: ImHash -> delta:Object<String, Any> -> ImHash

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
        var trie = assocKey(this._trie, parts, value)

        // trie, diffValue, diffPath, parentId
        return new ImHash(trie, value, parts, this._id)
    } else if (isObject(parts)) {
        var trie = assocObject(this._trie, parts)

        // trie, diffValue, empty path, parentId
        return new ImHash(trie, parts, [], this._id)
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
    var res = mutable(this._trie)
    var keys = Keys(res)
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

/*  map :: ImHash<String, A> -> lambda:(A -> B) -> ImHash<String, B>
    map :: ImHash -> path:String -> (A -> B) -> ImHash

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
    var keys = persistentKeys(hash._trie)
    var diff = {}

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var value = hash.get(key)
        var res = lambda(value, key)

        diff[key] = res
    }

    hash = hash.patch(diff)

    return query === "" ? hash : this.patch(query, hash)
}

/*  filter :: ImHash<String, A> -> lambda:(A -> Boolean) -> ImHash<String, A>
    filter :: ImHash -> path:String -> (A -> Boolean) -> ImHash

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

    var keys = persistentKeys(hash._trie)
    var diff = {}

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var value = hash.get(key)
        var keep = lambda(value, key)
        if (!keep) {
            diff[key] = null
        }
    }

    hash = hash.patch(diff)

    return query === "" ? hash : this.patch(query, hash)
}
proto.type = "immutable-hash@ImmutableHash"

module.exports = createHash

/*  ImmutableHash :: initial:Object<String, Any> -> ImHash

    Creates an ImmutableHash with optionally initial state.

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

/*  assocKey :: trie:Trie -> parts:[String] -> value:Any -> Trie

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
        var existingHash = get(trie, part)
        if (!existingHash || existingHash.type !== proto.type) {
             existingHash = new ImHash()
        }
        existingHash = existingHash.patch(parts.slice(1), value)

        trie = assoc(trie, part, existingHash)
    }

    return trie
}

/*  assocObject :: Trie -> Object<String, Any> -> Trie

    Given an object with keys and deltas return a new trie with
        the deltas applied to it.
*/
function assocObject(trie, object) {
    var keys = Keys(object)
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var value = object[key]
        trie = assocValue(trie, key, value)
    }
    return trie
}

/* assocValue :: Trie -> key:String -> value:Any -> Trie

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
