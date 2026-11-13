const {test}=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..');
async function launch(env={}){const p=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{p.stdout.once('data',resolve);p.once('error',reject)});return p}
async function call(port,p,body){const r=await fetch('http://127.0.0.1:'+port+p,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body&&JSON.stringify(body)});return{status:r.status,data:await r.json()}}
test('local create, publish, apply, download, restart persistence, reset and validation',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jobportal-api-')),port=19321;let proc=await launch({PORT:''+port,DATA_DIR:dir});
 try{assert.equal((await call(port,'/api/jobs')).data.length,3);assert.equal((await call(port,'/api/jobs',{})).status,400);
 const b={title:'Test BA',company:'Synthetic Co',location:'Hyderabad',description:'Synthetic test role',skills:[],responsibilities:[],requirements:[]};
 const job=(await call(port,'/api/jobs',b)).data;assert.equal((await call(port,'/api/jobs')).data.length,3);
 assert.equal((await call(port,`/api/jobs/${job.id}/publish`,{})).status,200);
 assert.equal((await call(port,'/api/jobs')).data.length,4);
 const a={jobId:job.id,name:'Synthetic Test',email:'test@example.com',phone:'0000000000',resumeName:'test.pdf',resumeData:Buffer.from('%PDF-1.4 synthetic').toString('base64')};
 assert.equal((await call(port,'/api/apply',{...a,email:'bad'})).status,400);
 assert.equal((await call(port,'/api/apply',{...a,resumeName:'bad.exe'})).status,400);
 assert.equal((await call(port,'/api/apply',{...a,resumeData:Buffer.alloc(5*1024*1024+1).toString('base64')})).status,400);
 const app=(await call(port,'/api/apply',a)).data;
 assert.equal(await(await fetch(`http://127.0.0.1:${port}/resume/${app.resumeFile}`)).text(),'%PDF-1.4 synthetic');
 proc.kill();await new Promise(r=>proc.once('exit',r));proc=await launch({PORT:''+port,DATA_DIR:dir});
 assert.equal((await call(port,'/api/jobs')).data.length,4);assert.equal((await call(port,'/api/applications')).data.length,1);
 assert.equal((await call(port,'/api/reset',{})).status,200);assert.equal((await call(port,'/api/jobs')).data.length,3);assert.equal((await call(port,'/api/applications')).data.length,0);
 assert.equal((await fetch(`http://127.0.0.1:${port}/resume/${app.resumeFile}`)).status,404);
 }finally{proc.kill();fs.rmSync(dir,{recursive:true,force:true})}
});
test('Vercel refuses unsafe local fallback before any storage writes',async()=>{const p=await launch({PORT:'19322',VERCEL:'1',SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:''});try{assert.equal((await call(19322,'/api/jobs')).status,503)}finally{p.kill()}});
