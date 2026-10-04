import { SPOTS, CATEGORIES, ORIGIN } from './data.js';
import { PHOTOS } from './photos.js';
import { BUDGETS } from './budgets.js';

const $ = (s, parent = document) => parent.querySelector(s);
const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
 landscape:'<path d="m2 18 7-12 5 8 3-5 5 9H2Z"/><path d="m6 12 3 2 2-1"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--paper,#f1f0e9)"/><circle cx="16" cy="17" r="3" fill="var(--paper,#f1f0e9)"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 next:'<path d="m9 5 7 7-7 7"/>', previous:'<path d="m15 5-7 7 7 7"/>',
 fullscreen:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 filter:'<path d="M3 6h18M6 12h12M9 18h6"/>',
 walk:'<circle cx="13" cy="3" r="1.5"/><path d="m10 21 2-7-4-3 2-5 4 1 2 5h4M4 10l4-3m3 7 6 7"/>',
 cycle:'<circle cx="5" cy="16" r="4"/><circle cx="19" cy="16" r="4"/><path d="m5 16 4-8 5 8H5m10-12h3l2 12M7 8h9M8 5h4"/>',
 rail:'<rect x="5" y="2" width="14" height="16" rx="3"/><path d="M5 10h14M9 6h6M7 22l3-4m7 4-3-4"/><path d="M8 14h1m6 0h1"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
 arrow:'<path d="M5 19 19 5M5 5h14v14"/>',
 check:'<path d="m5 12 4 4L20 5"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.pin}</svg>`;}
