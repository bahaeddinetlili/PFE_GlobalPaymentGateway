import jwt from 'jsonwebtoken'
import { User } from '../models/user.js'

export const checkCurrentUser = async (req, res, next) => {
    try {
        const header = req.headers.authorization
        if (!header || header === 'undefined') throw new Error('No token')

        const bearer = header.split(' ')

        if (bearer[1] === 'null') throw new Error('No token')

        const decodedToken = jwt.verify(
            bearer[1],
            process.env.TOKENKEY
        )

        const user = await User.findById(decodedToken.user._id, {
            password: false,
        })

        res.locals.currentUser = user

        next()

        return
    } catch (error) {
        res.status(400).send(error.message)
    }
}