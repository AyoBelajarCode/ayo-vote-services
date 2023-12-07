const { Server } = require("socket.io");
const db = require("./database");
const { saveAllSocket } = require("../controllers/voting");
const { getCandidateResult } = require("./voting");

let io;
const users = {};

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connect", function (socket) {
    console.log("Socket connected", socket.id);

    socket.on("joinRoom", async (roomId, userId, callback) => {
      console.log(`Socket ${socket.id} joining room: ${roomId}`);

      socket.join(roomId);
      users[socket.id] = roomId;
      const candidateResult = await getCandidateResult(roomId);

      callback({
        status: "success",
        message: "Success",
        data: candidateResult,
      });
    });

    socket.on("sendVote", async (data, callback) => {
      // fungsi save
      // Pastikan koneksi socket telah bergabung dengan ruangan
      if (users[socket.id]) {
        const roomId = users[socket.id];
        const results = await saveAllSocket(data);

        const candidateResult = await getCandidateResult(data?.roomId);
        console.log(candidateResult)
        results.data = candidateResult;

        io.to(roomId).emit("getVote", results);
        callback(results)
      } else {
        console.log(
          `socket.id : ${socket.id} cannot send vote because not joined to any room`
        );
      }
    });
  });
}

async function sendNotification(roomId) {
  if (io) {
    const candidateResult = await db.query(
      `select b.name, count(a.id) as vote, 'test' as masuk
                        from vote_master_room_participants_voting a
                        left join vote_master_room_candidate b on a.candidate__id = b.id
                        where a.room__id = $1
                        group by b.name, a.candidate__id`,
      [roomId]
    );
    try {
      // io.emit('getVote', candidateResult.rows)
      io.to(roomId).emit("getVote", candidateResult.rows);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}

module.exports = {
  initSocket,
  sendNotification,
};
