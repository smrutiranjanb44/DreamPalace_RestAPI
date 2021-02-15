const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const dreamsRoutes = require('./routes/dreams-routes')
const userRoutes = require('./routes/users-routes')

const HttpError = require('./models/http-error')

const app = express()

app.use(bodyParser.json())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    )
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next()
})

app.use('/dreams', dreamsRoutes)
app.use('/users', userRoutes)

app.use((req, res, next) => {
    const error = new HttpError('Could Not Find This Route')
    throw error
})


app.use((error, req, res, next) => {
    if (res.headerSent) {
        return next(error)
    }
    res.status(error.code || 500)
    res.json({ message: error.message || 'An unknown error occured' })
})

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bfyuq.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(process.env.PORT || 5000)
        console.log('Server Started')
    })
    .catch(err => {
        console.log(err)
    })

