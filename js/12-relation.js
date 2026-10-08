/* =========================================================
   같이 보기 = 오늘의 놀이 덱 (2026-10-07, 하단 탭 #page-community, 내용은 content/relation-cards.js)
   카드가 한 번에 다 펼쳐져 있으면 날것 같아서, 섞은 다섯 장을 한 장씩 넘긴다 (뒤에 다음 카드가 살짝 겹쳐 보이는 덱).
   답하면 카드 안에 결과가 나오고 '다음 카드'. 다섯 장을 다 하면 마무리 카드(고른 반응 모음 · 5장 더 · 종류 골라 하기).
   카드 종류: 나라면?(장면에서 나다운 반응) · 몇 번일까?(반응 보고 맞히기) · 닮은 두 유형 · 둘이서 질문(답하고 보내기)
            · 이렇게 말해 볼까?(내 유형 팁 + 문장) · 오늘 물어볼 말 · 내 반응 지도 · 유형 카드 비교
   마무리 카드의 칩(나라면? · 맞히기 · 둘이서 · 말 연습)을 고르면 그 종류로만 다섯 장을 다시 섞는다.
   장면 · 반응 원문은 비교 > 같은 상황, 다른 이유(homeScenes), 닮은 두 유형은 비교 > 헷갈리는 유형(homeVsPairs).
   '나라면?'에서 고른 반응은 장면 게임과 같은 기록(enneagram_scene_picks_v1, js/11)에 쌓인다.
   2026-10-08: 위에 분할 탭 [대화 카드 | 놀이]. 대화 카드(content/talk-cards.js)는 덱과 따로, 관계를 고르고 카드 더미에서 한 장씩 뽑는다.
   마주 앉아 돌아가며 답하는 질문이라 답을 받거나 기록하지 않는다. 고른 관계만 이 기기에 기억(enneagram_talk_rel_v1), 뽑은 카드는 이번에 연 동안만
   받은 질문 링크 #pair=<base64url(JSON)> {v:1, m, q, a, x(40자), n(12자)}는 덱 위에 고정 카드로 연다. 이 파일은 따로 기록을 남기지 않는다
   ========================================================= */
