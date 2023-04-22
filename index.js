const ServerStatic = require('./lib')
const url = require('url')
function serverStatic(rootName, options = {}) {
    if (!rootName) {
        throw new TypeError('rootName path required')
    }  
    if (typeof rootName !== 'string') {
      throw new TypeError('rootName path must be a string')
    }
    options.rootName = rootName
    const setHeaders = options.setHeaders
    if (setHeaders && typeof setHeaders !== 'function') {
      throw new TypeError('option setHeaders must be function')
    }
    return function serverStatic (req, res, next){
        let { pathname } = url.parse(req.url)
        const staticStream = new ServerStatic(req, pathname, options)
        if (setHeaders) {
            stream.on('headers', setHeaders)
        }
        staticStream.pipe(res)
        staticStream.on('error', (err) => {
            next()
        })
    }
}
module.exports = serverStatic