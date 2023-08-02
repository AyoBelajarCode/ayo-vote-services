const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv').config()

function readHTML(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, html) => {
            if (err) {
                reject(err);
            } else {
                resolve(html);
            }
        });
    });
}

async function sendEmail(token, data) {
    const transporter = nodemailer.createTransport(smtpTransport({
        service: process.env.SMTP_SERVICE,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    }))

    const html = await readHTML(path.join(__dirname, '/../template/email.html'))
    const template = handlebars.compile(html)

    const replacements = {
        name: data.name,
        room: data.room,
        token: token
    }

    const htmlToSend = template(replacements)

    const mailOptions = {
        to: data.email,
        subject: 'Halo AyoVote, disini ingin memberikan token kamu lho..',
        html: htmlToSend
    }

    try {
        const info = await transporter.sendMail(mailOptions)
        console.info('Success to send email!')
    } catch (error) {
        console.error(error)
        throw new Error('Failed to send email!')
    }
}

module.exports = {
    sendEmail
}