(function(){
const R=window.RELATION_DATA;
if(!R) return;
const esc=homeEsc, NAME=CHECK_TYPE_NAMES;
const N=t=>`${t}번 ${NAME[t]}`;
const myType=()=>getHomeProfile()?.type||0;
const rnd=n=>Math.floor(Math.random()*n);
const pickOne=list=>list[rnd(list.length)];
const shuffle=list=>{ const a=[...list]; for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const PAIR_VERSION=1;
const modeOf=k=>R.PAIR.find(x=>x.k===k)||R.PAIR[0];
const talkOf=k=>R.TALK.find(x=>x.k===k)||R.TALK[0];

/* ---------- 대화 카드: 카드 더미에서 한 장씩 뽑기 ---------- */
const TC=window.TALK_CARDS;
const REL_KEY='enneagram_talk_rel_v1';
let mode=TC?'talk':'play'; /* 위 분할 탭: talk 대화 카드 · play 놀이 */
let rel=(()=>{ try{ return localStorage.getItem(REL_KEY)||''; }catch(e){ return ''; } })();
let depth='all';
let ttype=myType()||1; /* '에니어그램 번호'를 골랐을 때 상대 번호(1~9) 또는 'center'(머리 · 가슴 · 장) */
let drawn=[]; /* 이번에 뽑은 카드 {r,tt,d,q}. 맨 뒤가 지금 카드 */
const usedT=new Set();
/* 관계 하나 = {k,label,color,color2,art,hint,light,mid,deep}. 'type'은 고른 번호의 카드(TC.TYPE[번호])로 그때그때 만든다 */
function relOf(k,tt=ttype){
  if(k==='type' && TC.TYPE){
    const base=TC.RELS.find(x=>x.k==='type')||{}, T=TC.TYPE[tt]||TC.TYPE[1];
    const isC=tt==='center';
    return {...base,k:'type',tt,label:isC?'머리 · 가슴 · 장':N(tt),color:isC?base.color:`--type-${tt}`,color2:isC?base.color2:`--type-${tt}-soft`,light:T.light||[],mid:T.mid||[],deep:T.deep||[]};
  }
  return TC.RELS.find(x=>x.k===k)||TC.RELS[0];
}
if(TC && !TC.RELS.some(x=>x.k===rel)) rel=TC.RELS[0].k;
/* 카드 한 장의 모양 (2026-10-08 세 번째): [질문, 예시1, 예시2] 질문 · {t:'bal',a,b} 밸런스 게임 · {t:'mis',q,tip} 미션 */
const cardOf=c=>relOf(c.r,c.tt)[c.d][c.q];
const kindOf=c=>{ const x=cardOf(c); return Array.isArray(x)?'q':x.t; };
const qOf=c=>{ const x=cardOf(c); return Array.isArray(x)?x[0]:x.t==='bal'?`${x.a} vs ${x.b}`:x.q; };
const exOf=c=>{ const x=cardOf(c); return Array.isArray(x)?x.slice(1):[]; };
/* 앞면 그림 · 색: 질문 주제로 (content/talk-cards.js TOPICS). 밸런스 게임은 저울, 미션은 폭죽, 번호 카드는 그 유형 보석 */
function topicOf(c,no){
  const sp=TC.SPARE||[relOf(c.r,c.tt).color], spin={color:sp[no%sp.length],color2:sp[(no+3)%sp.length]};
  const k=kindOf(c);
  if(k==='bal') return {art:'balance_scale',...spin};
  if(k==='mis') return {art:'party_popper',...spin};
  if(c.r==='type' && c.tt!=='center') return {gem:c.tt,color:`--type-${c.tt}`,color2:`--type-${c.tt}-soft`};
  const q=qOf(c), t=(TC.TOPICS||[]).find(([re])=>re.test(q));
  if(t) return {art:t[1],color:t[2],color2:t[3]};
  return {art:relOf(c.r,c.tt).art,...spin};
}
const keyOf=c=>`${c.r}-${c.tt||''}-${c.d}-${c.q}`;
function talkPool(){
  const r=relOf(rel), ds=depth==='all'?['light','mid','deep']:[depth];
  const all=ds.flatMap(d=>r[d].map((_,q)=>({r:r.k,tt:r.k==='type'?ttype:undefined,d,q})));
  let pool=all.filter(c=>!usedT.has(keyOf(c)));
  if(!pool.length){ all.forEach(c=>usedT.delete(keyOf(c))); pool=all; } /* 다 뽑으면 다시 섞는다 */
  return pool;
}
function drawTalk(){
  const pool=talkPool(); if(!pool.length) return;
  const c=pickOne(pool);
  usedT.add(keyOf(c));
  drawn.push(c);
}
/* 카드 뽑기 느낌 (2026-10-08): 뒷면이 보이는 카드 더미(남은 장수만큼 두께) → 누르거나 위로 밀면 맨 위 카드가 들려 올라가고,
   질문 카드가 위에서 떨어지듯 내려앉는다. 관계 · 깊이를 바꾸면 더미를 섞는다. 깊이 카드는 표시를 따로. 움직임 줄이기 설정이면 바로 바뀐다 */
let landing=false, shuffling=false, busy=false;
/* 세로 카드 (2026-10-08 두 번째): 트럼프 카드처럼 3:4. 관계마다 보석 색(--rc), 앞면은 그림 · 질문 · 예시 답 · 답하는 요령.
   처음엔 큰 카드 더미 하나, 뽑은 뒤엔 질문 카드 아래에 작은 더미 + '한 장 더 뽑기' */
const DEPTH_N={light:1,mid:2,deep:3};
const pips=d=>`<span class="talk-pips" aria-hidden="true">${[1,2,3].map(i=>`<i class="${i<=DEPTH_N[d]?'is-on':''}"></i>`).join('')}</span>`;
function talkHTML(){
  const r=relOf(rel), cur=drawn[drawn.length-1];
  const chip=(attr,val,label,on)=>`<button class="feed-chip" ${attr}="${val}" type="button" aria-pressed="${on}">${esc(label)}</button>`;
  const left=talkPool().length, layers=Math.min(3,Math.max(0,left-1));
  const rc=x=>`--rc:var(${relOf(x).color});--rc2:var(${relOf(x).color2||relOf(x).color})`;
  /* 토스 연말 카드처럼: 뒤에 색이 다른 카드 두 장이 비껴 겹치고, 앞면은 보석 색 면 + 그림 뒤로 번지는 빛 */
  const card=cur?(()=>{ const cr=relOf(cur.r,cur.tt), tp=topicOf(cur,drawn.length), kd=kindOf(cur), x=cardOf(cur); return `<div class="talk-show${landing?' is-landing':''}" style="--rc:var(${tp.color});--rc2:var(${tp.color2})"><span class="talk-show-back is-a" aria-hidden="true"></span><span class="talk-show-back is-b" aria-hidden="true"></span>`
      +`<article class="talk-card is-${cur.d}" aria-live="polite"><span class="talk-glow" aria-hidden="true"></span>`
      +`<div class="talk-card-corner"><span class="talk-card-depth">${kd==='q'?pips(cur.d)+esc(TC.DEPTH[cur.d]):kd==='bal'?'밸런스 게임':'미션'}</span><span class="talk-card-no">No.${String(drawn.length).padStart(2,'0')}</span></div>`
      +`<p class="talk-card-rel">${kd==='q'?`${cr.ask?esc(cr.ask):esc(cr.label)+(cr.k==='type'?(cur.tt==='center'?' 카드':'에 가까운 사람에게 묻기'):'에게 묻기')}`:kd==='bal'?'둘 중 하나만 고른다면?':'지금 바로 해 봐요'}</p>`
      +(kd==='bal'
        ?`<div class="talk-bal"><span>${esc(x.a)}</span><b aria-hidden="true">VS</b><span>${esc(x.b)}</span></div>`
        :`<h3 class="talk-q">${esc(kd==='mis'?x.q:qOf(cur))}</h3>`)
      +`<div class="talk-card-art">${tp.gem?gemImg(tp.gem,'art3d',true):`<img class="art3d" src="assets/illust/${tp.art}.png" alt="" width="256" height="256" decoding="async">`}</div>`
      +(kd==='q'?`<div class="talk-ex"><p class="talk-ex-title">이렇게 답해도 좋아요</p><ul>${exOf(cur).map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>`:'')
      +`<p class="talk-tip">${esc(kd==='q'?TC.TIP[cur.d]:kd==='bal'?'동시에 손가락으로 가리키고, 고른 이유를 한 문장씩 말해요.':(x.tip||''))}</p>`
      +'<div class="talk-card-actions"><button class="talk-copy" data-talk-copy type="button">질문 복사</button></div>'
      +'<p class="game-status" role="status"></p></article></div>'; })():'';
  const back=(cls,inner)=>`<span class="talk-glow" aria-hidden="true"></span><span class="talk-back-face"><img class="art3d" src="assets/illust/${r.art}.png" alt="" width="256" height="256" decoding="async">${inner}</span>`;
  const stack=cur
    ?`<button class="talk-more${shuffling?' is-shuffling':''}" data-talk-draw type="button" style="${rc(rel)}">`
      +`<span class="talk-mini" aria-hidden="true">${Array.from({length:Math.min(2,layers)},(_,i)=>`<span class="talk-mini-card" style="--i:${i+1}"></span>`).join('')}<span class="talk-mini-card talk-stack-top"></span></span>`
      +`<span class="talk-more-text"><b>한 장 더 뽑기</b><small>${esc(r.label)} 카드 ${left}장 남았어요</small></span></button>`
    :`<div class="talk-stack${shuffling?' is-shuffling':''}" style="${rc(rel)}">`
      +Array.from({length:layers},(_,i)=>`<span class="talk-stack-card" style="--i:${layers-i}" aria-hidden="true"></span>`).join('')
      +`<button class="talk-stack-top" data-talk-draw type="button" aria-label="${esc(r.label)} 대화 카드 한 장 뽑기, 남은 카드 ${left}장">`
      +back('',`<span class="talk-back-title">${esc(r.label)}</span><span class="talk-back-sub">대화 카드 ${left}장</span>`)
      +'</button></div><p class="talk-stack-hint">카드를 누르거나 위로 밀어서 한 장 뽑아요</p>';
  const past=drawn.slice(0,-1).reverse().slice(0,10);
  return '<section class="talk-draw" aria-label="대화 카드">'
    +'<div class="pf-rel-bar"><p class="pf-rel-title" id="pfRelTitle">누구와 이야기해요?</p>'
    +`<div class="shelf-rail feed-chip-row" role="group" aria-labelledby="pfRelTitle">${TC.RELS.map(x=>chip('data-talk-rel',x.k,x.label,x.k===rel)).join('')}</div></div>`
    +(rel==='type'&&TC.TYPE?`<div class="shelf-rail feed-chip-row talk-types" role="group" aria-label="상대 번호">${[1,2,3,4,5,6,7,8,9].map(t=>chip('data-talk-type',t,N(t),ttype===t)).join('')}${chip('data-talk-type','center','머리 · 가슴 · 장',ttype==='center')}</div>`:'')
    +`<div class="ui-chips talk-depths" role="group" aria-label="질문 깊이">${[['all','전부'],...Object.entries(TC.DEPTH)].map(([k,l])=>chip('data-talk-depth',k,l,k===depth)).join('')}</div>`
    +card+stack
    +(past.length?`<div class="talk-past"><h3 class="talk-past-title">앞에서 뽑은 카드</h3><ol>${past.map(c=>`<li><span>${esc(relOf(c.r,c.tt).label)} · ${esc(kindOf(c)==='q'?TC.DEPTH[c.d]:kindOf(c)==='bal'?'밸런스 게임':'미션')}</span>${esc(qOf(c))}</li>`).join('')}</ol></div>`:'')
    +'</section>';
}
const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function renderTalk(){
  render(); landing=false; shuffling=false;
}
function doDraw(){
  if(busy) return;
  const top=document.querySelector('#playFeed .talk-stack-top');
  drawTalk();
  if(navigator.userActivation?.hasBeenActive){ try{ navigator.vibrate?.(12); }catch(err){} } /* 폰에서 살짝 진동 */
  const land=()=>{ busy=false; landing=true; renderTalk(); const c=document.querySelector('#playFeed .talk-card'); c?.scrollIntoView({block:'nearest',behavior:reduceMotion()?'auto':'smooth'}); document.querySelector('#playFeed .talk-stack-top')?.focus({preventScroll:true}); };
  if(reduceMotion()||!top){ land(); return; }
  busy=true; top.classList.add('is-drawing');
  setTimeout(land,240);
}
/* 위로 밀어서 뽑기: 맨 위 카드를 손가락 따라 들어 올리고, 충분히 올리면 뽑는다 */
let drag=null;
document.addEventListener('pointerdown',e=>{
  const top=e.target.closest('#playFeed .talk-stack .talk-stack-top'); if(!top||busy) return;
  drag={top,y:e.clientY,dy:0,moved:false};
});
document.addEventListener('pointermove',e=>{
  if(!drag) return;
  drag.dy=Math.min(0,e.clientY-drag.y);
  if(drag.dy<-6) drag.moved=true;
  if(drag.moved) drag.top.style.transform=`translateY(${drag.dy}px) rotate(${drag.dy/24}deg)`;
});
document.addEventListener('pointerup',()=>{
  if(!drag) return;
  const d=drag; drag=null;
  if(!d.moved) return;
  d.top.dataset.dragged='1'; /* 이어서 오는 click은 무시 */
  if(d.dy<-48){ d.top.style.transform=''; doDraw(); }
  else d.top.style.transform='';
});
document.addEventListener('pointercancel',()=>{ if(drag){ drag.top.style.transform=''; drag=null; } });
const tabsHTML=()=>TC?`<div class="play-tabs" role="group" aria-label="같이 보기">${[['talk','대화 카드'],['play','놀이']].map(([k,l])=>`<button class="${mode===k?'active':''}" data-play-mode="${k}" type="button" aria-pressed="${mode===k}">${l}</button>`).join('')}</div>`:'';

/* ---------- 링크 보내기 · 복사 ---------- */
async function shareLink(title,text,url,status){
  try{
    if(navigator.share){ await navigator.share({title,text,url}); return; }
    await navigator.clipboard.writeText(url);
    if(status) status.textContent='링크를 복사했어요. 보내고 싶은 사람에게 붙여 넣어 보세요.';
  }catch(e){
    if(e && e.name==='AbortError') return;
    if(status) status.textContent=`링크를 복사하지 못했어요. 이 주소를 보내 주세요: ${url}`;
  }
}
async function copyText(text,status){
  try{ await navigator.clipboard.writeText(text); if(status) status.textContent='복사했어요. 보내고 싶은 곳에 붙여 넣어 보세요.'; }
  catch(e){ if(status) status.textContent='복사하지 못했어요. 문장을 길게 눌러 직접 복사해 주세요.'; }
}

/* ---------- 놀이 카드 만들기 ---------- */
const KINDS={pick:3,guess:2,pair:2,vs:1,talk:1,ask:1}; /* 섞는 비율 */
const FILTERS=[['all','전체',null],['pick','나라면?',['pick']],['guess','맞히기',['guess','vs']],['pair','둘이서',['pair','ask']],['talk','말 연습',['talk']]];
let filter='all', seq=0;
const cards=new Map(); /* 카드 id → 내용 */
function nextKind(prev){
  const allow=FILTERS.find(f=>f[0]===filter)[2];
  const bag=Object.entries(KINDS).filter(([k])=>!allow||allow.includes(k)).flatMap(([k,w])=>Array(w).fill(k));
  const pool=bag.filter(k=>k!==prev);
  return pickOne(pool.length?pool:bag);
}
function makeCard(kind){
  const id='pc'+(++seq), sc=homeScenes();
  let c={id,kind};
  if(kind==='pick' && sc.length){ const s=rnd(sc.length); const rows=shuffle(sc[s].rows).slice(0,4); c={...c,s,mood:rnd(2)?'calm':'tired',rows}; }
  else if(kind==='guess' && sc.length){ const s=rnd(sc.length), row=pickOne(sc[s].rows); c={...c,s,ans:row.t,quote:row.text,opts:shuffle([row.t,...shuffle([1,2,3,4,5,6,7,8,9].filter(t=>t!==row.t)).slice(0,2)])}; }
  else if(kind==='vs'){ const v=pickOne(homeVsPairs()); if(!v) return makeCard('pair'); c={...c,a:Math.min(v.a,v.b),b:Math.max(v.a,v.b),same:v.same,diff:v.diff}; }
  else if(kind==='pair'){ const md=pickOne(R.PAIR); c={...c,m:md.k,q:rnd(md.qs.length)}; }
  else if(kind==='talk'){ const T=pickOne(R.TALK); c={...c,k:T.k,line:rnd(T.lines.length)}; }
  else if(kind==='ask'){ const md=pickOne(R.PAIR); c={...c,label:md.label,ask:pickOne(md.qs).ask}; }
  else return makeCard('pair');
  cards.set(id,c);
  return c;
}
const optBtn=(attr,val,text,cls='')=>`<button class="game-option${cls}" data-${attr}="${esc(String(val))}" type="button">${esc(text)}</button>`;
const ART={pick:'thinking_face',guess:'magnifying_glass_tilted_left',vs:'balance_scale',pair:'handshake',ask:'light_bulb',talk:'key'};
const head=(tag,title,kind)=>`<div class="deck-card-top"><span class="feed-tag">${esc(tag)}</span>${ART[kind]?`<img class="art3d" src="assets/illust/${ART[kind]}.png" alt="" width="256" height="256" decoding="async">`:''}</div><h3 class="game-title">${esc(title)}</h3>`;
/* 놀이 카드 꾸미기 (2026-10-08): 대화 카드와 같은 크리스탈 글래스. 종류마다 보석 색 [앞면, 뒤에 겹치는 카드] */
const KC={pick:['--gem-lavender','--gem-pink'],guess:['--gem-sky','--gem-blue'],vs:['--gem-lilac','--gem-peach'],pair:['--gem-peach','--gem-yellow'],talk:['--gem-mint','--gem-sky'],ask:['--gem-yellow','--gem-mint'],done:['--gem-mint','--gem-lavender']};
const deckWrap=(kind,inner)=>{ const [a,b]=KC[kind]||KC.done; return `<div class="deck play-deck" style="--rc:var(${a});--rc2:var(${b})"><span class="play-back is-a" aria-hidden="true"></span><span class="play-back is-b" aria-hidden="true"></span>${inner.replace('<div class="deck-card-top">','<span class="talk-glow" aria-hidden="true"></span><div class="deck-card-top">')}</div>`; };
function cardHTML(c){
  const open=`<article class="game-card play-item is-${c.kind}" data-pf="${c.id}">`, end='<div class="game-result" hidden></div><p class="game-status" role="status"></p></article>';
  const sc=homeScenes();
  if(c.kind==='pick') return open+head('나라면?',sc[c.s].title,'pick')
    +`<p class="game-sub">${c.mood==='calm'?'여유 있을 때':'지친 날'}의 나라면 어떻게 할까요?</p>`
    +`<div class="game-options">${c.rows.map((r,i)=>optBtn('pf-pick',i,r.text)).join('')}</div>`+end;
  if(c.kind==='guess') return open+head('맞히기','이 반응, 몇 번일까?','guess')
    +`<p class="game-sub">${esc(sc[c.s].title)}</p><blockquote class="game-quote">${esc(c.quote)}</blockquote>`
    +`<div class="game-options is-types">${c.opts.map(t=>`<button class="game-option is-type" data-pf-guess="${t}" type="button" style="${gemVars(t)}"><span class="gem-tile deco-square">${gemImg(t,'',false)}</span><span>${esc(N(t))}</span></button>`).join('')}</div>`+end;
  if(c.kind==='vs'){
    const side=t=>`<span class="pf-vs-side" style="${gemVars(t)}"><span class="gem-tile deco-square">${gemImg(t,'',false)}</span><b>${esc(N(t))}</b></span>`;
    return open+head('닮은 두 유형',`${c.a}번 vs ${c.b}번, 뭐가 다를까?`,'vs')
      +`<div class="pf-vs">${side(c.a)}<span class="pf-vs-mark" aria-hidden="true">vs</span>${side(c.b)}</div>`
      +`<p class="game-sub">${esc(c.same)}</p><p class="pf-text">${esc(c.diff)}</p>`
      +`<div class="game-actions"><button class="feed-more" data-post="vs-${c.a}-${c.b}" type="button">글로 더 읽기</button></div></article>`;
  }
  if(c.kind==='pair'){
    const md=modeOf(c.m), Q=md.qs[c.q];
    return open+head(`둘이서 · ${md.label}`,Q.q,'pair')
      +`<div class="game-options">${Q.opts.map((o,i)=>optBtn('pf-pair',i,o)).join('')}</div>`+end;
  }
  if(c.kind==='talk'){
    const T=talkOf(c.k), t=myType();
    return open+head(`말 연습 · ${T.label}`,T.lead,'talk')
      +(t?`<div class="rel-tip"><span class="tcx-k">${t}번 ${esc(NAME[t])}라면</span><p>${esc(T.tips[t])}</p></div>`:'')
      +`<blockquote class="game-quote pf-line">${esc(T.lines[c.line])}</blockquote>`
      +'<p class="pf-hint">○○ 자리에 내 상황을 넣어 보세요.</p>'
      +'<div class="game-actions"><button class="btn secondary is-tinted" data-pf-copy type="button">문장 복사</button><button class="feed-more" data-pf-again type="button">다른 문장</button></div>'
      +'<p class="game-status" role="status"></p></article>';
  }
  if(c.kind==='ask') return open+head(`오늘 물어볼 말 · ${c.label}`,'이 말로 대화를 시작해 볼까요?','ask')
    +`<blockquote class="game-quote pf-ask">${esc(c.ask)}</blockquote>`
    +'<div class="game-actions"><button class="btn secondary is-tinted" data-pf-copy type="button">복사해서 보내기</button><button class="feed-more" data-pf-again type="button">다른 질문</button></div>'
    +'<p class="game-status" role="status"></p></article>';
  return '';
}
/* ---------- 덱: 다섯 장 ---------- */
const DECK_SIZE=5;
const FILTER_KIND={pick:['pick'],guess:['guess','vs'],pair:['pair','ask'],talk:['talk']};
let deck=[], at=0, deckPicks=[]; /* deckPicks: 이번 덱에서 고른 · 맞힌 유형 (마무리 카드에 보석으로) */
function newDeck(){
  cards.clear(); deckPicks=[]; at=0;
  const out=[]; let prev=null;
  for(let i=0;i<DECK_SIZE;i++){ const c=makeCard(nextKind(prev)); prev=c.kind; out.push(c); }
  deck=out;
}
const NEEDS_ANSWER=new Set(['pick','guess','pair']);
function doneHTML(){
  const s=window.sceneSummary?.()||{};
  const gems=[...new Set(deckPicks)].slice(0,5);
  return '<article class="game-card play-item deck-card is-done"><div class="deck-card-top"><span class="feed-tag">오늘의 놀이</span><img class="art3d" src="assets/illust/seedling.png" alt="" width="256" height="256" decoding="async"></div>'
    +`<h3 class="game-title">${DECK_SIZE}장을 다 넘겼어요</h3>`
    +(gems.length?`<div class="deck-gems" aria-label="이번에 고르거나 맞힌 유형">${gems.map(t=>`<span class="gem-tile deco-square" style="${gemVars(t)}" title="${esc(N(t))}">${gemImg(t,'',false)}</span>`).join('')}</div>`:'')
    +(s.picks>=3&&s.top?`<p class="pf-text">지금까지 장면에서 ${s.picks}번 골랐고, 자주 기운 쪽은 <b>${esc(N(s.top))}</b>이에요. 판정이 아니라 내가 자주 기우는 쪽이에요.</p>`:'<p class="pf-text">같은 장면에서도 마음이 향하는 곳은 저마다 달라요. 친구에게도 물어보세요.</p>')
    +'<div class="game-actions"><button class="btn primary" data-deck-new type="button">5장 더 하기</button><button class="btn secondary is-tinted" data-pf-sharecard type="button">유형 카드로 친구와 비교</button></div>'
    +`<p class="deck-pick-title">하나만 골라서 해 볼까요?</p><div class="ui-chips deck-kinds">${FILTERS.filter(x=>x[0]!=='all').map(([k,l])=>`<button class="feed-chip" data-pf-filter="${k}" type="button">${esc(l)}</button>`).join('')}</div></article>`;
}
function stageHTML(){
  if(at>=deck.length) return deckWrap('done',doneHTML());
  const c=deck[at];
  const label=filter==='all'?'오늘의 놀이':FILTERS.find(x=>x[0]===filter)[1];
  const dots=deck.map((_,i)=>`<i class="${i<at?'is-done':i===at?'is-now':''}"></i>`).join('');
  return `<div class="deck-top"><span class="deck-count">${esc(label)} <b>${at+1}</b> / ${deck.length}</span><span class="deck-dots" aria-hidden="true">${dots}</span></div>`
    +deckWrap(c.kind,cardHTML(c).replace('class="game-card play-item','class="game-card play-item deck-card'))
    +`<div class="deck-nav"><button class="feed-more" data-deck-skip type="button">건너뛰기</button><button class="btn primary" data-deck-next type="button"${NEEDS_ANSWER.has(c.kind)?' disabled':''}>${at===deck.length-1?'마무리':'다음 카드'}</button></div>`;
}
/* ---------- 받은 질문 카드 (#pair=…) : 피드 맨 위에 고정 ---------- */
let recv=null, recvPick=null;
function decodePair(str){
  try{
    const b64=str.replace(/-/g,'+').replace(/_/g,'/');
    const bin=atob(b64+'==='.slice((b64.length+3)%4));
    const o=JSON.parse(new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0))));
    const md=R.PAIR.find(x=>x.k===o.m), q=Number(o.q), a=Number(o.a);
    if(!md || !Number.isInteger(q) || !md.qs[q] || !Number.isInteger(a) || a<0 || a>=md.qs[q].opts.length) return null;
    return {m:md.k,q,a,x:String(o.x||'').trim().slice(0,40),n:String(o.n||'').trim().slice(0,12)};
  }catch(e){ return null; }
}
function recvHTML(){
  if(!recv) return '';
  const md=modeOf(recv.m), Q=md.qs[recv.q], who=recv.n?`${recv.n}님`:'친구', picked=recvPick!==null;
  const opts=Q.opts.map((o,i)=>`<button class="game-option${recvPick===i?' is-picked':''}${picked&&recv.a===i?' is-friend':''}" data-pf-recv="${i}" type="button"${picked?' disabled':''}>${esc(o)}</button>`).join('');
  let after='';
  if(picked){
    const side=(k,i,x)=>`<div class="game-side"><span class="tcx-k">${esc(k)}</span><b>${esc(Q.opts[i])}</b>${x?`<p>${esc(x)}</p>`:''}</div>`;
    after=`<h4 class="rel-sub">${recv.a===recvPick?'같은 답을 골랐어요':'같은 질문, 다른 답'}</h4><div class="game-vs">${side('나',recvPick,'')}${side(who,recv.a,recv.x)}</div>`
      +`<p class="rel-ask"><b>이어서 물어보기</b>${esc(Q.ask)}</p>`
      +'<div class="game-actions"><button class="btn secondary is-tinted" data-pf-recv-done type="button">다른 놀이 보기</button></div>';
  }
  return `<article class="game-card play-item is-recv" id="pairCards"><span class="feed-tag">받은 질문 · ${esc(md.label)}</span><h3 class="game-title">${esc(Q.q)}</h3>`
    +`<p class="rel-note">${esc(who)}${homeJosa(who,'이','가')} 보낸 질문이에요. 먼저 골라 보세요. ${esc(who)}의 답은 고른 뒤에 보여요.</p>`
    +`<div class="game-options">${opts}</div>${after}</article>`;
}

