const db = require('../helper/database')

async function getRoom(request, response){
    const { organizationId } = request.params

    try{
        const getRoomList = await db.query(`
            SELECT fn_convert_integer(id) as id,
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
                (select count(id) from vote_master_room_participants where room__id = a.id) as participants
                from vote_master_room a
                where organization__id = $1
        `, [organizationId])
    
        if(getRoomList.rowCount > 0){
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: getRoomList.rows
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

async function getRoomDetail(request, response){
    const { id } = request.params

    try{
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
                coalesce(created_by, 'SYSTEM') as "createdBy"
                from vote_master_room
                where id = $1
        `, [id])
    
        if(getRoomDetail.rowCount > 0){
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: getRoomDetail.rows[0]
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

async function insertRoom(request, response){
    const { id, organizationId, userId, name, dateStart, dateEnd, timeStart, timeEnd, description } = request.body

    const periodStart = `${dateStart} ${timeStart}`
    const periodEnd = `${dateEnd} ${timeEnd}`

    try{
        if(id === null || id === ""){
            const insert = await db.query(`INSERT INTO vote_master_room
                (
                    organization__id, name, period_start, period_end,
                    description, status, created_by
                )
                values
                (
                    $1, $2, $3, $4,
                    $5, $6, $7
                ) returning id`, [organizationId, name, periodStart, periodEnd,
                description, 'Active', userId])
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
                const insert = await db.query(`UPDATE vote_master_room set name = $1, period_start = $2, period_end = $3, description = $4, modified_by = $6 where id = $5`,
                [name, periodStart, periodEnd, description, id, userId])
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

async function deleteRoom(request, response){
    const { id } = request.params

    const check = await checkId(id)

    if(!check){
        response.status(500).json({
            status: 'error',
            message: `Data with id ${id} not found`
        })
    }else{
        try{
            deleteData = await db.query(`DELETE FROM vote_master_room where id = $1`, [id])

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
    const checkId = await db.query(`select id FROM vote_master_room where id = $1`, [id])

    if(checkId.rowCount === 0){
        return false
    }else{
        return true
    }
}

module.exports = {
    getRoom,
    getRoomDetail,
    insertRoom,
    deleteRoom
}