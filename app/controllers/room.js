const db = require('../helper/database')

async function getRoom(request, response) {
    const { organizationId } = request.params
    const { page, orderBy, order, size, search } = request.query

    try {
        let pagination = null, orderQuery = null, searchQuery = null

        if (page !== undefined && size !== undefined) {
            const index = page - 1
            pagination = `LIMIT ${size} OFFSET ${index} * ${size}`
        }

        if (orderBy !== undefined && order !== undefined) {
            orderQuery = `ORDER BY ${orderBy} ${order}`
        }

        if (search !== undefined) {
            searchQuery = `and name ilike '%${search}%'`
        }

        const getRoomList = await db.query(`
            SELECT fn_convert_integer(a.id) as id,
                name,
                description,
                to_char(period_start, 'yyyy-mm-dd HH24:mi') || ' - ' || to_char(period_end, 'yyyy-mm-dd HH24:mi') as period,
                to_char(period_start, 'yyyy-mm-dd') as "dateStart",
                to_char(period_end, 'yyyy-mm-dd') as "dateEnd",
                to_char(period_start, 'HH24:mi:ss') as "timeStart",
                to_char(period_end, 'HH24:mi:ss') as "timeEnd",
                status,
                created_date as "createdDate",
                coalesce(created_by, 'SYSTEM') as "createdBy",
                fn_convert_integer(type_room__id) as "typeRoomId",
                fn_vote_master_data_get_name(6, 2, type_room__id) as "typeRoom",
                fn_convert_integer(type_candidate__id) as "typeCandidateId",
                fn_vote_master_data_get_name(7, 2, type_candidate__id) as "typeCandidate",
                fn_convert_integer((select count(0) from vote_master_room_participants where room__id = a.id)) as participants,
                COUNT(*) OVER() as total_rows
                from vote_master_room a
                where organization__id = $1
                ${searchQuery ?? ''}
                ${pagination ?? ''}
                ${orderQuery ?? ''}
        `, [organizationId])

        if (getRoomList.rowCount > 0) {
            const data = getRoomList.rows.map(({ total_rows, ...rest }) => rest)

            response.status(200).json({
                status: 'success',
                message: 'success',
                data: data,
                totalRows: parseInt(getRoomList.rows[0].total_rows) ?? null,
                rowPerPage: parseInt(size) ?? null,
                totalPage: Math.ceil(parseInt(getRoomList.rows[0].total_rows) / parseInt(size)) ?? null
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
        console.log(err)
        response.status(500).json({
            status: 'error',
            message: 'Oops..there is unknown error',
            errorThrown: err.stack
        })
    }

}

async function getRoomDetail(request, response) {
    const { id } = request.params

    try {
        const getRoomDetail = await db.query(`
            SELECT fn_convert_integer(id) as id,
                name,
                description,
                to_char(period_start, 'yyyy-mm-dd') as "dateStart",
                to_char(period_end, 'yyyy-mm-dd') as "dateEnd",
                to_char(period_start, 'HH24:mi:ss') as "timeStart",
                to_char(period_end, 'HH24:mi:ss') as "timeEnd",
                status,
                created_date as "createdDate",
                fn_convert_integer(type_room__id) as "typeRoomId",
                fn_convert_integer(type_candidate__id) as "typeCandidateId",
                coalesce(created_by, 'SYSTEM') as "createdBy"
                from vote_master_room
                where id = $1
        `, [id])

        if (getRoomDetail.rowCount > 0) {
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: getRoomDetail.rows.shift()
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

async function insertRoom(request, response) {
    const { id, organizationId, userId, name, dateStart, dateEnd, timeStart, timeEnd, description, typeRoomId, typeCandidateId } = request.body

    const periodStart = (dateStart !== undefined && timeStart !== undefined) ? `${dateStart} ${timeStart}` : null
    const periodEnd = (dateEnd !== undefined && timeEnd !== undefined) ? `${dateEnd} ${timeEnd}` : null
    const insertData = [
        organizationId ?? null,
        name ?? null,
        periodStart,
        periodEnd,
        description ?? null,
        'Active',
        typeRoomId ?? null,
        typeCandidateId ?? null,
        userId
    ]

    try {
        if (id === null || id === "") {
            const insert = await db.query(`INSERT INTO vote_master_room
                (
                    organization__id, name, period_start, period_end,
                    description, status, type_room__id, type_candidate__id,
                    created_by
                )
                values
                (
                    $1, $2, $3, $4,
                    $5, $6, $7, $8,
                    $9
                ) returning id`,
                insertData)
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
                const insert = await db.query(`UPDATE vote_master_room set name = $1, period_start = $2, period_end = $3, description = $4, type_room__id = $7, type_candidate__id = $8, modified_by = $6 where id = $5`,
                    [name, periodStart, periodEnd, description, id, userId, typeRoomId ?? null, typeCandidateId ?? null])
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

async function deleteRoom(request, response) {
    const { id } = request.params

    const check = await checkId(id)

    if (!check) {
        response.status(500).json({
            status: 'error',
            message: `Data with id ${id} not found`
        })
    } else {
        try {
            deleteData = await db.query(`DELETE FROM vote_master_room where id = $1`, [id])

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

async function deleteRoomMultiple(request, response) {
    const { roomId } = request.body

    let countSuccess = 0, countFailed = 0
    const responseMessage = []

    for (const room of roomId) {
        const check = await checkId(room)

        if (!check) {
            responseMessage.push({
                id: candidate,
                message: `Data with id ${room} not found`
            })
            countFailed++
        } else {
            try {
                deleteData = await db.query(`DELETE FROM vote_master_room where id = $1`, [room])

                if (deleteData) {
                    responseMessage.push({
                        id: room,
                        message: 'Successfully delete the data!'
                    })
                    countSuccess++
                }
            } catch (err) {
                responseMessage.push({
                    id: room,
                    message: 'Oops..unknown error',
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
    const checkId = await db.query(`select id FROM vote_master_room where id = $1`, [id])

    if (checkId.rowCount === 0) {
        return false
    } else {
        return true
    }
}

module.exports = {
    getRoom,
    getRoomDetail,
    insertRoom,
    deleteRoom,
    deleteRoomMultiple
}