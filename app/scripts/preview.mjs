import http from 'node:http';
import worker from '../dist/server/index.js';
// Local preview uses the same route and authentication boundaries as the Worker.
const server=http.createServer(async(req,res)=>{
  const request=new Request('http://127.0.0.1:4173'+req.url,{method:req.method,headers:req.headers});
  const response=await worker.fetch(request,{});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
});
server.listen(4173,'127.0.0.1',()=>console.log('Quasar dashboard preview: http://127.0.0.1:4173/'));
