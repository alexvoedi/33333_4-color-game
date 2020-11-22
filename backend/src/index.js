const { default: Game } = require('./Game')

const io = require('socket.io')()

let game = new Game(io)

io.listen(3000)
