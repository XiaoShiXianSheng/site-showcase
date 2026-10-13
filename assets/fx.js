// shared micro-interactions: reveal, counters, spotlight, i18n
(()=>{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
const co=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,t=+el.dataset.count,s=performance.now();const f=n=>{const p=Math.min((n-s)/1400,1);el.textContent=Math.round(t*(1-Math.pow(1-p,3))).toLocaleString()+(el.dataset.suf||'');p<1&&requestAnimationFrame(f)};requestAnimationFrame(f);co.unobserve(el)}));
document.querySelectorAll('[data-count]').forEach(el=>co.observe(el));
document.querySelectorAll('.spot').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--x',e.clientX-r.left+'px');c.style.setProperty('--y',e.clientY-r.top+'px')}));
const I=window.I18N;if(I){const set=l=>{document.documentElement.lang=l;document.querySelectorAll('[data-i]').forEach(el=>{const v=I[l][el.dataset.i];if(v!=null)el.innerHTML=v});document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===l));localStorage.setItem('lang',l)};
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>set(b.dataset.l));const s=localStorage.getItem('lang');if(s&&I[s]&&s!=='en')set(s)}
document.querySelectorAll('form[data-demo]').forEach(f=>f.onsubmit=e=>{e.preventDefault();f.querySelector('.ok').hidden=false;f.querySelector('button').disabled=true});
})();
