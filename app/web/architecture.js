import '/site-nav.js';
import {profiles,makeGraph,sourceNote} from '/architecture-data.js';

const $=id=>document.getElementById(id);
const icons={'google-drive':'googledrive','google-sheets':'googlesheets',mcp:'modelcontextprotocol'};
const icon=name=>'/architecture-icons/'+(icons[name]||name)+'.svg';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let view='pipeline',mode='target',graph,selected,zoom=1,pan={x:0,y:0},paused=reduced.matches;
let renderer,scene,camera,group,THREE,frame=0,elapsed=0,lastTime=0,resources=[],packets=[],halos=[];
const routes=new Map(),stage=$('graph-stage'),world=$('graph-world');
const navNames={pipeline:'Overview',overview:'System',control:'Control',scout:'Scout',auto:'Auto',ultra:'Ultra',pulse:'Pulse',migration:'Migration'};
let messageTimer;
function announce(message){$('announcement').textContent=message;$('announcement').classList.add('visible');clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('announcement').classList.remove('visible'),4500);}
function picture(name){const img=document.createElement('img');img.src=icon(name);img.alt='';return img;}
function urlFor(key,version=mode){return '/architecture?view='+key+'&mode='+version;}
function readLocation(){const q=new URLSearchParams(location.search);view=Object.hasOwn(profiles,q.get('view'))?q.get('view'):'pipeline';mode=q.get('mode')==='installed'?'installed':'target';}
function navigate(key,version=mode,push=true){view=key;mode=version;if(push)history.pushState(null,'',urlFor(view));render();}

Object.entries(profiles).forEach(([key,p])=>{
  const a=document.createElement('a');a.className='nav-link';a.href=urlFor(key);a.title=p.name;a.append(picture(p.icon),document.createTextNode(navNames[key]));a.dataset.view=key;
  a.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(key);});$('view-nav').append(a);
});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>navigate(view,button.dataset.mode)));
addEventListener('popstate',()=>{readLocation();render();});

