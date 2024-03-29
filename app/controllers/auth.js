const db = require('../helper/database')
const { networkInterfaces } = require('os')
const { sha256Generator, sha256Encryptor } = require('../helper/encryptor')
const moment = require('moment')
const getMenus = require('./menus')

async function register(request, response){
    const { organizationName, organizationEmail, username, email, password } = request.body
    const { securitycode, timestamp } = request.headers
    const check = checkSecurity(securitycode, email, password, timestamp)
    const encryptedPassword = sha256Generator(password)

    if(check){
        try{
            const insertOrganization = await db.query(`
                INSERT INTO vote_master_organization(name, email)
                VALUES($1, $2) returning id
            `, [organizationName, organizationEmail])
    
            if(insertOrganization && insertOrganization.rows[0].id !== ''){
                const organizationId = insertOrganization.rows[0].id
    
                const insertUser = await db.query(`
                    INSERT INTO vote_user_data(id, organization__id, name, email, password, language__id, is_active)
                    values(fn_vote_user_id_generate(), $1, $2, $3, $4, $5, $6)
                `, [organizationId, username, email, encryptedPassword, 2, 1])
    
                if(insertUser){
                    response.status(200).json({
                        status: 'success',
                        message: 'Successfully registered user!'
                    })
                }
            }
        }catch(error){
            response.status(500).json({
                status: 'error',
                message: 'Error when save data to database!',
                errorThrown: error.stack
            })
        }
    }
}

async function checkAuth(request, response){
    const { email, password } = request.body
    const { securitycode, timestamp } = request.headers
    const check = checkSecurity(securitycode, email, password, timestamp)
    const encryptedPassword = sha256Generator(password)

    if(check){
        const ipAddress = await getIpAddress()
        const browserVersion = request.get('user-agent')

        const checkUser = await db.query(`select a.id,
                                            a.name,
                                            a.email,
                                            b.id as "organizationId",
                                            b.name as "organizationName",
                                            c.id as "languageId",
                                            c.name as language
                                            from vote_user_data a
                                            left join vote_master_organization b on a.organization__id = b.id
                                            left join vote_system_language c on a.language__id = c.id
                                            where a.email = $1
                                            and password = $2
                                            and is_active = 1`, [email, encryptedPassword])

        if(checkUser.rowCount > 0){
            const dataUser = checkUser.rows[0]
            const menus = await getMenus(dataUser.id, dataUser.languageId)
            const userData = {
                id: dataUser.id,
                name: dataUser.name,
                email: dataUser.email,
                organizationId: dataUser.organizationId,
                organizationName: dataUser.organizationName,
                language: dataUser.language
            }

            const session = request.session
            session.sessionID = request.sessionID
            session.userdata = userData

            const insertSession = await db.query(`INSERT INTO vote_user_sessions values($1, $2, $3, $4)`, [request.sessionID, ipAddress[0], browserVersion, moment().unix()])

            response.status(200).json({
                status: 'success',
                message: 'Successfully logged in!',
                session: session,
                menuAccess: menus.data === null ? [] : menus.data
            })
        }else{
            response.status(500).json({
                status: 'error',
                message: 'Incorrect email or password!'
            })
        }
    }else{
        response.status(401).json({
            status: 'error',
            message: 'Your security code is invalid!'
        })
    }
}

async function logout(request, response){
    const { sessionId } = request.body

    const insertSession = await db.query(`DELETE FROM vote_user_sessions where session = $1`, [sessionId])

    if(insertSession){
        response.status(200).json({
            status: 'success',
            message: 'Successfully logged in!'
        })
    }

}

function checkSecurity(securityCode, email, password, timestamp){
    const apiKey = process.env.API_KEY
    const serverHash = sha256Generator(apiKey + email + password + timestamp)

    if(securityCode === serverHash){
        return true
    }else{
        return false
    }
}

async function getIpAddress(){
    const nets = networkInterfaces()
    const results = []

    for(const name of Object.keys(nets)){
        for(const net of nets[name]){
            if(net.family === 'IPv4' && !net.internal){
                results.push(net.address)
            }
        }
    }

    return results
}

async function test(request, response){
    const { action, text } = request.body

    const result = sha256Encryptor(action, text)

    console.log(result)

    response.json({
        message: result
    })
}

module.exports = {
    checkAuth,
    register,
    logout,
    test
}