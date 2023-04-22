const SeverStatic = require('../lib')
const url = require('url')
const http = require('http')
const server = http.createServer((req, res) => {
    let { pathname } = url.parse(req.url); 
    const serverStatic = new SeverStatic(req, pathname, {
        rootName: __dirname, //静态资源根路径
        // index: 'index.js', //访问'/'路径时定向的文件，默认为index.html
        // maxAge: 60, //强缓存cacheControl的时间，默认为10s

        //2级根路径重写，默认重定向到重写根路径下index.html，用于History Router下用户刷新页面后重定向到index.html
        // pathRewrite: 2, 
        
        // gzip: true //开启Gzip压缩，默认不开启
    })
    serverStatic.pipe(res)
    serverStatic.on('error', (err) => {
        console.log(err)
    })
})
server.listen(80, () => {
    console.log('listening 80 ......')
})