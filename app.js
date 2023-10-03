const express = require('express')
const bodyParser = require('body-parser')
const http = require('http')
const app = express()

const dotenv = require('dotenv').config()

const port = process.env.PORT || 4000
const router = require('./app/helper/router')

const sessions = require('express-session')
const fileupload = require('express-fileupload')
const cookieParser = require('cookie-parser')

const cors = require('cors')
const { initSocket, sendNotification } = require('./app/helper/socket')
const { Server } = require('socket.io')
const oneDay = (1000 * 60 * 60 * 24) * 2
const server = http.createServer(app);

initSocket(server)

app.use(cors({
    origin: '*'
}))

app.use(fileupload())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(cookieParser())

app.use(sessions({
    secret: 'Ps8LHuhF2jQoh3B8NPDcCX7f1UqbTLDd6JpGZcu9R5Y0Ckn5fUFobwH5MVyK',
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))

app.get('/getVote', function(request, response){
    sendNotification(6)
    response.send('sukses')
})

app.use('/api', router)
app.all("*", (request, response) => {
    response.send({ message: "Your url was not found, please make sure you have entered an correct url!" })
})

server.listen(port, () => {
    console.log(`App running on port ${port}`)
})