const MongoClient = require('mongodb').MongoClient
const MongoURL = 'mongodb://localhost:27017/backend'


module.exports = function (app) {
    MongoClient.connect(MongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then((connect) => {
            const db = connect.db('backend')
            app.user = db.collection('user')
            console.log("connected")
        })
        .catch((err) => console.error(err))
}
