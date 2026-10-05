import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const allowed=new Set(['index.html','styles.css','app.js','core.js','icon.svg']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!allowed.has(name)){res.writeHead(404);res.end('Not found');return;}const data=await readFile(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(500);res.end('Unable to load file');}}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Coffee Together: http://127.0.0.1:4173'));
