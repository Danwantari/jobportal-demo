// Local static preview only. All demo data is stored in the visitor's browser.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
http.createServer((req,res)=>{
 const p=new URL(req.url,'http://localhost').pathname;
 if(req.method!=='GET'||!['/','/index.html'].includes(p)){res.writeHead(404);return res.end('Not found')}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end(fs.readFileSync(path.join(__dirname,'public/index.html')));
}).listen(process.env.PORT||3000,process.env.HOST||'127.0.0.1',()=>console.log('Open http://localhost:'+(process.env.PORT||3000)));
