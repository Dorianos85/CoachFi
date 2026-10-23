'use strict';
// C73 still denies all native outbound connects/fetch. Only literal listen-name
// resolution is synthesized; external DNS remains its durably recorded denial.
const install = require('../../evidence/cycle-73/network-guard.cjs');
install();
const dns = require('node:dns');
dns.lookup = require('./loopback.cjs')(dns.lookup);
require('node:module').syncBuiltinESMExports();
