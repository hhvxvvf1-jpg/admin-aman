'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const PORT=Number(process.env.PORT)||8080;
const ROOT=__dirname;
const DATA_FILE=path.join(ROOT,'data','admin-state.json');

const MIME={
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.cjs':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.svg':'image/svg+xml',
  '.md':'text/markdown; charset=utf-8',
  '.txt':'text/plain; charset=utf-8'
};

function readState(){
  try{return JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));}
  catch{return {siteControl:null,records:{}};}
}

function writeState(state){
  fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});
  fs.writeFileSync(DATA_FILE,JSON.stringify(state,null,2),'utf8');
}

const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/health'){
    res.writeHead(200,{'Content-Type':'application/json'});
    return res.end(JSON.stringify({ok:true,mode:'local-node'}));
  }
  if(url.pathname==='/api/site-control'){
    if(req.method==='GET'){
      res.writeHead(200,{'Content-Type':'application/json'});
      return res.end(JSON.stringify(readState().siteControl||{}));
    }
    if(req.method==='POST'||req.method==='PUT'){
      let body='';
      req.on('data',c=>{body+=c;if(body.length>1e6)req.destroy();});
      req.on('end',()=>{
        try{
          const state=readState();
          state.siteControl=JSON.parse(body);
          writeState(state);
          res.writeHead(200,{'Content-Type':'application/json'});
          res.end(JSON.stringify({ok:true,siteControl:state.siteControl}));
        }catch{
          res.writeHead(400,{'Content-Type':'application/json'});
          res.end(JSON.stringify({error:'invalid_json'}));
        }
      });
      return;
    }
  }
  const rel=url.pathname==='/'?'index.html':url.pathname.replace(/^\/+/,'');
  const file=path.resolve(ROOT,rel);
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){
    res.writeHead(404,{'Content-Type':'text/plain'});
    return res.end('Not found');
  }
  const ext=path.extname(file);
  res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT,'0.0.0.0',()=>{
  console.log(`AMAN Admin server listening on http://0.0.0.0:${PORT}`);
});
