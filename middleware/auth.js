const config = require('config')
const jwt = require('jsonwebtoken')

const auth = (req,res,next) => {
    const token = req.header('x-auth-token')
    
    if(!token){
        return res.status(401).json({msg:'No token,authorization denied'})
    }
    
    try {
        const verifiedUser = jwt.verify(token,config.get('jwtSecret'))
        req.user = verifiedUser.user
        next()
    } catch (err) {
        return res.status(401).json({msg:'No token,authorization denied'})
    }
}

module.exports = auth