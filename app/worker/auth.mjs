// Independent password session behind the owner-private Sites access policy.
// Contains no credentials. Runtime env: SOL_LOGIN_EMAIL, SOL_PASSWORD_VERIFIER,
// SOL_SESSION_SECRET. Keep the Site owner-private in Sites access policy.
const encoder = new TextEncoder();
const COOKIE = '__Host-sol_session';
const TTL = 2 * 60 * 60;
const attempts = new Map(); // Additional per-isolate mitigation, not global rate limiting.
const encode = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const decode = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4-text.length%4)%4)), c => c.charCodeAt(0));
const json = (value, status=200, extra={}) => new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff',...extra}});
const sessionKey = env => crypto.subtle.importKey('raw', decode(env.SOL_SESSION_SECRET), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']);
const SUBJECT = 'sol-pulse-owner';

function cookie(request) {
  const values = (request.headers.get('cookie') || '').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));
  return values.length===1 ? values[0].slice(COOKIE.length+1) : '';
}
function sameOrigin(request) {
  return request.headers.get('origin') === new URL(request.url).origin && request.headers.get('sec-fetch-site') !== 'cross-site';
}
function setCookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}
function hasConfig(env) {
  return typeof env.SOL_LOGIN_EMAIL==='string' && typeof env.SOL_PASSWORD_VERIFIER==='string' && typeof env.SOL_SESSION_SECRET==='string';
}
async function validPassword(password, env) {
  // Generate outside source control: salt >= 16 random bytes, hash 32 bytes,
  // PBKDF2/SHA-256/100000 iterations. Verifier JSON is a secret runtime value.
  const spec = JSON.parse(env.SOL_PASSWORD_VERIFIER);
  if (spec.iterations!==100000 || typeof spec.salt!=='string' || typeof spec.hash!=='string') return false;
  const salt=decode(spec.salt), expected=decode(spec.hash);
  if(salt.length<16 || expected.length!==32) return false;
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:spec.iterations},key,256));
  // HMAC verification avoids a data-dependent byte-string equality check.
  const comparisonKey=await sessionKey(env);
  const expectedTag=await crypto.subtle.sign('HMAC',comparisonKey,expected);
  return crypto.subtle.verify('HMAC',comparisonKey,expectedTag,actual);
}
export async function sessionValid(request, env) {
  try {
    if(!hasConfig(env)) return false;
    const token=cookie(request);
    if(token.length>2048) return false;
    const [payload,signature,...rest]=token.split('.');
    if(!payload || !signature || rest.length) return false;
    const key=await sessionKey(env);
    if(!await crypto.subtle.verify('HMAC',key,decode(signature),encoder.encode(payload))) return false;
    const data=JSON.parse(new TextDecoder().decode(decode(payload)));
    const now=Math.floor(Date.now()/1000);
    return data.v===2 && data.sub===SUBJECT && data.email===env.SOL_LOGIN_EMAIL.toLowerCase() && Number.isInteger(data.exp) && Number.isInteger(data.iat) && data.iat<=now+30 && data.exp>now && data.exp-data.iat===TTL;
  } catch { return false; }
}
export async function handleAuth(request, env) {
  const path=new URL(request.url).pathname;
  if(path!=='/api/login' && path!=='/api/logout' && path!=='/api/session') return null;
  if(!hasConfig(env)) return json({error:'Sign-in is unavailable. Please try again later.'},503);
  // The platform supports authorized identity-less API requests. Its owner-only
  // access gate stays independent; this application always requires its password.
  const uid=SUBJECT;
  if(path==='/api/session') return request.method==='GET' ? json({authenticated:await sessionValid(request,env)}) : json({error:'Method not allowed'},405,{Allow:'GET'});
  if(request.method!=='POST') return json({error:'Method not allowed'},405,{Allow:'POST'});
  if(!sameOrigin(request)) return json({error:'Request rejected'},403);
  if(path==='/api/logout') return json({ok:true},200,{'set-cookie':setCookie('',0)});
  const now=Date.now(), prior=attempts.get(uid);
  if(prior && prior.until>now && prior.count>=5) return json({error:'Please wait before trying again.'},429,{'retry-after':String(Math.ceil((prior.until-now)/1000))});
  if((request.headers.get('content-type')||'').split(';')[0]!=='application/json') return json({error:'Invalid request'},415);
  if(Number(request.headers.get('content-length')||0)>4096) return json({error:'Invalid request'},413);
  // Bound reading even if Content-Length is absent. Cancel as soon as oversized.
  const reader=request.body?.getReader();
  if(!reader) return json({error:'Invalid request'},400);
  let size=0, chunks=[];
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return json({error:'Invalid request'},413);}chunks.push(value);}
  let body;
  try { const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}body=JSON.parse(new TextDecoder().decode(bytes)); } catch {return json({error:'Invalid request'},400);}
  if(typeof body.email!=='string' || typeof body.password!=='string' || body.email.length>254 || body.password.length>256) return json({error:'Email or password is incorrect.'},401);
  // Reserve attempt before awaiting derivation to bound concurrent guesses.
  const attemptNow=Date.now(), latest=attempts.get(uid);
  if(latest && latest.until>attemptNow && latest.count>=5) return json({error:'Please wait before trying again.'},429,{'retry-after':String(Math.ceil((latest.until-attemptNow)/1000))});
  const state=latest && latest.until>attemptNow ? latest : {count:0,until:attemptNow+15*60*1000};
  state.count++; attempts.set(uid,state);
  const passwordOK=await validPassword(body.password,env);
  if(!passwordOK || body.email.trim().toLowerCase()!==env.SOL_LOGIN_EMAIL.toLowerCase()) return json({error:'Email or password is incorrect.'},401);
  attempts.delete(uid);
  const iat=Math.floor(Date.now()/1000);
  const payload=encode(encoder.encode(JSON.stringify({v:2,sub:SUBJECT,email:env.SOL_LOGIN_EMAIL.toLowerCase(),iat,exp:iat+TTL})));
  const signature=encode(new Uint8Array(await crypto.subtle.sign('HMAC',await sessionKey(env),encoder.encode(payload))));
  return json({ok:true},200,{'set-cookie':setCookie(`${payload}.${signature}`,TTL)});
}
