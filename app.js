'use strict';
const Koa = require('koa')
const Router = require('koa-router')
const BodyParser = require('koa-bodyparser')
const logger = require('koa-logger')
const Bcrypt = require('bcryptjs')
const view = require('koa-view')
const uniqueRandom = require('unique-random')
const ObjectID = require("mongodb").ObjectID
const mongodb = require('mongodb')
const transporter = require('./config/mail')

const random = uniqueRandom(1, 10000)
const app = new Koa()
const router = new Router()
// const db    = require('./server')
require('./config/database')(app)
//view
app.use(view('./views'))

//body parser
app.use(BodyParser())

//logger
app.use(logger())
//mail

var deleteCode = app.use(async (ctx, next) => {
    const user = await ctx.app.user.find().toArray()
    const dateNow = new Date()
    user.forEach((element, index) => {
        const date2 = element.code_created
        const calculate = dateNow - date2
        const diffInMinutes = Math.round(((calculate % 86400000) % 3600000) / 60000)

        if (diffInMinutes > 2) {
            ctx.app.user.updateMany({
                'code_created': date2
            }, {
                $set: {
                    'code': '',
                    'kode': '',
                    'attemps': 1
                }
            })
        }

    });

    await next()
})



router.get('/', async (ctx) => {
    await deleteCode
    return ctx.render('./index')
})

router.get('/user', async (ctx) => {
    ctx.body = await ctx.app.user.find().toArray()
})

router.post('/login', async (ctx, next) => {
    let username = ctx.request.body.name
    let password = ctx.request.body.password
    let kode = random().toString()
    let checkExistingUser = await ctx.app.user.findOne({
        'username': username,
    })

    if (checkExistingUser.block == false) {
        if (checkExistingUser) {
            let checkPassword = Bcrypt.compareSync(password, checkExistingUser.password)
            if (checkPassword === true) {
                await ctx.app.user.updateOne({
                    '_id': ObjectID(checkExistingUser._id)
                }, {
                    $set: {
                        'code': Bcrypt.hashSync(kode),
                        'code_created': new Date(),
                        'kode': kode,
                        'attemps': 1
                    }
                })
                let getUser = await ctx.app.user.findOne({
                    '_id': ObjectID(checkExistingUser._id)
                })

                let mailOptions = {
                    from: '"Example Team" <from@example.com>',
                    to: `${getUser.email}`,
                    // text: 'Hey there, it’s our first message sent with Nodemailer ;)',
                    html: `<b>This is your code: ${kode} . Expired in 2 Minutes</b>`
                }

                await transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error)
                    } else {
                        console.log('Message sent to %s with info : %s, %s', getUser.email, info.messageId, kode);
                    }
                })


                return await ctx.render('./login', { id: getUser._id })
            } else {
                return ctx.render('./index', { msg: 'password is incorrect' })
            }

        } else {
            return ctx.render('./index', { msg: 'We cant find the data, try other username!' })
        }
    } else {
        return ctx.render('./index', { msg: 'Your account is locked, because you have been entered 3 times wrong code!' })
    }
})

router.post('/verify', async (ctx, next) => {
    await deleteCode
    // await next()
    let code = ctx.request.body.name
    let id = ctx.request.body.id
    let timer = 0

    const getCode = await ctx.app.user.findOne({
        '_id': ObjectID(id)
    })

    // let countAttemps = getCode.attemps+1

    if (getCode.code != "") {
        if (Bcrypt.compareSync(code, getCode.code)) {
            if (getCode.attemps == 3) {
                timer = 1
                setTimeout(() => {
                    timer = 0
                    console.log(getCode.attemps + ',' + timer)
                }, 10000)
                return await ctx.render('./login', { id: getCode._id, msg: '2 Attemps,waiting for 10 seconds.' })

            } else {
                await ctx.app.user.updateOne({ '_id': ObjectID(id) }, {
                    $set: {
                        'attemps': 1,
                        'code': "",
                        'kode': ""
                    }
                })
                ctx.body = "You are logged in"
            }

        } else {

            // ctx.body    = 'attemps' + (getCode.attemps)                
            if (getCode.attemps == 3) {
                timer = 1

                await setTimeout(() => {
                    timer = 0
                    console.log(getCode.attemps + ',' + timer)
                    ctx.app.user.updateOne({ '_id': ObjectID(id) }, {
                        $set: {
                            'attemps': mongodb.Int32(getCode.attemps + 1)
                        }
                    })
                }, 10000)
                return await ctx.render('./login', { id: getCode._id, msg: '2 Attemps wrong code,waiting for 10 seconds.' })
                // ctx.body = 'attemps 2, waiting for 10 seconds. status timer: ' + timer

            } else if (getCode.attemps >= 4) {

                await ctx.app.user.updateOne({ '_id': ObjectID(id) }, {
                    $set: {
                        'attemps': mongodb.Int32(getCode.attemps + 1),
                        'block': true
                    }
                })
                return ctx.redirect('/')
            } else {
                await ctx.app.user.updateOne({ '_id': ObjectID(id) }, {
                    $set: {
                        'attemps': mongodb.Int32(getCode.attemps + 1)
                    }
                })

                return ctx.render('./login', { id: getCode._id, msg: `${getCode.attemps} attemps, wrong code` })
            }

        }
    }
    else {
        return ctx.render('./index', { msg: 'Your code expired. please login again to resend the new code' })
    }
})


app.use(router.routes()).use(router.allowedMethods())

app.listen(3000)