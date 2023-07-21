const db = require('../helper/database')
const { sha256Generator } = require('../helper/encryptor')
const moment = require('moment')

async function checkSession(request, response, next){
    const { securitycode, timestamp } = request.headers
    const sessionId = (request.method === 'GET' || request.method === 'DELETE') ? request.headers.session : request.body.sessionId
    const apiKey = process.env.API_KEY

    const serverHash = sha256Generator(apiKey + sessionId + timestamp)
    
    if(securitycode === serverHash){
        const checkCurrentSession = await db.query(`SELECT * from vote_user_sessions where session = $1`, [sessionId])

        if(checkCurrentSession.rowCount > 0){
            const lastActivity = moment.unix(checkCurrentSession.rows[0].last_activity).format("YYYY-MM-DD")
            const currentDate = moment(moment.unix(timestamp).format('YYYY-MM-DD'))
            
            const differentDay = currentDate.diff(lastActivity, 'days')

            if(differentDay > 2){
                await db.query(`DELETE FROM vote_user_sessions where session = $1`, [sessionId])
                response.status(408).json({
                    status: 'error',
                    message: 'Session timeout!'
                })
                return
            }

            await db.query(`UPDATE vote_user_sessions set last_activity = $1 where session = $2`, [moment().unix(), sessionId])
            
            next()
        }else{
            response.status(408).json({
                status: 'error',
                message: 'Session timeout!'
            })
        }
    }else{
        response.status(401).json({
            status: 'error',
            message: 'Your security code is invalid!'
        })
    }
}

module.exports = checkSession