/* ---------- 그리기 ---------- */
function render(fresh){
  const box=document.getElementById('playFeed'); if(!box) return;
  if(fresh || !deck.length) newDeck();
  box.innerHTML=tabsHTML()+(mode==='talk'?talkHTML():recvHTML()+`<div class="deck-stage" id="deckStage">${stageHTML()}</div>`);
}
function renderStage(){
  const st=document.getElementById('deckStage'); if(!st){ render(); return; }
  st.innerHTML=stageHTML();
  const card=st.querySelector('.deck-card');
  card?.classList.add('is-enter');
  st.querySelector('[data-pf-pick], [data-pf-guess], [data-pf-pair], [data-deck-next]:not([disabled]), [data-deck-new]')?.focus({preventScroll:true});
}
/* 답하면 '다음 카드'를 켠다 */
function unlockNext(){ const n=document.querySelector('#deckStage [data-deck-next]'); if(n){ n.disabled=false; } }

/* ---------- 누르기 ---------- */
function reveal(card,html){ const r=card.querySelector('.game-result'); if(r){ r.innerHTML=html; r.hidden=false; } }
function answered(card,btn,attr){
  card.classList.add('is-answered');
  card.querySelectorAll(`[data-${attr}]`).forEach(b=>{ b.classList.toggle('is-picked',b===btn); b.setAttribute('aria-pressed',String(b===btn)); });
}
document.getElementById('page-community')?.addEventListener('click',e=>{
  /* 분할 탭 · 대화 카드 */
  const md=e.target.closest('[data-play-mode]');
  if(md){ mode=md.dataset.playMode; render(); document.querySelector(`#playFeed [data-play-mode="${mode}"]`)?.focus({preventScroll:true}); return; }
  const tr=e.target.closest('[data-talk-rel]');
  if(tr){ rel=tr.dataset.talkRel; try{ localStorage.setItem(REL_KEY,rel); }catch(err){} drawn=[]; shuffling=true; renderTalk(); const on=document.querySelector(`#playFeed [data-talk-rel="${rel}"]`); on?.focus({preventScroll:true}); on?.scrollIntoView({inline:'center',block:'nearest'}); return; }
  const tt=e.target.closest('[data-talk-type]');
  if(tt){ const v=tt.dataset.talkType; ttype=v==='center'?'center':Number(v); drawn=[]; shuffling=true; renderTalk(); const on=document.querySelector(`#playFeed [data-talk-type="${v}"]`); on?.focus({preventScroll:true}); on?.scrollIntoView({inline:'center',block:'nearest'}); return; }
  const td=e.target.closest('[data-talk-depth]');
  if(td){ depth=td.dataset.talkDepth; drawn=[]; shuffling=true; renderTalk(); document.querySelector(`#playFeed [data-talk-depth="${depth}"]`)?.focus({preventScroll:true}); return; }
  const dr=e.target.closest('[data-talk-draw]');
  if(dr){ if(dr.dataset.dragged){ delete dr.dataset.dragged; return; } doDraw(); return; }
  if(e.target.closest('[data-talk-copy]')){ const cur=drawn[drawn.length-1]; if(cur) copyText(qOf(cur),document.querySelector('#playFeed .talk-card .game-status')); return; }
  const fl=e.target.closest('[data-pf-filter]');
  if(fl){ filter=fl.dataset.pfFilter; render(true); return; }
  if(e.target.closest('[data-deck-new]')){ filter='all'; render(true); return; }
  if(e.target.closest('[data-deck-next], [data-deck-skip]')){ at++; renderStage(); document.getElementById('page-community')?.scrollTo({top:0}); return; }
  if(e.target.closest('[data-pf-sharecard]')){ showSharePage(); return; }
  /* 받은 질문 */
  const rv=e.target.closest('[data-pf-recv]');
  if(rv && !rv.disabled){ recvPick=Number(rv.dataset.pfRecv); document.getElementById('pairCards').outerHTML=recvHTML(); document.querySelector('#pairCards .rel-sub')?.scrollIntoView({block:'nearest'}); return; }
  if(e.target.closest('[data-pf-recv-done]')){ recv=null; recvPick=null; document.getElementById('pairCards')?.remove(); history.replaceState(null,'','#community'); return; }

  const card=e.target.closest('[data-pf]'); if(!card) return;
  const c=cards.get(card.dataset.pf); if(!c) return;
  const status=card.querySelector('.game-status');
  const pk=e.target.closest('[data-pf-pick]');
  if(pk && c.kind==='pick' && !card.classList.contains('is-answered')){
    const t=c.rows[Number(pk.dataset.pfPick)].t;
    answered(card,pk,'pf-pick'); window.sceneAddPick?.(c.s,t,c.mood); deckPicks.push(t); unlockNext();
    reveal(card,`<p class="game-answer" style="${gemVars(t)}"><b>${esc(N(t))}</b>에 가까운 반응이에요.</p>`
      +'<p class="game-note">정답이 아니라, 같은 장면에서도 마음이 향하는 곳이 다르다는 예시예요.</p>'
      +`<div class="game-actions"><button class="btn secondary is-tinted" data-pf-scene="${c.s}-${t}" type="button">친구에게 물어보기</button></div>`);
    return;
  }
  const sh=e.target.closest('[data-pf-scene]');
  if(sh){ const [s,t]=sh.dataset.pfScene.split('-').map(Number); shareLink('나라면 어떻게 할까?',`'${homeScenes()[s]?.title}' 이 장면에서 너라면 어떻게 할 것 같아? 나는 이미 골랐어. 골라 보면 내 답이랑 비교해 줄게.`,`${location.origin}${location.pathname}#scene=${s}-${t}`,status); return; }
  const gs=e.target.closest('[data-pf-guess]');
  if(gs && c.kind==='guess' && !card.classList.contains('is-answered')){
    const t=Number(gs.dataset.pfGuess), ok=t===c.ans;
    answered(card,gs,'pf-guess'); deckPicks.push(c.ans); unlockNext();
    card.querySelectorAll('[data-pf-guess]').forEach(b=>b.classList.toggle('is-answer',Number(b.dataset.pfGuess)===c.ans));
    reveal(card,`<p class="game-answer" style="${gemVars(c.ans)}">${ok?'맞았어요. ':''}<b>${esc(N(c.ans))}</b>의 반응이에요.</p>`
      +`<p class="game-note">${esc(HOME_PROFILES[c.ans]?.desc||'')}. 같은 행동이라도 이 마음에서 나올 때 ${c.ans}번에 가까워요.</p>`);
    return;
  }
  const pr=e.target.closest('[data-pf-pair]');
  if(pr && c.kind==='pair' && !card.classList.contains('is-answered')){
    c.a=Number(pr.dataset.pfPair); answered(card,pr,'pf-pair'); unlockNext();
    reveal(card,'<p class="game-note">친구에게 같은 질문을 보내면, 친구가 먼저 고른 뒤에 두 답이 나란히 보여요.</p>'
      +`<p class="rel-ask"><b>이어서 물어볼 말</b>${esc(modeOf(c.m).qs[c.q].ask)}</p>`
      +'<div class="game-actions"><button class="btn secondary is-tinted" data-pf-send type="button">이 질문 보내기</button></div>');
    return;
  }
  if(e.target.closest('[data-pf-send]') && c.kind==='pair'){
    const Q=modeOf(c.m).qs[c.q];
    shareLink('우리 사이 질문 카드',`'${Q.q}' 너라면 뭐라고 답할 것 같아? 나는 골랐어. 골라 보면 내 답이랑 나란히 보여 줘.`,`${location.origin}${location.pathname}#pair=${encodeShare({v:PAIR_VERSION,m:c.m,q:c.q,a:c.a})}`,status);
    return;
  }
  if(e.target.closest('[data-pf-copy]')){ copyText(c.kind==='talk'?talkOf(c.k).lines[c.line]:c.ask,status); return; }
  if(e.target.closest('[data-pf-again]')){
    if(c.kind==='talk'){ const T=talkOf(c.k); c.line=(c.line+1)%T.lines.length; }
    else if(c.kind==='ask'){ const md=pickOne(R.PAIR); c.label=md.label; c.ask=pickOne(md.qs).ask; }
    card.outerHTML=cardHTML(c).replace('class="game-card play-item','class="game-card play-item deck-card');
  }
});

