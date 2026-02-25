require('ts-node').register({ transpileOnly: true, files: true });
module.exports = require('./knexfile.ts').default;
