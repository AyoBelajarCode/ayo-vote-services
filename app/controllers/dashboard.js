const db = require('../helper/database')

async function dashboardWidget(request, response){
    const { organizationId } = request.body

    try{
        const getAllRoom = await getRoom(organizationId)
        const getRoomActive = await getRoom(organizationId, 'active')
        const getAllUser = await getUser(organizationId)

        const responseData = {
            room: getAllRoom,
            roomActive: getRoomActive,
            user: getAllUser
        }

        response.status(200).json({
            status: 'success',
            message: 'success',
            data: responseData
        })
    }catch(err){
        response.status(500).json({
            status: 'error',
            message: 'Oops..unknown error!',
            errorThrown: err.stack
        })
    }
}

async function getRoom(organizationId, filter = null){
    try{
        const queryData = {
            name: 'vote_master_room',
            where: [organizationId]
        }

        let query = `SELECT count(id)
                        from ${queryData.name} where organization__id = $1`

        if(filter !== null){
            switch(filter){
                case 'active':
                    query += 'and status = $2'
                    queryData.where.push('active')
                break
            }
        }

        const getData = await db.query(query, queryData.where)

        return getData.rowCount
    }catch(err){
        return err.stack
    }
}

async function getUser(organizationId){
    try{
        const query = await db.query(`SELECT count(id) from vote_user_data where organization__id = $1 and is_active = 1`, [organizationId])

        return query.rowCount
    }catch(err){
        return err.stack
    }
}

module.exports = {
    dashboardWidget
}