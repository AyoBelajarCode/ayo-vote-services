const crypto = require('crypto')
const cryptoJS = require('crypto-js')

function sha256Encryptor(action, value) {
    const secretKey = "This is my secret key"
    const secretIv = "This is my secret iv"

    const key = cryptoJS.SHA256(secretKey).toString()
    const iv = cryptoJS.SHA256(secretIv).toString()
    let outputRaw, output

    if (action === 'encrypt') {
        outputRaw = cryptoJS.AES.encrypt(value, cryptoJS.enc.Utf8.parse(key), { iv: cryptoJS.enc.Utf8.parse(iv) })
        output = cryptoJS.enc.Base64.stringify(outputRaw.ciphertext)
    } else {
        outputRaw = cryptoJS.AES.decrypt(cryptoJS.enc.Base64.parse(value), cryptoJS.enc.Utf8.parse(key), { iv: cryptoJS.enc.Utf8.parse(iv) })
        output = cryptoJS.enc.Base64.parse(outputRaw)
    }

    return output
}

function sha256Generator(action, value) {
    // const secretKey = "This is my secret key"

    if (action === 'encrypt') {
        return crypto.createHash('sha256').update(value).digest('hex')
    }
}

module.exports = {
    sha256Encryptor,
    sha256Generator
}