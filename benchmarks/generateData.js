var hash = require("string-hash")
var uuid = require("uuid")

module.exports = gen

function gen(propNum) {
    var obj = {}
    for (var i = 0; i < propNum; i++) {
        var key = hash(uuid() + i)
        obj[key] = true
    }

    return obj
}
