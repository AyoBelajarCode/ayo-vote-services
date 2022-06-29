const db = require('../helper/database')

async function getRoom(request, response){
    const { organizationId } = request.headers

    console.log(organizationId)
}

module.exports = {
    getRoom
}