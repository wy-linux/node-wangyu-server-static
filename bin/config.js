const options = {
    'port': {
        option: '-p, --port <n>', 
        default: 80,
        usage: 'fs --port 8080',
        description: 'set ServerStatic port'
    },
    'gzip': {
        option: '-g, --gzip <b>',
        default: false,
        usage: 'fs --gzip true', 
        description: 'open ServerStatic gzip'
    },
    'maxAge':{
        option: '-m, --maxAge <n>',
        default: 10,
        usage: 'fs --maxAge 60', 
        description: 'set ServerStatic maxAge'
    },
    'pathRewrite': {
        option: '-pr, --pathRewrite <n>',
        default: 0,
        usage: 'fs --pathRewrite 2', 
        description: 'set ServerStatic pathRewrite'
    },
    'index': {
        option: '-i, --index <s>',
        default: 'index.html',
        usage: 'fs --maxAge index.js', 
        description: 'set ServerStatic index' 
    },
    'rootName': {
        option: '-r, --rootName <s>',
        default: './',
        usage: 'fs --rootName ./', 
        description: 'set ServerStatic rootName'    
    }
}

module.exports = options;