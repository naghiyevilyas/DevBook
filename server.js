const { urlencoded } = require('express')
const express = require('express')
const app = express()
const PORT = process.env.PORT || 5000
require('./config/db')()

app.use(express.json({urlencoded:false}))

app.use('/api/users',require('./routes/api/users'))
app.use('/api/profile',require('./routes/api/profile'))
app.use('/api/posts',require('./routes/api/posts'))
app.use('/api/auth',require('./routes/api/auth'))

app.listen(PORT, () => console.log(`App listening PORT ${PORT}`))