const db = require('../helper/database')

async function getRoom(request, response){
    const { organizationId } = request.params

    try{
        const getRoomList = await db.query(`
            SELECT id,
                name,
                description,
                period_start as "periodStart",
                period_end as "periodEnd",
                created_date as "createdDate",
                coalesce(created_by, 'SYSTEM') as "createdBy"
                from vote_master_room
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

async function insertRoom(request, response){
    const { id, organizationId, userId, name, dateStart, dateEnd, timeStart, timeEnd, description } = request.body

    const periodStart = dateStart+timeStart
    const periodEnd = dateEnd+timeEnd

    try{
        if(id === null){
            const insert = await db.query(`INSERT INTO vote_master_room
                (
                    organization__id, name, period_start, period_end,
                    description, status, created_by
                )
                values
                (
                    $1, $2, $3, $4,
                    $5, $6, $7
                )`, [organizationId, name, periodStart, periodEnd,
                description, 'Active', userId])
            if(insert){
                response.status(200).json({
                    status: 'success',
                    message: 'Succesfully added new data!'
                })
            }
        }else{
            const insert = await db.query(`UPDATE vote_master_room name = $1, period_start = $2, periodEnd = $3, description = $4 where id = $5`,
            [name, periodStart, periodEnd, description, id])
            if(insert){
                response.status(200).json({
                    status: 'success',
                    message: 'Succesfully added new data!'
                })
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

module.exports = {
    getRoom,
    insertRoom
}