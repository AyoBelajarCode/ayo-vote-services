const { sendNotification, initSocket } = require('./app/helper/socket')
const express = require('express')
const http = require('http')
const app = express()

const server = http.createServer(app);

initSocket(server)

sendNotification(6)