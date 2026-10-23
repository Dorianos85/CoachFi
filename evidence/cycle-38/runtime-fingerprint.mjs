import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function fingerprintRuntime(root,expectedVersion){
 const modules=fs.realpathSync(path.join(root,'node_modules')),target=fs.realpathSync(path.join(root,'node_modules/postcss-selector-parser'));
 assert(target.startsWith(modules+path.sep)); const pkg=JSON.parse(fs.readFileSync(path.join(target,'package.json'),'utf8'));
 assert.equal(pkg.version,expectedVersion);const lockPath=path.join(root,'package-lock.json'),lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));
 assert.equal(lock.packages['node_modules/postcss-selector-parser'].version,expectedVersion);
 const files=[];function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);assert(!e.isSymbolicLink());if(e.isDirectory())visit(p);else if(e.isFile())files.push({path:path.relative(target,p).split(path.sep).join('/'),sha256:hash(p)});}}visit(target);
 const consumers=['tailwindcss','postcss-nested'].map(name=>{const p=path.join(root,'node_modules',name,'package.json'),json=JSON.parse(fs.readFileSync(p,'utf8')),req=createRequire(p),entry=fs.realpathSync(req.resolve('postcss-selector-parser'));assert(entry.startsWith(target+path.sep));return{name,version:json.version,range:json.dependencies['postcss-selector-parser'],packageSHA256:hash(p),parserVersion:pkg.version,parserEntry:path.relative(modules,entry).split(path.sep).join('/'),entrySHA256:hash(entry)};});
 return{parserVersion:pkg.version,lockSHA256:hash(lockPath),files,consumers};
}
