/* =========================================================
   PRD v1 (2026-10-01) — 서버 없이 지금 사이트에서 할 수 있는 MVP 항목
   1) 위기 지원 안내 (SF-1~5): 어떤 경우에도 무료. 장식·보석·모션·결제 유도 없이 단색 화면.
      - "도움이 필요할 때" 진입점: 전체 메뉴 · 나의 공간 머리 (항상 보임)
      - 다이어리 저장 시 위험 표현이 보이면 기록은 저장하고, 분석 대신 이 안내를 띄운다 (키워드 확인. AI 이중 확인은 서버 붙일 때)
   2) 결과 공개 연출 (QT-5): 간편 검사 '결과 보기'에서 뿌연 원석 → 맑은 보석 약 3초, 건너뛰기 가능, 동작 줄이기면 페이드만.
   ========================================================= */
(function(){
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const appRoot=()=>document.querySelector('.shell-app')||document.body;

  /* ---------- 1. 위기 지원 안내 ---------- */
  /* 애매하면 안내 쪽으로 (SF-4). 띄어쓰기 차이를 줄이려고 공백을 지운 글에서 찾는다 */
  const CRISIS_WORDS=['죽고싶','죽고만싶','죽어버리고싶','자살','자해','사라지고싶','없어지고싶','살기싫','살고싶지않','그만살고싶','극단적선택','목숨을끊','삶을끝내','다끝내고싶','손목을긋','유서'];
  function hasCrisisSignal(text){
    const t=String(text||'').replace(/\s+/g,'');
    return CRISIS_WORDS.some(w=>t.includes(w));
  }

  let crisisReturnFocus=null;
  function openCrisisGuide({fromDiary=false}={}){
    let layer=document.getElementById('crisisGuide');
    if(!layer){
      layer=document.createElement('div');
      layer.id='crisisGuide';
      layer.className='crisis-guide';
      layer.setAttribute('role','dialog');
      layer.setAttribute('aria-modal','true');
      layer.setAttribute('aria-labelledby','crisisGuideTitle');
      appRoot().appendChild(layer);
      layer.addEventListener('click',e=>{ if(e.target.closest('[data-crisis-close]')) closeCrisisGuide(); });
      layer.addEventListener('keydown',e=>{ if(e.key==='Escape') closeCrisisGuide(); });
    }
    layer.innerHTML=`<div class="crisis-guide-inner">`
      +`<h2 id="crisisGuideTitle" tabindex="-1">지금 많이 힘든 것 같아요</h2>`
      +`<p class="crisis-guide-lead">혼자 견디지 않아도 괜찮아요. 지금 바로 이야기를 들어줄 곳이 있어요.</p>`
      +(fromDiary?`<p class="crisis-guide-note">방금 쓴 기록은 저장해 두었어요.</p>`:'')
      +`<ul class="crisis-guide-list">`
      +`<li><a class="crisis-guide-tel" href="tel:109">109</a><span>자살예방상담전화 · 24시간</span></li>`
      +`<li><a class="crisis-guide-tel" href="tel:15770199">1577-0199</a><span>정신건강위기상담</span></li>`
      +`</ul>`
      +`<p class="crisis-guide-urgent">지금 위험한 상황이라면 112나 119에 바로 연락해 주세요.</p>`
      +`<button class="crisis-guide-close" data-crisis-close type="button">닫기</button>`
      +`</div>`;
    crisisReturnFocus=document.activeElement;
    layer.hidden=false;
    document.body.classList.add('is-crisis'); /* SF-3: 앱 열 밖 소개 패널(검사 유도)도 숨긴다 */
    document.getElementById('crisisGuideTitle').focus();
  }
  function closeCrisisGuide(){
    const layer=document.getElementById('crisisGuide');
    if(layer) layer.hidden=true;
    document.body.classList.remove('is-crisis');
    crisisReturnFocus?.focus?.();
  }
  window.openCrisisGuide=openCrisisGuide;
  window.prdHasCrisisSignal=hasCrisisSignal; /* 채팅 다이어리(02 스크립트)에서도 같은 확인을 쓴다 */

  /* 진입점: 전체 메뉴 아래 · 나의 공간 맨 아래 */
  function addHelpEntry(host,cls){
    if(!host || host.querySelector('[data-crisis-open]')) return;
    const b=document.createElement('button');
    b.type='button';
    b.className=cls;
    b.dataset.crisisOpen='';
    b.textContent='도움이 필요할 때';
    host.appendChild(b);
  }
  addHelpEntry(document.querySelector('.shell-sidebar'),'help-entry help-entry-menu');
  addHelpEntry(document.getElementById('myHelp'),'help-entry'); /* 나의 공간 맨 아래 (2026-10-07) */
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-crisis-open]')) return;
    if(typeof closeShellMenu==='function') closeShellMenu();
    openCrisisGuide();
  });

  /* 다이어리 저장: 원래 저장 처리(02 스크립트)가 끝난 뒤 안내를 띄우도록 캡처 단계에서 글만 먼저 읽어 둔다 */
  const form=document.getElementById('diaryForm');
  if(form){
    let pending=false;
    form.addEventListener('submit',()=>{
      const text=[...form.querySelectorAll('textarea, input[type="text"]')].map(el=>el.value).join(' ');
      pending=!!form.querySelector('#diarySituation')?.value.trim() && hasCrisisSignal(text);
    },true);
    form.addEventListener('submit',()=>{
      if(!pending) return;
      pending=false;
      setTimeout(()=>openCrisisGuide({fromDiary:true}),0);
    });
  }

  /* ---------- 2. 결과 공개 연출 ---------- */
  const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealTimer=0, revealReturnFocus=null;
  function showGemReveal(t){
    if(!(t>=1 && t<=9) || typeof gemImg!=='function') return;
    const p=(typeof HOME_PROFILES!=='undefined' && HOME_PROFILES[t])||{};
    let layer=document.getElementById('gemReveal');
    if(!layer){
      layer=document.createElement('div');
      layer.id='gemReveal';
      layer.className='gem-reveal';
      layer.setAttribute('role','dialog');
      layer.setAttribute('aria-modal','true');
      layer.setAttribute('aria-labelledby','gemRevealTitle');
      appRoot().appendChild(layer);
      layer.addEventListener('click',e=>{ if(e.target.closest('[data-reveal-close]')) closeGemReveal(); });
      layer.addEventListener('keydown',e=>{ if(e.key==='Escape') closeGemReveal(); });
    }
    const sparks=[1,2,3].map(i=>`<span class="gem-reveal-spark gem-reveal-spark-${i}" aria-hidden="true">${typeof pcSparkSVG==='function'?pcSparkSVG('var(--color-gold)'):''}</span>`).join('');
    layer.style.cssText=`--tc:var(--type-${t});--td:var(--type-${t}-deep)`;
    layer.innerHTML=`<button class="gem-reveal-skip" data-reveal-close type="button">건너뛰기</button>`
      +`<div class="gem-reveal-stage" aria-hidden="true"><span class="gem-reveal-glow"></span>${gemImg(t,'gem-reveal-gem',true)}<span class="gem-reveal-mist"></span>${sparks}</div>`
      +`<div class="gem-reveal-copy"><p class="gem-reveal-title" id="gemRevealTitle">내 보석이 깨어났어요</p>`
      +`<p class="gem-reveal-sub">${t}번 ${esc(CHECK_TYPE_NAMES[t])} · ${esc(p.gem||'')}</p>`
      +`<button class="gem-reveal-go" data-reveal-close type="button">결과 보기</button></div>`;
    revealReturnFocus=document.activeElement;
    layer.hidden=false;
    layer.classList.remove('is-done');
    void layer.offsetWidth;
    layer.classList.add('is-playing');
    layer.querySelector('.gem-reveal-skip').focus();
    clearTimeout(revealTimer);
    revealTimer=setTimeout(()=>{ layer.classList.add('is-done'); layer.querySelector('.gem-reveal-go')?.focus(); },reduceMotion()?200:3000);
  }
  function closeGemReveal(){
    const layer=document.getElementById('gemReveal');
    clearTimeout(revealTimer);
    if(layer){ layer.hidden=true; layer.classList.remove('is-playing','is-done'); }
    revealReturnFocus?.focus?.();
  }
  window.showGemReveal=showGemReveal;

  /* 간편 검사 '결과 보기' — 결과 화면으로 넘어간 뒤 그 위에 연출을 띄운다 */
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-check-go="quick-result"]')) return;
    setTimeout(()=>{
      const t=typeof getSavedQuickType==='function' ? Number(getSavedQuickType()) : 0;
      showGemReveal(t);
    },0);
  });
})();
