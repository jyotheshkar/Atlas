// Shared Quasar header. Dashboard controls keep their original owners.
export function mountSiteNav(){
 const header=document.querySelector('[data-site-header]');
 if(!header||header.dataset.navMounted)return;
 header.dataset.navMounted='true';
 const brand=header.querySelector('.lp-brand,.brand,.site-brand');
 if(brand){brand.className='site-brand';brand.href='/';brand.setAttribute('aria-label','Quasar home');brand.innerHTML='<img src="/quasar-mark.svg" alt=""><span>Quasar</span>';}
 header.classList.add('site-header');
 header.querySelectorAll('.site-nav').forEach(el=>el.remove());
 const actions=header.querySelector('.header-actions,.header-right');if(actions)actions.classList.add('site-actions');
 header.querySelectorAll('.lp-header-caption,.header-divider,.header-caption,.header-rule,.home-link,.live-clock').forEach(el=>el.remove());
}
mountSiteNav();
