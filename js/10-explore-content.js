/* =========================================================
   유형 탐구 = 콘텐츠 피드 + 글 상세 (2026-10-05)
   - 피드(유형 탐구 탭 #page-explore의 #homeExplore. 2026-10-07 같이 보기(장면 게임)와 나눔): 오늘의 글 → 내 유형 이야기 → 주제별 줄(옆으로 넘김) → 더 많은 글(위에 나온 글 빼고 전부, 2열, 스크롤하면 끝까지)
   - 글 상세(#page-post): 모든 글이 같은 블로그 템플릿. 사진 → 분류 → 제목 → 리드 → 본문 → 질문 → 안내 → 이어 읽기
   - 글 목록과 제목은 content/explore-posts.js. 유형별 글 본문은 핸드북 데이터에서 소제목(h3) 단위로 읽어 블로그 문단으로 바꾼다
   카드 그림은 모두 사진(assets/photos). 아이콘·입체 그림은 쓰지 않는다
   ========================================================= */
(function(){
const D=window.EXPLORE_DATA;
if(!D) return;
const esc=homeEsc, NAME=CHECK_TYPE_NAMES;
const N=t=>`${t}번 ${NAME[t]}`;
/* 2026-10-07: 날마다 → 새로고침할 때마다 바뀌게. 페이지를 열 때 한 번 정한 수라, 연 동안에는 글을 보고 돌아와도 같은 줄 */
const day=Math.floor(Math.random()*9973);
/* 줄마다 정해 둔 글 목록도 섞는다: 글마다 페이지를 열 때 한 번 정한 무작위 값 순서로 (연 동안에는 같은 순서) */
const mixKey=new Map();
const keyOf=id=>{ if(!mixKey.has(id)) mixKey.set(id,Math.random()); return mixKey.get(id); };
const mix=ids=>[...ids].sort((a,b)=>keyOf(a)-keyOf(b));

/* ---------- 글 목록 ---------- */
const POSTS=new Map();
D.KINDS.forEach(kd=>{
  /* 사진은 글마다 다르게: assets/photos/posts/<종류>-<번호>.jpg */
  for(let t=1;t<=9;t++) POSTS.set(`${kd.k}-${t}`,{id:`${kd.k}-${t}`,src:'hb',kind:kd.k,t,cat:kd.cat,pic:kd.own?kd.pic:`posts/${kd.k}-${t}`,note:kd.note,h3:kd.h3,
    title:kd.title(N(t),t,NAME[t]),lead:kd.lead(N(t),t)});
});
D.PAGES.forEach(p=>POSTS.set(p.id,{...p}));
D.ARTICLES.forEach(a=>POSTS.set(a.id,{...a,src:'art'}));
/* 다시 쓴 본문 (2026-10-07, docs/콘텐츠_가이드라인.md §0-1): 유형별 글·기초·비교 글을 같은 모양(리드 · 본문 · 질문 · 해볼 것)으로.
   content/type-posts.js에 있으면 그걸 쓰고, 없으면 예전처럼 핸드북·화면 원문에서 읽는다 */
Object.entries(window.EXPLORE_TEXT||{}).forEach(([id,x])=>{ if(POSTS.has(id)) Object.assign(POSTS.get(id),x,{src:'art'}); });
/* 헷갈리는 두 유형 12쌍 (2026-10-05): 비교 > 헷갈리는 유형 원문 + 두 유형의 핵심 두려움·욕망을 엮어 글로. 사진은 '닮은 둘' */
const VS_ASK=['그 행동을 하지 않으면 어떤 기분이 들 것 같나요?','실패했을 때 더 아픈 쪽은 어느 유형의 이유인가요?'];
const VS_TRY='이번 주 비슷한 장면 하나에서, 내가 무엇을 먼저 지키려 했는지 적어 보는 건 어때요?';
homeVsPairs().forEach(v=>{
  const a=Math.min(v.a,v.b), b=Math.max(v.a,v.b), id=`vs-${a}-${b}`;
  const hook=(typeof HOME_VS_HOOK!=='undefined' && HOME_VS_HOOK[`${a}-${b}`])||'뭐가 다를까?';
  POSTS.set(id,{id,src:'vs',a,b,cat:'헷갈리는 유형',pic:`posts/${id}`,meta:`${a}번 vs ${b}번 · 헷갈리는 유형`,
    title:`${a}번 vs ${b}번, ${hook.replace(", "," ")}`,lead:v.same,same:v.same,diff:v.diff,ask:VS_ASK,try:VS_TRY});
});
/* 기도제목 글 (2026-10-08): 보석 닦기의 유형별 · 상태별 기도제목과 말씀(js/02 POLISH_PRAYERS)을 유형마다 한 편으로.
   같은 데이터를 읽기만 해서, 보석 닦기에서 고치면 여기도 같이 바뀐다 */
const PRAY=window.POLISH_PRAYERS||null;
if(PRAY) for(let t=1;t<=9;t++){
  const P=PRAY[t]; if(!P) continue;
  const name=N(t), eul=(c=>c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'을':'를')(name.charCodeAt(name.length-1));
  const li=a=>(a||[]).map(x=>`<li>${esc(x)}</li>`).join('');
  POSTS.set(`pray-${t}`,{id:`pray-${t}`,src:'art',kind:'pray',t,cat:'기도제목',pic:'polish',
    title:`${name}${eul} 위한 기도제목`,
    lead:`“${P.low?.signs?.[0]||''}” 그런 날에도, 빛나는 날에도 꺼내 읽을 기도예요.`,
    body:`<h2>지칠 때</h2><ul>${li(P.low?.prays)}</ul><h2>다듬는 중일 때</h2><ul>${li(P.mid?.prays)}</ul><h2>빛날 때</h2><ul>${li(P.high?.prays)}</ul>`
      +`<h2>함께 읽는 말씀</h2><p>${esc(P.verse||'')}</p>`,
    ask:['세 묶음 가운데 지금 내 마음에 가장 가까운 기도는 무엇인가요?'],
    try:'마음에 닿는 기도 하나를 분석 노트 ‘소원과 기도’에 담아 보기'});
}
/* 주제 태그 (2026-10-08): 글마다 주제를 여러 개. 분류(cat)는 그대로 두고 tags에 더한다.
   종류(KINDS)별로 붙이는 것 + 글 id로 붙이는 것. 필터 패널은 TAG_GROUPS 순서로 묶어 보여준다 */
const KIND_TAGS={
  traits:['유형 이해'],strengths:['유형 이해'],motive:['유형 이해'],immature:['유형 이해'],confused:['헷갈리는 유형'],
  theme:['핵심 패턴'],auto:['핵심 패턴'],childhood:['핵심 패턴','가족'],groups:['핵심 패턴','먼저 반응하는 곳','원하는 걸 얻는 방식','문제 앞에서'],wings:['핵심 패턴'],
  fixation:['핵심 패턴','죄성(유혹)'],
  defense:['방어기제','핵심 패턴'],selfimage:['동일시하는 패턴','핵심 패턴'],fixmind:['핵심 패턴','죄성(유혹)'],stages:['성장'],
  relemo:['관계'],talk:['관계'],praise:['관계'],conflict:['관계'],
  levels:['성장'],signals:['성장'],integration:['성장'],gifts:['성장','영성'],growself:['성장'],grow:['성장'],growtalk:['성장','관계'],
  decide:['일상생활'],energy:['일상생활'],money:['시간','돈','일상생활'],
  love:['사랑'],parenting:['양육','부모','자녀','가족'],
  work:['일','회사에서 일할 때','어울리는 직업'],interview:['일','취업 준비'],lead:['리더십','일'],
  mbti:['MBTI'],pray:['기도제목','영성']
};
const ID_TAGS={
  /* 세 가지 묶음 (2026-10-08): 세 중심 · 호니비언 · 하모닉을 다루는 기존 글. 새 글은 content/group-posts.js의 tags */
  'ov-centers':['먼저 반응하는 곳'],'cmp-centers':['먼저 반응하는 곳'],'r-recover':['먼저 반응하는 곳'],'r-team':['먼저 반응하는 곳'],'r-sport':['먼저 반응하는 곳'],
  'cmp-hornevian':['원하는 걸 얻는 방식'],'cmp-harmonic':['문제 앞에서'],
  'a-mbti':['MBTI'],'r-mbti9':['MBTI'],'r-money':['돈'],'r-love':['사랑'],'r-marriage':['사랑','가족'],'r-fight':['사랑','관계'],
  'r-career':['일','어울리는 직업'],'r-doctor':['일','어울리는 직업'],'r-team':['일','리더십','관계'],
  'r-sport':['일상생활'],'r-recover':['일상생활'],'r-joy':['일상생활'],'a-tired':['일상생활'],'a-other':['관계'],'r-seen':['관계'],
  'r-steady':['성장'],'r-books':['성장'],'a-next':['성장','일상생활']
};
POSTS.forEach(p=>{ p.tags=new Set([p.cat,...(Array.isArray(p.tags)?p.tags:[]),...(KIND_TAGS[p.kind]||[]),...(ID_TAGS[p.id]||[]),...(p.src==='vs'?['헷갈리는 유형','비교']:[])].filter(Boolean)); });
/* 피드에만 있는 바로가기 카드 (글이 아니라 기능 화면으로) */
const GO={'go-diary':{title:'오늘 있었던 장면 하나 이야기하기',cat:'분석 노트',pic:'diary'},'go-polish':{title:'이번 주에 해볼 작은 행동 고르기',cat:'보석 닦기',pic:'polish'}};

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
  const meta=p.meta||(p.t?`${N(p.t)} · ${p.cat}`:p.cat);
  const attr=GO[id]?`data-go="${id.slice(3)}"`:`data-post="${id}"`;
  return `<button class="feed-post" ${attr} type="button"><span class="feed-post-pic">${pic(p.pic)}</span>`
    +`<strong class="feed-post-title">${esc(p.title)}</strong><span class="feed-post-meta">${esc(meta)}</span></button>`;
}
const rail=(ids,wide)=>`<div class="shelf-rail feed-post-rail${wide?' is-wide':''}">${ids.map(card).join('')}</div>`;
const section=(key,title,inner)=>`<section class="feed-collection" aria-labelledby="fc-${key}"><h2 class="explore-hub-sub" id="fc-${key}">${title}</h2>${inner}</section>`;

/* ---------- 필터 (2026-10-08): 유형 칩 줄(탭) 대신 '필터' 버튼 → 아래에서 올라오는 패널에서 유형 · 주제를 여러 개 고른다 ----------
   고른 것은 위 줄에 칩으로 남고(× 로 빼기), 아무것도 안 골랐을 때는 그 자리에 자주 쓰는 빠른 필터(내 유형 · 처음이라면 · 헷갈리는 유형 · 관계)를 둔다.
   유형은 그 유형 글(두 유형 비교 글은 둘 중 하나라도), 주제는 글 분류. 유형끼리 · 주제끼리는 '또는', 유형과 주제 사이는 '그리고' */
const TAG_GROUPS=[
  ['삶의 장면',['일','취업 준비','회사에서 일할 때','어울리는 직업','리더십','관계','사랑','가족','부모','자녀','양육','일상생활','시간','돈']],
  ['마음 들여다보기',['성장','방어기제','동일시하는 패턴','죄성(유혹)','기도제목','영성','핵심 패턴','마음 돌보기']],
  /* 세 중심 · 호니비언 · 하모닉. 태그는 쉬운 말, 용어는 글 본문에서 */
  ['세 가지 묶음',['먼저 반응하는 곳','원하는 걸 얻는 방식','문제 앞에서']],
  ['유형 알아보기',['처음이라면','유형 이해','헷갈리는 유형','비교','MBTI']]
];
/* 글이 하나도 없는 주제는 패널에 보이지 않는다 (예: 아직 쓰지 않은 주제) */
const TAGS=TAG_GROUPS.flatMap(([,l])=>l).filter(g=>[...POSTS.values()].some(p=>p.tags.has(g)));
const filter={types:new Set(),tags:new Set()};
const isFiltering=()=>filter.types.size>0||filter.tags.size>0;
const typesOf=p=>p.src==='vs'?[p.a,p.b]:p.t?[p.t]:p.types||[]; /* MBTI 글(content/mbti-posts.js)은 자주 보이는 번호들 */
const matches=(p,fl=filter)=>(!fl.types.size||typesOf(p).some(t=>fl.types.has(t)))&&(!fl.tags.size||[...fl.tags].some(g=>p.tags.has(g)));
const matchIds=(fl=filter)=>[...POSTS.values()].filter(p=>matches(p,fl)).map(p=>p.id);
function filterHTML(){
  const n=filter.types.size+filter.tags.size;
  const chip=(attr,val,label,on,extra='')=>`<button class="feed-chip" ${attr}="${esc(String(val))}" type="button" aria-pressed="${on}"${extra}>${label}</button>`;
  let row;
  if(n){
    row=[...filter.types].sort((x,y)=>x-y).map(t=>chip('data-filter-remove',`t:${t}`,`${esc(N(t))} <span aria-hidden="true">×</span>`,true,` aria-label="${esc(N(t))} 필터 빼기"`)).join('')
      +[...filter.tags].map(g=>chip('data-filter-remove',`g:${g}`,`#${esc(g)} <span aria-hidden="true">×</span>`,true,` aria-label="${esc(g)} 필터 빼기"`)).join('')
      +'<button class="feed-more explore-filter-clear" data-filter-clear type="button">초기화</button>';
  }else{
    const t=myType();
    row=(t?chip('data-filter-quick',`t:${t}`,`내 유형 · ${esc(N(t))}`,false):'')
      +['처음이라면','헷갈리는 유형','관계','성장'].map(g=>chip('data-filter-quick',`g:${g}`,`#${esc(g)}`,false)).join('');
  }
  return `<div class="feed-filters"><div class="explore-filter-bar">`
    +`<button class="explore-filter-btn${n?' is-on':''}" data-filter-open type="button" aria-haspopup="dialog" aria-controls="exploreFilterSheet">`
    +`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>필터${n?` <b>${n}</b>`:''}</button>`
    +`<div class="shelf-rail feed-chip-row explore-filter-row" role="group" aria-label="${n?'고른 필터':'빠른 필터'}">${row}</div></div></div>`;
}
function filteredHTML(){
  const ids=feedList;
  const label=[...[...filter.types].sort((x,y)=>x-y).map(N),...[...filter.tags].map(g=>'#'+g)].join(' · ');
  if(!ids.length) return `<p class="feed-empty">${esc(label)}에 맞는 글이 아직 없어요. 필터를 하나 빼 보세요.</p>`;
  return section('filtered',`${esc(label)} 글 ${ids.length}편`,`<div class="feed-post-grid" id="feedAll">${ids.slice(0,12).map(card).join('')}</div>`
    +'<div class="feed-sentinel" aria-hidden="true"></div>');
}
/* 다른 화면(유형 카드 '글 보기' · 글의 #태그)에서 부르는 예전 모양 {t, tag}도 받는다 */
window.setExploreFilter=(f)=>{
  filter.types=new Set(f.t?[Number(f.t)]:[]);
  filter.tags=new Set(f.tag?[f.tag]:[]);
};

/* ---------- 필터 패널 (아래에서 올라오는 시트). 고르는 동안은 draft, 'N편 보기'를 눌러야 적용 ---------- */
let draft=null, sheetOpener=null;
function sheetHTML(){
  const n=matchIds(draft).length;
  const chip=(attr,val,label,on)=>`<button class="feed-chip" ${attr}="${esc(String(val))}" type="button" aria-pressed="${on}">${esc(label)}</button>`;
  return '<div class="xf-backdrop" data-xf-close></div>'
    +'<div class="xf-panel" role="dialog" aria-modal="true" aria-labelledby="xfTitle">'
    +'<div class="xf-head"><h2 class="xf-title" id="xfTitle">필터</h2><button class="xf-close" data-xf-close type="button" aria-label="필터 닫기">×</button></div>'
    +'<div class="xf-body">'
    +`<h3 class="xf-sub">유형 <small>여러 개 고를 수 있어요</small></h3><div class="xf-chips">${[1,2,3,4,5,6,7,8,9].map(t=>chip('data-xf-type',t,N(t),draft.types.has(t))).join('')}</div>`
    +TAG_GROUPS.map(([label,list])=>{ const l=list.filter(g=>TAGS.includes(g)); return l.length?`<h3 class="xf-sub">${esc(label)}</h3><div class="xf-chips">${l.map(g=>chip('data-xf-tag',g,g,draft.tags.has(g))).join('')}</div>`:''; }).join('')
    +'</div>'
    +`<div class="xf-foot"><button class="ui-btn ui-btn-ghost" data-xf-reset type="button">초기화</button>`
    +`<button class="ui-btn ui-btn-primary" data-xf-apply type="button">${n?`${n}편 보기`:'맞는 글이 없어요'}</button></div></div>`;
}
function sheetEl(){
  let el=document.getElementById('exploreFilterSheet');
  if(!el){ el=document.createElement('div'); el.id='exploreFilterSheet'; el.className='xf-sheet'; el.hidden=true; document.body.appendChild(el); el.addEventListener('click',onSheetClick); }
  return el;
}
function openSheet(opener){
  draft={types:new Set(filter.types),tags:new Set(filter.tags)};
  sheetOpener=opener||null;
  const el=sheetEl(); el.innerHTML=sheetHTML(); el.hidden=false;
  document.getElementById('page-explore')?.classList.add('is-sheet-open');
  el.querySelector('.xf-close')?.focus();
}
function closeSheet(){
  const el=document.getElementById('exploreFilterSheet'); if(!el || el.hidden) return;
  el.hidden=true; draft=null;
  document.getElementById('page-explore')?.classList.remove('is-sheet-open');
  (document.querySelector('#exploreFeed [data-filter-open]')||sheetOpener)?.focus();
}
function redrawSheet(focusSel){
  const el=sheetEl(), y=el.querySelector('.xf-body')?.scrollTop||0;
  el.innerHTML=sheetHTML();
  const body=el.querySelector('.xf-body'); if(body) body.scrollTop=y;
  if(focusSel) el.querySelector(focusSel)?.focus();
}
function applyFilter(){
  const y=document.querySelector('#exploreFeed .feed-filters')?.getBoundingClientRect().top;
  window.renderExploreFeed();
  if(y<0) document.querySelector('#exploreFeed .feed-filters')?.scrollIntoView({block:'start'});
}
function onSheetClick(e){
  if(e.target.closest('[data-xf-close]')){ closeSheet(); return; }
  const ty=e.target.closest('[data-xf-type]'), tg=e.target.closest('[data-xf-tag]');
  if(ty){ const t=Number(ty.dataset.xfType); draft.types.has(t)?draft.types.delete(t):draft.types.add(t); redrawSheet(`[data-xf-type="${t}"]`); return; }
  if(tg){ const g=tg.dataset.xfTag; draft.tags.has(g)?draft.tags.delete(g):draft.tags.add(g); redrawSheet(`[data-xf-tag="${CSS.escape(g)}"]`); return; }
  if(e.target.closest('[data-xf-reset]')){ draft={types:new Set(),tags:new Set()}; redrawSheet('[data-xf-reset]'); return; }
  if(e.target.closest('[data-xf-apply]')){
    filter.types=draft.types; filter.tags=draft.tags; closeSheet(); applyFilter();
    document.querySelector('#exploreFeed [data-filter-open]')?.focus({preventScroll:true}); /* 목록을 새로 그려서 버튼도 새것 */
  }
}
document.addEventListener('keydown',e=>{
  const el=document.getElementById('exploreFilterSheet'); if(!el || el.hidden) return;
  if(e.key==='Escape'){ closeSheet(); return; }
  if(e.key==='Tab'){ /* 패널 안에서만 돌게 */
    const f=[...el.querySelectorAll('.xf-panel button')]; if(!f.length) return;
    if(e.shiftKey && document.activeElement===f[0]){ e.preventDefault(); f[f.length-1].focus(); }
    else if(!e.shiftKey && document.activeElement===f[f.length-1]){ e.preventDefault(); f[0].focus(); }
  }
});


/* ---------- 피드 ---------- */
/* 오늘의 글: 유형이 있으면 내 유형 글 중 하나, 없으면 처음 오는 사람을 위한 글. 홈 '오늘 읽을 글'도 같은 글로 시작 */
function todayPostId(t){
  const kinds=D.KINDS.map(k=>k.k);
  return t?`${kinds[day%kinds.length]}-${t}`:['a-mbti','r-guess','a-many','r-money','ov-basics','r-love','a-allme','r-science','cmp-glance','a-change'][day%10];
}
window.exploreTodayPost=()=>{ const p=POSTS.get(todayPostId(myType())); return p?{id:p.id,title:p.title}:null; };
/* 홈 '오늘 읽을 글' (2026-10-07): 오늘의 글 + 내 유형(없으면 처음 오는 사람을 위한) 글 넷. 사진 카드 줄. 나머지는 유형 탐구에서 */
window.exploreHomeRailHTML=function(){
  const t=myType(), kinds=D.KINDS.map(k=>k.k), hero=todayPostId(t);
  const more=t?kinds.map((_,i)=>`${kinds[(day+i)%kinds.length]}-${t}`):mix(['a-mbti','r-guess','a-change','r-science','ov-basics','r-colors']);
  return rail([hero,...more.filter(id=>id!==hero && POSTS.has(id))].slice(0,5),true);
};
let allOrder=null;
window.renderExploreFeed=function(){
  const box=document.getElementById('exploreFeed');
  if(!box) return;
  if(isFiltering()){ feedList=matchIds(); feedShown=12; box.innerHTML=filterHTML()+filteredHTML(); watchSentinel(); return; }
  const t=myType(), vs=homeVsPairs();
  const kinds=D.KINDS.map(k=>k.k);
  const heroId=todayPostId(t);
  /* 한 화면에 같은 글(같은 사진)은 한 번만: 줄마다 앞에서 나온 글을 뺀다 */
  const seen=new Set([heroId]);
  const railOnce=(ids,wide)=>rail(mix(ids).filter(id=>!seen.has(id) && seen.add(id)),wide);
  let html=filterHTML()+section('today','오늘의 글',`<div class="feed-post-single">${card(heroId)}</div>`);
  if(t){
    const mine=kinds.map((_,i)=>`${kinds[(day+i)%kinds.length]}-${t}`).filter(id=>id!==heroId).slice(0,10);
    html+=section('mine',`${N(t)} 이야기`,railOnce(mine,true));
  }
  html+=section('start','처음 왔다면 여기부터',railOnce(['a-mbti','r-guess','a-change','r-science','ov-basics','r-colors','ov-core','r-mbti9','ov-centers','cmp-glance','ov-use'],true));
  html+=section('confused','나 혹시 몇 번? 헷갈릴 때 읽는 글',railOnce(['a-many','a-allme','cmp-confused','cmp-motives','cmp-situations',...pick(['confused','traits'],8)]));
  /* 두 유형 비교(VS)는 한 섹션에 줄이 두 개면 헷갈려서 따로 (2026-10-05) */
  html+=section('vs','닮은 두 유형, 뭐가 다를까?',railOnce([...POSTS.values()].filter(x=>x.src==='vs').map(x=>x.id)));
  html+=section('auto','머릿속 자동 재생 버튼',railOnce(pick(['auto','theme','fixation'],9,1)));
  html+=section('people','사람 사이에서 우리는',railOnce(['a-other','r-seen','cmp-hornevian',...pick(['talk','conflict','relemo','praise'],8,2)]));
  html+=section('love','연애할 때, 가족일 때',railOnce(['r-love','r-fight','r-marriage',...pick(['love','parenting'],8,3)]));
  html+=section('work','일하고 돈 쓸 때',railOnce(['r-money','r-career','cmp-harmonic','r-team','r-doctor',...pick(['work','money','lead','interview','decide','energy'],9,4)]));
  /* MBTI 글 (2026-10-08): MBTI 16가지 · 네 글자 축. 내 유형이 있으면 그 번호가 자주 보이는 MBTI 글부터 */
  const mx=[...POSTS.values()].filter(x=>x.cat==='MBTI'&&x.src==='art'&&x.types).sort((a,b)=>(t&&b.types.includes(t))-(t&&a.types.includes(t))).map(x=>x.id);
  html+=section('mbti','MBTI랑 겹쳐 보면',rail(mx.filter(id=>!seen.has(id)&&seen.add(id)).slice(0,12)));
  /* 세 가지 묶음 (2026-10-08, content/group-posts.js): 세 중심 · 호니비언 · 하모닉 */
  /* 묶음마다 전체 보기 → 세 그룹 순서 그대로 */
  html+=section('groups','세 가지 묶음으로 보면',rail(['g-centers','g-gut','g-heart','g-head','g-horn','g-assert','g-withdrawn','g-compliant','g-harm','g-positive','g-competent','g-reactive'].filter(id=>!seen.has(id)&&seen.add(id))));
  html+=section('variation','같은 번호, 다른 사람',railOnce(['r-rare',...pick(['wings','groups','mbti','motive','strengths'],9,5)]));
  html+=section('tired','지칠 때 꺼내 읽는 글',railOnce(['a-tired','r-recover','r-joy','r-sport','ov-growth',...pick(['immature','integration','signals','levels'],7,6)])
    +'<p class="feed-care">여기 있는 내용은 성격 패턴을 이해하기 위한 것이지, 마음 상태를 진단하는 것이 아니에요. 힘든 마음이 여러 날 이어진다면 믿을 수 있는 사람이나 전문가에게 이야기해보세요.'
    +'<span class="feed-care-tel"><a href="tel:109">109</a> 자살예방상담전화 · <a href="tel:15770199">1577-0199</a> 정신건강위기상담</span></p>');
  html+=section('next','이번 주, 작은 실천 하나',railOnce(['a-next','r-steady','r-books',...pick(['grow','growtalk','gifts','growself'],8,7),'go-diary','go-polish']));
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
  if(p.src==='vs'){
    const [da,db]=await Promise.all([getTypeProfile(p.a),getTypeProfile(p.b)]);
    const side=(t,d)=>`<h2>${esc(N(t))}가 지키려는 것</h2>`
      +(d.fear?`<p><strong>핵심 두려움</strong><br>${esc(d.fear)}</p>`:'')+(d.desire?`<p><strong>핵심 욕망</strong><br>${esc(d.desire)}</p>`:'')
      +(d.thought?`<blockquote>${esc(d.thought)}</blockquote>`:'');
    return `<h2>닮은 점</h2><p>${esc(p.same)}</p><h2>갈리는 지점</h2><p>${esc(p.diff)}</p>`+side(p.a,da)+side(p.b,db);
  }
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
  if(p.src==='vs'){
    const others=[...POSTS.values()].filter(x=>x.src==='vs' && x.id!==p.id).map(x=>x.id);
    const two=['confused','traits','theme'].flatMap(k=>[`${k}-${p.a}`,`${k}-${p.b}`]);
    return section('postOthers','다른 두 유형도 볼까요?',rail(others))+section('postSame',`${p.a}번과 ${p.b}번 더 알아보기`,rail(two));
  }
  if(p.t){
    const others=[1,2,3,4,5,6,7,8,9].filter(x=>x!==p.t).map(x=>`${p.kind}-${x}`);
    const ks=D.KINDS.map(k=>k.k), i=ks.indexOf(p.kind);
    const same=[1,2,3,4,5,6,7,8].map(d=>`${ks[(i+d)%ks.length]}-${p.t}`);
    return section('postOthers','다른 번호는 어떨까?',rail(others))+section('postSame',`${N(p.t)} 이야기 더 보기`,rail(same));
  }
  const ids=[...(p.more||[]).map(ref),...[...POSTS.values()].filter(x=>!x.t && x.cat===p.cat && x.id!==p.id).map(x=>x.id)];
  return section('postMore','함께 읽으면 좋은 글',rail([...new Set(ids)].filter(id=>id!==p.id).slice(0,8)));
}
/* 참여 블록 (가이드라인 9-5 F3 퀴즈 · F4 O/X · F8 미션). 고르면 바로 아래에 해설 */
const playHTML=p=>(p.quiz?`<section class="post-play" data-quiz><h2>${esc(p.quiz.q)}</h2><div class="post-opts">${p.quiz.opts.map((o,i)=>`<button class="feed-chip" data-quiz-opt="${i}" type="button" aria-pressed="false">${esc(o.a)}</button>`).join('')}</div><p class="post-play-result" aria-live="polite"></p></section>`:'')
  +(p.ox?`<section class="post-play"><h2>맞을까, 아닐까?</h2><ol class="post-ox">${p.ox.map((x,i)=>`<li data-ox="${i}"><p>${esc(x.q)}</p><div class="post-opts"><button class="feed-chip" data-ox-pick="1" type="button" aria-pressed="false">맞아요</button><button class="feed-chip" data-ox-pick="0" type="button" aria-pressed="false">아니에요</button></div><p class="post-play-result" aria-live="polite"></p></li>`).join('')}</ol></section>`:'')
  +(p.mission?`<section class="post-play"><h2>${esc(p.mission.title)}</h2><ul class="post-mission">${p.mission.items.map(t=>`<li><label><input type="checkbox"><span>${esc(t)}</span></label></li>`).join('')}</ul></section>`:'')
  +(p.cta?`<p class="post-cta"><button class="btn primary" ${p.cta.check?'data-quiz-check':`data-go="${esc(p.cta.go)}"`} type="button">${esc(p.cta.label)}</button></p>`:'');
function onPlay(e){
  const p=POSTS.get(currentPost);
  const q=e.target.closest('[data-quiz-opt]');
  if(q && p?.quiz){
    const box=q.closest('[data-quiz]');
    box.querySelectorAll('[data-quiz-opt]').forEach(b=>b.setAttribute('aria-pressed',String(b===q)));
    box.querySelector('.post-play-result').textContent=p.quiz.opts[Number(q.dataset.quizOpt)].r;
    return true;
  }
  const o=e.target.closest('[data-ox-pick]');
  if(o && p?.ox){
    const li=o.closest('[data-ox]'), x=p.ox[Number(li.dataset.ox)], pick=o.dataset.oxPick==='1';
    li.querySelectorAll('[data-ox-pick]').forEach(b=>b.setAttribute('aria-pressed',String(b===o)));
    li.querySelector('.post-play-result').textContent=(pick===x.o?'맞혔어요. ':`정답은 “${x.o?'맞아요':'아니에요'}”예요. `)+x.r;
    return true;
  }
  return false;
}
let postToken=0, currentPost='';
async function showPost(id,push=true){
  const p=POSTS.get(id);
  if(!p){ showExploreHub(push); return; }
  const token=++postToken;
  currentPost=id;
  activateBasePage('post');
  document.getElementById('shellMobileTitle').textContent='유형 탐구';
  const view=document.getElementById('postView');
  const lead=p.lead||(p.src==='ov'||p.src==='cmp'?pageLead(p):'');
  view.innerHTML=`<article class="post"><figure class="post-hero">${pic(p.pic).replace(' loading="lazy"','')}</figure>`
    +`<header class="post-head"><p class="post-cat">${esc(p.meta||((p.t?`${N(p.t)} · `:'')+p.cat))}</p><h1 class="post-title">${esc(p.title)}</h1>${lead?`<p class="post-lead">${esc(lead)}</p>`:''}</header>`
    +'<div class="post-body"><p class="post-loading">불러오는 중</p></div>'
    +playHTML(p)
    +(p.ask?`<section class="post-ask"><h2>스스로 물어볼 질문</h2><ul>${p.ask.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></section>`:'')
    +(p.try?`<section class="post-ask post-try"><h2>이번 주 해볼 것</h2><p>${esc(p.try)}</p></section>`:'')
    +(p.cite?`<p class="post-src">${p.cite.map(esc).join('<br>')}</p>`:'')
    +(p.note?NOTES[p.note]:'')
    +(p.t?`<p class="post-fine">${esc(N(p.t))}에 가까울 때 자주 보이는 패턴이에요. 모든 ${p.t}번이 이렇다는 뜻은 아니에요.</p>`
      :'')
    +`<div class="post-tags">${(p.src==='vs'?[p.a,p.b]:p.t?[p.t]:[]).map(t=>`<button class="feed-chip" data-tag-type="${t}" type="button">#${esc(N(t))}</button>`).join('')}</div>`
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
  view.innerHTML=`<div class="shelf-rail feed-chip-row type-chip-row" role="group" aria-label="유형 고르기">${chips}</div>`
    +'<div class="type-summary"><p class="ui-loading">요약을 준비하고 있어요</p></div>';
  document.getElementById('page-type')?.scrollTo({top:0});
  window.scrollTo({top:0});
  view.querySelector('[aria-pressed="true"]')?.scrollIntoView({block:'nearest',inline:'center'});
  if(push) history.replaceState(null,'',`#type-${n}`);
  closeShellMenu();
  const d=await getTypeProfile(n);
  if(token!==typeToken) return;
  const count=[...POSTS.values()].filter(p=>p.t===n).length;
  const ks=D.KINDS.map(k=>k.k);
  const rec=ks.map((_,i)=>`${ks[(day+i*3)%ks.length]}-${n}`).filter((x,i,a)=>a.indexOf(x)===i).slice(0,10);
  const SHARE_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M5 12.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.5"/></svg>';
  view.querySelector('.type-summary').innerHTML=typeCardHTML(d,{
    kicker:`${n}번 유형`,
    note:'유형은 나를 단정하는 이름표가 아니라, 반복되는 반응을 살펴보는 틀이에요.'
  }).replace('<article class="type-card-pro','<article data-source="유형 탐구" class="type-card-pro')
    +`<div class="type-actions"><button class="btn primary type-save" data-type-image="${n}" type="button">이미지로 저장하기</button>`
    +`<button class="type-share" data-type-share="${n}" type="button" aria-label="링크로 공유하기" title="링크로 공유하기">${SHARE_ICON}</button></div>`
    +`<section class="type-more" aria-labelledby="typeMoreTitle"><h2 class="explore-hub-sub" id="typeMoreTitle">${esc(N(n))} 이야기 ${count}편</h2>${rail(rec)}</section>`;
}
window.showTypeSummary=showTypeSummary;
document.getElementById('page-type')?.addEventListener('click',e=>{
  const go=e.target.closest('[data-type-go]');
  if(go){ showTypeSummary(Number(go.dataset.typeGo)); return; }
  if(e.target.closest('[data-post-back]')){ showExploreHub(); return; }
  const img=e.target.closest('[data-type-image]');
  if(img){ saveTypeCardImage(Number(img.dataset.typeImage),'유형 탐구'); return; }
  const sh=e.target.closest('[data-type-share]');
  if(sh){ showSharePage(); document.querySelector(`#shareApp [data-share-type="${sh.dataset.typeShare}"]`)?.click(); return; }
  const post=e.target.closest('[data-post]');
  if(post) showPost(post.dataset.post);
});

/* ---------- 누르기 ---------- */
function onClick(e){
  if(onPlay(e)) return;
  const post=e.target.closest('[data-post]');
  if(post){ showPost(post.dataset.post); return; }
  const go=e.target.closest('[data-go]');
  if(go){
    if(go.dataset.go==='diary' && typeof showDiaryPage==='function') showDiaryPage();
    else if(go.dataset.go==='polish' && typeof showPolishPage==='function') showPolishPage();
    return;
  }
  if(e.target.closest('[data-post-back]')){ showExploreHub(); return; }
  if(e.target.closest('[data-quiz-check]')){ showCheckTarget('quick'); return; }
  const fo=e.target.closest('[data-filter-open]');
  if(fo){ openSheet(fo); return; }
  const fr=e.target.closest('[data-filter-remove], [data-filter-quick]');
  if(fr){
    const [k,v]=(fr.dataset.filterRemove||fr.dataset.filterQuick).split(/:(.*)/s);
    const set=k==='t'?filter.types:filter.tags, val=k==='t'?Number(v):v;
    if(fr.dataset.filterRemove) set.delete(val); else set.add(val);
    applyFilter(); return;
  }
  if(e.target.closest('[data-filter-clear]')){ filter.types=new Set(); filter.tags=new Set(); applyFilter(); return; }
  const tt=e.target.closest('[data-tag-type]'), tc=e.target.closest('[data-tag-cat]');
  if(tt||tc){ window.setExploreFilter(tt?{t:Number(tt.dataset.tagType),tag:''}:{t:0,tag:tc.dataset.tagCat}); showExploreHub(); return; }

}
/* 같이 보기(#page-community)의 '간편 검사로 내 유형 확인하기'도 여기서 맡는다 */
document.getElementById('page-explore')?.addEventListener('click',onClick);
document.getElementById('page-community')?.addEventListener('click',onClick);
document.getElementById('page-post')?.addEventListener('click',onClick);

/* 직접 링크 #post-<id> (00-app-core.js의 직접 링크 처리 뒤에 실행) */
const m=location.hash.match(/^#post-(.+)$/); let m2=null;
if(m) showPost(decodeURIComponent(m[1]),false);
else if((m2=location.hash.match(/^#(?:type|handbook)-([1-9])/))) showTypeSummary(Number(m2[1]),false); /* 예전 핸드북 주소도 요약으로 */
else window.renderExploreFeed(); /* 유형 탐구 탭 피드. #explore 주소는 js/11이 연다 */
})();
