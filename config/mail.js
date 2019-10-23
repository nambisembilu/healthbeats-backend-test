
const nodemailer = require('nodemailer')
module.exports= nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    // secure: true,
    auth: {
        user: 'c3d69ef9ea9cae',
        pass: '1b20d8e0b1ee92'
    }
})