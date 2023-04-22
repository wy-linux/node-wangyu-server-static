### Node手写的静态资源服务中间件，更好的部署web资源服务，下发相关静态资源
1. lib目录为ServerStatic的核心库
2. example目录提供了ServerStatic的一些使用示例
3. bin目录为ServerStatic的命令行工具

Using npm:
```javascript
npm install node-wangyu-server-static -g 
```
Once the package is installed, you can import the library using require approach:
```javascript
ServerStatic --port 80 --index index.js --rootName ./

Starting up http-server, serving ./
Available on:
http://192.168.121.36:80
http://127.0.0.1:80
```
###### pathRewrite
在前端History Router时，用户手动刷新页面会向后端发送请求。
+ pathRewrite：1 时，'/'下面无法正常访问的路径都会重定向到'/index.html'
+ pathRewrite：2 时，'/***/'下面无法正常访问的路径都会重定向到'/index.html'
```javascript
 fs.stat(pathJoin, (err, stat) => {
            if(err) {//路径错误没有资源
                //_ispathRewrite开启后强制重写路径
                if(this._pathRewrite && !this._ispathRewrite) {
                    this.pathname = path.join(this._pathRewriteFn(pathname), index)
                    this._ispathRewrite = true //已经重写路径，下一次pipe会直接抛出错误
                    this.pipe(res)
                } else {
                    this._emitError(404, err)
                } 
            } else {
                if(stat.isFile()) {
                    this.send(pathJoin, stat)
                } else {
                    this.pathname = path.join(pathname, index) //重写路径
                    this.pipe(res)
                }        
            }
        })
```

###### Example:
http模块创建服务，new ServerStatic实例后通过pipe方法下发静态资源
```javascript
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
```
express框架创建服务，作为一个下发静态资源的中间件使用
```javascript
const express = require('express')
const path = require('path')
const serverStatic = require('node-wangyu-server-static')
let app = express()

app.use(serverStatic(path.resolve(__dirname, 'cache')))

app.listen(80, () => {
    console.log('listening 80 ......')
})
```