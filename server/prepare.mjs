import {execFileSync} from 'node:child_process';
import {mkdirSync,statSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('./recognize.swift',import.meta.url));
const binary=fileURLToPath(new URL('../.cache/recognize',import.meta.url));
mkdirSync(fileURLToPath(new URL('../.cache',import.meta.url)),{recursive:true});
if(process.platform==='darwin'&&(!existsSync(binary)||statSync(source).mtimeMs>statSync(binary).mtimeMs)){execFileSync('/usr/bin/swiftc',[source,'-o',binary],{stdio:'inherit'});}
