const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

// const app = express()
// const server = http.createServer(app)
// const io = new Server(server)

async function handleSocketConnection(data){
    // io.on('connection', (socket) => {
    //     socket.emit('changeData', data)
    // })
}

module.exports = handleSocketConnection