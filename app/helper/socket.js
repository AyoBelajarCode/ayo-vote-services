const { Server } = require('socket.io')
const db = require('./database')

let io
const connectedSockets = new Set();

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*'
        }
    })

    io.on('connect', function (socket) {
        console.log('Socket connected', socket.id)

        // Tambahkan socket ke daftar
        connectedSockets.add(socket);

        socket.on('joinRoom', (roomId) => {
            console.log('masuk joinRoom: ' + roomId)
            socket.join(roomId)
            socket.roomId = roomId
        })

        socket.on('disconnect', () => {
            console.log('Client disconnected', socket.id);

            // Hapus socket dari daftar ketika klien terputus
            connectedSockets.delete(socket);
        });
    })
}

async function sendNotification(roomId) {
    if (io) {
        const candidateResult = await db.query(`select b.name, count(a.id) as vote, 'test' as masuk
                        from vote_master_room_participants_voting a
                        left join vote_master_room_candidate b on a.candidate__id = b.id
                        where a.room__id = $1
                        group by b.name, a.candidate__id`, [roomId])

        // io.sockets.sockets.forEach((socket) => {
        //     console.log(socket.roomId)
        //     if (socket.roomId === roomId) {
        //         // Kirim pembaruan hanya jika roomId cocok
        //         socket.emit('getVote', candidateResult.rows);
        //     }
        // });
        try {
            io.emit('getVote', candidateResult.rows)
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }
}

module.exports = {
    initSocket,
    sendNotification
}