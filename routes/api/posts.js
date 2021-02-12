const express = require('express')
const router = express.Router()
const Post = require('../../models/Post')
const {body,validationResult} = require('express-validator')
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const { json } = require('express')

// @route       POST /api/posts
// @desc        Create a post
// @access      Private
router.post('/',auth,[body('text','Text field can not be empty').notEmpty()],async (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})        
    }

    try {
        const user = await User.findById(req.user.id).select('-password')
        const post = await new Post({
            text:req.body.text,
            user:req.user.id,
            name:user.name
        })
        await post.save()
        res.json(post)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route       GET /api/posts
// @desc        Get all posts
// @access      Public
router.get('/',auth,async (req,res) => {
    try {
        const posts = await Post.find().sort({date:-1})
        res.json(posts)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
})

// @route       GET /api/posts/:post_id
// @desc        Get post by post id
// @access      Private
router.get('/:id',auth,async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
          return res.status(404).json({ msg: 'Post not found' });
        }
    
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
})

// @route       DELETE /api/posts/:post_id
// @desc        Delete post by post id
// @access      Private
router.delete('/:id',auth,async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
          return res.status(404).json({ msg: 'Post not found' });
        }
    
        // Check user
        if (post.user.toString() !== req.user.id) {
          return res.status(401).json({ msg: 'User not authorized' });
        }
    
        await post.remove();
    
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
})

// @route       PUT /api/posts/like/:id
// @desc        Like a post
// @access      Private
router.put('/like/:post_id',auth,async (req,res) => {
    try {
        const post =await Post.findById(req.params.post_id)        
        if(post.likes.some(like => like.user.toString() === req.user.id)){
            return res.status(400).json({msg:'Post already liked'})
        }

        post.likes.unshift({user:req.user.id})
        await post.save()
        res.json(post.likes)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
})
 
// @router      PUT /api/posts/unlike/:post_id
// @desc        Unlike a post
// @access      Private
router.put('/unlike/:post_id',auth,async (req,res) => {
    try {
        const post = await Post.findById(req.params.post_id)

        if(!post.likes.some(like => like.user.toString() === req.user.id)){
            return res.status(400).json({msg:'Post has not been liked yet'})
        }
        post.likes =  post.likes.filter(like => like.user.toString() !== req.user.id)
        await post.save()
        res.json(post.likes)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
}) 

// @router      POST /api/posts/comment/:post_id
// @desc        Comment a post
// @access      Private
router.post('/comment/:post_id',auth,body('text','Text is required').notEmpty(),async (req,res) => {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()})
        }

        const post = await Post.findById(req.params.post_id)
        const user = await User.findById(req.user.id).select('-password')

        const comment = {
            user:req.user.id,
            text:req.body.text,
            name:user.name
        }

        post.comments.unshift(comment)
        await post.save()
        res.json(post.comments)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
})

// @route       DELETE /api/posts/comment/:post_id/:comment_id
// @desc        Delete comment from post
// @access      Private
router.delete('/comment/:post_id/:comment_id',auth,async (req,res) => {
    try {
        const post = await Post.findById(req.params.post_id)

        const comment = post.comments.find(comment => comment.id.toString() === req.params.comment_id)

        if(!comment){
            return res.status(400).json({msg:'Comment not exists'})
        }

        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({msg:'Authorization denied'})
        }

        post.comments = post.comments.filter(comment => comment.id.toString() !== req.params.comment_id)
        await post.save()
        res.json(post.comments)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
})

module.exports = router