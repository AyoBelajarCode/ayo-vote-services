const db = require('../helper/database')

async function getCombo(request, response){
    const { type, parent } = request.body

    try{
        const data = await comboData(type, parent)

        if(data.length > 0){
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: data
            })
        }else{
            response.status(200).json({
                status: 'success',
                message: `Sorry, there is no data yet.`,
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

async function comboData(type, parent = null){
    let query
    switch(type){
        case 'room':
            query = await db.query(`SELECT fn_convert_integer(id) as "comboKey", name as "comboName"
                                            from vote_master_room where organization__id = $1`, [parent])
        break
        case 'position':
            query = await db.query(`SELECT fn_convert_integer(id) as "comboKey", name as "comboName"
                                            from vote_master_position`);
        break
        case 'organization':
            query = await db.query(`SELECT fn_convert_integer(id) as "comboKey", name as "comboName"
                                            from vote_master_organization
                                            where id in(select b.organization__id
                                                            from vote_master_organization_user_group_member a
                                                            left join vote_master_organization_user_group b on a.user_group__id = b.id
                                                            where user__id = $1)`, [parent]);
        break
    }

    return query.rows
}

module.exports = {
    getCombo
}