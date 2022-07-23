const crypto = require('crypto')
const cryptoJS = require('crypto-js')

function sha256Encryptor(action, value) {
    const Sha256 = cryptoJS.SHA256
    const Hex = cryptoJS.enc.Hex
    const Utf8 = cryptoJS.enc.Utf8
    const Base64 = cryptoJS.enc.Base64
    const AES = cryptoJS.AES

    const secretKey = '4y0v0t3'
    const secretIv = '4y0v0t31v'

    const key = Sha256(secretKey).toString(Hex).substr(0, 32)
    const iv = Sha256(secretIv).toString(Hex).substr(0, 16)

    
    if(action === 'encrypt'){
        const output = AES.encrypt(value, Utf8.parse(key), {
            iv: Utf8.parse(iv)
        }).toString()

        console.log(output)

        const output2ndB64 = Utf8.parse(output).toString(Base64)
        return output2ndB64
    }else{
        const newValue = Base64.parse(value).toString(Utf8)

        console.log(newValue)

        // kWSaRKPdK+SR9b7eFydcEg==
        const decrypted = AES.decrypt(value, Utf8.parse(key), {
            iv: Utf8.parse(iv)
        }).toString(Utf8)

        return decrypted
    }
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