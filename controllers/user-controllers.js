const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')

const User = require('../models/user')


/* Retrives All Users */
//-----------------------------------


const getUsers = async (req, res, next) => {

    let users
    try {
        users = await User.find({}, '-password')
    } catch (err) {
        const error = new HttpError(
            'Fetching users failed, please try again later',
            500
        )
        return next(error)
    }
    res.json({ users: users.map(user => user.toObject({ getters: true })) })
}



/* User Sign Up Process */
//-----------------------------------


const signup = async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors)
        return next(new HttpError('Invalid Inputs, please check your data', 422))
    }

    const { name, email, password } = req.body

    let existingUser
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError(
            'Signing up Failed, please try again later',
            500
        )
        return next(error)
    }

    if (existingUser) {
        const error = new HttpError(
            'User exists already, please login instead',
            422
        )
        return next(error)
    }

    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch (err) {
        const error = new HttpError(
            'Could not create user, please try again',
            500
        )
        return next(error)
    }

    const createdUser = new User({
        name,
        email,
        password: hashedPassword,
        image: 'http://images.unsplash.com/photo-1517519902248-8b2b71ef7da3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MXwxMjA3fDB8MXxhbGx8fHx8fHx8fA&ixlib=rb-1.2.1&q=80&w=1080',
        dreams: []
    })

    try {
        await createdUser.save()
    } catch (err) {
        const error = new HttpError(
            'Signing up Failed,Please try again',
            500
        )
        return next(error)
    }

    let token
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    } catch (err) {
        const error = new HttpError(
            'Signing up Failed,Please try again',
            500
        )
        return next(error)
    }

    res.json({
        userId: createdUser.id,
        email: createdUser.email,
        token: token
    })
}


/* User Log In Process */
//-----------------------------------



const login = async (req, res, next) => {

    const { email, password } = req.body

    let existingUser
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError(
            'Logging in Failed, please try again later',
            500
        )
        return next(error)
    }


    if (!existingUser) {
        const error = new HttpError(
            'Invalid credentials, Could not log you in',
            401
        )
        return next(error)
    }

    let isValidPassword = false
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        const error = new HttpError(
            'Could not log you in , please check our credentials and try again'
        )
        return next(error)
    }

    if (!isValidPassword) {
        const error = new HttpError(
            'Invalid credentials, Could not log you in',
            401
        )
        return next(error)
    }


    let token
    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    } catch (err) {
        const error = new HttpError(
            'Logging in failed,Please try again',
            500
        )
        return next(error)
    }

    res.json({
        userId: existingUser.id,
        email: existingUser.email,
        token: token
    })
}


exports.getUsers = getUsers
exports.signup = signup
exports.login = login
