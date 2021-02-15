const express = require('express')
const { check } = require('express-validator')

const dreamsControllers = require('../controllers/dream-controllers')
const checkAuth = require('../middleware/check-auth')

const router = express.Router()


router.get('/:did', dreamsControllers.getDreamById)

router.get('/user/:uid', dreamsControllers.getDreamsByUserId)

router.use(checkAuth)

router.post(
    '/',
    [
        check("title").not().isEmpty(),
        check('description').isLength({ min: 5 })
    ],
    dreamsControllers.createDream
)

router.patch(
    '/:did',
    [
        check("title").not().isEmpty(),
        check('description').isLength({ min: 5 })
    ],
    dreamsControllers.updateDream
)

router.delete('/:did', dreamsControllers.deleteDream)

module.exports = router