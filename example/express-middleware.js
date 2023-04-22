const express = require('express')
const path = require('path')
const serverStatic = require('../index.js')
let app = express()
app.use(serverStatic(path.resolve(__dirname, 'cache')))
app.listen(80, () => {
    console.log('listening 80 ......')
})