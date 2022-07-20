const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')

function readHTML(path, callback){
    fs.readFile(path, {encoding: 'utf-8'}, function(err, html){
        if(err){
            callback(err)
            throw err
        }else{
            callback(null, html)
        }
    })
}

function sendEmail(token, data){
    const transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        auth: {
            user: 'ayovoteapps@gmail.com',
            pass: 'jkvbpzfdgmnkuvrf'
        }
    }))

    readHTML(path.join(__dirname+'/../template/email.html'), function(err, html){
        const template = handlebars.compile(html)

        const replacements = {
            name: data.name,
            room: data.room,
            token: token
        }

        const htmlToSend = template(replacements)

        const mailOptions = {
            to: data.email,
            subject: 'Halo AyoVote disini ingin memberikan token kamu lho..',
            html: htmlToSend
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if(err){
                console.log(err)
                callback(error)
            }
            console.log(`Email sent ${info.response}`)
        })
    })
    
}

module.exports = {
    sendEmail
}