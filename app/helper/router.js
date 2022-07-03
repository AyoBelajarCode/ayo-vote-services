const express = require('express')

const auth = require('../controllers/auth')
const room = require('../controllers/room')

const checkSession = require('./sessions')
const router = express.Router()

router.use(function hitlog(request, response, next){
    console.log('Time: ', Date.now())
    next()
})

router.post('/login', auth.checkAuth)

router.use(checkSession)
router.get('/room/:organizationId', room.getRoom)
router.post('/room', room.insertRoom)

module.exports = router