const { Server } = require('socket.io')
const db = require('./database')

let io
const users = {}

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*'
        }
    })

    io.on('connect', function (socket) {
        console.log('Socket connected', socket.id)

        socket.on('joinRoom', (roomId, userId) => {
            console.log(`Socket ${socket.id} joining room: ${roomId}`)

            socket.join(roomId)
            users[socket.id] = roomId
        })

        socket.on('sendVote', async (data) => {
            // fungsi save
            // Pastikan koneksi socket telah bergabung dengan ruangan
            if (users[socket.id]) {
                const roomId = users[socket.id];

                const candidateResult = await db.query(`select b.name, count(a.id) as vote, 'test' as masuk
                        from vote_master_room_participants_voting a
                        left join vote_master_room_candidate b on a.candidate__id = b.id
                        where a.room__id = $1
                        group by b.name, a.candidate__id`, [data.roomId])

                io.to(roomId).emit('getVote', candidateResult.rows)

            } else {
                console.log(`socket.id : ${socket.id} cannot send vote because not joined to any room`)
            }

        })
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
            // io.emit('getVote', candidateResult.rows)
            io.to(roomId).emit('getVote', candidateResult.rows)
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }
}

module.exports = {
    initSocket,
    sendNotification
}