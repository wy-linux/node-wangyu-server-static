#! /usr/bin/env node
const ServerStatic = require('../lib')
const http = require('http')
const url = require('url')
const chalk = require('chalk')
const program = require('commander');
const configOptions = require('./config');
const {getIp} = require('./util')
program.name('ServerStatic')
program.usage('[options]')

const examples = []

const defaultMapping = {};
Object.entries(configOptions).forEach(([key,value])=>{
    examples.push(value.usage)
    defaultMapping[key] = value.default;
    program.option(value.option,value.description)
})

program.on('--help',function () {
    console.log('\nExamples:')
    examples.forEach(item=>{
        console.log(`  ${item}`)
    })
})

program.parse(process.argv);
let userArgs = program.opts();

let options = Object.assign(defaultMapping,userArgs)
const server = http.createServer((req, res) => {
    let { pathname } = url.parse(req.url);
    const staticStream = new ServerStatic(req, pathname, options)
    staticStream.pipe(res)
    staticStream.on('error', (err) => {
        console.log(err)
    })
})
const port = options.port
server.listen(port, () => { 
    console.log(chalk.yellow(`Starting up http-server, serving ${chalk.red(options.rootName)}`))
    console.log(chalk.yellow('Available on:'));
    console.log(`http://` + getIp().address + `:${chalk.green(port)}`);
    console.log(`http://127.0.0.1:${chalk.green(port)}`);
});
server.on('error', (err) => {
    if (err.errno === 'EADDRINUSE') {
        server.listen(++this.port)
    }
})