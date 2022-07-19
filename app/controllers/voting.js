const db = require('../helper/database')

async function checkToken(request, response) {
    const { token } = request.params

    try {
        const check = await db.query(`
            SELECT status, room__id from vote_master_room_participants
            where token = $1
        `, [token])

        if (check.rowCount > 0) {
            if (check.rows[0].status.toLowerCase() === 'active') {
                response.status(200).json({
                    status: 'success',
                    message: 'Success!',
                    roomId: check.rows[0].room__id
                })
            } else {
                response.status(500).json({
                    status: 'error',
                    message: 'Token already used!'
                })
            }
        } else {
            response.status(500).json({
                status: 'error',
                message: "Token doesn't exists"
            })
        }
    } catch (err) {
        response.status(500).json({
            status: 'error',
            message: 'Oops..unknown error',
            errorThrown: err.stack
        })
    }
}

async function getPosition(request, response) {
    const { roomId } = request.params

    try {
        const getPositionId = await db.query(`SELECT distinct(fn_convert_integer(position__id)) as "positionId",
                                                (select name from vote_master_position where position__id = id) as "positionName"
                                                from vote_master_room_candidate where room__id = $1`, [roomId])

        if (getPositionId.rowCount > 0) {
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: getPositionId.rows
            })
        } else {
            response.status(200).json({
                status: 'error',
                message: `This room doesn't have an candidate, please setup first before start`,
                data: null
            })
        }
    } catch (err) {
        response.status(500).json({
            status: 'error',
            message: 'Oops..there is unknown error',
            errorThrown: err.stack
        })
    }
}

async function getCandidate(request, response) {
    const { roomId, positionId } = request.params

    try {
        const getAllCandidate = await db.query(`
            SELECT fn_convert_integer(id) as id,
                name,
                string_agg(substr(initials, 1,1)|| '', '') initials,
                (select name from vote_master_position where position__id = id) as position,
                vision,
                array_to_json(mission) mission
                from
                (
                    select id,
                            name,
                            unnest(string_to_array(name, ' ')) initials,
                            position__id,
                        vision,
                        mission
                            from vote_master_room_candidate
                        where room__id = $1
                        and position__id = $2
                ) sub
                group by sub.id, sub.name, sub.position__id, sub.vision, sub.mission;
            `, [roomId, positionId])

        if (getAllCandidate.rowCount > 0) {
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: getAllCandidate.rows
            })
        } else {
            response.status(200).json({
                status: 'error',
                message: `This room doesn't have an candidate, please setup first before start`,
                data: null
            })
        }
    } catch (err) {
        response.status(500).json({
            status: 'error',
            message: 'Oops..there is unknown error',
            errorThrown: err.stack
        })
    }
}

async function saveVoting(request, response){
    const { token, candidateId, roomId } = request.body

    try{
        const checkAccess = await db.query(`SELECT
                                                id,
                                                status
                                                from vote_master_room_participants
                                                where token = $1`, [token])
        
        if(checkAccess.rowCount > 0){
            if(checkAccess.rows[0].status.toLowerCase() === 'active'){
                const checkVote = await db.query(`SELECT id from vote_master_room_participants_voting
                                                    where participants__id = $1 and room__id = $2`, [checkAccess.rows[0].id, roomId])

                if(checkVote.rowCount > 0){
                    const updateVote = await db.query(`update vote_master_room_participants_voting
                                                        set candidate__id = $1
                                                        where id = $2
                                                        `, [candidateId, checkVote.rows[0].id])
    
                    if(updateVote){
                        response.status(200).json({
                            status: 'success',
                            message: `Thank you for your vote!`
                        })
                    }
                }else{
                    const insertVote = await db.query(`INSERT INTO vote_master_room_participants_voting
                                                        (room__id, participants__id, candidate__id)
                                                        values
                                                        ($1, $2, $3)`, [roomId, checkAccess.rows[0].id, candidateId])
    
                    if(insertVote){
                        response.status(200).json({
                            status: 'success',
                            message: `Thank you for your vote!`
                        })
                    }
                }

            }else{
                response.status(200).json({
                    status: 'error',
                    message: `Token already used!`,
                    data: null
                })
            }
        }else{
            response.status(200).json({
                status: 'error',
                message: `Token doesn't exists`,
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

async function saveAll(request, response){
    const { token } = request.body

    try{
        const checkAccess = await db.query(`SELECT
                                                id,
                                                status
                                                from vote_master_room_participants
                                                where token = $1`, [token])
        
        if(checkAccess.rowCount > 0){
            if(checkAccess.rows[0].status.toLowerCase() === 'active'){
                const updateVote = await db.query(`update vote_master_room_participants set status = 'Inactive', status_vote = 'Yes' where id = $1`, [checkAccess.rows[0].id])

                if(updateVote){
                    response.status(200).json({
                        status: 'success',
                        message: `Thank you for your vote, see you next time!`
                    })
                }
            }else{
                response.status(200).json({
                    status: 'error',
                    message: `Token already used!`,
                    data: null
                })
            }
        }else{
            response.status(200).json({
                status: 'error',
                message: `Token doesn't exists`,
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

async function getCandidateResult(request, response){
    const { token } = request.params

    try{
        const checkAccess = await db.query(`SELECT
                                                id,
                                                status
                                                from vote_master_room_participants
                                                where token = $1`, [token])
        
        if(checkAccess.rowCount > 0){
            if(checkAccess.rows[0].status.toLowerCase() === 'active'){
                const updateVote = await db.query(`select a.id,
                                                    b.name as "candidateName",
                                                    c.name as "positionName"
                                                    from vote_master_room_participants_voting a
                                                    left join vote_master_room_participants d on a.participants__id = d.id
                                                    left join vote_master_room_candidate b on a.candidate__id = b.id
                                                    left join vote_master_position c on c.id = b.position__id
                                                    where d.id = $1
                                                    order by c.id`, [checkAccess.rows[0].id])

                if(updateVote && updateVote.rowCount > 0){
                    response.status(200).json({
                        status: 'success',
                        message: `Success`,
                        data: updateVote.rows
                    })
                }else{
                    response.status(200).json({
                        status: 'error',
                        message: `You haven't vote`,
                        data: null
                    })
                }
            }else{
                response.status(200).json({
                    status: 'error',
                    message: `Token already used!`,
                    data: null
                })
            }
        }else{
            response.status(200).json({
                status: 'error',
                message: `Token doesn't exists`,
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

module.exports = {
    checkToken,
    getPosition,
    getCandidate,
    saveVoting,
    saveAll,
    getCandidateResult
}