const storage = {get(k, fallback){try {return JSON.parse(localStorage.getItem('mikawa:'+k)) ?? fallback;}catch{return fallback;}},set(k,v){try{localStorage.setItem('mikawa:'+k,JSON.stringify(v));}catch{}}};
const state = {view:'scenery',id:storage.get('current',SPOTS[0].id),area:'all',category:'all',travel:'all',query:'',saved:new Set(storage.get('saved',[])),reduced:storage.get('motion',false)};
if(!SPOTS.some(s=>s.id===state.id)) state.id=SPOTS[0].id;
const mobile = /Android|iPhone|iPod/i.test(navigator.userAgent) || navigator.userAgentData?.mobile;
if(mobile)document.body.classList.add('touch-device');
document.body.classList.toggle('reduce-motion',state.reduced);
$('#reduce-motion').checked=state.reduced;
const reduced = ()=>state.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches;
const animate = (el, frames, options={}) => {if(!el || reduced())return Promise.resolve();return el.animate(frames,{duration:450,easing:'cubic-bezier(.22,1,.36,1)',...options}).finished.catch(()=>{});};
const current=()=>SPOTS.find(s=>s.id===state.id);
const areaNames={all:'豊田・新城・周辺',toyota:'豊田市',shinshiro:'新城市',nearby:'周辺の森'};
const travelNames={all:'移動・散策',walk:'徒歩散策',cycle:'現地ライド',rail:'鉄道を使う'};
const railSuitable=new Set(['kaisho','mikawa-hirose','asagiri-lake','ogyu-castle']);
const walkSuitable=new Set(['nijogataki','kaisho','naganoyama','oshikawa-otaki','asagiri-lake','mikawa-hirose','takadoya','futase-tunnel','kansenji','kuroda-lake','narusawa','horai-lake','kadoya-school','mennoki-enchi','atera','komochi','yotsuya','kameyama']);
const cycleSuitable=new Set(['nijogataki','mikawa-hirose','asagiri-lake','futase-tunnel','horai-lake','kadoya-school','atera','yotsuya','kameyama']);
function matches(s, f=state){
 const q=f.query.trim().normalize('NFKC').toLowerCase();
 return (f.area==='all'||s.area===f.area)&&(f.category==='all'||s.category===f.category)&&(f.travel==='all'||(f.travel==='walk'&&walkSuitable.has(s.id))||(f.travel==='cycle'&&cycleSuitable.has(s.id))||(f.travel==='rail'&&railSuitable.has(s.id)))&&(!q||[s.name,s.reading,s.city,s.district,s.address,CATEGORIES[s.category]].join(' ').normalize('NFKC').toLowerCase().includes(q));
}
const filtered=()=>SPOTS.filter(s=>matches(s));
function mapLink(s){return 'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:s.address+' '+s.name});}
function routeLink(s,mode){return 'https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',origin:ORIGIN.query,destination:s.address+' '+s.name,travelmode:mode,...(mode==='driving'?{avoid:'tolls,highways'}:{})});}
function budget(s){const b=BUDGETS[s.id];return b?`${b.low.toLocaleString('ja-JP')}～${b.high.toLocaleString('ja-JP')}円`:'未確認';}
function tags(s){return `<div class="access-tags">${['walk','cycle','rail'].map(type=>`<span class="access-tag ${type}">${icon(type)}${esc(s[type])}</span>`).join('')}</div>`;}
function toast(message){clearTimeout(toast.timer);$('#toast').textContent=message;$('#toast').classList.add('visible');toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),2500);}
function save(id,button){state.saved.has(id)?state.saved.delete(id):state.saved.add(id);storage.set('saved',[...state.saved]);updateSaves();if(state.view==='saved')renderSaved();if(button)animate(button,[{transform:'scale(1)'},{transform:'scale(.82)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:430});}
function updateSaves(){
 const s=current();$('#scene-save').setAttribute('aria-pressed',String(state.saved.has(s.id)));$('#scene-save').setAttribute('aria-label',state.saved.has(s.id)?'この場所の保存を解除':'この場所を保存');
 $$('[data-save]').forEach(b=>{b.setAttribute('aria-pressed',String(state.saved.has(b.dataset.save)));b.setAttribute('aria-label',state.saved.has(b.dataset.save)?'保存を解除':'この場所を保存');});
 $('#nav-saved-count').textContent=state.saved.size;$('#nav-saved-count').hidden=!state.saved.size;$('#saved-count').textContent=state.saved.size;
}
let photoSequence=0;
async function renderScene(direction=0){
 const spots=filtered();$('#scenery-empty').hidden=!!spots.length;if(!spots.length)return;
 if(!spots.some(s=>s.id===state.id))state.id=spots[0].id;
 const s=current(),p=PHOTOS[s.photo],seq=++photoSequence;
 storage.set('current',s.id);
 $('#scene-name').textContent=s.name;$('#scene-reading').textContent=s.reading;$('#scene-area').textContent=s.city+'・'+s.district;$('#scene-category').textContent=CATEGORIES[s.category];$('#scene-summary').textContent=s.summary;
 $('#scene-tags').innerHTML=tags(s);$('#scene-time').textContent='原駅発・往復燃料費';$('#scene-budget').textContent=budget(s);
 $('#scene-position').textContent=String(spots.indexOf(s)+1).padStart(2,'0');$('#scene-total').textContent=String(spots.length).padStart(2,'0');$('#progress-fill').style.width=((spots.indexOf(s)+1)/spots.length*100)+'%';
 $('#location-label').textContent=state.area==='all'?'豊田・新城・周辺':areaNames[state.area];$('#scene-map').href=mapLink(s);
 $('#photo-unavailable').hidden=!!p;$('#unavailable-category').textContent=CATEGORIES[s.category];$('#unavailable-name').textContent=s.name;$('#unavailable-link').href=s.source;
 $('#photo-caption').textContent=p?`写真：${p.author}`:'';$('#scene-photo').hidden=!p;$('#scene-photo').alt=s.name;$('#photo-load').hidden=true;
 updateSaves();
 if(direction){animate($('#scene-panel'),[{opacity:0,transform:`translateX(${direction*22}px)`},{opacity:1,transform:'translateX(0)'}],{duration:650});}
 if(p){
  let loadingTimer=setTimeout(()=>{if(seq===photoSequence)$('#photo-load').hidden=false;},180);
  const img=new Image();img.src=p.path;try{await img.decode();}catch{clearTimeout(loadingTimer);if(seq===photoSequence){$('#photo-load').hidden=true;$('#scene-photo').hidden=true;$('#photo-unavailable').hidden=false;$('#photo-caption').textContent='';}return;}
  clearTimeout(loadingTimer);if(seq!==photoSequence)return;$('#photo-load').hidden=true;$('#scene-photo').src=p.path;$('#scene-photo').style.objectPosition=photoPosition[s.id]||'center';
  animate($('#scene-photo'),[{opacity:direction?.65:0,transform:`translateX(${direction*28}px) scale(1.07)`},{opacity:1,transform:'translateX(0) scale(1)'}],{duration:850});
 }
 const next=spots[(spots.indexOf(s)+1)%spots.length];if(PHOTOS[next.photo]){const img=new Image();img.src=PHOTOS[next.photo].path;}
}
const photoPosition={'nijogataki':'32% 55%','kansenji':'55% 30%','futase-tunnel':'47% center','rokusho':'50% 40%'};
let turning=false;
async function step(dir){if(turning)return;const list=filtered();if(list.length<2)return;turning=true;const index=list.findIndex(s=>s.id===state.id);state.id=list[(index+dir+list.length)%list.length].id;await renderScene(dir);setTimeout(()=>turning=false,reduced()?0:140);}
function card(s){const p=PHOTOS[s.photo];return `<article class="spot-card"><button class="spot-card-main" data-spot="${s.id}" aria-label="${esc(s.name)}の風景を見る"><div class="card-image${p?'':' card-no-photo'}">${p?`<img src="${p.path}" alt="${esc(s.name)}" loading="lazy" decoding="async">`:`${icon(s.category==='forest'?'landscape':'pin')}`}<span class="card-number">${String(s.number).padStart(2,'0')}</span><span class="card-area">${esc(s.city)}・${esc(s.district)}</span></div><div class="card-info"><h2>${esc(s.name)}</h2>${tags(s)}<p>${esc(s.summary)}</p><div class="card-budget"><span>原駅発・往復燃料費</span><strong>${budget(s)}</strong></div></div></button><button class="card-save" data-save="${s.id}" aria-label="この場所を保存" aria-pressed="${state.saved.has(s.id)}">${icon('bookmark')}</button></article>`;}
let observer;
function observeCards(parent){if(reduced()||!('IntersectionObserver'in window))return;observer?.disconnect();observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){animate(entry.target,[{opacity:0,transform:'translateY(23px)'},{opacity:1,transform:'translateY(0)'}],{duration:650});observer.unobserve(entry.target);}}),{threshold:.07});$$('.spot-card',parent).forEach(el=>observer.observe(el));}
function renderList(){const list=filtered();$('#spot-list').innerHTML=list.map(card).join('');$('#list-count').textContent=list.length+'件';$('#list-empty').hidden=!!list.length;$('#filter-description').textContent=[state.category==='all'?'すべての風景':CATEGORIES[state.category],state.travel==='all'?'':travelNames[state.travel]].filter(Boolean).join(' · ');$$('.quick-areas [data-area]').forEach(b=>{b.classList.toggle('selected',b.dataset.area===state.area);b.setAttribute('aria-pressed',String(b.dataset.area===state.area));});observeCards($('#spot-list'));updateSaves();}
function renderSaved(){const list=SPOTS.filter(s=>state.saved.has(s.id));$('#saved-list').innerHTML=list.map(card).join('');$('#saved-empty').hidden=!!list.length;updateSaves();observeCards($('#saved-list'));}
function setView(view){if(view===state.view)return;document.body.classList.remove('photo-mode');state.view=view;$$('.view').forEach(v=>{v.hidden=v.id!==view+'-view';v.classList.toggle('active',!v.hidden);});$$('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(view==='list')renderList();if(view==='saved')renderSaved();animate($('#'+view+'-view'),[{opacity:.2,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:500});}
function openDialog(dialog){if(dialog.open)return;dialog.showModal();dialog.scrollTop=0;animate(dialog,matchMedia('(orientation:landscape)').matches?[{transform:'translateX(105%)',opacity:.6},{transform:'translateX(0)',opacity:1}]:[{transform:'translateY(55%)',opacity:.5},{transform:'translateY(0)',opacity:1}],{duration:500});}
async function closeDialog(dialog){if(!dialog.open)return;await animate(dialog,matchMedia('(orientation:landscape)').matches?[{transform:'translateX(0)',opacity:1},{transform:'translateX(25%)',opacity:0}]:[{transform:'translateY(0)',opacity:1},{transform:'translateY(20%)',opacity:0}],{duration:220,easing:'ease-in'});dialog.close();}
function details(){
 const s=current(),b=BUDGETS[s.id],p=PHOTOS[s.photo];
 $('#detail-content').innerHTML=`<p class="detail-region">${String(s.number).padStart(2,'0')} ／ ${esc(s.city)}・${esc(s.district)}</p><h2 class="detail-title" id="detail-title">${esc(s.name)}</h2>${tags(s)}<p class="tag-explain">徒歩は現地散策の目安。自転車の「自走」は原駅発です。適性は距離・地形をもとにした編集上の目安です。</p><p class="detail-description">${esc(s.description)}</p><section class="detail-section"><h3>住所</h3><a class="address-link" href="${mapLink(s)}" target="_blank" rel="noopener noreferrer">${esc(s.address)} ${icon('arrow')}</a><small>${esc(s.addressNote)}</small></section><section class="detail-section"><h3>原駅から</h3><p>${esc(s.access)}</p><div class="route-links"><a href="${routeLink(s,'transit')}" target="_blank" rel="noopener noreferrer">${icon('rail')}電車・バス</a><a href="${routeLink(s,'bicycling')}" target="_blank" rel="noopener noreferrer">${icon('cycle')}自転車</a><a href="${routeLink(s,'driving')}" target="_blank" rel="noopener noreferrer">${icon('pin')}車</a></div><small>出発：愛知県名古屋市天白区・原駅<br>Google マップで経路を確認。自転車経路が出ない地域があります。</small></section><section class="detail-section"><h3>予算目安</h3><p class="budget-number">${budget(s)}</p><p>原駅から車1台で往復する燃料費の概算</p>${b?`<small>一般道優先の道路データで周辺まで往復約${b.roundTripKm}km。ガソリン160～190円/L、燃費12～18km/Lを仮定し、上限は距離に10％の余裕を加算。料金相場の断定ではありません。高速代・駐車代・入場料は別。迂回や渋滞で変わります。</small>`:''}<div class="local-fees"><h4>現地費用</h4><p>${esc(s.fees)}</p></div><small>鉄道・バスの運賃は上の経路から日時を指定して確認してください。</small></section><section class="detail-section"><h3>訪問の目安</h3><p>${esc(s.quiet)}</p><p class="visit-note">${esc(s.caution)}</p></section><div class="source-links"><a class="detail-source" href="${s.source}" target="_blank" rel="noopener noreferrer">案内の出典 ${icon('arrow')}</a>${(s.extraSources||[]).map((u,i)=>`<a class="detail-source" href="${u}" target="_blank" rel="noopener noreferrer">補足資料 ${i+1} ${icon('arrow')}</a>`).join('')}${p?`<small class="photo-source">写真：${esc(p.author)} · <a href="${p.source_url}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a></small>`:''}</div>`;
 openDialog($('#detail-dialog'));
}
let draft;
function updateFilter(){for(const [key,id] of [['area','area-options'],['category','category-options'],['travel','travel-options']])$$('button',$('#'+id)).forEach(b=>{const yes=b.dataset[key]===draft[key];b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});$('#filter-apply').textContent=SPOTS.filter(s=>matches(s,draft)).length+'景を表示';}
function filterOpen(){draft={...state};updateFilter();openDialog($('#filter-dialog'));}
function reset(){Object.assign(state,{area:'all',category:'all',travel:'all',query:''});$('#search').value='';renderScene();renderList();}
function credits(){
 $('#credits-content').innerHTML='<p class="setting-note">情報確認日：2026年10月4日。自治体・観光協会・管理者の案内を優先しています。文章は案内資料と訪問記を参照して独自に編集。写真はすべて実写です。</p>'+SPOTS.map(s=>{const p=PHOTOS[s.photo];return `<article class="source-item"><h3>${String(s.number).padStart(2,'0')}　${esc(s.name)}</h3><a href="${s.source}" target="_blank" rel="noopener noreferrer">案内情報</a>${s.reference?` · <a href="${s.reference}" target="_blank" rel="noopener noreferrer">参考にした訪問記</a>`:''}${p?`<p>写真：${esc(p.author)}<br>撮影日表記：${esc(p.date_taken)}<br><a href="${p.source_url}" target="_blank" rel="noopener noreferrer">Wikimedia Commons 原画像</a> · <a href="${p.license_url}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a><br>${esc(p.changes)}<br>写真の権利は原作者に帰属。写真には表示した原ライセンスが適用されます。</p>`:'<p>転載用写真なし。元の案内ページで確認できます。</p>'}</article>`;}).join('')+'<article class="source-item"><h3>フォント</h3><p>Noto Sans JP / Noto Serif JP。掲載文字に合わせてサブセット化。</p><a href="./assets/NotoSansJP-OFL.txt" target="_blank" rel="noopener noreferrer">SIL Open Font License 1.1</a></article><article class="source-item"><h3>距離・燃料費</h3><p>OpenStreetMap の道路データを Valhalla で経路計算し、2026年10月4日に記録。ルートは周辺道路までの概算で、通行可能性や駐車場所を保証しません。案内に記載した規制を優先してください。</p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors · ODbL</a><p>低額側：往復距離 ÷ 18 × 160。上限側：往復距離 × 1.1 ÷ 12 × 190。100円単位に丸めています。</p></article>';
 openDialog($('#credits-dialog'));
}
// Fullscreen is attempted at launch and once during the first deliberate touch.
let fullscreenAttempted=false;
function requestFullscreen(){if(!mobile)return;const root=document.documentElement;const request=root.requestFullscreen||root.webkitRequestFullscreen;if(request&&!document.fullscreenElement){try{return Promise.resolve(request.call(root)).catch(()=>{});}catch{}}}
function syncFullscreen(){const standalone=matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone;$('#fullscreen-state').textContent=document.fullscreenElement||standalone?'全画面で表示中':'切り替える';if(!document.documentElement.requestFullscreen&&!document.documentElement.webkitRequestFullscreen)$('#fullscreen-note').textContent='このブラウザは自動全画面に対応していません。共有メニューからホーム画面に追加すると、ブラウザの枠を減らして開けます。';}
document.addEventListener('pointerup',()=>{if(!fullscreenAttempted){fullscreenAttempted=true;requestFullscreen();}},{capture:true,once:true});
$('#fullscreen-button').onclick=()=>{document.fullscreenElement?document.exitFullscreen():requestFullscreen();};$('#settings-fullscreen').onclick=()=>{if(!document.documentElement.requestFullscreen&&!document.documentElement.webkitRequestFullscreen){toast('共有メニューからホーム画面に追加');return;}document.fullscreenElement?document.exitFullscreen():requestFullscreen();};
document.addEventListener('fullscreenchange',syncFullscreen);syncFullscreen();requestFullscreen();
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install-button').hidden=false;});$('#install-button').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('#install-button').hidden=true;}};
// Touch gestures deliberately leave links, buttons and vertical scrolling alone.
let gesture=null;
$('#scenery-view').addEventListener('pointerdown',e=>{if(e.target.closest('button,a')||e.pointerType==='mouse'&&e.button!==0)return;gesture={x:e.clientX,y:e.clientY,t:performance.now(),target:e.target,dx:0,dy:0};});
$('#scenery-view').addEventListener('pointermove',e=>{if(!gesture)return;gesture.dx=e.clientX-gesture.x;gesture.dy=e.clientY-gesture.y;if(Math.abs(gesture.dx)>12&&Math.abs(gesture.dx)>Math.abs(gesture.dy)*1.3){$('#scene-photo').style.transform=`translateX(${gesture.dx*.2}px) scale(1.04)`;}});
$('#scenery-view').addEventListener('pointerup',e=>{if(!gesture)return;const g=gesture;gesture=null;$('#scene-photo').style.transform='';const dx=e.clientX-g.x,dy=e.clientY-g.y,dt=performance.now()-g.t;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25){step(dx<0?1:-1);}else if(dy< -55&&Math.abs(dy)>Math.abs(dx)&&!document.body.classList.contains('photo-mode')){details();}else if(Math.abs(dx)<9&&Math.abs(dy)<9&&dt<350&&g.target.closest('.photo-stage')&&!g.target.closest('button,a')){document.body.classList.toggle('photo-mode');}});
$('#scenery-view').addEventListener('pointercancel',()=>{gesture=null;$('#scene-photo').style.transform='';});
$('#previous').onclick=()=>step(-1);$('#next').onclick=()=>step(1);$('#scene-save').onclick=e=>save(state.id,e.currentTarget);$('#detail-open').onclick=details;$('#filter-open').onclick=filterOpen;$('#list-filter').onclick=filterOpen;$('#credits-open').onclick=credits;
$$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('#search').addEventListener('input',e=>{state.query=e.target.value;renderList();renderScene();});
$$('.quick-areas [data-area]').forEach(b=>b.onclick=()=>{state.area=b.dataset.area;renderList();renderScene();});
$$('.filter-options').forEach(group=>group.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;Object.assign(draft,b.dataset);updateFilter();}));
$('#filter-apply').onclick=()=>{for(const k of ['area','category','travel'])state[k]=draft[k];renderScene();if(state.view==='list')renderList();closeDialog($('#filter-dialog'));};
$$('[data-reset]').forEach(b=>b.onclick=reset);
$$('.close-dialog').forEach(b=>{b.innerHTML=icon('close');b.onclick=()=>closeDialog(b.closest('dialog'));});
$$('.sheet-header').forEach(header=>{let start=null;header.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))start={x:e.clientX,y:e.clientY};});header.addEventListener('pointerup',e=>{if(start&&((matchMedia('(orientation:portrait)').matches&&e.clientY-start.y>45)||(matchMedia('(orientation:landscape)').matches&&e.clientX-start.x>55)))closeDialog(header.closest('dialog'));start=null;});header.addEventListener('pointercancel',()=>start=null);});
$$('dialog').forEach(dialog=>{dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closeDialog(dialog);});dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});});
for(const parent of [$('#spot-list'),$('#saved-list')])parent.addEventListener('click',e=>{const saveButton=e.target.closest('[data-save]');if(saveButton){save(saveButton.dataset.save,saveButton);return;}const spot=e.target.closest('[data-spot]');if(spot){state.id=spot.dataset.spot;if(!filtered().some(s=>s.id===state.id)){state.area='all';state.category='all';state.travel='all';state.query='';$('#search').value='';}setView('scenery');renderScene(1);}});
$('#reduce-motion').onchange=e=>{state.reduced=e.target.checked;storage.set('motion',state.reduced);document.body.classList.toggle('reduce-motion',state.reduced);};
$$('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));for(const [id,name] of Object.entries({'fullscreen-button':'fullscreen','scene-save':'bookmark','previous':'previous','next':'next','list-filter':'filter','search-icon':'search','saved-empty-icon':'bookmark'}))$('#'+id).innerHTML=icon(name);
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="http"]');if(a&&!navigator.onLine){e.preventDefault();toast('外部の地図・出典を開くには通信が必要です。');}});
document.addEventListener('keydown',e=>{if(state.view!=='scenery'||$('dialog[open]')||e.target.matches('input'))return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);if(e.key==='Escape')document.body.classList.remove('photo-mode');});
renderScene();

