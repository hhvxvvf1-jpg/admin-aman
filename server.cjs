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
  if(url.pathname.startsWith('/api/admin/')){
    const section=url.pathname.slice('/api/admin/'.length).split('/')[0];
    if(req.method==='GET'){
      const items=readState().records?.[section]||[];
      res.writeHead(200,{'Content-Type':'application/json'});
      return res.end(JSON.stringify({items,offset:0,hasMore:false}));
    }
    if(req.method==='POST'||req.method==='PATCH'||req.method==='DELETE'){
      let body='';
      req.on('data',c=>{body+=c;if(body.length>1e6)req.destroy();});
      req.on('end',()=>{
        try{
          const state=readState();
          state.records=state.records||{};
          state.records[section]=state.records[section]||[];
          const payload=body?JSON.parse(body):{};
          if(req.method==='POST'){
            const item={id:`${section}-${Date.now()}`,...payload,created_at:new Date().toISOString()};
            state.records[section].unshift(item);
            writeState(state);
            res.writeHead(201,{'Content-Type':'application/json'});
            return res.end(JSON.stringify(item));
          }
          if(req.method==='PATCH'){
            const id=url.pathname.split('/')[4];
            const idx=state.records[section].findIndex(r=>r.id===id);
            if(idx===-1){res.writeHead(404);return res.end(JSON.stringify({error:'not_found'}));}
            state.records[section][idx]={...state.records[section][idx],...payload,updated_at:new Date().toISOString()};
            writeState(state);
            res.writeHead(200,{'Content-Type':'application/json'});
            return res.end(JSON.stringify(state.records[section][idx]));
          }
          if(req.method==='DELETE'){
            const id=url.pathname.split('/')[4];
            state.records[section]=state.records[section].filter(r=>r.id!==id);
            writeState(state);
            res.writeHead(200,{'Content-Type':'application/json'});
            return res.end(JSON.stringify({ok:true}));
          }
        }catch{
          res.writeHead(400,{'Content-Type':'application/json'});
          res.end(JSON.stringify({error:'invalid_request'}));
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
