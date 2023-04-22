const fs = require('fs')
const EventEmitter = require('events')
const path = require('path')
const mime = require('mime')
const zlib = require('zlib')
const compressible = require('compressible')

const pathRewriteOneLevel = 1
const pathRewriteTwoLevel = 2

class ServerStatic extends EventEmitter {

    constructor(req, pathname, options) {
        super()
        this.req = req
        this.res = null
        this.pathname = pathname
        this.rootName = path.resolve(options.rootName) || __dirname
        this._gzip = options.gzip || false
        this._index = options.index || 'index.html'
        this._cacheControl = options.cacheControl ?? true
        this._lastModified = options.lastModified ?? true
        this._etag = options.etag ?? true
        this._maxAge = Number(options.maxAge) ?? 10
        this._pathRewrite = Number(options.pathRewrite) || false
        this._ispathRewrite = false //限制路径只会重写一次
    }

    _pathRewriteFn(pathname) {
        switch(this._pathRewrite) {
            case(pathRewriteOneLevel) : {
                pathname = '/'
            }
            case(pathRewriteTwoLevel) : {
                pathname = pathname.split('/')[1]
            }
        }
        return pathname
    }

    _emitError(status, err) {
        this.emit('error', {
            status,
            err
        })
    }

    _setCacheHeader(pathJoin, stat) {
        const res = this.res
        this.emit('headers', res, pathJoin, stat)
        if (this._cacheControl && !res.getHeader('Cache-Control')) {
            const cacheControl = 'public, max-age=' + this._maxAge
            res.setHeader('Cache-Control', cacheControl)
            res.setHeader('Expires', new Date(Date.now() + 10 * this._maxAge).toGMTString());
        }
        if (this._lastModified && !res.getHeader('Last-Modified')) {
            const modified = this.modified = stat.mtime.toGMTString()
            res.setHeader('Last-Modified', modified)
        }
        if (this._etag && !res.getHeader('ETag')) {
            const mtime = stat.mtime.getTime().toString(16)
            const size = stat.size.toString(16)
            const etag = this.etag = size + '-' + mtime 
            res.setHeader('ETag', etag)
        }
    }

    _cacheModifiedCheck() {
        const req = this.req
        const ifModifiedSince = req.headers['if-modified-since'];
        const ifNoneMatch = req.headers['if-none-match'];
        if(ifModifiedSince === this.modified && ifNoneMatch === this.etag) {
           return true
        } 
        return false
    }

    _rangeReqOptions(stat) {
        const req = this.req
        const res = this.res
        let start = 0
        let end = stat.size - 1
        const rangeHeader = req.headers.range;
        if(rangeHeader) {
            const rangeArray = rangeHeader.replace('bytes=', '').split('-');
            start = rangeArray[0] ? Number(rangeArray[0]) : start
            end = rangeArray[1] ? Number(rangeArray[1]) : end
            res.statusCode = 206
            res.setHeader('Accept-Ranges', 'bytes')
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
            res.setHeader('Content-Length', `${end - start + 1}`)
        } else {
            res.setHeader('Content-Length', `${stat.size}`)
        }
        return {
            start,
            end
        }
    }

    _shouldCompress(pathJoin) {
        const contentType = mime.getType(pathJoin)
        if (!compressible(contentType)) {
          return false
        }
        return true
    }

    _compressFile(pathJoin) { //创建Gzip压缩流
        const req = this.req
        const res = this.res
        const encodings = req.headers['accept-encoding'];
        if (this._gzip && this._shouldCompress(pathJoin) && encodings) { // 浏览器支持压缩
            if (encodings.includes('gzip')) {
                res.setHeader('Content-Encoding','gzip'); // 浏览器要知道服务器的压缩类型
                return zlib.createGzip();
            } else if (encodings.includes('deflate')) {
                res.setHeader('Content-Encoding','deflate');
                return zlib.createDeflate();
            }
        }
        return false; // 浏览器不支持压缩
    }

    pipe(res) {
        this.res = res
        const rootName = this.rootName
        let pathname = this.pathname
        const index = this._index
        const pathJoin = path.join(rootName, pathname)
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
    }

    send(pathJoin, stat) {
        const res = this.res
        this._setCacheHeader(pathJoin, stat)
        if(this._cacheModifiedCheck()) { //如果文件没有发生改变，直接走强缓存
             res.statusCode = 304
             return  res.end() 
        } 
        const options = this._rangeReqOptions(stat) //处理范围请求
        if(options.start > stat.size || options.end > stat.end) {
            res.statusCode = 416
            return res.end()
        }
        res.setHeader('Content-Type', mime.getType(pathJoin) + ';charset=utf-8');
        this.sendFile(pathJoin, options)
    }

    sendFile(pathJoin, options) {
        const res = this.res
        let readStream
        const compressStream = this._compressFile(pathJoin)
        if(compressStream) { //如果压缩流存在，开启压缩
            readStream = fs.createReadStream(pathJoin, options)
            readStream.pipe(compressStream).pipe(res)
        } else {
            readStream  = fs.createReadStream(pathJoin, options)
            readStream.pipe(res)
        }
        readStream.on('error', (err) => {
            readStream.destroy()
            this._emitError(500, err)
        })
    }
} 

module.exports = ServerStatic