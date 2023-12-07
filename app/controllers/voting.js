const db = require("../helper/database");
const { sha256Generator } = require("../helper/encryptor");
require("dotenv").config();
const { faker } = require("@faker-js/faker");

function checkSecurity(token, timestamp, securityCode) {
  const serverHash = sha256Generator(process.env.API_KEY + token + timestamp);

  if (securityCode === serverHash) {
    return true;
  } else {
    return false;
  }
}

async function checkToken(request, response) {
  const { token } = request.params;
  const { timestamp, securitycode } = request.headers;

  const checkAuth = checkSecurity(token, timestamp, securitycode);

  if (checkAuth) {
    try {
      const check = await db.query(
        `
                SELECT a.status, room__id, b.status as "statusRoom", b.id as "roomId", fn_convert_integer(type_candidate__id) as "typeCandidateId"
                    from vote_master_room_participants a
                    left join vote_master_room b on a.room__id = b.id
                    where token = $1
            `,
        [token]
      );

      if (check.rowCount > 0) {
        const result = check.rows.shift();

        if (result?.roomId === null) {
          response.status(500).json({
            status: "error",
            message: "Ruangan sudah tidak tersedia!",
          });
          return;
        }

        if (result?.statusRoom?.toLowerCase() !== "active") {
          response.status(500).json({
            status: "error",
            message: "Periode voting sudah berakhir",
          });
        } else {
          if (result?.status?.toLowerCase() === "active") {
            response.status(200).json({
              status: "success",
              message: "Success!",
              roomId: result?.room__id,
              typeCandidateId: result?.typeCandidateId,
            });
          } else {
            response.status(500).json({
              status: "error",
              message: "Token sudah digunakan!",
            });
          }
        }
      } else {
        response.status(500).json({
          status: "error",
          message: "Token doesn't exists",
        });
      }
    } catch (err) {
      response.status(500).json({
        status: "error",
        message: "Oops..unknown error",
        errorThrown: err.stack,
      });
    }
  } else {
    response.status(401).json({
      status: "error",
      message: "your security code is invalid!",
    });
  }
}

async function getPosition(request, response) {
  const { roomId } = request.params;
  const { timestamp, securitycode, token } = request.headers;

  const checkAuth = checkSecurity(token, timestamp, securitycode);

  if (checkAuth) {
    try {
      const getPositionId = await db.query(
        `SELECT distinct(fn_convert_integer(position__id)) as "positionId",
                                                    (select name from vote_master_position where position__id = id) as "positionName"
                                                    from vote_master_room_candidate where room__id = $1`,
        [roomId]
      );

      if (getPositionId.rowCount > 0) {
        response.status(200).json({
          status: "success",
          message: "success",
          data: getPositionId.rows,
        });
      } else {
        response.status(200).json({
          status: "error",
          message: `This room doesn't have an candidate, please setup first before start`,
          data: null,
        });
      }
    } catch (err) {
      response.status(500).json({
        status: "error",
        message: "Oops..there is unknown error",
        errorThrown: err.stack,
      });
    }
  } else {
    response.status(401).json({
      status: "error",
      message: "your security code is invalid!",
    });
  }
}

