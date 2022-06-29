const db = require('../helper/database')

async function getRoom(request, response){
    const { organizationId } = request.params
    
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
}

module.exports = {
    getRoom
}