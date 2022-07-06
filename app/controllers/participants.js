const db = require('../helper/database')
const { sha256Generator } = require('../helper/encryptor')

async function getParticipants(request, response){
    const { roomId } = request.params

    try{
        const getParticipantsList = await db.query(`
            SELECT id,
                name,
                email,
                token,
                status
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
    const { userId, id, roomId, name, email, status } = request.body

    try{       
        if(id === null){
            const secretKey = '4y0v0t3p4rt1c1p4nts'
            const generateToken = sha256Generator('encrypt', roomId+email+secretKey)
            const insert = await db.query(`
                INSERT INTO vote_master_room_participants(room__id, name, email, token, status, created_by)
                values($1, $2, $3, $4, $5, $6) returning id
            `, [roomId, name, email, generateToken, 'Active', userId])

            if(insert){
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
                    UPDATE vote_master_room_participants set room__id = $1, name = $2, email = $3, status = $4, modified_by = $5
                    where id = $6
                `, [roomId, name, email, status, userId, id])
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
                    status: 'error',
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