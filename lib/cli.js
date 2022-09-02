#!/usr/bin/env node

/**
 * External dependencies
 */
const program = require('commander');
// import {program} from 'commander';

/**
 * Internal dependencies
 */
const { version } = require('../package.json');
// import pkg from '../package.json' assert { type: 'json' };


program.usage('<command>');

program.version(version);
// program.version(pkg.version);

const programs = [
    './gutenberg',
    './env',
    './test',
]

programs.map(async(p) => {
  //import `${p}`;
  require(`${p}`)
})

program.parse(process.argv)