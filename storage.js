const fs=require('node:fs'),path=require('node:path');
const root=process.env.DATA_DIR||__dirname;
const cloud=!!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
const bucket=process.env.SUPABASE_RESUME_BUCKET||'jobportal-resumes';
const base=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const headers=()=>({apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY});
const localDir=path.join(root,'data'),uploadDir=path.join(root,'uploads');
if(!cloud&&!process.env.VERCEL){fs.mkdirSync(localDir,{recursive:true});fs.mkdirSync(uploadDir,{recursive:true})}
async function rest(url,options={}){
 const r=await fetch(base+url,{...options,headers:{...headers(),...options.headers}});
 if(!r.ok)throw new Error('Storage request failed ('+r.status+'). Check the database and private bucket setup.');
 const text=await r.text();return text?JSON.parse(text):null;
}
async function all(kind){
 if(cloud)return (await rest('/rest/v1/jobportal_records?kind=eq.'+kind+'&select=payload')).map(x=>x.payload);
 const f=path.join(localDir,kind+'.json');return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):[];
}
async function put(kind,item){
 if(cloud)return rest('/rest/v1/jobportal_records?on_conflict=kind,id',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({kind,id:item.id,payload:item})});
 const rows=await all(kind),i=rows.findIndex(x=>x.id===item.id);if(i<0)rows.push(item);else rows[i]=item;
 const f=path.join(localDir,kind+'.json');fs.writeFileSync(f+'.tmp',JSON.stringify(rows,null,2));fs.renameSync(f+'.tmp',f);
}
async function clear(kind){
 if(cloud)return rest('/rest/v1/jobportal_records?kind=eq.'+kind,{method:'DELETE'});
 fs.writeFileSync(path.join(localDir,kind+'.json'),'[]');
}
async function saveResume(name,buf){fs.writeFileSync(path.join(uploadDir,name),buf)}
async function resume(name){
 if(!cloud)return fs.existsSync(path.join(uploadDir,name))?fs.readFileSync(path.join(uploadDir,name)):null;
 const r=await fetch(base+'/storage/v1/object/authenticated/'+bucket+'/'+encodeURIComponent(name),{headers:headers()});
 if(r.status===404||r.status===400)return null;if(!r.ok)throw new Error('Could not read resume');return Buffer.from(await r.arrayBuffer());
}
async function uploadUrl(name){
 const d=await rest('/storage/v1/object/upload/sign/'+bucket+'/'+encodeURIComponent(name),{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 return base+'/storage/v1'+d.url;
}
async function downloadUrl(name){
 const d=await rest('/storage/v1/object/sign/'+bucket+'/'+encodeURIComponent(name),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:60})});
 return base+'/storage/v1'+d.signedURL+'&download='+encodeURIComponent(name.replace(/^app_[\w-]+?_/ ,''));
}
async function removeResumes(names){
 if(cloud){if(names.length)await rest('/storage/v1/object/'+bucket,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:names})});}
 else for(const n of fs.readdirSync(uploadDir))fs.unlinkSync(path.join(uploadDir,n));
}
module.exports={cloud,all,put,clear,saveResume,resume,uploadUrl,downloadUrl,removeResumes};
