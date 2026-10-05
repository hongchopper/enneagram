/* =========================================================
   유형 탐구 = 콘텐츠 피드 + 글 상세 (2026-10-05)
   - 피드(#page-explore): 오늘의 글 → 내 유형 이야기 → 주제별 줄(옆으로 넘김) → 더 많은 글(위에 나온 글 빼고 전부, 2열, 스크롤하면 끝까지)
   - 글 상세(#page-post): 모든 글이 같은 블로그 템플릿. 사진 → 분류 → 제목 → 리드 → 본문 → 질문 → 안내 → 이어 읽기
   - 글 목록과 제목은 content/explore-posts.js. 유형별 글 본문은 핸드북 데이터에서 소제목(h3) 단위로 읽어 블로그 문단으로 바꾼다
   카드 그림은 모두 사진(assets/photos). 아이콘·입체 그림은 쓰지 않는다
   ========================================================= */
(function(){
const D=window.EXPLORE_DATA;
if(!D) return;
const esc=homeEsc, NAME=CHECK_TYPE_NAMES;
const N=t=>`${t}번 ${NAME[t]}`;
const day=homeDayNum();

/* ---------- 글 목록 ---------- */
const POSTS=new Map();
D.KINDS.forEach(kd=>{
  /* 사진은 글마다 다르게: assets/photos/posts/<종류>-<번호>.jpg */
  for(let t=1;t<=9;t++) POSTS.set(`${kd.k}-${t}`,{id:`${kd.k}-${t}`,src:'hb',kind:kd.k,t,cat:kd.cat,pic:`posts/${kd.k}-${t}`,note:kd.note,h3:kd.h3,
    title:kd.title(N(t),t,NAME[t]),lead:kd.lead(N(t),t)});
});
D.PAGES.forEach(p=>POSTS.set(p.id,{...p}));
D.ARTICLES.forEach(a=>POSTS.set(a.id,{...a,src:'art'}));
/* 피드에만 있는 바로가기 카드 (글이 아니라 기능 화면으로) */
const GO={'go-diary':{title:'오늘 있었던 장면 하나 적어 보기',cat:'다이어리',pic:'diary'},'go-polish':{title:'이번 주에 해볼 작은 행동 고르기',cat:'보석 닦기',pic:'polish'}};

const myType=()=>getHomeProfile()?.type||0;
/* 'more'에 적힌 종류 이름(예: 'mbti')은 내 유형(없으면 오늘의 유형) 글로 */
const ref=r=>POSTS.has(r)?r:`${r}-${myType()||(day%9)+1}`;
/* 여러 종류를 섞어 유형이 겹치지 않게 count개. 날마다 순서가 바뀐다 */
function pick(kinds,count,offset=0){
  const out=[];
  for(let i=0;out.length<count && i<count*4;i++){
    const id=`${kinds[i%kinds.length]}-${((day+offset+i*4)%9)+1}`;
    if(!out.includes(id)) out.push(id);
  }
  return out;
}

/* ---------- 카드 ---------- */
const pic=f=>`<img src="assets/photos/${f}.jpg" alt="" width="900" height="600" loading="lazy" decoding="async">`;
function card(id){
  const p=POSTS.get(id)||GO[id];
  if(!p) return '';
  const meta=p.t?`${N(p.t)} · ${p.cat}`:p.cat;
  const attr=GO[id]?`data-go="${id.slice(3)}"`:`data-post="${id}"`;
  return `<button class="feed-post" ${attr} type="button"><span class="feed-post-pic">${pic(p.pic)}</span>`
    +`<strong class="feed-post-title">${esc(p.title)}</strong><span class="feed-post-meta">${esc(meta)}</span></button>`;
}
const rail=(ids,wide)=>`<div class="shelf-rail feed-post-rail${wide?' is-wide':''}">${ids.map(card).join('')}</div>`;
const section=(key,title,inner)=>`<section class="feed-collection" aria-labelledby="fc-${key}"><h2 class="explore-hub-sub" id="fc-${key}">${title}</h2>${inner}</section>`;

/* ---------- 필터: 유형 칩 + 주제 태그 (하나씩 고른다) ---------- */
const TAGS=['처음이라면','헷갈리는 유형','유형 이해','핵심 패턴','관계','사랑과 가족','생활','일','성장','마음 돌보기','비교'];
const filter={t:0,tag:''};
function filterHTML(){
  const chip=(attr,val,label,on)=>`<button class="feed-chip" ${attr}="${val}" type="button" aria-pressed="${on}">${esc(label)}</button>`;
  return `<div class="feed-filters"><div class="shelf-rail feed-chip-row" role="group" aria-label="유형으로 보기">${chip('data-filter-type',0,'전체 유형',!filter.t)}${[1,2,3,4,5,6,7,8,9].map(t=>chip('data-filter-type',t,N(t),filter.t===t)).join('')}</div>`
    +'</div>';
}
function filteredHTML(){
  const ids=[...POSTS.values()].filter(p=>(!filter.t||p.t===filter.t)&&(!filter.tag||p.cat===filter.tag)).map(p=>p.id);
  const label=[filter.t?N(filter.t):'',filter.tag?'#'+filter.tag:''].filter(Boolean).join(' · ');
  if(!ids.length) return `<p class="feed-empty">${esc(label)}에 맞는 글이 아직 없어요. 다른 유형이나 주제를 골라 보세요.</p>`;
  return section('filtered',`${esc(label)} 글 ${ids.length}편`,`<div class="feed-post-grid" id="feedAll">${ids.slice(0,12).map(card).join('')}</div>`
    +'<div class="feed-sentinel" aria-hidden="true"></div>');
}
window.setExploreFilter=(f)=>{ Object.assign(filter,f); };

/* ---------- 피드 ---------- */
let allOrder=null;
window.renderExploreFeed=function(){
  const box=document.getElementById('exploreFeed');
  if(!box) return;
  if(filter.t||filter.tag){ feedList=[...POSTS.values()].filter(p=>(!filter.t||p.t===filter.t)&&(!filter.tag||p.cat===filter.tag)).map(p=>p.id); feedShown=12; box.innerHTML=filterHTML()+filteredHTML(); watchSentinel(); return; }
  const t=myType(), vs=homeVsPairs();
  const kinds=D.KINDS.map(k=>k.k);
  /* 오늘의 글: 유형이 있으면 내 유형 글 중 하나, 없으면 처음 오는 사람을 위한 글 */
  const heroId=t?`${kinds[day%kinds.length]}-${t}`:['a-mbti','a-many','ov-basics','a-allme','cmp-glance','a-change'][day%6];
  /* 한 화면에 같은 글(같은 사진)은 한 번만: 줄마다 앞에서 나온 글을 뺀다 */
  const seen=new Set([heroId,'cmp-situations']);
  const railOnce=(ids,wide)=>rail(ids.filter(id=>!seen.has(id) && seen.add(id)),wide);
  let html=filterHTML()+section('today','오늘의 글',`<div class="feed-post-single">${card(heroId)}</div>`);
  if(t){
    const mine=kinds.map((_,i)=>`${kinds[(day+i)%kinds.length]}-${t}`).filter(id=>id!==heroId).slice(0,10);
    html+=section('mine',`${N(t)} 이야기`,railOnce(mine,true));
  }
  html+=section('start','처음 왔다면 여기부터',railOnce(['a-mbti','a-change','ov-basics','ov-core','ov-centers','cmp-glance','ov-use'],true));
  html+=section('confused','나 혹시 몇 번? 헷갈릴 때 읽는 글',railOnce(['a-many','a-allme','cmp-confused','cmp-motives',...pick(['confused','traits'],8)])
    +`<div class="shelf-rail feed-vs-rail">${vs.map(v=>homeVsCardHTML(v).replace('data-shelf-compare="confused"',`data-shelf-compare="confused" data-vs-pair="${v.a}-${v.b}"`)).join('')}</div>`);
  html+=section('quiz','나라면 어떻게 할까',homeQuizHTML(day)+`<div class="feed-post-single">${card('cmp-situations')}</div>`);
  html+=section('auto','머릿속 자동 재생 버튼',railOnce(pick(['auto','theme','fixation'],9,1)));
  html+=section('people','사람 사이에서 우리는',railOnce(['a-other','cmp-hornevian',...pick(['talk','conflict','relemo','praise'],8,2)]));
  html+=section('love','연애할 때, 가족일 때',railOnce(pick(['love','parenting'],9,3)));
  html+=section('work','일하고 돈 쓸 때',railOnce(['cmp-harmonic',...pick(['work','money','lead','interview','decide','energy'],9,4)]));
  html+=section('variation','같은 번호, 다른 사람',railOnce(pick(['wings','groups','mbti','motive','strengths'],9,5)));
  html+=section('tired','지칠 때 꺼내 읽는 글',railOnce(['a-tired','ov-growth',...pick(['immature','integration','signals','levels'],7,6)])
    +'<p class="feed-care">여기 있는 내용은 성격 패턴을 이해하기 위한 것이지, 마음 상태를 진단하는 것이 아니에요. 힘든 마음이 여러 날 이어진다면 믿을 수 있는 사람이나 전문가에게 이야기해보세요.'
    +'<span class="feed-care-tel"><a href="tel:109">109</a> 자살예방상담전화 · <a href="tel:15770199">1577-0199</a> 정신건강위기상담</span></p>');
  html+=section('next','이번 주, 작은 실천 하나',railOnce(['a-next',...pick(['grow','growtalk','gifts','growself'],8,7),'go-diary','go-polish']));
  /* 더 많은 글: 위 줄에 나온 글은 빼고 나머지 전부. 날마다 섞인 순서로, 스크롤하면 끝까지 */
  const ids=[...POSTS.keys()];
  const mixed=ids.map((id,i)=>[id,(i*7919+day*104729)%ids.length]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  allOrder=mixed.filter(id=>!seen.has(id));
  feedList=allOrder; feedShown=12;
  /* 제목 없이 위 줄들에 이어서 2열 목록 */
  html+=`<section class="feed-collection" aria-label="글 목록"><div class="feed-post-grid" id="feedAll">${allOrder.slice(0,feedShown).map(card).join('')}</div>`
    +'<div class="feed-sentinel" aria-hidden="true"></div></section>';
  html+='<p class="feed-foot">에니어그램은 나를 진단하는 도구가 아니라 살펴보는 틀이에요.</p>';
  box.innerHTML=html;
  watchSentinel();
};
/* 목록 끝이 화면 가까이 오면 다음 12편. 다 보여주면 관찰을 멈춘다 */
let feedList=[], feedShown=12, feedObserver=null;
function loadMore(){
  const end=document.querySelector('#exploreFeed .feed-sentinel');
  if(!end || feedShown>=feedList.length) return;
  const grid=document.getElementById('feedAll');
  const next=feedList.slice(feedShown,feedShown+12);
  feedShown+=next.length;
  grid?.insertAdjacentHTML('beforeend',next.map(card).join(''));
  if(feedShown>=feedList.length){ feedObserver?.disconnect(); end.remove(); }
}
function watchSentinel(){
  feedObserver?.disconnect();
  const end=document.querySelector('#exploreFeed .feed-sentinel');
  if(!end || !('IntersectionObserver' in window)) return;
  feedObserver=new IntersectionObserver(entries=>{ if(entries.some(x=>x.isIntersecting)) loadMore(); },{rootMargin:'0px 0px 600px 0px'});
  feedObserver.observe(end);
}
/* 관찰자를 못 쓰는 환경 대비: 스크롤할 때마다 끝 표시가 화면 아래 600px 안에 오면 이어 붙인다 */
document.addEventListener('scroll',()=>{
  const end=document.querySelector('#page-explore.active .feed-sentinel');
  if(end && end.getBoundingClientRect().top<innerHeight+600) loadMore();
},{capture:true,passive:true});

/* ---------- 글 본문: 핸드북 HTML → 블로그 문단 ---------- */
const BLOCK=new Set(['DIV','SECTION','ARTICLE','HEADER','FOOTER','ASIDE','P','UL','OL','LI','H1','H2','H3','H4','H5','H6','TABLE','BLOCKQUOTE','FIGURE','DL','DT','DD','NAV','MAIN','THEAD','TBODY','TR']);
const DROP=new Set(['SCRIPT','STYLE','BUTTON','IMG','SVG','FIGURE','NAV','INPUT','SELECT']);
/* 번호 배지·영어 대문자 라벨(PATTERN LOOP 등)·단계 숫자는 뺀다 */
const skip=el=>DROP.has(el.tagName)
  || /badge|subsection-no|chapter-number|eyebrow|subgroup-no|section-nav|hero-animal|(^|[\s_-])no($|[\s_-])|number|step-num/.test(el.className||'')
  || /^[A-Z0-9 ·&/.,'-]{2,}$/.test((el.textContent||'').trim());
function inl(n){
  if(n.nodeType===3) return esc(n.textContent);
  if(n.nodeType!==1 || skip(n)) return '';
  const inner=[...n.childNodes].map(inl).join('');
  if(n.tagName==='B'||n.tagName==='STRONG') return inner.trim()?`<strong>${inner}</strong> `:'';
  if(n.tagName==='BR') return '<br>';
  return BLOCK.has(n.tagName)?` ${inner} `:inner;
}
function tableHTML(tb){
  const rows=[...tb.querySelectorAll('tr')].map(tr=>`<tr>${[...tr.children].map(c=>`<${c.tagName==='TH'?'th':'td'}>${inl(c).trim()}</${c.tagName==='TH'?'th':'td'}>`).join('')}</tr>`).join('');
  return rows?`<div class="post-table"><table>${rows}</table></div>`:'';
}
function blk(node){
  let out='', buf='';
  const flush=()=>{ const s=buf.replace(/\s+/g,' ').trim(); if(s) out+=`<p>${s}</p>`; buf=''; };
  for(const c of node.childNodes){
    if(c.nodeType===3){ buf+=esc(c.textContent); continue; }
    if(c.nodeType!==1 || skip(c)) continue;
    const tag=c.tagName;
    if(!BLOCK.has(tag)){ buf+=inl(c); continue; }
    flush();
    /* 짧은 이름표 + 설명 두 칸(예: '상황' / '기준에 어긋난 점이 보인다')은 한 문단으로 */
    const kids=[...c.children].filter(x=>!skip(x));
    const leaf=x=>![...x.querySelectorAll('*')].some(y=>BLOCK.has(y.tagName));
    if(!/^(H[1-6]|UL|OL|TABLE|LI)$/.test(tag) && kids.length===2 && kids.every(leaf)
      && kids[0].textContent.trim().length<=16 && kids[1].textContent.trim().length>kids[0].textContent.trim().length){
      out+=`<p><strong>${esc(kids[0].textContent.replace(/\s+/g,' ').trim())}</strong><br>${inl(kids[1]).replace(/\s+/g,' ').trim()}</p>`;
      continue;
    }
    if(/^H[1-6]$/.test(tag)){ const s=c.textContent.replace(/\s+/g,' ').trim(); if(s) out+=`<h3>${esc(s)}</h3>`; }
    else if(tag==='P'){ const s=inl(c).replace(/\s+/g,' ').trim(); if(s) out+=`<p>${s}</p>`; }
    else if(tag==='UL'||tag==='OL'){
      const lis=[...c.children].filter(li=>li.tagName==='LI').map(li=>inl(li).replace(/\s+/g,' ').trim()).filter(Boolean).map(s=>`<li>${s}</li>`).join('');
      if(lis) out+=`<${tag.toLowerCase()}>${lis}</${tag.toLowerCase()}>`;
    }
    else if(tag==='TABLE') out+=tableHTML(c);
    else if(tag==='BLOCKQUOTE'){ const s=inl(c).replace(/\s+/g,' ').trim(); if(s) out+=`<blockquote>${s}</blockquote>`; }
    else out+=blk(c);
  }
  flush();
  return out;
}

const typeDocs={};
async function typeDoc(t){
  if(typeDocs[t]) return typeDocs[t];
  const store=await window.getHandbookStore();
  typeDocs[t]=new DOMParser().parseFromString(`<body>${store[t]||''}</body>`,'text/html');
  return typeDocs[t];
}
const h3Text=h=>h.textContent.replace(/\s+/g,' ').trim();
/* 소제목(h3) 하나의 내용: h3를 품은 section에 h3가 하나뿐이면 그 section, 아니면 다음 h3 전까지의 형제들 */
function topicNode(doc,name){
  const h=[...doc.querySelectorAll('h3')].find(x=>h3Text(x).startsWith(name));
  if(!h) return null;
  const box=doc.createElement('div');
  const sec=h.closest('section');
  if(sec && sec.querySelectorAll('h3').length===1){
    const c=sec.cloneNode(true);
    const ch=c.querySelector('h3'); (ch.closest('.title')||ch).remove();
    box.append(c);
    return box;
  }
  let start=h; while(start.parentElement && start.parentElement.children.length===1+[...start.parentElement.children].filter(x=>x!==start && skip(x)).length && start.parentElement.tagName!=='BODY') start=start.parentElement;
  for(let n=start.nextElementSibling;n && !n.querySelector('h3') && n.tagName!=='H3';n=n.nextElementSibling) box.append(n.cloneNode(true));
  return box;
}
async function bodyHTML(p){
  if(p.src==='art') return p.body;
  if(p.src==='ov'||p.src==='cmp'){
    const panel=p.src==='ov'
      ?document.querySelector(`#page-overview .overview-panel[data-overview-key="${p.key}"]`)
      :document.querySelector(`#page-compare [data-compare-panel="${p.key}"]`);
    if(!panel) return '';
    const c=panel.cloneNode(true);
    c.querySelectorAll('.overview-hero, .compare-section-hero, .explore-chips, figure').forEach(x=>x.remove());
    return blk(c);
  }
  const doc=await typeDoc(p.t);
  return p.h3.map(name=>{
    const n=topicNode(doc,name);
    if(!n) return '';
    return (p.h3.length>1?`<h2>${esc(name)}</h2>`:'')+blk(n);
  }).join('');
}
/* 기초·비교 글 리드: 그 화면 맨 위 설명 문장 */
function pageLead(p){
  const sel=p.src==='ov'?`#page-overview .overview-panel[data-overview-key="${p.key}"] .overview-hero p`:`#page-compare [data-compare-panel="${p.key}"] .compare-section-hero p`;
  return document.querySelector(sel)?.textContent.trim()||'';
}

/* ---------- 글 상세 ---------- */
const NOTES={
  child:'<p class="post-note">어린 시절 이야기는 실제로 그런 말을 들었다는 뜻이 아니에요. 어린 내가 상황을 어떻게 받아들였는지 살펴보는 거예요. 부모나 누군가의 탓을 찾는 글이 아니에요.</p>',
  kid:'<p class="post-note">아이는 성격이 아직 자라는 중이에요. 아이에게 번호를 붙이기보다, 부모인 나의 반응을 먼저 살펴보는 데 써 주세요.</p>',
  care:'<div class="post-note">여기 있는 내용은 성격 패턴을 이해하기 위한 것이지, 마음 상태를 진단하는 것이 아니에요. 힘든 마음이 여러 날 이어진다면 믿을 수 있는 사람이나 전문가에게 이야기해보세요.'+D.TEL+'</div>'
};
function moreRails(p){
  if(p.t){
    const others=[1,2,3,4,5,6,7,8,9].filter(x=>x!==p.t).map(x=>`${p.kind}-${x}`);
    const ks=D.KINDS.map(k=>k.k), i=ks.indexOf(p.kind);
    const same=[1,2,3,4,5,6,7,8].map(d=>`${ks[(i+d)%ks.length]}-${p.t}`);
    return section('postOthers','다른 번호는 어떨까?',rail(others))+section('postSame',`${N(p.t)} 이야기 더 보기`,rail(same));
  }
  const ids=[...(p.more||[]).map(ref),...[...POSTS.values()].filter(x=>!x.t && x.cat===p.cat && x.id!==p.id).map(x=>x.id)];
  return section('postMore','함께 읽으면 좋은 글',rail([...new Set(ids)].filter(id=>id!==p.id).slice(0,8)));
}
let postToken=0;
async function showPost(id,push=true){
  const p=POSTS.get(id);
  if(!p){ showExploreHub(push); return; }
  const token=++postToken;
  activateBasePage('post');
  document.getElementById('shellMobileTitle').textContent='유형 탐구';
  const view=document.getElementById('postView');
  const lead=p.lead||(p.src==='ov'||p.src==='cmp'?pageLead(p):'');
  view.innerHTML=`<div class="post-top"><button class="feed-chip" data-post-back type="button">‹ 유형 탐구</button></div>`
    +`<article class="post"><figure class="post-hero">${pic(p.pic).replace(' loading="lazy"','')}</figure>`
    +`<header class="post-head"><p class="post-cat">${p.t?`${esc(N(p.t))} · `:''}${esc(p.cat)}</p><h1 class="post-title">${esc(p.title)}</h1>${lead?`<p class="post-lead">${esc(lead)}</p>`:''}</header>`
    +'<div class="post-body"><p class="post-loading">불러오는 중</p></div>'
    +(p.ask?`<section class="post-ask"><h2>스스로 물어볼 질문</h2><ul>${p.ask.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></section>`:'')
    +(p.note?NOTES[p.note]:'')
    +(p.t?`<p class="post-fine">${esc(N(p.t))}에 가까울 때 자주 보이는 패턴이에요. 모든 ${p.t}번이 이렇다는 뜻은 아니에요.</p>`
      :'')
    +`<div class="post-tags">${p.t?`<button class="feed-chip" data-tag-type="${p.t}" type="button">#${esc(N(p.t))}</button>`:''}</div>`
    +`</article><div class="post-more">${moreRails(p)}</div>`;
  document.getElementById('page-post')?.scrollTo({top:0});
  window.scrollTo({top:0});
  if(push) history.replaceState(null,'',`#post-${id}`);
  closeShellMenu();
  let html='';
  try{ html=await bodyHTML(p); }catch(err){ console.error(err); }
  if(token!==postToken) return;
  view.querySelector('.post-body').innerHTML=html||'<p>글을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>';
}
window.showExplorePost=showPost;
/* 검색(js/06)이 글 목록을 읽는다 */
window.getExplorePostList=()=>[...POSTS.values()].map(p=>({id:p.id,title:p.title,lead:p.lead||p.hook||'',cat:p.cat,typeName:p.t?N(p.t):''}));

/* ---------- 유형 요약 (핸드북 대신): 검사 결과와 같은 카드 ---------- */
let typeToken=0;
async function showTypeSummary(n,push=true){
  n=Number(n);
  if(!Number.isInteger(n)||n<1||n>9) n=1;
  const token=++typeToken;
  activateBasePage('type');
  document.getElementById('shellMobileTitle').textContent=`유형 탐구 · ${N(n)}`;
  const view=document.getElementById('typeView');
  const chips=[1,2,3,4,5,6,7,8,9].map(t=>`<button class="feed-chip" data-type-go="${t}" type="button" aria-pressed="${t===n}">${esc(N(t))}</button>`).join('');
  view.innerHTML=`<div class="post-top"><button class="feed-chip" data-post-back type="button">‹ 유형 탐구</button></div>`
    +`<div class="shelf-rail feed-chip-row type-chip-row" role="group" aria-label="유형 고르기">${chips}</div>`
    +'<div class="type-summary"><p class="ui-loading">요약을 준비하고 있어요</p></div>';
  document.getElementById('page-type')?.scrollTo({top:0});
  window.scrollTo({top:0});
  view.querySelector('[aria-pressed="true"]')?.scrollIntoView({block:'nearest',inline:'center'});
  if(push) history.replaceState(null,'',`#type-${n}`);
  closeShellMenu();
  const d=await getTypeProfile(n);
  if(token!==typeToken) return;
  const count=[...POSTS.values()].filter(p=>p.t===n).length;
  view.querySelector('.type-summary').innerHTML=typeCardHTML(d,{
    kicker:`${n}번 유형`,
    note:'유형은 나를 단정하는 이름표가 아니라, 반복되는 반응을 살펴보는 틀이에요.',
    actions:[
      {label:`${n}번 글 ${count}편 모두 보기`,attr:'data-tcp-posts',primary:true},
      {label:'내 유형으로 저장하기',attr:'data-tcp-save'},
      {label:'링크로 공유하기',attr:'data-tcp-share'},
      {label:'이미지로 저장하기',attr:'data-tcp-image'}
    ]
  }).replace('<article class="type-card-pro','<article data-source="유형 탐구" class="type-card-pro');
}
window.showTypeSummary=showTypeSummary;
document.getElementById('page-type')?.addEventListener('click',e=>{
  const go=e.target.closest('[data-type-go]');
  if(go){ showTypeSummary(Number(go.dataset.typeGo)); return; }
  if(e.target.closest('[data-post-back]')) showExploreHub();
});

/* ---------- 누르기 ---------- */
function onClick(e){
  const post=e.target.closest('[data-post]');
  if(post){ showPost(post.dataset.post); return; }
  const go=e.target.closest('[data-go]');
  if(go){
    if(go.dataset.go==='diary' && typeof showDiaryPage==='function') showDiaryPage();
    else if(go.dataset.go==='polish' && typeof showPolishPage==='function') showPolishPage();
    return;
  }
  if(e.target.closest('[data-post-back]')){ showExploreHub(); return; }
  const ft=e.target.closest('[data-filter-type]'), fg=e.target.closest('[data-filter-tag]');
  if(ft||fg){
    if(ft) filter.t=Number(ft.dataset.filterType); else filter.tag=fg.dataset.filterTag;
    const y=document.querySelector('#exploreFeed .feed-filters')?.getBoundingClientRect().top;
    window.renderExploreFeed();
    if(y<0) document.querySelector('#exploreFeed .feed-filters')?.scrollIntoView({block:'start'});
    return;
  }
  const tt=e.target.closest('[data-tag-type]'), tc=e.target.closest('[data-tag-cat]');
  if(tt||tc){ window.setExploreFilter(tt?{t:Number(tt.dataset.tagType),tag:''}:{t:0,tag:tc.dataset.tagCat}); showExploreHub(); return; }

}
document.getElementById('page-explore')?.addEventListener('click',onClick);
document.getElementById('page-post')?.addEventListener('click',onClick);

/* 직접 링크 #post-<id> (00-app-core.js의 직접 링크 처리 뒤에 실행) */
const m=location.hash.match(/^#post-(.+)$/); let m2=null;
if(m) showPost(decodeURIComponent(m[1]),false);
else if((m2=location.hash.match(/^#(?:type|handbook)-([1-9])/))) showTypeSummary(Number(m2[1]),false); /* 예전 핸드북 주소도 요약으로 */
else if(document.getElementById('page-explore')?.classList.contains('active')) window.renderExploreFeed();
})();