async function getCandidate(request, response) {
  const { roomId, positionId } = request.params;
  const { token, securitycode, timestamp } = request.headers;

  const checkAuth = checkSecurity(token, timestamp, securitycode);

  if (checkAuth) {
    try {
      // const candidateRaw = []
      // for(let i = 0; i < 30; i++){
      //     candidateRaw.push({
      //         id: faker.number.int(),
      //         name: faker.person.fullName(),
      //         initials: faker.person.firstName(),
      //         // candidatePhoto: null,
      //         candidatePhoto: faker.image.imageUrl(),
      //         positionId: faker.number.int(),
      //         vision: faker.string.alphanumeric({ length: { min: 12, max: 60 } }),
      //         mission: faker.datatype.array({ min: 1, max: 9 })
      //     })
      // }

      // response.status(200).json({
      //     status: 'success',
      //     message: 'success',
      //     data: candidateRaw
      // })
      // return
      const getAllCandidate = await db.query(
        `
                SELECT fn_convert_integer(id) as id,
                    name,
                    string_agg(substr(initials, 1,1)|| '', '') initials,
                    candidate_photo as "candidatePhoto",
                    fn_convert_integer(position__id) as "positionId",
                    (select name from vote_master_position where position__id = id) as position,
                    vision,
                    array_to_json(mission) mission
                    from
                    (
                        select id,
                                name,
                                unnest(string_to_array(name, ' ')) initials,
                                candidate_photo,
                                position__id,
                            vision,
                            mission
                                from vote_master_room_candidate
                            where room__id = $1
                            and position__id = $2
                    ) sub
                    group by sub.id, sub.name, sub.position__id, sub.vision, sub.mission, sub.candidate_photo;
                `,
        [roomId, positionId]
      );

      if (getAllCandidate.rowCount > 0) {
        response.status(200).json({
          status: "success",
          message: "success",
          data: getAllCandidate.rows,
        });
      } else {
        response.status(200).json({
          status: "error",
          message: `This room doesn't have an candidate, please setup first before start`,
          data: null,
        });
      }
    } catch (err) {
      response.status(500).json({
        status: "error",
        message: "Oops..there is unknown error",
        errorThrown: err.stack,
      });
    }
  } else {
    response.status(401).json({
      status: "error",
      message: "your security code is invalid!",
    });
  }
}

async function saveVoting(request, response) {
  const { token, candidateId, positionId, roomId } = request.body;
  const { securitycode, timestamp } = request.headers;

  const checkAuth = checkSecurity(token, timestamp, securitycode);

  if (checkAuth) {
    try {
      const checkAccess = await db.query(
        `SELECT
                                                    id,
                                                    status
                                                    from vote_master_room_participants
                                                    where token = $1`,
        [token]
      );

      if (checkAccess.rowCount > 0) {
        if (checkAccess.rows[0].status.toLowerCase() === "active") {
          const checkVote = await db.query(
            `SELECT a.id from vote_master_room_participants_voting a
                                                        left join vote_master_room_candidate b on a.candidate__id = b.id
                                                        left join vote_master_position c on b.position__id = c.id
                                                        where participants__id = $1 and a.room__id = $2 and b.position__id = $3`,
            [checkAccess.rows[0].id, roomId, positionId]
          );

          if (checkVote.rowCount > 0) {
            const updateVote = await db.query(
              `update vote_master_room_participants_voting
                                                            set candidate__id = $1
                                                            where id = $2
                                                            `,
              [candidateId, checkVote.rows[0].id]
            );

            if (updateVote) {
              response.status(200).json({
                status: "success",
                message: `Thank you for your vote!`,
              });
            }
          } else {
            const insertVote = await db.query(
              `INSERT INTO vote_master_room_participants_voting
                                                            (room__id, participants__id, candidate__id)
                                                            values
                                                            ($1, $2, $3)`,
              [roomId, checkAccess.rows[0].id, candidateId]
            );

            if (insertVote) {
              response.status(200).json({
                status: "success",
                message: `Thank you for your vote!`,
              });
            }
          }
        } else {
          response.status(200).json({
            status: "error",
            message: `Token already used!`,
            data: null,
          });
        }
      } else {
        response.status(200).json({
          status: "error",
          message: `Token doesn't exists`,
          data: null,
        });
      }
    } catch (err) {
      response.status(500).json({
        status: "error",
        message: "Oops..there is unknown error",
        errorThrown: err.stack,
      });
    }
  } else {
    response.status(401).json({
      status: "error",
      message: "your security code is invalid!",
    });
  }
}

