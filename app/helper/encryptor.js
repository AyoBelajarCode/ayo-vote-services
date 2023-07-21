const crypto = require('crypto')

function sha256Encryptor(action, value) {
    const key = Buffer.from(crypto.createHash('sha256').update('4y0v0t3k3y').digest('hex'), 'hex') // Kunci dengan panjang 32 byte (256 bit)
    const iv = Buffer.from(crypto.createHash('md5').update('4y0v0t31v').digest('hex'), 'hex')

    if (action === 'encrypt') {
        let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted
    } else {
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(value, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted
    }
}

function sha256Generator(value) {
    return crypto.createHash('sha256').update(value).digest('hex')
}

module.exports = {
    sha256Encryptor,
    sha256Generator
}