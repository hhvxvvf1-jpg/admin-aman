// Local single-operator AMAN installation. No seeded accounts or sample data.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process');
const repo=process.env.AMAN_LOCAL_REPO||path.join(__dirname,'amanapp');
const appData=process.env.LOCALAPPDATA;
if(!appData||!path.isAbsolute(appData))throw Error('Windows LOCALAPPDATA is not configured.');
const data=path.join(appData,'AMAN-Admin');
fs.mkdirSync(data,{recursive:true,mode:0o700});
const keyFile=path.join(data,'application.key'),dbPath=path.join(data,'aman.db');
function appKey(){
  try{return fs.readFileSync(keyFile,'utf8').trim();}catch(error){if(error.code!=='ENOENT')throw error;}
  if(fs.existsSync(dbPath))throw Error('Existing database has no application.key. Restore the original key; do not generate a replacement.');
  try{fs.writeFileSync(keyFile,crypto.randomBytes(32).toString('hex')+'\n',{flag:'wx',mode:0o600});}
  catch(error){if(error.code!=='EEXIST')throw error;}
  return fs.readFileSync(keyFile,'utf8').trim();
}
const env={...process.env,NODE_ENV:'production',AMAN_DB_PATH:dbPath,AMAN_AUDIO_DIR:path.join(data,'audio'),AMAN_ENCRYPTION_KEY:appKey(),AMAN_BIND_HOST:'127.0.0.1',AMAN_SOCKET_PATH:'',AMAN_TRUST_PROXY:'0',AMAN_SENSITIVE_INTAKE:'0',PORT:'3030'};
if(!/^[a-f0-9]{64}$/.test(env.AMAN_ENCRYPTION_KEY))throw Error('The local AMAN application key is invalid.');
Object.assign(process.env,env);
const action=process.argv[2];
function readInput(){
  const serialized=fs.readFileSync(0,'utf8').trim();
  if(serialized.length>32768)throw Error('Operator input is too long.');
  return JSON.parse(Buffer.from(serialized,'base64').toString('utf8'));
}
function offline(task){
  return new Promise((resolve,reject)=>{
    // Reserve the same port as the local app for the duration of the operation.
    const guard=require('node:net').createServer(socket=>socket.destroy());
    guard.once('error',error=>reject(Error(error.code==='EADDRINUSE'?'Close the running AMAN window and retry. Port 3030 must be free.':error.message)));
    guard.listen({host:env.AMAN_BIND_HOST,port:Number(env.PORT),exclusive:true},()=>{
      try{task();resolve();}catch(error){reject(error);}finally{guard.close();}
    });
  });
}
function snapshot(){
  if(!fs.existsSync(dbPath))throw Error('Initialize the local installation before using the backup tools.');
  const {key,archive,directory}=readInput();
  if(typeof key!=='string'||!/^[a-f0-9]{64}$/i.test(key))throw Error('Enter the independent 64-character hexadecimal backup key.');
  if(typeof archive!=='string'||!path.isAbsolute(archive))throw Error('Enter the full path to the backup file.');
  if(action==='restore'&&(typeof directory!=='string'||!path.isAbsolute(directory)))throw Error('Enter the full path of a new restore directory.');
  const args=action==='backup'?['create','--offline',archive]:['restore',archive,directory];
  const scratch=path.join(data,'backup-work');fs.mkdirSync(scratch,{recursive:true,mode:0o700});
  return offline(()=>{
    const result=spawnSync(process.execPath,[path.join(repo,'scripts','backup.js'),...args],{cwd:repo,env:{...env,AMAN_BACKUP_KEY:key,TMPDIR:scratch,TMP:scratch,TEMP:scratch},stdio:['ignore','inherit','inherit']});
    if(result.status!==0)throw Error(result.error?.message||'The encrypted backup operation did not complete.');
  });
}
if(action==='keygen'){
  console.log(crypto.randomBytes(32).toString('hex'));
}else if(action==='backup'||action==='restore'){
  Promise.resolve().then(snapshot).catch(error=>{console.error(error.message);process.exitCode=1;});
}else{
  const {db}=require(path.join(repo,'src/db/database'));
  const exists=()=>Boolean(db.prepare("SELECT 1 FROM users WHERE role='super_admin' LIMIT 1").get());
  if(action==='check'){process.exitCode=exists()?0:10;db.close();}
  else if(action==='setup'||action==='recover'){
    const input=readInput();
    const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
    if(!/^[^\s@]{1,100}@[^\s@]{1,100}\.[^\s@]{1,40}$/.test(email)||typeof input.password!=='string'||input.password.length<14||input.password.length>128||/[\r\n]/.test(input.password))throw Error('Enter a valid email and a password of 14 to 128 characters.');
    if(action==='recover'&&!db.prepare("SELECT 1 FROM users WHERE email=? AND role='super_admin'").get(email))throw Error('No Local Super Admin with that email.');
    // Serialize first-use setup. The database/key are private to this OS profile.
    const lock=path.join(data,'setup.lock');
    const fd=fs.openSync(lock,'wx',0o600);
    try{
      if(action==='setup'&&exists())throw Error('Setup already completed. Use the recovery launcher if needed.');
      const args=action==='setup'?['create',email,'super_admin','Local Administrator']:[action,email];
      const result=spawnSync(process.execPath,[path.join(repo,'scripts','staff.js'),...args],{cwd:repo,env,input:input.password+'\n',encoding:'utf8',timeout:30000});
      if(result.error)throw Error(result.error.code==='ETIMEDOUT'?'Account setup timed out after 30 seconds.':result.error.message);
      if(result.status!==0)throw Error(result.stderr?.trim()||'Could not configure the local account.');
      process.stdout.write(result.stdout);
    }finally{fs.closeSync(fd);fs.unlinkSync(lock);db.close();}
  }else if(action==='start'){
    if(!exists())throw Error('Create the local account before starting AMAN.');
    db.close();
    const server=spawn(process.execPath,[path.join(repo,'server.js')],{cwd:repo,env,stdio:['ignore','pipe','inherit']});
    let messages='',ready=false;
    server.stdout.on('data',chunk=>{
      process.stdout.write(chunk);messages=(messages+chunk).slice(-4096);
      if(!ready&&messages.includes('URL: http://localhost:3030')){
        ready=true;const url='http://127.0.0.1:3030/admin/';console.log(`Open this address in your browser: ${url}`);
        if(process.platform==='win32'){
          const browser=spawn('explorer.exe',[url],{stdio:'ignore',windowsHide:true});
          browser.on('error',()=>{});browser.unref();
        }
      }
    });
    server.on('error',error=>{console.error(error.message);process.exitCode=1;});
    server.on('exit',code=>{if(!ready)console.error('If port 3030 is occupied, close the earlier AMAN window or other process using it.');process.exitCode=code??1;});
    for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.kill());
  }else throw Error('Use SETUP-START-AMAN.cmd to open AMAN.');
}
