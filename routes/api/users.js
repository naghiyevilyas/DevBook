const express = require('express')
const router = express.Router()
const { body,validationResult } = require('express-validator')
const User = require('../../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('config')

// @route       POST /api/users
// @desc        Register User
// @access      Public
router.post('/',[
    body('name','Please enter valid name').notEmpty(),
    body('email','Please enter valid email').isEmail(),
    body('password','Password must be at least 6 charachters long').isLength({min:6})
],async (req,res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    const { name,email,password } = req.body
    
    try {
        let user = await User.findOne({email})

        if(user){
            return res.status(400).json({errors:[{msg:'User already exists'}]})
        }

        user = new User({
            name,
            email,
            password
        })

        user.password = await bcrypt.hash(password,10)

        await user.save()

        const payload = {
            user:{
                id : user.id
            }
        }

        jwt.sign(payload,config.get("jwtSecret"),{expiresIn:36000},(err,token) => {
            if(err) throw err
            res.json(token)
        })    
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

module.exports = router