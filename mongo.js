const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose')
const colors = require('colors')

const mongoPath = 'mongodb+srv://admin:admin@filemanagercluster.6n9kybm.mongodb.net/filemanager?retryWrites=true&w=majority'


async function connectDB() {
    try {
        const conn = await mongoose.connect(mongoPath)

        console.log(`Connected with: ${conn.connection.host}`.cyan.underline);
    } catch (err) {
        console.log(colors.bgRed(err));
        process.exit(1)
    }
}

module.exports = connectDB
