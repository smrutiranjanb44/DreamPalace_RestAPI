const mongoose = require('mongoose')
const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error')

const Dream = require('../models/dream')
const User = require('../models/user')



/* Retrives a Dream By it's Id*/
//--------------------------------------------------


const getDreamById = async (req, res, next) => {

    const dreamId = req.params.did
    let dream
    try {
        dream = await Dream.findById(dreamId)
    } catch (err) {
        const error = new HttpError(
            'Something Went Wrong, Could not find a Dreaam',
            500
        )
        return next(error)
    }

    if (!dream) {
        const error = new HttpError(
            'Could not find a dream for the provided id',
            404
        )
        return next(error)
    }

    res.json({ dream: dream.toObject({ getters: true }) })
}



/* Retrives All Dreams Of a Specific Userid*/
//--------------------------------------------------


const getDreamsByUserId = async (req, res, next) => {

    const userId = req.params.uid
    //let dreams
    let userWithDreams
    try {
        userWithDreams = await User.findById(userId).populate('dreams')
        // dreams = await Dream.find({ creator: userId })
    } catch (err) {
        const error = new HttpError(
            'Fetching Places failed, please try again later',
            500
        )
        return next(error)
    }

    if (!userWithDreams || userWithDreams.dreams.length === 0) {
        return next(new HttpError('Could not find a dream for the provided user id', 404))
    }

    res.json({ dreams: userWithDreams.dreams.map(dream => dream.toObject({ getters: true })) })
}



/* Create Dream and Merge With Creater Id*/
//--------------------------------------------------


const createDream = async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors)
        throw new HttpError('Invalid Inputs, please check your data', 422)
    }

    const { title, description } = req.body

    const createdDream = new Dream({
        title,
        description,
        image: 'https://cdn.mos.cms.futurecdn.net/aymFyPP7sSKEXJpqtfDs4R.jpg',
        creator: req.userData.userId
    })

    let user
    try {
        user = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError(
            'Creating dream failed,please try again',
            500
        )
        return next(error)
    }


    if (!user) {
        const error = new HttpError(
            'Could not find user for provided id',
            500
        )
        return next(error)
    }
    console.log(user)

    try {
        const sess = await mongoose.startSession()
        sess.startTransaction()
        await createdDream.save({ session: sess })
        user.dreams.push(createdDream)
        await user.save({ session: sess })
        await sess.commitTransaction()
    } catch (err) {
        const error = new HttpError(
            'Creating Dream Failed,Please try again',
            500
        )
        return next(error)
    }

    res.status(201).json({ createdDream })
}


/* Updates a Specific Dream*/
//--------------------------------------------------


const updateDream = async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors)
        throw new HttpError('Invalid Inputs, please check your data', 422)
    }

    const { title, description } = req.body
    const dreamId = req.params.did

    let dream
    try {
        dream = await Dream.findById(dreamId)
    } catch (err) {
        const error = new HttpError(
            'Something Went wrong ,could not update place',
            500
        )
        return next(error)
    }

    if (dream.creator.toString() !== req.userData.userId) {
        const error = new HttpError(
            'You are not allowed to edit this place',
            401
        )
        return next(error)
    }

    dream.title = title
    dream.description = description

    try {
        await dream.save()
    } catch (err) {
        const error = new HttpError(
            'Something Went wrong ,could not update place',
            500
        )
        return next(error)
    }

    res.status(200).json({ dream: dream.toObject({ getters: true }) })
}


/* Delete Dream From dreams Collection and also From dreams properties of users Collection  */
//--------------------------------------------------


const deleteDream = async (req, res, next) => {

    const dreamId = req.params.did
    let dream
    try {
        dream = await Dream.findById(dreamId).populate('creator')
    } catch (err) {
        const error = new HttpError(
            'Something Went wrong ,could not delete place',
            500
        )
        return next(error)
    }

    if (!dream) {
        const error = new HttpError(
            'Could not find dream for provided id',
            500
        )
        return next(error)
    }

    if (dream.creator.id !== req.userData.userId) {
        const error = new HttpError(
            'You are not allowed to edit this place',
            401
        )
        return next(error)
    }


    try {
        const sess = await mongoose.startSession()
        sess.startTransaction()
        await dream.remove({ session: sess })
        dream.creator.dreams.pull(dream)
        await dream.creator.save({ session: sess })
        await sess.commitTransaction()
    } catch (err) {
        const error = new HttpError(
            'Something Went wrong ,could not update place',
            500
        )
        return next(error)
    }
    res.status(200).json({ message: 'Deleted Place' })
}


// Exports

exports.getDreamById = getDreamById
exports.getDreamsByUserId = getDreamsByUserId
exports.createDream = createDream
exports.updateDream = updateDream
exports.deleteDream = deleteDream