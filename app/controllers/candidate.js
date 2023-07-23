const db = require('../helper/database')

async function getCandidate(request, response) {
    const { roomId } = request.params
    const { page, orderBy, order, size, search } = request.query

    try {
        let pagination = null, orderQuery = null, searchQuery = null

        if(page !== undefined && size !== undefined){
            const index = page - 1
            pagination = `LIMIT ${size} OFFSET ${index} * ${size}`
        }

        if(orderBy !== undefined && order !== undefined){
            orderQuery = `ORDER BY ${orderBy} ${order}`
        }

        if(search !== undefined){
            searchQuery = `and name ilike '%${search}%'`
        }

        const getCandidateList = await db.query(`
            SELECT fn_convert_integer(id) as id,
                name,   
                room__id as "roomId",
                position__id as "positionId",
                (select name from vote_master_position where id = position__id) as position,
                vision,
                /*
                    array_to_string(mission, E'\n') as mission,
                */
                array_to_json(mission) as mission,
                candidate_photo as "candidatePhoto",
                COUNT(*) OVER() AS total_rows
                from vote_master_room_candidate
                where room__id = $1
                ${searchQuery ?? ''}
                ${pagination ?? ''}
                ${orderQuery ?? ''}
        `, [roomId])


        if (getCandidateList.rowCount > 0) {
            const data = getCandidateList.rows.map(({ total_rows, ...rest }) => rest)

            response.status(200).json({
                status: 'success',
                message: 'success',
                data: data,
                totalRows: parseInt(getCandidateList.rows[0].total_rows) ?? null,
                rowPerPage: parseInt(size) ?? null,
                totalPage: Math.ceil(parseInt(getCandidateList.rows[0].total_rows) / parseInt(size)) ?? null
            })
        } else {
            response.status(200).json({
                status: 'error',
                message: 'Sorry, there is no data yet.',
                data: null,
                totalRows: null,
                rowPerPage: parseInt(size) ?? null,
                totalPage: null
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

async function getCandidateDetail(request, response) {
    const { id } = request.params

    try {
        const getCandidateList = await db.query(`
            SELECT fn_convert_integer(id) as id,
                name,
                room__id as "roomId",
                position__id as "positionId",
                (select name from vote_master_position where id = position__id) as position,
                vision,
                array_to_json(mission) as mission,
                candidate_photo as "candidatePhoto"
                from vote_master_room_candidate
                where id = $1
        `, [id])

        if (getCandidateList.rowCount > 0) {
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: getCandidateList.rows[0]
            })
        } else {
            response.status(200).json({
                status: 'error',
                message: 'Sorry, there is no data yet.',
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

async function insertCandidate(request, response) {
    const { userId, id, roomId, name, positionId, vision, missions, candidatePhoto } = request.body

    try {
        const newMission = missions.join(', ')
        const arrayMission = `{${newMission}}`

        if (id === null || id === "") {
            const insert = await db.query(`
                INSERT INTO vote_master_room_candidate(room__id, name, position__id, vision, mission, created_by, candidate_photo)
                values($1, $2, $3, $4, $5, $6, $7) returning id
            `, [roomId, name, positionId, vision, arrayMission, userId, candidatePhoto])

            if (insert) {
                response.status(200).json({
                    status: 'success',
                    message: 'Succesfully added new data!',
                    dataId: parseInt(insert.rows[0].id)
                })
            }
        } else {
            const check = await checkId(id)

            if (!check) {
                response.status(500).json({
                    status: 'error',
                    message: `Data with id ${id} not found`
                })
            } else {
                const insert = await db.query(`
                    UPDATE vote_master_room_candidate set room__id = $1, name = $2, position__id = $3, vision = $4, mission = $5, modified_by = $7, candidate_photo = $8
                    where id = $6
                `, [roomId, name, positionId, vision, arrayMission, id, userId, candidatePhoto])
                if (insert) {
                    response.status(200).json({
                        status: 'success',
                        message: 'Succesfully update the data!',
                        dataId: parseInt(id)
                    })
                }
            }
        }


    } catch (err) {
        response.status(500).json({
            status: 'error',
            message: 'Oops..there is unknown error',
            errorThrown: err.stack
        })
    }
}

async function deleteCandidate(request, response) {
    const { id } = request.params

    const check = await checkId(id)

    if (!check) {
        response.status(500).json({
            status: 'error',
            message: `Data with id ${id} not found`
        })
    } else {
        try {
            deleteData = await db.query(`DELETE FROM vote_master_room_candidate where id = $1`, [id])

            if (deleteData) {
                response.status(200).json({
                    status: 'success',
                    message: 'Successfully delete the data!'
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
}

async function deleteCandidateMultiple(request, response) {
    const { candidateId } = request.body

    let countSuccess = 0, countFailed = 0
    const responseMessage = []

    for (const candidate of candidateId) {
        const check = await checkId(candidate)

        if (!check) {
            responseMessage.push({
                id: candidate,
                message: `Data with id ${candidate} not found!`
            })
            countFailed++
        } else {
            try {
                deleteData = await db.query(`DELETE FROM vote_master_room_candidate where id = $1`, [candidate])

                if (deleteData) {
                    responseMessage.push({
                        id: candidate,
                        message: 'Successfully delete the data!'
                    })
                    countSuccess++
                }
            } catch (err) {
                responseMessage.push({
                    id: candidate,
                    message: `Oops..unkown error in id ${candidate}`,
                    errorThrown: err.stack
                })
                countFailed++
            }
        }
    }

    if (countSuccess === 0) {
        response.status(500).json({
            status: 'error',
            message: 'No data has been deleted!',
            success: countSuccess,
            failed: countFailed,
            data: responseMessage
        })
    } else {
        response.status(200).json({
            status: 'success',
            message: 'Data was successfully deleted!',
            success: countSuccess,
            failed: countFailed,
            data: responseMessage
        })
    }
}

async function checkId(id) {
    const checkId = await db.query(`select id, name FROM vote_master_room_candidate where id = $1`, [id])

    if (checkId.rowCount === 0) {
        return false
    } else {
        return true
    }
}

module.exports = {
    getCandidate,
    getCandidateDetail,
    insertCandidate,
    deleteCandidate,
    deleteCandidateMultiple
}