/* 하단 탭 · 뒤로 가기로 같이 보기를 열면 새로 섞은 피드 */
const openCommunity=window.showCommunityPage;
if(openCommunity) window.showCommunityPage=function(...args){ openCommunity(...args); filter='all'; render(true); };
/* 예전 놀이 주소 #play-… 는 그 칩을 고른 피드로. 다른 화면(js/11)이 부르는 openPlay도 같은 곳으로 */
const PLAY_FILTER={scene:'pick',guess:'guess',pair:'pair',talk:'talk'};
window.openPlay=function(k,push=true){
  if(k==='card'){ showSharePage(); return; }
  filter=PLAY_FILTER[k]||'all'; mode='play';
  openCommunity?.(false); render(true);
  if(push) history.replaceState(null,'','#community');
};
function route(){
  const m=location.hash.match(/^#pair=(.+)$/);
  if(m){ const d=decodePair(m[1]); if(d){ recv=d; recvPick=null; filter='all'; mode='play'; openCommunity?.(false); render(true); } return; }
  const p=location.hash.match(/^#play-(scene|guess|pair|talk)$/);
  if(p) window.openPlay(p[1],false);
  if(location.hash==='#play-cards' && TC){ mode='talk'; openCommunity?.(false); render(); history.replaceState(null,'','#community'); }
}
window.addEventListener('hashchange',route);
render(true);
route();
})();
