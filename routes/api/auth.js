const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const { body,validationResult } = require('express-validator')
const config = require('config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// @route       GET /api/auth
// @desc        Get current user 
// @access      Public
router.get('/',auth,async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json(user)        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')        
    }
})

// @route       POST /api/auth
// @desc        Log in user
// @access      Public
router.post('/',[
    body('email','Please enter valid email').isEmail(),
    body('password','Password is required').exists()
],async (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    const { email,password } = req.body
    try {
        let user = await User.findOne({email})
        if(!user){
            return res.status(404).json({errors:[{msg:'Invalid credentials'}]})
        }

        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(401).json({errors:[{msg:'Invalid credentials'}]})
        }

        const payload = {
            user:{
                id:user.id
            }
        }

        jwt.sign(payload,config.get('jwtSecret'),{expiresIn:'5 days'},(err,token) => {
            if(err) throw err
            res.json(token)
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})


module.exports = router