function pathFor(e){
  const a=graph.nodes.find(n=>n.id===e.from),b=graph.nodes.find(n=>n.id===e.to);
  const horizontal=Math.abs(b.x-a.x)>Math.abs(b.y-a.y)*.8;
  const sx=a.x+(horizontal?Math.sign(b.x-a.x)*(view==='pipeline'?144:88):0),sy=a.y+(horizontal?0:Math.sign(b.y-a.y)*(a.circle?45:47));
  const tx=b.x-(horizontal?Math.sign(b.x-a.x)*(view==='pipeline'?146:90):0),ty=b.y-(horizontal?0:Math.sign(b.y-a.y)*(b.circle?46:49));
  let points;
  if(e.from==='step-2'&&e.to==='step-3')points=[[a.x,a.y+48],[a.x,350],[b.x,350],[b.x,b.y-49]];
  else if(e.from==='source'&&e.to==='step-4')points=[[sx,sy],[sx+15,sy],[tx-15,ty],[tx,ty]];
  else if(e.kind==='evidence'&&Math.abs(b.x-a.x)>400&&Math.abs(b.y-a.y)>180){
    const gutter=Math.min(690,Math.max(a.y,b.y)+82);points=[[a.x,a.y+48],[a.x,gutter],[b.x,gutter],[b.x,b.y+49]];
  }else if(horizontal){const mid=(sx+tx)/2;points=[[sx,sy],[mid,sy],[mid,ty],[tx,ty]];}
  else{const mid=(sy+ty)/2;points=[[sx,sy],[sx,mid],[tx,mid],[tx,ty]];}
  return {points,d:`M ${points[0].join(' ')} C ${points.slice(1).map(p=>p.join(' ')).join(', ')}`};
}
function render(){
  graph=makeGraph(view,mode);document.querySelector('.explorer').classList.toggle('pipeline-mode',view==='pipeline');selected=view==='pipeline'?'scout':(view==='overview'||view==='migration')?'system':'plugin';
  document.documentElement.style.setProperty('--accent',(view==='pulse'?'#65d4a3':'#ef5562'));document.title=graph.profile.name+' | Sol System Architecture';
  $('view-title').textContent=graph.profile.name;if(view==='pipeline')$('view-title').innerHTML='Four <strong>Agents.</strong> <span>Moving In One Direction.</span>';$('view-caption').textContent=graph.profile.caption;$('view-purpose').textContent=graph.profile.purpose;
  $('version-note').textContent=mode==='target'?'v7 target · cutover gated':'v6 installed contract';$('source-note').textContent=sourceNote;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  document.querySelectorAll('[data-view]').forEach(a=>{a.href=urlFor(a.dataset.view);if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('graph-nodes').replaceChildren();$('lane-labels').replaceChildren();$('node-list').replaceChildren();routes.clear();
  const svg=$('graph-routes');svg.innerHTML='<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="route-head" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>';
  graph.edges.forEach((e,i)=>{const r=pathFor(e);routes.set(i,r);const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',r.d);path.setAttribute('class','route '+e.kind);path.setAttribute('marker-end','url(#arrow)');path.dataset.from=e.from;path.dataset.to=e.to;svg.append(path);});
  graph.lanes.forEach(l=>{const label=document.createElement('span');label.className='lane-label';label.style.left=l.x+'px';label.textContent=l.text;$('lane-labels').append(label);});
  graph.nodes.forEach((n,i)=>{
    const button=document.createElement('button');button.type='button';button.className='graph-node'+(n.circle?' circle':'')+(n.compact?' compact':'');button.style.left=n.x+'px';button.style.top=n.y+'px';button.dataset.node=n.id;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',n.title+'. '+n.type+'. Show explanation.');
    const top=document.createElement('span');top.className='node-top';top.append(picture(n.icon));const number=document.createElement('span');number.className='node-number';number.textContent=n.id.startsWith('step-')?String(Number(n.id.slice(5))+1).padStart(2,'0'):'↗';top.append(number);
    const title=document.createElement('span');title.className='node-title';title.textContent=n.title;const subtitle=document.createElement('span');subtitle.className='node-subtitle';subtitle.textContent=n.subtitle||n.type;
    button.append(top,title,subtitle);button.addEventListener('click',()=>view==='pipeline'?navigate(n.id):select(n.id,true));button.addEventListener('focus',()=>{const b=button.getBoundingClientRect(),s=stage.getBoundingClientRect();if(b.left<s.left||b.right>s.right||b.top<s.top||b.bottom>s.bottom)centerNode(n);});$('graph-nodes').append(button);
    const item=document.createElement('button');item.type='button';item.className='index-item';const labels=document.createElement('span');const b=document.createElement('b');b.textContent=n.title;const s=document.createElement('small');s.textContent=n.type;labels.append(b,s);item.append(picture(n.icon),labels);item.addEventListener('click',()=>{toggleIndex(false);if(view==='pipeline')navigate(n.id);else{select(n.id,true);centerNode(n);}});$('node-list').append(item);
  });
  $('node-count').textContent=graph.nodes.length+' explorable nodes';toggleIndex(false);select(selected);fit();buildScene();
}
function select(id,open=false){
  const n=graph.nodes.find(item=>item.id===id);if(!n)return;selected=id;
  document.querySelectorAll('[data-node]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.node===id)));
  document.querySelectorAll('.route').forEach(p=>p.classList.toggle('connected',p.dataset.from===id||p.dataset.to===id));
  $('inspector-title').textContent=n.title;$('inspector-kind').textContent=n.type;$('inspector-description').textContent=n.description;
  $('inspector-implementation').textContent=n.implementation;$('inspector-evidence').textContent=n.evidence;$('inspector-icon').replaceChildren(picture(n.icon));
  ['inputs','outputs'].forEach(key=>{$('inspector-'+key).replaceChildren(...(n[key]||[]).map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));});
  $('inspector-links').replaceChildren(...(n.links||[]).map(([label,url])=>{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.append(document.createTextNode(label),picture('arrow-up-right'));return a;}));
  const link=$('agent-deep-link');link.hidden=!['scout','auto','ultra','pulse'].includes(id);link.href=urlFor(id);link.onclick=event=>{if(event.metaKey||event.ctrlKey)return;event.preventDefault();navigate(id);};
  $('inspector-body').scrollTop=0;if(open)toggleInspector(true);renderFrame();
}
function toggleInspector(open){$('inspector').classList.toggle('open',open);$('details-toggle').setAttribute('aria-expanded',String(open));if(open&&innerWidth<=900)$('inspector-title').focus({preventScroll:true});}
function toggleIndex(open){$('node-list').hidden=!open;$('node-list-toggle').setAttribute('aria-expanded',String(open));}
$('node-list-toggle').addEventListener('click',()=>toggleIndex($('node-list').hidden));
$('details-toggle').addEventListener('click',()=>toggleInspector(!$('inspector').classList.contains('open')));
$('inspector-close').addEventListener('click',()=>{toggleInspector(false);$('details-toggle').focus();});
$('inspector').addEventListener('keydown',event=>{if(event.key!=='Tab'||innerWidth>900)return;const items=[...$('inspector').querySelectorAll('button,a:not([hidden])')];const first=items[0],last=items.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===$('inspector-title'))){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
addEventListener('keydown',event=>{if(event.key==='Escape'){toggleIndex(false);toggleInspector(false);}if(event.target.closest('input,textarea'))return;if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(zoom*1.18);}if(event.key==='-'){event.preventDefault();setZoom(zoom/1.18);}if(event.key==='0'){event.preventDefault();fit();}});

function transform(){world.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;world.style.setProperty('--zoom',zoom);$('zoom-value').textContent=Math.round(zoom*100)+'%';renderFrame();}
function fit(){const w=stage.clientWidth,h=stage.clientHeight,depth=view==='pipeline'?510:710;zoom=Math.min(1.35,(w-44)/1160,(h-74)/depth);zoom=Math.max(w<650?.65:.48,zoom);pan={x:w<650?20:(w-1160*zoom)/2,y:Math.max(20,(h-depth*zoom)/2-8)-(view==='pipeline'?80*zoom:0)};transform();}
function setZoom(next,x=stage.clientWidth/2,y=stage.clientHeight/2){const old=zoom;zoom=Math.max(.28,Math.min(2,next));pan={x:x-(x-pan.x)*zoom/old,y:y-(y-pan.y)*zoom/old};transform();}
function centerNode(n){if(zoom<.6)zoom=.85;pan={x:stage.clientWidth/2-n.x*zoom,y:stage.clientHeight/2-n.y*zoom};transform();}
$('zoom-in').addEventListener('click',()=>setZoom(zoom*1.2));$('zoom-out').addEventListener('click',()=>setZoom(zoom/1.2));$('fit').addEventListener('click',fit);
let drag=null;
stage.addEventListener('pointerdown',event=>{if(event.target.closest('button,a,.node-index'))return;drag={x:event.clientX,y:event.clientY,pan:{...pan}};stage.setPointerCapture(event.pointerId);stage.classList.add('dragging');});
stage.addEventListener('pointermove',event=>{if(!drag)return;pan={x:drag.pan.x+event.clientX-drag.x,y:drag.pan.y+event.clientY-drag.y};transform();});
function endDrag(){drag=null;stage.classList.remove('dragging');}
stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
stage.addEventListener('wheel',event=>{if(event.target.closest('.node-index'))return;event.preventDefault();const r=stage.getBoundingClientRect();setZoom(zoom*Math.exp(-event.deltaY*.0015),event.clientX-r.left,event.clientY-r.top);},{passive:false});

function motionState(){const b=$('motion');b.setAttribute('aria-pressed',String(paused));b.querySelector('img').src=icon(paused?'play':'pause');b.querySelector('span').textContent=paused?'Resume Motion':'Pause Motion';b.setAttribute('aria-label',paused?'Resume illustrative animation':'Pause illustrative animation');if(paused){cancelAnimationFrame(frame);frame=0;renderFrame();}else startMotion();}
$('motion').addEventListener('click',()=>{paused=!paused;motionState();});reduced.addEventListener('change',e=>{paused=e.matches;motionState();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{announce('Full screen is unavailable in this browser. You can still expand the browser window.');}});
document.addEventListener('fullscreenchange',()=>{const active=Boolean(document.fullscreenElement);$('fullscreen').setAttribute('aria-pressed',String(active));$('fullscreen').querySelector('span').textContent=active?'Exit Full Screen':'Full Screen';});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(!paused)startMotion();});

function remember(resource){resources.push(resource);return resource;}
function buildScene(){
  if(!THREE)return;
  if(group)scene.remove(group);resources.forEach(r=>r.dispose());resources=[];packets=[];halos=[];group=new THREE.Group();scene.add(group);
  const accent=new THREE.Color(view==='pulse'?'#65d4a3':'#ef5562');
  const lineMaterial=remember(new THREE.LineBasicMaterial({color:accent,transparent:true,opacity:.10}));
  graph.edges.forEach((e,i)=>{
    const p=routes.get(i).points.map(([x,y])=>new THREE.Vector3(x,-y,0));const curve=new THREE.CubicBezierCurve3(...p);
    const line=new THREE.Line(remember(new THREE.BufferGeometry().setFromPoints(curve.getPoints(56))),lineMaterial);group.add(line);
    for(let j=0;j<(e.kind==='control'?3:1);j++){
      const geometry=remember(new THREE.SphereGeometry(e.kind==='control'?2.6:1.9,8,6));const material=remember(new THREE.MeshBasicMaterial({color:e.kind==='control'?accent:0x65d4a3,transparent:true,opacity:.9}));
      const dot=new THREE.Mesh(geometry,material);dot.position.z=1;group.add(dot);packets.push({dot,curve,offset:(i*.123+j*.32)%1,speed:e.kind==='control'?.085:.045,point:new THREE.Vector3()});
    }
  });
  graph.nodes.forEach(n=>{
    const ring=new THREE.Mesh(remember(new THREE.RingGeometry(n.circle?30:54,n.circle?32:55,64)),remember(new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.04,side:THREE.DoubleSide})));ring.position.set(n.x,-n.y,0);if(!n.circle)ring.scale.x=1.7;group.add(ring);halos.push({mesh:ring,id:n.id});
  });
  const stars=new Float32Array(140*3);for(let i=0;i<140;i++){stars[i*3]=(i*197.3)%1160;stars[i*3+1]=-((i*83.7)%710);stars[i*3+2]=-.2;}
  const geometry=remember(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.BufferAttribute(stars,3));group.add(new THREE.Points(geometry,remember(new THREE.PointsMaterial({size:1.2,color:accent,transparent:true,opacity:.14,sizeAttenuation:false}))));
  renderFrame();if(!paused)startMotion();
}
function renderFrame(){
  if(!renderer||!group)return;group.position.set(pan.x,-pan.y,0);group.scale.set(zoom,zoom,1);
  packets.forEach(p=>{p.curve.getPoint((elapsed*p.speed+p.offset)%1,p.point);p.dot.position.copy(p.point);p.dot.position.z=1;});
  halos.forEach(h=>{const active=h.id===selected;h.mesh.material.opacity=active?.18+Math.sin(elapsed*1.5)*.05:.025;});renderer.render(scene,camera);
}
function animate(time){frame=0;if(paused||document.hidden)return;if(lastTime)elapsed+=Math.min(.05,(time-lastTime)/1000);lastTime=time;renderFrame();frame=requestAnimationFrame(animate);}
function startMotion(){if(frame||!renderer||document.hidden||paused)return;lastTime=0;frame=requestAnimationFrame(animate);}
function resize(){if(renderer){renderer.setSize(stage.clientWidth,stage.clientHeight,false);camera.right=stage.clientWidth;camera.bottom=-stage.clientHeight;camera.updateProjectionMatrix();}fit();}
new ResizeObserver(resize).observe(stage);
readLocation();render();motionState();
try{
  THREE=await import('/three.js');renderer=new THREE.WebGLRenderer({canvas:$('graph-canvas'),alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0x000000,0);scene=new THREE.Scene();camera=new THREE.OrthographicCamera(0,stage.clientWidth,0,-stage.clientHeight,-20,20);camera.position.z=10;
  $('graph-canvas').addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;$('graph-canvas').style.display='none';});resize();buildScene();
}catch(error){$('graph-canvas').style.display='none';console.info('Architecture uses its accessible diagram fallback because WebGL is unavailable.');}
addEventListener('pagehide',event=>{cancelAnimationFrame(frame);frame=0;if(!event.persisted){resources.forEach(r=>r.dispose());renderer?.dispose();}});
addEventListener('pageshow',event=>{if(event.persisted&&!paused)startMotion();});