const offlineAssets=['./','./index.html','./style.css','./app.js','./data.js','./photos.js','./budgets.js','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./assets/NotoSerifJP.woff2','./assets/NotoSansJP.woff2','./assets/NotoSerifJP-OFL.txt','./assets/NotoSansJP-OFL.txt',...Object.values(PHOTOS).map(p=>p.path)];
let serviceWorkerReady;
async function updateOfflineState(){try{const c=await caches.open('mikawa-offline-v1');const found=await Promise.all(offlineAssets.map(u=>c.match(new URL(u,location.href).href)));const count=found.filter(Boolean).length;$('#offline-state').textContent=count===offlineAssets.length?'保存済み':count?`${count} / ${offlineAssets.length}`:'未保存';}catch{$('#offline-state').textContent='利用できません';}}
if('serviceWorker'in navigator&&window.isSecureContext){serviceWorkerReady=navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>updateOfflineState()).catch(()=>{$('#offline-state').textContent='利用できません';});}else{$('#offline-state').textContent='利用できません';}
$('#offline-download').onclick=async()=>{const button=$('#offline-download');if(!('caches'in window)||!serviceWorkerReady){toast('この環境ではオフライン保存できません。');return;}button.disabled=true;let count=0;try{await serviceWorkerReady;const cache=await caches.open('mikawa-offline-v1');for(const asset of offlineAssets){const url=new URL(asset,location.href).href;if(!(await cache.match(url))){const response=await fetch(url,{cache:'reload'});if(!response.ok)throw new Error('download');await cache.put(url,response);}$('#offline-state').textContent=`${++count} / ${offlineAssets.length}`;}$('#offline-state').textContent='保存済み';toast('写真と案内をオフライン保存しました。');}catch{toast('保存が途中で止まりました。通信を確認して再試行してください。');await updateOfflineState();}finally{button.disabled=false;}};