async function saveAll(request, response) {
  const { token } = request.body;
  const { securitycode, timestamp } = request.headers;

  const checkAuth = checkSecurity(token, timestamp, securitycode);

  if (checkAuth) {
    try {
      const checkAccess = await db.query(
        `SELECT
            id,
            status
            from vote_master_room_participants
            where token = $1`,
        [token]
      );

      if (checkAccess.rowCount > 0) {
        const result = checkAccess.rows.shift();

        if (result?.status?.toLowerCase() === "active") {
          const updateVote = await db.query(
            `update vote_master_room_participants set status = 'Inactive', status_vote = 'Yes' where id = $1`,
            [result?.id]
          );

          if (updateVote) {
            response.status(200).json({
              status: "success",
              message: `Thank you for your vote, see you next time!`,
            });
          }
        } else {
          response.status(200).json({
            status: "error",
            message: `Token already used!`,
            data: null,
          });
        }
      } else {
        response.status(200).json({
          status: "error",
          message: `Token doesn't exists`,
          data: null,
        });
      }
    } catch (err) {
      response.status(500).json({
        status: "error",
        message: "Oops..there is unknown error",
        errorThrown: err.stack,
      });
    }
  } else {
    response.status(401).json({
      status: "error",
      message: "your security code is invalid!",
    });
  }
}

async function saveAllSocket(data) {
  const client = db.connect();
  try {
    (await client).query("BEGIN");

    const checkAccess = await db.query(
      `SELECT
        id,
        status
        from vote_master_room_participants
        where token = $1`,
      [data?.token]
    );

    if (checkAccess.rowCount > 0) {
      const result = checkAccess.rows.shift();

      if (result?.status?.toLowerCase() === "active") {
        for (const entry of data?.data) {
          const insert = await (
            await client
          ).query(
            `
                INSERT INTO vote_master_room_participants_voting
                (room__id, participants__id, candidate__id)
                values
                ($1, $2, $3)
            `,
            [entry?.roomId, result?.id, entry?.candidateId]
          );
        }

        const updateVote = await (await client).query(
          `update vote_master_room_participants set status = 'Inactive', status_vote = 'Yes' where id = $1`,
          [result?.id]
        );

        if (updateVote) {
          (await client).query("COMMIT");
          return {
            status: "success",
            message: `Thank you for your vote, see you next time!`,
            data: null,
          };
        }
      } else {
        (await client).query("ROLLBACK");
        return {
          status: "error",
          message: `Token already used!`,
          data: null,
        };
      }
    } else {
      (await client).query("ROLLBACK");
      return {
        status: "error",
        message: `Token doesn't exists`,
        data: null,
      };
    }
  } catch (err) {
    (await client).query("ROLLBACK");
    return {
      status: "error",
      message: "Oops..there is unknown error",
      errorThrown: err.stack,
    };
  }
}

async function getCandidateResult(request, response) {
  const { token } = request.params;
  const { securitycode, timestamp } = request.headers;

  const checkAuth = checkSecurity(token, timestamp, securitycode);

  if (checkAuth) {
    try {
      const checkAccess = await db.query(
        `SELECT
            id,
            status
            from vote_master_room_participants
            where token = $1`,
        [token]
      );

      if (checkAccess.rowCount > 0) {
        if (checkAccess.rows[0].status.toLowerCase() === "active") {
          const updateVote = await db.query(
            `select a.id,
                                                        b.name as "candidateName",
                                                        c.name as "positionName"
                                                        from vote_master_room_participants_voting a
                                                        left join vote_master_room_participants d on a.participants__id = d.id
                                                        left join vote_master_room_candidate b on a.candidate__id = b.id
                                                        left join vote_master_position c on c.id = b.position__id
                                                        where d.id = $1
                                                        order by c.id`,
            [checkAccess.rows[0].id]
          );

          if (updateVote && updateVote.rowCount > 0) {
            response.status(200).json({
              status: "success",
              message: `Success`,
              data: updateVote.rows,
            });
          } else {
            response.status(200).json({
              status: "error",
              message: `You haven't vote`,
              data: null,
            });
          }
        } else {
          response.status(200).json({
            status: "error",
            message: `Token already used!`,
            data: null,
          });
        }
      } else {
        response.status(200).json({
          status: "error",
          message: `Token doesn't exists`,
          data: null,
        });
      }
    } catch (err) {
      response.status(500).json({
        status: "error",
        message: "Oops..there is unknown error",
        errorThrown: err.stack,
      });
    }
  } else {
    response.status(401).json({
      status: "error",
      message: "your security code is invalid!",
    });
  }
}

module.exports = {
  checkToken,
  getPosition,
  getCandidate,
  saveVoting,
  saveAll,
  saveAllSocket,
  getCandidateResult,
};
