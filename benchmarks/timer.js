module.exports = Timer

function Timer() {
    var time = 0

    return timer

    function timer(action) {
        var d = Date.now()
        if (action === "start") {
            time = d
        } else if (action === "stop") {
            var delta = d - time
            time = 0
            return delta
        }
    }
}
