const db = require('../helper/database')

async function getCombo(request, response){
    const { type, parent } = request.body

    try{
        const data = comboData(type, parent)

        if(data.length > 0){
            response.status(200).json({
                status: 'success',
                message: 'success',
                data: data.rows
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
            query = await db.query(`SELECT id as combo_key, name as combo_name
                                            from vote_master_room`)
        break
        case 'position':
            query = await db.query(`SELECT id as combo_key, name as combo_name
                                            from vote_master_position`);
        break
    }

    return query.rows
}

module.exports = {
    getCombo
}