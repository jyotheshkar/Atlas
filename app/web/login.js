import {mountSiteNav} from '/site-nav.js';
(() => {
  'use strict';
  const form = document.getElementById('login-form');
  const error = document.getElementById('login-error');
  const button = document.getElementById('enter-button');
  const reveal = document.getElementById('reveal');
  const stage = document.getElementById('orbit-stage');
  const canvas = document.getElementById('orb');
  const lifecycle = new AbortController();
  let unlocked = false;
  let selectVisual = () => {};
  let disposeVisual = () => {};
  let updateVisualMotion = () => {};
  let motionPaused = false;
  document.getElementById('motion-toggle').addEventListener('click',event=>{
    motionPaused=!motionPaused;event.currentTarget.textContent=motionPaused?'Resume Motion':'Pause Motion';event.currentTarget.setAttribute('aria-pressed',String(motionPaused));document.body.dataset.motion=motionPaused?'paused':'playing';updateVisualMotion();
  },{signal:lifecycle.signal});
  const fullscreenToggle=document.getElementById('fullscreen-toggle');
  const updateFullscreenToggle=()=>{
    const active=Boolean(document.fullscreenElement);
    fullscreenToggle.querySelector('span').textContent=active?'Exit Full Screen':'Full Screen';
    fullscreenToggle.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');
    fullscreenToggle.setAttribute('aria-pressed',String(active));
  };
  fullscreenToggle.addEventListener('click',async()=>{
    try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { fullscreenToggle.setAttribute('title','Full screen is not available in this browser.'); }
  },{signal:lifecycle.signal});
  document.addEventListener('fullscreenchange',updateFullscreenToggle,{signal:lifecycle.signal});
  updateFullscreenToggle();
  const components = {
    scout: {index: '01 / Scout', title: 'Start With A Better Signal.', copy: 'Finds Opportunities, Checks Role Fit And Sponsorship Evidence, Then Routes Candidates To The Right Workflow.'},
    auto: {index: '02 / Auto', title: 'Make Every Introduction Relevant.', copy: 'Prepares Outreach For The Exact Role, With The Right Materials. Employer Sends Happen Only When Authorised.'},
    ultra: {index: '03 / Ultra', title: 'Arrive Prepared. Stay In Control.', copy: 'Builds Manual-Application Packs With Tailored Materials And Answers. You Review The Pack And Control Submission.'},
    pulse: {index: '04 / Pulse', title: 'See What The Evidence Supports.', copy: 'Brings Campaign Outcomes And Operational Evidence Into One View, With Clear Boundaries Between Prepared, Sent And Verified.'}
  };
  let selected = 'scout';

  function selectComponent(key) {
    if (!components[key] || unlocked) return;
    selected = key;
    document.querySelectorAll('[data-component]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.component === key)));
    const detail = components[key];
    document.getElementById('component-index').textContent = detail.index;
    document.getElementById('component-title').textContent = detail.title;
    document.getElementById('component-copy').textContent = detail.copy;
    stage.dataset.mode = key;
    selectVisual(Object.keys(components).indexOf(key));
  }
  document.querySelectorAll('[data-component]').forEach(node => node.addEventListener('click', () => selectComponent(node.dataset.component), {signal:lifecycle.signal}));
  document.querySelector('.lp-component-controls').addEventListener('keydown', event => {
    const keys = Object.keys(components);
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const current = keys.indexOf(event.target.dataset.component);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (current + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : 3)) % 4;
    const target = document.querySelector(`.lp-orbit-node[data-component="${keys[next]}"]`);
    target.focus();
    selectComponent(keys[next]);
  }, {signal:lifecycle.signal});
  reveal.addEventListener('click', () => {
    const input = document.getElementById('password');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    reveal.textContent = show ? 'Hide' : 'Show';
    reveal.setAttribute('aria-label', show ? 'Hide Password' : 'Show Password');
    reveal.setAttribute('aria-pressed', String(show));
  }, {signal:lifecycle.signal});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    error.textContent = '';
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    button.firstElementChild.textContent = 'Opening Your Workspace';
    let fullscreenBlocked = false;
    try {
      const response = await fetch('/api/login', {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:form.email.value.trim(), password:form.password.value})});
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable To Sign In. Please Try Again.');
      form.password.value = '';
      try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch { fullscreenBlocked = true; }
      const page = await fetch('/dashboard', {credentials:'same-origin', cache:'no-store'});
      if (!page.ok) throw Error('Your Workspace Could Not Load. Please Try Again.');
      const parsed = new DOMParser().parseFromString(await page.text(), 'text/html');
      if (!parsed.querySelector('#overview')) throw Error('Your Workspace Could Not Load. Please Try Again.');
      unlocked = true;
      lifecycle.abort();
      disposeVisual();
      document.body.classList.remove('locked','architecture-visible');
      delete document.body.dataset.motion;
      document.body.replaceChildren(...[...parsed.body.children].filter(node => node.tagName !== 'SCRIPT'));
      history.replaceState(null,'','/dashboard');
      document.title = parsed.title;
      mountSiteNav();
      const script = document.createElement('script');
      script.src = '/app.js';
      script.onload = () => { if (fullscreenBlocked) window.solToast?.('Workspace opened. Use the fullscreen button if your browser allows it.'); };
      document.head.append(script);
      const heading = document.querySelector('.heading h1');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
    } catch (err) {
      error.textContent = err.message || 'Unable To Sign In. Please Try Again.';
      button.disabled = false;
      form.removeAttribute('aria-busy');
      button.firstElementChild.textContent = 'Enter Workspace';
    }
  }, {signal:lifecycle.signal});

  // Four precomputed forms share a topology, so selection morphs the actual
  // sculpture instead of replacing it. Graphics never gate the login form.
  async function initOrbitalSystem() {
    let renderer, observer, visualEvents;
    let destroyed = false, frame = 0;
    const resources = [];
    function cleanup() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      visualEvents?.abort();
      for (const resource of resources) resource.dispose();
      if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
      selectVisual = () => {};
      updateVisualMotion = () => {};
    }
    disposeVisual = cleanup;
    stage.dataset.mode = selected;
    try {
      const THREE = await import('/three.js');
      if (unlocked || destroyed) return;
      renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, .1, 80);
      const system = new THREE.Group();
      scene.add(system);
      const keep = resource => { resources.push(resource); return resource; };
      const red = 0xf34c58;

      const coreMaterial = keep(new THREE.MeshBasicMaterial({color:red,wireframe:true,transparent:true,opacity:.16,depthWrite:false}));
      const core = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(.89, 1)), coreMaterial);
      const innerMaterial = keep(new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.12,depthWrite:false}));
      const inner = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(.55, 1)), innerMaterial);
      system.add(core,inner);

      // 864 vertices and static indices. No geometry, vectors or arrays are
      // allocated in the render loop. The topology is shared by all four forms.
      const bands = 24, steps = 36, count = bands*steps;
      const forms = Array.from({length:4},()=>new Float32Array(count*3));
      const phases = new Float32Array(count);
      const positions = new Float32Array(count*3);
      const indices = new Uint16Array(bands*(steps-1)*2);
      let edge = 0;
      for (let band=0;band<bands;band++) {
        const latitude=(band+.5)/bands*Math.PI;
        const routeAngle=band/bands*Math.PI*2;
        const layer=Math.floor(band/6), lane=band%6;
        for (let step=0;step<steps;step++) {
          const point=band*steps+step, offset=point*3, t=step/(steps-1);
          const longitude=t*Math.PI*2;
          forms[0][offset]=Math.sin(latitude)*Math.cos(longitude)*1.12;
          forms[0][offset+1]=Math.cos(latitude)*1.12;
          forms[0][offset+2]=Math.sin(latitude)*Math.sin(longitude)*1.12;
          const routeRadius=.13+.42*(1-t);
          forms[1][offset]=(t-.5)*3.5;
          forms[1][offset+1]=Math.cos(routeAngle+t*.65)*routeRadius;
          forms[1][offset+2]=Math.sin(routeAngle+t*.65)*routeRadius;
          forms[2][offset]=lane<3 ? (t-.5)*2.24 : (lane%3-1)*.72;
          forms[2][offset+1]=(layer-1.5)*.53;
          forms[2][offset+2]=lane<3 ? (lane%3-1)*.72 : (t-.5)*2.24;
          const phase=t*Math.PI*5+band*.13;
          forms[3][offset]=(t-.5)*3.05;
          forms[3][offset+1]=Math.sin(phase)*(.38+.13*Math.sin(t*Math.PI));
          forms[3][offset+2]=(band-(bands-1)/2)*.035;
          phases[point]=phase;
          if(step<steps-1){indices[edge++]=point;indices[edge++]=point+1;}
        }
      }
      const positionAttribute=new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage);
      const filamentGeometry=keep(new THREE.BufferGeometry());
      filamentGeometry.setAttribute('position',positionAttribute);
      filamentGeometry.setIndex(new THREE.BufferAttribute(indices,1));
      const filamentMaterial=keep(new THREE.LineBasicMaterial({color:red,transparent:true,opacity:.31,depthWrite:false}));
      const filaments=new THREE.LineSegments(filamentGeometry,filamentMaterial);
      filaments.frustumCulled=false;
      const pointGeometry=keep(new THREE.BufferGeometry());
      pointGeometry.setAttribute('position',positionAttribute);
      const pointMaterial=keep(new THREE.PointsMaterial({color:0xffb6bb,size:.014,transparent:true,opacity:.7,depthWrite:false}));
      const points=new THREE.Points(pointGeometry,pointMaterial);points.frustumCulled=false;
      system.add(filaments,points);

      const ringGeometry=keep(new THREE.TorusGeometry(1,.006,5,120));
      const satelliteGeometry=keep(new THREE.IcosahedronGeometry(.035,1));
      const rings=[];
      const ringTargets=Array.from({length:4},()=>[]);
      function target(position,rotation,scale){return {position,quaternion:new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),scale};}
      for(let i=0;i<4;i++) {
        ringTargets[0].push(target([0,0,0],[1.02+i*.22,i*.51,i*.74],[1.35+i*.14,1.35+i*.14,1.35+i*.14]));
        ringTargets[1].push(target([-1.5+i,0,0],[0,Math.PI/2,.2],[.68-i*.095,.68-i*.095,.68-i*.095]));
        ringTargets[2].push(target([0,(i-1.5)*.53,0],[Math.PI/2,0,Math.PI/4],[1.28,1.28,1.28]));
        ringTargets[3].push(target([0,0,-.12+i*.08],[.16+i*.13,.12*i,-.1],[1.37+i*.2,1.05+i*.15,1]));
        const group=new THREE.Group();
        const material=keep(new THREE.MeshBasicMaterial({color:i===3?0x57d8a0:red,transparent:true,opacity:.3,depthWrite:false}));
        const ring=new THREE.Mesh(ringGeometry,material);group.add(ring);
        const arcMaterial=keep(new THREE.MeshBasicMaterial({color:i===3?0x8ce9bc:0xffafb6,transparent:true,opacity:.8,depthWrite:false}));
        const arc=new THREE.Mesh(keep(new THREE.TorusGeometry(1,.011,5,28,.38)),arcMaterial);group.add(arc);
        const satellite=new THREE.Mesh(satelliteGeometry,keep(new THREE.MeshBasicMaterial({color:i===3?0x8ce9bc:0xffffff,transparent:true,opacity:.85,depthWrite:false})));
        group.add(satellite);system.add(group);
        rings.push({group,material,arc,arcMaterial,satellite,quaternion:new THREE.Quaternion()});
      }

      // Scanner and signal echoes are pooled objects whose intensity is blended
      // with the active form. Auto uses a similarly fixed particle buffer.
      const scanner=new THREE.Group();
      const scannerMaterial=keep(new THREE.MeshBasicMaterial({color:0xffb2b8,transparent:true,opacity:.7,depthWrite:false}));
      scanner.add(new THREE.Mesh(keep(new THREE.TorusGeometry(1.16,.011,5,72,Math.PI*.66)),scannerMaterial));
      system.add(scanner);
      const echoes=[];
      for(let i=0;i<3;i++) {
        const material=keep(new THREE.MeshBasicMaterial({color:red,transparent:true,opacity:0,depthWrite:false}));
        const mesh=new THREE.Mesh(ringGeometry,material);mesh.rotation.x=.15;mesh.position.z=-.15;system.add(mesh);echoes.push({mesh,material});
      }
      const streamCount=72, streamPositions=new Float32Array(streamCount*3);
      const streamAttribute=new THREE.BufferAttribute(streamPositions,3).setUsage(THREE.DynamicDrawUsage);
      const streamGeometry=keep(new THREE.BufferGeometry());streamGeometry.setAttribute('position',streamAttribute);
      const streamMaterial=keep(new THREE.PointsMaterial({color:0xffffff,size:.026,transparent:true,opacity:0,depthWrite:false}));
      const stream=new THREE.Points(streamGeometry,streamMaterial);stream.frustumCulled=false;system.add(stream);

      const modes=[
        {rotation:[.14,-.19,-.12],camera:[-.1,.24,7.05],core:[.95,.95,.95],opacity:.17},
        {rotation:[.19,-.45,-.15],camera:[.32,.32,7.3],core:[1.46,.26,.26],opacity:.23},
        {rotation:[.25,.57,-.05],camera:[.1,.8,7.15],core:[.65,1.03,.65],opacity:.025},
        {rotation:[.08,-.13,.04],camera:[-.1,.18,6.95],core:[1.21,.42,.35],opacity:.035}
      ];
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      const weights=new Float32Array([1,0,0,0]),fromWeights=new Float32Array(weights);
      let lastTime=0,elapsed=0,active=0,progress=1;
      const pointer = {x:0,y:0};
      const lookAt=new THREE.Vector3();
      const mix=(a,b,t)=>a+(b-a)*t;
      function render(now=0) {
        if (destroyed || unlocked) return;
        frame=0;
        const delta=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;
        if(!motion.matches&&!motionPaused){elapsed+=delta;progress=Math.min(1,progress+delta/1.28);}else progress=1;
        const eased=progress*progress*progress*(progress*(progress*6-15)+10);
        for(let mode=0;mode<4;mode++)weights[mode]=mix(fromWeights[mode],mode===active?1:0,eased);
        if(progress===1&&stage.dataset.transition!=='settled')stage.dataset.transition='settled';
        const waveTime=motion.matches?0:elapsed;
        for(let i=0;i<count;i++) {
          const offset=i*3;
          for(let axis=0;axis<3;axis++)positions[offset+axis]=forms[0][offset+axis]*weights[0]+forms[1][offset+axis]*weights[1]+forms[2][offset+axis]*weights[2]+forms[3][offset+axis]*weights[3];
          positions[offset+1]+=weights[3]*.16*Math.sin(phases[i]+waveTime*1.75);
          const breathe=1+weights[0]*.012*Math.sin(waveTime*.7);
          positions[offset]*=breathe;positions[offset+2]*=breathe;
        }
        positionAttribute.needsUpdate=true;
        let rx=0,ry=0,rz=0,cx=0,cy=0,cz=0,sx=0,sy=0,sz=0,opacity=0;
        for(let mode=0;mode<4;mode++) {
          const config=modes[mode],w=weights[mode];
          rx+=config.rotation[0]*w;ry+=config.rotation[1]*w;rz+=config.rotation[2]*w;
          cx+=config.camera[0]*w;cy+=config.camera[1]*w;cz+=config.camera[2]*w;
          sx+=config.core[0]*w;sy+=config.core[1]*w;sz+=config.core[2]*w;opacity+=config.opacity*w;
        }
        const turn=motion.matches?0:Math.sin(progress*Math.PI)*.32;
        system.rotation.set(rx+(motion.matches?0:pointer.y*.1),ry+turn+(motion.matches?0:pointer.x*.13),rz);
        system.scale.setScalar(1+(motion.matches?0:Math.sin(progress*Math.PI)*.055));
        camera.position.set(cx,cy,cz+(camera.aspect<1.4?.25:0));camera.lookAt(lookAt);
        core.scale.set(sx,sy,sz);inner.scale.set(sx*.88,sy*.88,sz*.88);
        core.rotation.y=waveTime*.14*weights[0];inner.rotation.set(waveTime*.06,-waveTime*.14,waveTime*.05);
        coreMaterial.opacity=opacity;innerMaterial.opacity=.1*weights[0]+.035*weights[1];
        filamentMaterial.opacity=.25*weights[0]+.24*weights[1]+.43*weights[2]+.35*weights[3];
        pointMaterial.opacity=.65*weights[0]+.25*weights[1]+.7*weights[2]+.45*weights[3];
        for(let i=0;i<4;i++) {
          const ring=rings[i];let px=0,py=0,pz=0,rsx=0,rsy=0,rsz=0,total=0;
          for(let mode=0;mode<4;mode++) {
            const value=ringTargets[mode][i],w=weights[mode];
            px+=value.position[0]*w;py+=value.position[1]*w;pz+=value.position[2]*w;
            rsx+=value.scale[0]*w;rsy+=value.scale[1]*w;rsz+=value.scale[2]*w;
            if(w>.00001){if(total===0)ring.quaternion.copy(value.quaternion);else ring.quaternion.slerp(value.quaternion,w/(total+w));total+=w;}
          }
          const selectedWeight=weights[i];
          const ringBreath=1+weights[3]*.035*Math.sin(waveTime*1.6-i*.6);
          ring.group.position.set(px,py,pz);ring.group.quaternion.copy(ring.quaternion);ring.group.scale.set(rsx*ringBreath,rsy*ringBreath,rsz);
          const angle=i*Math.PI*.5+waveTime*(.18+.075*i+selectedWeight*.25);
          ring.arc.rotation.z=angle;ring.satellite.position.set(Math.cos(angle+.38),Math.sin(angle+.38),0);
          ring.satellite.scale.setScalar(1+selectedWeight*.75);
          ring.material.opacity=.17+selectedWeight*.43;
          ring.arcMaterial.opacity=.25+selectedWeight*.7;
        }
        scanner.rotation.set(Math.PI/2,waveTime*.5,0);scannerMaterial.opacity=weights[0]*.75;
        for(let i=0;i<3;i++) {
          const phase=(waveTime*.22+i/3)%1;
          const radius=1.1+phase*1.04;
          echoes[i].mesh.scale.set(radius,radius*.68,1);
          echoes[i].material.opacity=weights[3]*(1-phase)*.22;
        }
        for(let i=0;i<streamCount;i++) {
          const lane=i%6,t=(Math.floor(i/6)/12+waveTime*.24)%1,angle=lane/6*Math.PI*2+t*.65,radius=.13+.42*(1-t),offset=i*3;
          streamPositions[offset]=(t-.5)*3.5;streamPositions[offset+1]=Math.cos(angle)*radius;streamPositions[offset+2]=Math.sin(angle)*radius;
        }
        streamAttribute.needsUpdate=true;streamMaterial.opacity=weights[1]*.9;
        renderer.render(scene,camera);
        if(!motion.matches&&!motionPaused&&!document.hidden)frame=requestAnimationFrame(render);
      }
      updateVisualMotion=()=>requestRender();
      function requestRender(){if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;render();}
      function resize() {
        if (destroyed || unlocked) return;
        const {width,height}=stage.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width,height,false);
        camera.aspect=width/height;camera.updateProjectionMatrix();
        requestRender();
      }
      observer=new ResizeObserver(resize);observer.observe(stage);
      visualEvents = new AbortController();
      stage.addEventListener('pointermove',event=>{const box=stage.getBoundingClientRect();pointer.x=(event.clientX-box.left)/box.width-.5;pointer.y=(event.clientY-box.top)/box.height-.5;},{signal:visualEvents.signal,passive:true});
      stage.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0;},{signal:visualEvents.signal});
      motion.addEventListener('change',()=>{fromWeights.set(weights);if(motion.matches)progress=1;requestRender();},{signal:visualEvents.signal});
      document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0;}else requestRender();},{signal:visualEvents.signal});
      selectVisual=index=>{
        if(index===active&&progress===1)return;
        fromWeights.set(weights);active=index;progress=motion.matches?1:0;
        stage.dataset.transition=motion.matches?'settled':'running';
        requestRender();
      };
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stage.dataset.renderer='fallback';cleanup();},{signal:visualEvents.signal});
      stage.dataset.renderer='webgl';
      stage.dataset.transition='settled';
      selectVisual(Object.keys(components).indexOf(selected));
      resize();
    } catch {
      cleanup();
      stage.dataset.renderer='fallback';
    }
  }
  initOrbitalSystem();
})();
