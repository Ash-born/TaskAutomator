const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { stdout } = require('process');
let { defaultTimeout } = require('config').get('browser')
defaultTimeout = parseInt(defaultTimeout)

const delay = ({ routine = 'delay', ms = defaultTimeout } = {}) => {
    console.log(`util: ${routine} adding custom delay of ${ms} milliseconds`);
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { delay }
