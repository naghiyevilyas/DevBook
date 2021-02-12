const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const { body,validationResult } = require('express-validator')
const axios = require('axios')

// @route       GET /api/profile/me
// @desc        Get current user's profile
// @access      Private
router.get('/me',auth,async (req,res) => {
    try {
        const profile = await Profile.findOne({user:req.user.id}).populate('user',['name'])

        if(!profile){
            return res.status(400).json({msg:'There is no profile for this user'})
        }

        res.json(profile)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

// @route       POST /api/profile
// @desc        Create & Profile 
// @access      Private
router.post('/',[auth,[
    body('status','Please enter valid status').notEmpty(),
    body('skills','Please enter valid skills').notEmpty()
]],async (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    const newProfile = { ...req.body,
                         user:req.user.id,
                         skills:req.body.skills.split(',').map(skill => skill.trim())}

    try {
        const profile = await Profile.findOneAndUpdate({user:req.user.id},
                                                       {$set:newProfile},
                                                       {upsert:true,new:true})
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @route       GET /api/profile
// @desc        Get all profiles
// @access      Public
router.get('/',async (req,res) => {
    try {
        const profiles = await Profile.find().populate('user',['name'])
        res.json(profiles)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @route       GET /api/profile/user/:user_id
// @desc        Get profile by user id
// @access      Public
router.get('/user/:user_id',async (req,res) => {
    try {
        const profile = await Profile.findOne({user:req.params.user_id}).populate('user',['name'])
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @route       DELETE /api/profile
// @desc        Delete Profile,user and post
// @access      Private
router.delete('/',auth,async (req,res) => {
    try {
        await Profile.findOneAndRemove({user:req.user.id})
        await User.findByIdAndRemove(req.user.id)
        res.json({msg:'User was deleted'})
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @route       PUT /api/profile/experience
// @desc        Add profile experience
// @access      Private

router.put('/experience',[auth,[
    body('title','title is required').notEmpty(),
    body('company','company is required').notEmpty(),
    body('from','from is required').notEmpty()
]],async (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    try {
        const profile =await Profile.findOne({user:req.user.id})
        profile.experience.unshift(req.body)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @route       DELETE /api/profile/experience/:exp_id
// @desc        Delete experience 
// @access      Private
router.delete('/experience/:exp_id',auth,async (req,res) => {
    try {
        const profile = await Profile.findOne({user:req.user.id})
        profile.experience = profile.experience.filter(exp => exp._id.toString() !== req.params.exp_id)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @route       PUT /api/profile/education
// @desc        Add education to profile
// @access      Private
router.put('/education',auth,[
    body('school','School is required field').notEmpty(),
    body('degree','Degree is required field').notEmpty(),
    body('fieldofstudy','fieldofstudy is required field').notEmpty(),
    body('from','from is required field').notEmpty()
],async (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    try {
        const profile = await Profile.findOne({user:req.user.id})
        profile.education.unshift(req.body)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @router      DELETE /api/profile/education/:edu_id
// @desc        Delete experience from profile
// @access      Private
router.delete('/education/:edu_id',auth,async (req,res) => {
    try {
        const profile = await Profile.findOne({user:req.user.id})
        profile.education = profile.education.filter(edu => edu._id.toString() !== req.params.edu_id)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @router      GET /api/profile/github/:username
// @desc        Get user's repo from Github
// @access      Public
router.get('/github/:username',async (req,res) => {
    try {
        const headers = {
            'user-agent': 'node.js',
          };
        const resRepo = await axios.get(`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`,{headers})
        res.json(resRepo.data)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

module.exports = router