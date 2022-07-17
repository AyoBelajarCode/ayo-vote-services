const db = require('../helper/database')

async function getCandidate(request, response){
    const { roomId } = request.params

    try{
        const getCandidateList = await db.query(`
            SELECT fn_convert_integer(id) as id,
                name,
                (select name from vote_master_position where id = position__id) as position,
                vision,
                array_to_json(mission) as mission
                from vote_master_room_candidate
                where room__id = $1
        `, [roomId])

        if(getCandidateList.rowCount > 0){
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: getCandidateList.rows
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

async function insertCandidate(request, response){
    const { userId, id, roomId, name, positionId, vision, mission } = request.body

    try{
        const newMission = mission.join(', ')
        const arrayMission = `{${newMission}}`

        if(id === null || id === ""){
            const insert = await db.query(`
                INSERT INTO vote_master_room_candidate(room__id, name, position__id, vision, mission, created_by)
                values($1, $2, $3, $4, $5, $6) returning id
            `, [roomId, name, positionId, vision, arrayMission, userId])

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
                    UPDATE vote_master_room_candidate set room__id = $1, name = $2, position__id = $3, vision = $4, mission = $5, modified_by = $7
                    where id = $6
                `, [roomId, name, positionId, vision, arrayMission, id, userId])
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

async function deleteCandidate(request, response){
    const { id } = request.params

    const check = await checkId(id)

    if(!check){
        response.status(500).json({
            status: 'error',
            message: `Data with id ${id} not found`
        })
    }else{
        try{
            deleteData = await db.query(`DELETE FROM vote_master_room_candidate where id = $1`, [id])

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
    const checkId = await db.query(`select id FROM vote_master_room_candidate where id = $1`, [id])

    if(checkId.rowCount === 0){
        return false
    }else{
        return true
    }
}

module.exports = {
    getCandidate,
    insertCandidate,
    deleteCandidate
}