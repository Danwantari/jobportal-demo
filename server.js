// Local Node server and shared Vercel request handler. Synthetic demo data only.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const store=require('./storage'),seedJobs=require('./seed');
const MAX=5*1024*1024, extensions=['.pdf','.doc','.docx'];
const send=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj))};
function body(req){return new Promise((resolve,reject)=>{
 if(req.body!==undefined){if(Buffer.isBuffer(req.body))return parse(req.body.toString());if(typeof req.body==='string')return parse(req.body);return resolve(req.body)}
 const chunks=[];let n=0;req.on('data',c=>{n+=c.length;if(n>8*1024*1024){reject(Object.assign(new Error('Request too large'),{status:413}));}else chunks.push(c)});
 req.on('end',()=>parse(Buffer.concat(chunks).toString()));req.on('error',reject);
 function parse(text){try{resolve(JSON.parse(text||'{}'))}catch{reject(Object.assign(new Error('Invalid JSON'),{status:400}))}}
})}
let initialized;
async function init(){if(!(await store.all('jobs')).length)for(const j of seedJobs())await store.put('jobs',j)}
function authorized(req){
 const password=process.env.DEMO_ACCESS_TOKEN;if(!password)return !process.env.VERCEL;
 const header=req.headers.authorization||'';let pass='';try{const raw=Buffer.from(header.replace(/^Basic /,''),'base64').toString();pass=raw.slice(raw.indexOf(':')+1)}catch{}
 const a=Buffer.from(pass),b=Buffer.from(password);return header.startsWith('Basic ')&&a.length===b.length&&crypto.timingSafeEqual(a,b);
}
async function handler(req,res){
 try{
 if(process.env.VERCEL&&(!store.cloud||!process.env.DEMO_ACCESS_TOKEN))return send(res,503,{error:'Configure Supabase storage and DEMO_ACCESS_TOKEN before using this deployment. Local disk fallback is deliberately disabled on Vercel.'});
 if(!authorized(req)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="JobPortal synthetic demo"'});return res.end('Demo password required')}
 if(!initialized)initialized=init().catch(e=>{initialized=null;throw e});await initialized;
 const u=new URL(req.url,'http://localhost');
 const p=u.searchParams.has('apiPath')?'/api/'+u.searchParams.get('apiPath'):u.searchParams.has('resumePath')?'/resume/'+u.searchParams.get('resumePath'):u.pathname,m=req.method;
 let mm;
 if(p==='/api/config'&&m==='GET')return send(res,200,{storage:store.cloud?'supabase':'local'});
 if(p==='/api/jobs'&&m==='GET')return send(res,200,(await store.all('jobs')).filter(j=>j.status==='published').sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)));
 if(p==='/api/jobs'&&m==='POST'){
 const b=await body(req);if(!b.title||!b.description)return send(res,400,{error:'Title and description are required'});
 const job={...b,id:'job_'+crypto.randomUUID(),status:'draft',source:'HireCloud',createdAt:new Date().toISOString()};await store.put('jobs',job);return send(res,201,job)}
 if((mm=p.match(/^\/api\/jobs\/([\w-]+)\/publish$/))&&m==='POST'){
 const j=(await store.all('jobs')).find(x=>x.id===mm[1]);if(!j)return send(res,404,{error:'Job not found'});j.status='published';j.publishedAt=new Date().toISOString();await store.put('jobs',j);return send(res,200,j)}
 if(p==='/api/upload-url'&&m==='POST'){
 if(!store.cloud)return send(res,400,{error:'Direct upload is used only with Supabase'});
 const b=await body(req);if(typeof b.name!=='string'||!extensions.includes(path.extname(b.name).toLowerCase())||!Number.isFinite(b.size)||b.size<=0||b.size>MAX)return send(res,400,{error:'Resume must be a PDF, DOC or DOCX under 5 MB'});
 const name='app_'+crypto.randomUUID()+'_'+b.name.replace(/[^\w.-]/g,'_');
 await store.put('tickets',{id:name,createdAt:Date.now(),resumeName:b.name});return send(res,200,{path:name,uploadUrl:await store.uploadUrl(name)})}
 if(p==='/api/apply'&&m==='POST'){
 const b=await body(req),job=(await store.all('jobs')).find(x=>x.id===b.jobId&&x.status==='published');
 if(!job)return send(res,404,{error:'This job is no longer open'});
 if(!b.name||!/^\S+@\S+\.\S+$/.test(b.email||'')||!b.phone)return send(res,400,{error:'Name, valid email and phone are required'});
 if(typeof b.resumeName!=='string'||!extensions.includes(path.extname(b.resumeName).toLowerCase()))return send(res,400,{error:'Resume must be PDF, DOC or DOCX'});
 const id='app_'+crypto.randomUUID();let safe,buf;
 if(store.cloud){
 const ticket=(await store.all('tickets')).find(t=>t.id===b.resumeFile&&t.resumeName===b.resumeName&&!t.used&&Date.now()-t.createdAt<2*3600e3);
 if(!ticket)return send(res,400,{error:'Please upload the resume again'});safe=ticket.id;buf=await store.resume(safe);
 if(!buf||!buf.length||buf.length>MAX)return send(res,400,{error:'Uploaded resume is missing or exceeds 5 MB'});
 ticket.used=true;await store.put('tickets',ticket);
 }else{
 if(typeof b.resumeData!=='string'||!b.resumeData.length)return send(res,400,{error:'Please upload your resume'});
 buf=Buffer.from(b.resumeData,'base64');if(!buf.length||buf.length>MAX)return send(res,400,{error:'Resume must be nonempty and under 5 MB'});
 safe=id+'_'+b.resumeName.replace(/[^\w.-]/g,'_');await store.saveResume(safe,buf)}
 const app={id,jobId:job.id,jobTitle:job.title,name:b.name,email:b.email,phone:b.phone,company:b.company||'',experience:b.experience||'',notice:b.notice||'',note:b.note||'',resumeFile:safe,resumeName:b.resumeName,resumeSize:buf.length,appliedAt:new Date().toISOString()};
 await store.put('applications',app);return send(res,201,app)}
 if(p==='/api/applications'&&m==='GET')return send(res,200,(await store.all('applications')).sort((a,b)=>b.appliedAt.localeCompare(a.appliedAt)));
 if(p==='/api/reset'&&m==='POST'){
 const apps=await store.all('applications'),tickets=await store.all('tickets');await store.removeResumes([...new Set([...apps.map(a=>a.resumeFile),...tickets.map(t=>t.id)])]);
 for(const k of ['jobs','applications','tickets'])await store.clear(k);await init();return send(res,200,{ok:true})}
 if((mm=p.match(/^\/resume\/([\w.-]+)$/))&&m==='GET'){
 if(!(await store.all('applications')).some(a=>a.resumeFile===mm[1]))return send(res,404,{error:'Resume not found'});
 if(store.cloud){res.writeHead(302,{Location:await store.downloadUrl(mm[1]),'Cache-Control':'no-store'});return res.end()}
 const buf=await store.resume(mm[1]);if(!buf)return send(res,404,{error:'Resume not found'});
 res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="'+mm[1].replace(/^app_[\w-]+?_/,'')+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(buf)}
 if(m==='GET'&&p==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'public/index.html')))}
 return send(res,404,{error:'Not found'});
 }catch(e){return send(res,e.status||500,{error:e.status?e.message:'Could not complete request. Check server storage configuration.'})}
}
if(require.main===module)http.createServer(handler).listen(process.env.PORT||3000,process.env.HOST||'127.0.0.1',()=>console.log('Demo running at http://localhost:'+(process.env.PORT||3000)));
module.exports=handler;
