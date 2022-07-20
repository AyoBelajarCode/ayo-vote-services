const db = require('../helper/database')
const { sha256Generator } = require('../helper/encryptor')
const { sendEmail } = require('../helper/email')

async function getParticipants(request, response){
    const { roomId } = request.params

    try{
        const getParticipantsList = await db.query(`
            SELECT fn_convert_integer(id) as id,
                name,
                email,
                token,
                status,
                status_vote as "voteStatus"
                from vote_master_room_participants
                where room__id = $1
        `, [roomId])

        if(getParticipantsList.rowCount > 0){
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: getParticipantsList.rows
            })
        }else{
            response.status(200).json({
                status: 'error',
                message: 'Sorry, there is no data yet.',
                data: null
            })
        }
    }catch(err){
        response.status(500).json({
            status: 'error',
            message: 'Oops..there is unknown error',
            errorThrown: err.stack
        })
    }
}

async function insertParticipants(request, response){
    const { userId, id, roomId, name, email, status, statusVote } = request.body

    try{       
        if(id === null || id === ""){
            const secretKey = '4y0v0t3p4rt1c1p4nts'
            const generateToken = sha256Generator('encrypt', roomId+email+secretKey)
            const insert = await db.query(`
                INSERT INTO vote_master_room_participants(room__id, name, email, token, status, status_vote, created_by)
                values($1, $2, $3, $4, $5, $7, $6) returning id
            `, [roomId, name, email, generateToken, 'Active', userId, 'No'])

            if(insert){
                const getParticipantsData = await db.query(`
                    SELECT
                        a.name,
                        b.name as "roomName",
                        email,
                        token
                        from vote_master_room_participants a
                        left join vote_master_room b on a.room__id = b.id
                        where a.id = $1
                `, [insert.rows[0].id])

                const resultParticipants = getParticipantsData.rows[0]

                const data = {
                    name: resultParticipants.name,
                    room: resultParticipants.roomName,
                    email: resultParticipants.email
                }

                sendEmail(resultParticipants.token, data)

                response.status(200).json({
                    status: 'success',
                    message: 'Succesfully added new data!',
                    dataId: parseInt(insert.rows[0].id)
                })
            }
        }else{
            const check = await checkId(id)

            if(!check){
                response.status(500).json({
                    status: 'error',
                    message: `Data with id ${id} not found`
                })
            }else{
                const insert = await db.query(`
                    UPDATE vote_master_room_participants set room__id = $1, name = $2, email = $3, status = $4, modified_by = $5, status_vote = $7
                    where id = $6
                `, [roomId, name, email, status, userId, id, statusVote])
                if(insert){
                    response.status(200).json({
                        status: 'success',
                        message: 'Succesfully update the data!',
                        dataId: parseInt(id)
                    })
                }
            }
        }


    }catch(err){
        response.status(500).json({
            status: 'error',
            message: 'Oops..there is unknown error',
            errorThrown: err.stack
        })
    }
}

async function deleteParticipants(request, response){
    const { id } = request.params

    const check = await checkId(id)

    if(!check){
        response.status(500).json({
            status: 'error',
            message: `Data with id ${id} not found`
        })
    }else{
        try{
            deleteData = await db.query(`DELETE FROM vote_master_room_participants where id = $1`, [id])

            if(deleteData){
                response.status(200).json({
                    status: 'success',
                    message: 'Successfully delete the data!'
                })
            }
        }catch(err){
            response.status(500).json({
                status: 'error',
                message: 'Oops..unknown error',
                errorThrown: err.stack
            })
        }
    }
}

async function checkId(id){
    const checkId = await db.query(`select id FROM vote_master_room_participants where id = $1`, [id])

    if(checkId.rowCount === 0){
        return false
    }else{
        return true
    }
}

module.exports = {
    getParticipants,
    insertParticipants,
    deleteParticipants
}