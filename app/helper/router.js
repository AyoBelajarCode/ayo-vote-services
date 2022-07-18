const express = require('express')

const auth = require('../controllers/auth')
const room = require('../controllers/room')
const candidate = require('../controllers/candidate')
const participants = require('../controllers/participants')
const voting = require('../controllers/voting')
const option = require('../controllers/option')

const checkSession = require('./sessions')
const router = express.Router()

router.use(function hitlog(request, response, next){
    console.log('Time: ', Date.now())
    next()
})

router.post('/login', auth.checkAuth)

router.use(checkSession)

router.get('/room/:organizationId', room.getRoom)
router.get('/roomDetail/:id', room.getRoomDetail)
router.post('/room', room.insertRoom)
router.put('/room', room.insertRoom)
router.delete('/room/:id', room.deleteRoom)

router.get('/candidate/:roomId', candidate.getCandidate)
router.post('/candidate', candidate.insertCandidate)
router.put('/candidate', candidate.insertCandidate)
router.delete('/candidate/:id', candidate.deleteCandidate)

router.get('/participants/:roomId', participants.getParticipants)
router.post('/participants', participants.insertParticipants)
router.put('/participants', participants.insertParticipants)
router.delete('/participants/:id', participants.deleteParticipants)

router.get('/voting/checktoken/:token', voting.checkToken)
router.get('/voting/position/:roomId', voting.getPosition)
router.get('/voting/:roomId/:positionId', voting.getCandidate)
router.post('/voting', voting.saveVoting)

router.post('/option', option.getCombo)

module.exports = router