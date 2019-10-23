const MongoClient = require('mongodb').MongoClient
const MongoURL = 'mongodb://localhost:27017/healthbeats'


module.exports = function (app) {
    MongoClient.connect(MongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then((connect) => {
            const db = connect.db('healthbeats')
            app.user = db.collection('users')
            console.log("connected")
        })
        .catch((err) => console.error(err))
}
