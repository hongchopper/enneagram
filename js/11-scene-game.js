/* =========================================================
   장면 게임 (2026-10-05): 유형을 아는 사람도 함께 노는 '나라면?'
   1) 나라면?      장면 하나에서 나다운 반응 고르기. '여유 있을 때 / 지쳤을 때'를 골라 답한다
   2) 내 반응 지도  고른 반응이 어느 유형 쪽으로 기우는지 쌓아서 보여준다 (유형 판정 아님)
   3) 친구에게      링크로 같은 장면을 보내고, 친구가 고르면 두 반응을 나란히 비교한다 (궁합·점수 없음)
   4) 맞히기       반응 하나를 보고 몇 번의 반응인지 골라 본다
   장면·반응 원문: 비교 > 같은 상황, 다른 이유 (homeScenes, js/00-app-core.js)
   기록: localStorage 'enneagram_scene_picks_v1' { schemaVersion, picks:[{s,t,state,at}] } — 바꿀 때는 migrate를 함께
   ========================================================= */
(function(){
const KEY='enneagram_scene_picks_v1', SCHEMA=1;
const esc=homeEsc, NAME=CHECK_TYPE_NAMES;
const N=t=>`${t}번 ${NAME[t]}`;
const day=homeDayNum();
const scenes=()=>homeScenes();

/* ---------- 기록 ---------- */
function migrate(raw){
  if(!raw || typeof raw!=='object') return {schemaVersion:SCHEMA,picks:[]};
  const list=Array.isArray(raw)?raw:(Array.isArray(raw.picks)?raw.picks:[]);
  const picks=list.filter(p=>p && Number.isInteger(p.s) && Number.isInteger(p.t) && p.t>=1 && p.t<=9)
    .map(p=>({s:p.s,t:p.t,state:p.state==='tired'||p.state==='calm'?p.state:null,at:String(p.at||'')}));
  return {schemaVersion:SCHEMA,picks};
}
function load(){ try{ return migrate(JSON.parse(localStorage.getItem(KEY)||'null')); }catch(e){ return migrate(null); } }
function addPick(s,t,state){
  const d=load();
  d.picks.push({s,t,state:state||null,at:new Date().toISOString()});
  try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){}
}

/* ---------- 공통 ---------- */
let sceneIdx=day%6, mood='calm', guessCount=0, guessRight=0;
/* 반응 네 개: 꼭 넣을 유형(친구가 고른 것)이 있으면 넣고, 나머지는 날마다 다르게 */
function options(sc,must,seed){
  const out=[];
  if(must) out.push(sc.rows.find(r=>r.t===must));
  for(let i=0;out.length<4 && i<40;i++){ const r=sc.rows[(seed*5+i*2)%sc.rows.length]; if(r && !out.includes(r)) out.push(r); }
  return out.filter(Boolean).sort((a,b)=>((a.t*7+seed)%9)-((b.t*7+seed)%9));
}
const optBtn=(attr,r)=>`<button class="game-option" ${attr}="${r.t}" type="button">${esc(r.text)}</button>`;
const SHARE_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M5 12.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.5"/></svg>';

/* ---------- 1) 나라면? ---------- */
function pickCardHTML(){
  const sc=scenes()[sceneIdx]; if(!sc) return '';
  const chip=(k,label)=>`<button class="feed-chip" data-scene-mood="${k}" type="button" aria-pressed="${mood===k}">${label}</button>`;
  return `<article class="game-card" id="scenePick" data-scene="${sceneIdx}"><span class="feed-tag">나라면?</span>`
    +`<h3 class="game-title">${esc(sc.title)}</h3>`
    +`<div class="game-mood" role="group" aria-label="지금의 나">${chip('calm','여유 있을 때')}${chip('tired','지쳤을 때')}</div>`
    +`<p class="game-sub">${mood==='calm'?'여유 있을 때':'지쳤을 때'}의 나라면 어떻게 할까요?</p>`
    +`<div class="game-options">${options(sc,0,day+sceneIdx).map(r=>optBtn('data-scene-pick',r)).join('')}</div>`
    +'<div class="game-result" hidden></div></article>';
}
function revealPick(btn){
  const card=btn.closest('#scenePick'); if(!card || card.classList.contains('is-answered')) return;
  const t=Number(btn.dataset.scenePick), s=Number(card.dataset.scene);
  addPick(s,t,mood);
  card.classList.add('is-answered');
  card.querySelectorAll('.game-option').forEach(b=>{ b.classList.toggle('is-picked',b===btn); b.setAttribute('aria-pressed',String(b===btn)); });
  const res=card.querySelector('.game-result');
  res.innerHTML=`<p class="game-answer" style="${gemVars(t)}"><b>${esc(N(t))}</b>에 가까운 반응이에요.</p>`
    +'<p class="game-note">정답이 아니라, 같은 장면에서도 마음이 향하는 곳이 다르다는 예시예요.</p>'
    +`<div class="game-actions"><button class="btn primary" data-scene-share="${s}-${t}" type="button">${SHARE_ICON}친구에게 물어보기</button>`
    +'<button class="btn secondary is-tinted" data-scene-next type="button">다른 장면</button></div>'
    +'<p class="game-status" role="status"></p>';
  res.hidden=false;
  refreshMap();
}

/* ---------- 4) 맞히기 ---------- */
function guessCardHTML(){
  const all=scenes(); if(!all.length) return '';
  const k=day+guessCount*5, sc=all[k%all.length], row=sc.rows[(k*4+3)%sc.rows.length];
  const others=[1,2,3,4,5,6,7,8,9].filter(t=>t!==row.t);
  const opts=[row.t,others[(k*3)%8],others[(k*3+4)%8]].filter((t,i,a)=>a.indexOf(t)===i).sort((a,b)=>((a*5+k)%9)-((b*5+k)%9));
  return `<article class="game-card" id="sceneGuess" data-answer="${row.t}"><span class="feed-tag">맞히기</span>`
    +'<h3 class="game-title">이 반응, 몇 번일까?</h3>'
    +`<p class="game-sub">${esc(sc.title)}</p><blockquote class="game-quote">${esc(row.text)}</blockquote>`
    +`<div class="game-options is-types">${opts.map(t=>`<button class="game-option" data-scene-guess="${t}" type="button">${esc(N(t))}</button>`).join('')}</div>`
    +'<div class="game-result" hidden></div></article>';
}
function revealGuess(btn){
  const card=btn.closest('#sceneGuess'); if(!card || card.classList.contains('is-answered')) return;
  const ans=Number(card.dataset.answer), t=Number(btn.dataset.sceneGuess), ok=ans===t;
  guessCount++; if(ok) guessRight++;
  card.classList.add('is-answered');
  card.querySelectorAll('.game-option').forEach(b=>{ const v=Number(b.dataset.sceneGuess); b.classList.toggle('is-picked',b===btn); b.classList.toggle('is-answer',v===ans); });
  const res=card.querySelector('.game-result');
  res.innerHTML=`<p class="game-answer" style="${gemVars(ans)}">${ok?'맞았어요. ':''}<b>${esc(N(ans))}</b>의 반응이에요.</p>`
    +`<p class="game-note">${esc(HOME_PROFILES[ans]?.desc||'')}. 같은 행동이라도 이 마음에서 나올 때 ${ans}번에 가까워요.</p>`
    +`<div class="game-actions"><button class="btn secondary is-tinted" data-scene-guess-next type="button">다음 문제</button><span class="game-score">이번에 ${guessCount}문제 중 ${guessRight}개</span></div>`;
  res.hidden=false;
}

/* ---------- 2) 내 반응 지도 ---------- */
function mapCardHTML(){
  const {picks}=load();
  if(!picks.length) return '<div id="sceneMap" hidden></div>';
  const count=list=>{ const c={}; list.forEach(p=>c[p.t]=(c[p.t]||0)+1); return Object.entries(c).map(([t,n])=>[Number(t),n]).sort((a,b)=>b[1]-a[1]||a[0]-b[0]); };
  const all=count(picks), max=all[0][1];
  const top=list=>{ const c=count(list); return c.length?`${c[0][0]}번`:'아직 없음'; };
  return `<article class="game-card game-map" id="sceneMap"><span class="feed-tag">내 반응 지도</span>`
    +`<h3 class="game-title">지금까지 ${picks.length}번 골랐어요</h3>`
    +`<div class="game-bars">${all.slice(0,5).map(([t,n])=>`<div class="game-bar" style="${gemVars(t)}"><span class="game-bar-name">${esc(N(t))}</span><span class="game-bar-track"><span class="game-bar-fill" style="width:${Math.round(n/max*100)}%"></span></span><span class="game-bar-n">${n}번</span></div>`).join('')}</div>`
    +`<div class="game-moods"><div><span class="tcx-k">여유 있을 때</span><b>${top(picks.filter(p=>p.state==='calm'))}</b></div><div><span class="tcx-k">지쳤을 때</span><b>${top(picks.filter(p=>p.state==='tired'))}</b></div></div>`
    +'<p class="game-note">고른 반응은 유형 판정이 아니라, 내가 자주 기우는 쪽을 보여줘요. 여유 있을 때와 지쳤을 때 다르게 고른다면 그것도 좋은 단서예요.</p></article>';
}
function refreshMap(){ const m=document.getElementById('sceneMap'); if(m) m.outerHTML=mapCardHTML(); }

/* 같이 보기의 놀이 카드 하나씩 (2026-10-07, js/12가 고른 놀이만 그린다): 'pick' 나라면? · 'guess' 몇 번일까? · 'map' 내 반응 지도 */
window.scenePart=k=>k==='pick'?pickCardHTML():k==='guess'?guessCardHTML():k==='map'?mapCardHTML():'';
/* 같이 보기 놀이 피드(js/12)에서 고른 반응도 같은 기록(내 반응 지도)에 쌓는다 */
window.sceneAddPick=(s,t,state)=>addPick(s,t,state);
/* 피드에 넣는 묶음 (js/10이 '나라면 어떻게 할까' 섹션에 넣는다) */
window.sceneGameHTML=function(noType){
  return `<div class="game-stack">${pickCardHTML()}${guessCardHTML()}${mapCardHTML()}`
    +(noType?'<button class="btn primary feed-quiz-go" data-quiz-check type="button">간편 검사로 내 유형 확인하기</button>':'')+'</div>';
};

/* ---------- 3) 친구에게 물어보기 ---------- */
async function share(s,t,status){
  const sc=scenes()[s]; if(!sc) return;
  const url=`${location.origin}${location.pathname}#scene=${s}-${t}`;
  const text=`'${sc.title}' 이 장면에서 너라면 어떻게 할 것 같아? 나는 이미 골랐어. 골라 보면 내 답이랑 비교해 줄게.`;
  try{
    if(navigator.share){ await navigator.share({title:'나라면 어떻게 할까?',text,url}); return; }
    await navigator.clipboard.writeText(url);
    if(status) status.textContent='링크를 복사했어요. 친구에게 보내 보세요.';
  }catch(e){
    if(e && e.name==='AbortError') return;
    if(status) status.textContent=`링크를 복사하지 못했어요. 이 주소를 보내 주세요: ${url}`;
  }
}

/* 받은 링크로 들어온 화면: 친구 답은 숨겨 두고 먼저 고르게 한다 → 나란히 비교 */
function showSceneShare(s,friend,push=false){
  const sc=scenes()[s];
  if(!sc || !(friend>=1 && friend<=9)){ showExploreHub(false); return; }
  activateBasePage('post');
  setTopBack('같이 보기',()=>window.openPlay?.('scene'));
  /* 글 화면(post)을 빌려 쓰지만 하단 탭은 같이 보기 */
  document.querySelectorAll('.bottom-tab[data-tab]').forEach(b=>{ const on=b.dataset.tab==='community'; b.classList.toggle('active',on); if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  document.getElementById('shellMobileTitle').textContent='친구가 보낸 장면';
  const view=document.getElementById('postView');
  view.innerHTML=`<article class="post"><figure class="post-hero"><img src="assets/photos/situations.jpg" alt="" width="900" height="600" decoding="async"></figure>`
    +`<header class="post-head"><p class="post-cat">친구가 보낸 장면</p><h1 class="post-title">${esc(sc.title)}</h1>`
    +'<p class="post-lead">친구가 이 장면에서 고른 반응은 아직 숨겨 두었어요. 먼저 나라면 어떻게 할지 골라 보세요.</p></header>'
    +`<div class="game-options is-share" data-share-scene="${s}" data-friend="${friend}">${options(sc,friend,s*3+friend).map(r=>optBtn('data-friend-pick',r)).join('')}</div>`
    +'<div class="game-compare" hidden></div></article>';
  document.getElementById('page-post')?.scrollTo({top:0});
  window.scrollTo({top:0});
  if(push) history.replaceState(null,'',`#scene=${s}-${friend}`);
}
function compare(btn){
  const box=btn.closest('[data-friend]'); if(!box || box.classList.contains('is-answered')) return;
  const s=Number(box.dataset.shareScene), friend=Number(box.dataset.friend), me=Number(btn.dataset.friendPick);
  const sc=scenes()[s], row=t=>sc.rows.find(r=>r.t===t)?.text||'';
  addPick(s,me,null);
  box.classList.add('is-answered');
  box.querySelectorAll('.game-option').forEach(b=>{ const v=Number(b.dataset.friendPick); b.classList.toggle('is-picked',v===me); b.classList.toggle('is-friend',v===friend); });
  const side=(who,t)=>`<div class="game-side" style="${gemVars(t)}"><span class="tcx-k">${who}</span><b>${esc(N(t))}에 가까운 반응</b><p>${esc(row(t))}</p><p class="game-why">${esc(HOME_PROFILES[t]?.desc||'')}</p></div>`;
  const out=box.parentElement.querySelector('.game-compare');
  out.innerHTML=`<h2 class="game-compare-title">${me===friend?'같은 반응을 골랐어요':'같은 장면, 다른 반응'}</h2>`
    +`<div class="game-vs">${side('나',me)}${side('친구',friend)}</div>`
    +`<p class="game-note">${me===friend?'이 장면에서 마음이 향하는 곳이 비슷할 수 있어요. 그래도 고른 이유는 다를 수 있으니 서로 물어보세요.':'누가 맞고 틀린 게 아니라, 같은 장면에서도 먼저 신경 쓰는 게 달라요. 서로 왜 그 반응을 골랐는지 물어보세요.'}</p>`
    +`<div class="game-actions"><button class="btn primary" data-scene-share="${s}-${me}" type="button">${SHARE_ICON}나도 친구에게 물어보기</button>`
    +'<button class="btn secondary is-tinted" data-scene-home type="button">다른 장면 해보기</button>'
    +'<button class="btn secondary is-tinted" data-scene-card type="button">유형 카드로도 비교하기</button></div><p class="game-status" role="status"></p>';
  out.hidden=false;
  out.scrollIntoView({block:'start',behavior:'smooth'});
}

/* ---------- 누르기 ---------- */
document.addEventListener('click',e=>{
  if(!e.target.closest('#page-community, #page-post')) return;
  /* [data-quiz-check](간편 검사 버튼)는 js/10이 #page-community·#page-post에서 맡는다 */
  const mood_=e.target.closest('[data-scene-mood]');
  if(mood_){ mood=mood_.dataset.sceneMood; document.getElementById('scenePick').outerHTML=pickCardHTML(); return; }
  const pick=e.target.closest('[data-scene-pick]');
  if(pick){ revealPick(pick); return; }
  if(e.target.closest('[data-scene-next]')){ sceneIdx=(sceneIdx+1)%Math.max(1,scenes().length); document.getElementById('scenePick').outerHTML=pickCardHTML(); return; }
  const guess=e.target.closest('[data-scene-guess]');
  if(guess){ revealGuess(guess); return; }
  if(e.target.closest('[data-scene-guess-next]')){ document.getElementById('sceneGuess').outerHTML=guessCardHTML(); return; }
  const sh=e.target.closest('[data-scene-share]');
  if(sh){ const [s,t]=sh.dataset.sceneShare.split('-').map(Number); share(s,t,sh.closest('.game-result, .game-compare')?.querySelector('.game-status')); return; }
  const fp=e.target.closest('[data-friend-pick]');
  if(fp){ compare(fp); return; }
  if(e.target.closest('[data-scene-card]')){ showSharePage(); return; } /* 친구와 비교하기 (js/00) */
  if(e.target.closest('[data-scene-home], [data-scene-community]')){ if(window.openPlay) window.openPlay('scene'); else showCommunityPage(); }
});

/* 같이 보기 화면 (하단 탭, 코드 id community, 2026-10-07): 놀이 카드를 고르는 첫 화면. 카드와 고른 놀이는 js/12가 그린다 */
function showCommunityPage(push=true){
  activateBasePage('community');
  document.getElementById('shellMobileTitle').textContent='같이 보기';
  document.getElementById('page-community')?.scrollTo({top:0});
  window.scrollTo({top:0});
  if(push) history.replaceState(null,'','#community');
  closeShellMenu();
}
window.showCommunityPage=showCommunityPage;

/* 홈 '오늘의 장면' · 나의 공간 '내 반응 지도' 요약 (2026-10-07): 오늘 장면 제목, 지금까지 고른 수, 가장 자주 기운 유형 */
window.sceneSummary=function(){
  const {picks}=load(), c={};
  picks.forEach(p=>c[p.t]=(c[p.t]||0)+1);
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0];
  return {title:scenes()[sceneIdx]?.title||'',picks:picks.length,top:top?Number(top[0]):0};
};
/* 나의 공간 '찾은 패턴' (js/02): 여유 있을 때 · 지친 날 따로 가장 많이 고른 유형과 그 수 */
window.sceneMoodTops=function(){
  const {picks}=load();
  const top=state=>{ const c={}; picks.filter(p=>p.state===state).forEach(p=>c[p.t]=(c[p.t]||0)+1); const e=Object.entries(c).sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0]; return e?{t:Number(e[0]),n:e[1],of:picks.filter(p=>p.state===state).length}:null; };
  return {total:picks.length,calm:top('calm'),tired:top('tired')};
};
/* 홈은 js/00이 먼저 그려서 js/02 · 10 · 11 값이 없었다. 마지막 파일인 여기서 다시 그린다 */
if(typeof renderHomeShelves==='function') renderHomeShelves(getHomeProfile());
window.refreshMySpaceScene?.(); /* 나의 공간 장면 반응 수 · 패턴도 */

/* 받은 링크 #scene=<장면>-<친구가 고른 유형> */
function route(){ const m=location.hash.match(/^#scene=(\d+)-([1-9])$/); if(m) showSceneShare(Number(m[1]),Number(m[2])); return !!m; }
window.addEventListener('hashchange',route);
if(!route()){ if(location.hash==='#community') showCommunityPage(false); else if(location.hash==='#explore') showExploreHub(false); }
})();
