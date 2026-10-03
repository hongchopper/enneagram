(function(){
  const STORAGE={
    reflections:'enneagram_reflections_v1',
    myType:'enneagram_my_type_v1',
    experiments:'enneagram_experiments_v1'
  };
  const REFLECTION_SCHEMA=2; /* 성찰 기록 한 건의 형식 버전 (readReflections에서 옮김) */
  const EXPERIMENT_SCHEMA=2; /* 성장 실험 저장 형식 버전 (readExperiments). v2: 항목마다 루틴(routine)과 날짜별 체크(log)를 더했다 */

  const TYPES={
    1:{name:'개혁가',focus:'기준·올바름',fear:'잘못되거나 결함 있는 상태',desire:'좋고 올바른 사람이 되는 것',question:'그 상황에서 “제대로 해야 한다”는 기준이 얼마나 중요했나요?'},
    2:{name:'조력가',focus:'관계·필요됨',fear:'사랑받을 가치가 없는 상태',desire:'사랑받고 필요한 사람이 되는 것',question:'상대에게 필요한 사람이거나 좋은 관계를 유지하는 것이 얼마나 중요했나요?'},
    3:{name:'성취자',focus:'성과·가치',fear:'가치 없고 실패한 상태',desire:'가치 있고 인정받는 사람이 되는 것',question:'결과나 평가를 통해 내 가치가 확인되어야 한다는 느낌이 있었나요?'},
    4:{name:'개인주의자',focus:'정체성·의미',fear:'정체성이 없고 평범한 상태',desire:'나만의 정체성과 의미를 찾는 것',question:'그 상황에서 “진짜 나답다”거나 내 감정의 의미가 중요했나요?'},
    5:{name:'탐구자',focus:'이해·유능함',fear:'무능하고 압도되는 상태',desire:'유능하고 충분히 이해하는 것',question:'충분히 알고 준비할 시간이나 에너지가 확보되어야 마음이 놓였나요?'},
    6:{name:'충실가',focus:'안전·신뢰',fear:'지원과 안내가 없는 상태',desire:'안전하고 믿을 수 있는 기반을 갖는 것',question:'실패 자체보다 위험, 변수, 믿을 수 있는 기준이 있는지가 더 중요했나요?'},
    7:{name:'열정가',focus:'자유·가능성',fear:'고통과 박탈에 갇히는 상태',desire:'행복하고 자유로운 상태',question:'답답함을 피하고 다른 선택이나 더 좋은 가능성을 확보하는 것이 중요했나요?'},
    8:{name:'도전자',focus:'자율성·보호',fear:'통제당하고 해를 입는 상태',desire:'자신을 보호하고 주도하는 것',question:'누가 주도하는지, 내 경계와 선택권이 지켜지는지가 중요했나요?'},
    9:{name:'평화주의자',focus:'평화·연결',fear:'분리되고 연결을 잃는 상태',desire:'평화롭고 안정된 연결을 유지하는 것',question:'갈등이 커지지 않고 관계나 내적 평온이 유지되는 것이 중요했나요?'}
  };


  const read=(k,fallback)=>{
    try{
      const v=localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    }catch(e){ return fallback; }
  };
  const write=(k,v)=>{
    try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>new Date().toISOString();
  const formatDate=v=>{
    const d=new Date(v); if(Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  let currentMySpace='dashboard';
  let libraryFilter='전체';

  /* 다이어리(성찰 기록)는 상단 메뉴의 별도 페이지. 예전 '나의 공간 > 성찰 기록' 링크는 다이어리로 */
  window.showDiaryPage=function(push=true){
    if(typeof activateBasePage==='function') activateBasePage('diary');
    const mobileTitle=document.getElementById('shellMobileTitle');
    if(mobileTitle) mobileTitle.textContent='다이어리';
    if(push) history.replaceState(null,'','#diary');
    if(typeof closeShellMenu==='function') closeShellMenu();
    renderReflectionHistory();
    /* ---- 다이어리 탭: 쓰기(채팅) · 기록 · 실천 (2026-10-03) ----
     쓰기는 긴 폼 대신 채팅: 정해진 순서로 질문이 하나씩 말풍선으로 나오고, 답을 모아 다이어리 한 편으로 정리해 저장한다.
     저장 형식은 기존 성찰 기록(schemaVersion 2)과 같다 — '왜'는 다섯 단계 대신 한 번(whys[0])만 묻는다. */
  const DIARY_TABS=[['write','쓰기'],['history','기록']]; /* '실천'은 하단 메뉴 '보석 닦기'로 옮겼다 (2026-10-03) */
  let diaryTab='write';
  function chatWhyOptions(){
    const t=diaryTypeInfo.type, out=[];
    if(t && DIARY_WHY_BY_TYPE[t]) out.push([DIARY_WHY_BY_TYPE[t],`${DIARY_WHY_BY_TYPE[t]} · 내 유형`]);
    Object.entries(DIARY_WHY_BY_TYPE).forEach(([k,v])=>{ if(Number(k)!==t) out.push([v,v]); });
    return out;
  }
  function chatMotiveOptions(){
    const t=diaryTypeInfo.type;
    const list=t?[DIARY_TYPE_MOTIVE[t],...DIARY_MOTIVES.filter(m=>m!==DIARY_TYPE_MOTIVE[t])]:DIARY_MOTIVES;
    return list.map(m=>[m,m===DIARY_TYPE_MOTIVE[t]?`${m} · 내 유형`:m]);
  }
  function chatNextOptions(){
    return (diaryTypeInfo.actions.length?diaryTypeInfo.actions.slice(0,3):DIARY_NEXT_GENERIC).map(x=>[x,x.length>40?x.slice(0,39)+'…':x]);
  }
  const CHAT_STEPS=[
    {key:'date',ask:'언제 있었던 일이에요?',type:'single',options:()=>[['today','오늘'],['yesterday','어제']]},
    {key:'category',ask:'어떤 장면의 이야기예요?',type:'single',options:()=>DIARY_CATEGORIES},
    {key:'situation',ask:'무슨 일이 있었나요? 해석보다 실제로 있었던 일을 적어보세요.',type:'text',placeholder:'예: 회의에서 내 의견이 묻혔다'},
    {key:'emotions',ask:'그때 어떤 감정이 들었어요? 여러 개 골라도 돼요.',type:'multi',options:()=>DIARY_EMOTIONS.map(e=>[e,e]),text:'다른 감정이면 적어주세요'},
    {key:'reaction',ask:'그 순간 나는 어떻게 반응했나요?',type:'multi',options:()=>DIARY_REACTIONS.map(r=>[r,r]),text:'직접 쓰기',skip:true},
    {key:'why',ask:'왜 그렇게 반응했을까요?',type:'multi',options:chatWhyOptions,text:'직접 쓰기',skip:true},
    {key:'motives',ask:'그 순간 나는 무엇을 지키거나 얻고 싶었을까요?',type:'multi',options:chatMotiveOptions,skip:true},
    {key:'next',ask:'다음에 비슷한 일이 생기면 해보고 싶은 작은 행동이 있나요? 적어 두면 ‘보석 닦기’에 모여요.',type:'multi',options:chatNextOptions,text:'직접 쓰기',skip:true}
  ];
  let chat={step:0,answers:{},picks:[],saved:false};

  function chatAvatar(){
    const t=diaryMyType()||5;
    return `<span class="chat-avatar" aria-hidden="true">${typeof gemImg==='function'?gemImg(t,'',true):''}</span>`;
  }
  function chatBot(html){
    g('diaryChatLog').insertAdjacentHTML('beforeend',`<div class="chat-msg is-bot">${chatAvatar()}<div class="chat-bubble">${html}</div></div>`);
  }
  function chatMe(text){
    g('diaryChatLog').insertAdjacentHTML('beforeend',`<div class="chat-msg is-me"><div class="chat-bubble">${esc(text)}</div></div>`);
  }
  /* 마지막 질문과 선택지가 한 화면에 들어오면 선택지 끝까지, 선택지가 길면 질문이 맨 위에 오게 내린다 */
  function chatScroll(){
    const log=g('diaryChatLog'); if(!log) return;
    const behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
    const msgs=log.querySelectorAll('.chat-msg'), msg=msgs[msgs.length-1], quick=log.querySelector('.chat-quick');
    if(msg && quick){
      const cs=getComputedStyle(msg), room=innerHeight-parseFloat(cs.scrollMarginBottom||0)-parseFloat(cs.scrollMarginTop||0);
      if(quick.getBoundingClientRect().bottom-msg.getBoundingClientRect().top>room){ msg.scrollIntoView({block:'start',behavior}); return; }
    }
    log.lastElementChild?.scrollIntoView({block:'end',behavior});
  }
  function chatAsk(){
    const st=CHAT_STEPS[chat.step];
    chat.picks=[];
    chatBot(esc(st.ask));
    renderChatComposer();
    chatScroll();
  }
  /* 선택지는 마지막 질문 말풍선 바로 아래(대화 안)에 그때그때 보여주고, 입력창은 화면 아래에 늘 붙어 있다.
     하나만 고르는 질문에서는 입력창을 잠그고 '위에서 골라주세요'라고 안내한다. */
  function renderChatComposer(){
    const log=g('diaryChatLog'), field=g('diaryChatText'); if(!log||!field) return;
    log.querySelector('.chat-quick')?.remove();
    const st=CHAT_STEPS[chat.step];
    let quick='';
    if(!st) quick=chat.saved
      ?'<div class="chat-actions"><button type="button" class="ui-btn ui-btn-secondary" data-chat-go="history">기록 보기</button><button type="button" class="ui-btn ui-btn-primary" data-chat-restart>새 장면 쓰기</button></div>'
      :'<div class="chat-actions"><button type="button" class="ui-btn ui-btn-secondary" data-chat-restart>처음부터 다시 쓰기</button><button type="button" class="ui-btn ui-btn-primary" data-chat-save>다이어리에 저장하기</button></div>';
    else if(st.type==='single') quick=`<div class="ui-chips chat-chips">${st.options().map(([v,l])=>`<button type="button" class="ui-chip" data-chat-pick="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;
    else if(st.type==='multi') quick=`<div class="ui-chips chat-chips">${st.options().map(([v,l])=>`<button type="button" class="ui-chip" data-chat-toggle="${esc(v)}" aria-pressed="false">${esc(l)}</button>`).join('')}</div>`;
    if(quick) log.insertAdjacentHTML('beforeend',`<div class="chat-quick">${quick}</div>`);
    const open=!!st && (st.type==='text' || !!st.text);
    field.value='';
    field.disabled=!open;
    field.placeholder=!st?(chat.saved?'저장했어요':'위에서 저장해주세요'):st.type==='text'?(st.placeholder||''):(st.text||'위에서 골라주세요');
    if(st && st.type==='single') field.placeholder='위에서 하나를 골라주세요';
    field.setAttribute('aria-label',st?(st.type==='text'?st.ask:(st.text||st.ask)):'대화 입력');
    const err=g('diaryChatError'); if(err) err.hidden=true;
    chatNextLabel();
  }
  function chatNextLabel(){
    const st=CHAT_STEPS[chat.step], send=g('diaryChatSend');
    if(!send) return;
    const has=chat.picks.length || (g('diaryChatText')?.value.trim());
    send.disabled=!st || st.type==='single';
    send.textContent=st && st.type==='multi' && st.skip && !has?'건너뛰기':'보내기';
  }
  function chatAnswer(value,label){
    const st=CHAT_STEPS[chat.step];
    chat.answers[st.key]=value;
    g('diaryChatLog')?.querySelector('.chat-quick')?.remove();
    chatMe(label||'건너뛰었어요');
    chat.step++;
    if(chat.step<CHAT_STEPS.length) chatAsk(); else chatSummary();
  }
  function chatRecord(){
    const a=chat.answers;
    const now=new Date();
    let createdAt=now.toISOString();
    if(a.date==='yesterday'){ const d=new Date(now); d.setDate(d.getDate()-1); d.setHours(12,0,0,0); createdAt=d.toISOString(); }
    const situation=(a.situation||'').trim();
    return {id:'r_'+Date.now(),schemaVersion:REFLECTION_SCHEMA,createdAt,
      title:situation.split(/[.\n!?]/)[0].slice(0,30),category:a.category||'일상',emotions:a.emotions||[],situation,
      reaction:(a.reaction||[]).join(' · '),whys:[(a.why||[]).join(' · '),'','','',''],motives:a.motives||[],next:(a.next||[]).join(' · ')};
  }
  function chatSummary(){
    const r=chatRecord();
    const rows=[['무슨 일',r.situation],['감정',r.emotions.join(', ')],['나의 반응',r.reaction],['그렇게 한 이유',r.whys[0]],['지키고 싶었던 것',r.motives.join(', ')],['다음엔',r.next]].filter(x=>x[1]);
    const d=new Date(r.createdAt);
    chatBot('오늘의 장면을 이렇게 정리했어요.'
      +`<article class="chat-summary"><div class="chat-summary-meta">${esc(longDate(d))} · ${esc(catLabel(r.category))}</div>`
      +`<h3 class="chat-summary-title">${esc(r.title||'제목 없는 기록')}</h3>`
      +`<dl class="diary-review">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></article>`);
    renderChatComposer();
    chatScroll();
  }
  function chatSave(){
    const record=chatRecord();
    const arr=readReflections(); arr.unshift(record); write(STORAGE.reflections,arr);
    chat.saved=true;
    renderReflectionHistory(); renderExperiments(); renderDashboard();
    chatBot(record.next?'저장했어요. ‘기록’에서 다시 볼 수 있고, 해보기로 한 행동은 ‘보석 닦기’에 모였어요.':'저장했어요. ‘기록’에서 다시 볼 수 있어요.');
    renderChatComposer();
    chatScroll();
    /* 위험한 표현이 보이면 기록은 저장하고 도움 안내를 띄운다 (PRD SF-1·2) */
    const text=[record.situation,record.reaction,record.whys[0],record.next,...record.emotions].join(' ');
    if(typeof window.prdHasCrisisSignal==='function' && window.prdHasCrisisSignal(text) && typeof window.openCrisisGuide==='function') window.openCrisisGuide({fromDiary:true});
  }
  function chatStart(){
    chat={step:0,answers:{},picks:[],saved:false};
    const log=g('diaryChatLog'); if(!log) return;
    log.innerHTML='';
    chatBot('오늘 기억에 남은 장면 하나를 같이 정리해볼까요? 질문에 하나씩 답하면 다이어리 한 편으로 정리해줘요.');
    chatAsk();
  }
  function setDiaryTab(tab){
    diaryTab=tab;
    document.querySelectorAll('#diaryTabs [data-diary-tab]').forEach(b=>{
      const on=b.dataset.diaryTab===tab;
      b.setAttribute('aria-selected',on?'true':'false');
      b.classList.toggle('active',on);
      b.tabIndex=on?0:-1;
    });
    const wrap=document.querySelector('#page-diary .diary-wrap');
    if(wrap) wrap.dataset.diaryTab=tab;
    if(tab==='history') renderReflectionHistory();
    if(tab==='practice') renderExperiments();
  }
  function setupDiaryTabs(){
    const wrap=document.querySelector('#page-diary .diary-wrap');
    if(!wrap || g('diaryTabs')) return;
    const head=wrap.querySelector('.diary-head');
    head?.insertAdjacentHTML('afterend',`<div class="diary-tabs" id="diaryTabs" role="tablist" aria-label="다이어리">${DIARY_TABS.map(([k,l])=>`<button type="button" role="tab" id="diaryTab-${k}" data-diary-tab="${k}" aria-selected="false">${l}</button>`).join('')}</div>`
      +'<section class="diary-chat" data-diary-panel="write" role="tabpanel" aria-labelledby="diaryTab-write"><div class="chat-log" id="diaryChatLog" role="log" aria-live="polite"></div>'
      +'<form class="chat-bar" id="diaryChatComposer" data-chat-form><p class="diary-error" hidden id="diaryChatError" role="alert"></p>'
      +'<textarea class="ui-field" id="diaryChatText" rows="1" aria-label="대화 입력"></textarea>'
      +'<button type="submit" class="ui-btn ui-btn-primary" id="diaryChatSend">보내기</button></form></section>');
    wrap.querySelector('.diary-layout')?.setAttribute('data-diary-panel','practice');
    wrap.querySelector('.diary-list')?.setAttribute('data-diary-panel','history');
    g('diaryTabs').addEventListener('click',e=>{ const b=e.target.closest('[data-diary-tab]'); if(b) setDiaryTab(b.dataset.diaryTab); });
    g('diaryTabs').addEventListener('keydown',e=>{
      if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return;
      const i=DIARY_TABS.findIndex(([k])=>k===diaryTab), n=(i+(e.key==='ArrowRight'?1:-1)+DIARY_TABS.length)%DIARY_TABS.length;
      setDiaryTab(DIARY_TABS[n][0]); g('diaryTab-'+DIARY_TABS[n][0])?.focus();
    });
    const composer=g('diaryChatComposer'), chatPanel=wrap.querySelector('.diary-chat');
    chatPanel.addEventListener('click',e=>{
      const pick=e.target.closest('[data-chat-pick]');
      if(pick){ chatAnswer(pick.dataset.chatPick,pick.textContent); return; }
      const tog=e.target.closest('[data-chat-toggle]');
      if(tog){ const v=tog.dataset.chatToggle, i=chat.picks.indexOf(v); if(i>=0) chat.picks.splice(i,1); else chat.picks.push(v); tog.classList.toggle('active',i<0); tog.setAttribute('aria-pressed',i<0?'true':'false'); if(g('diaryChatError')) g('diaryChatError').hidden=true; chatNextLabel(); return; }
      if(e.target.closest('[data-chat-save]')){ chatSave(); return; }
      if(e.target.closest('[data-chat-restart]')){ chatStart(); return; }
      const go=e.target.closest('[data-chat-go]');
      if(go) setDiaryTab(go.dataset.chatGo);
    });
    composer.addEventListener('input',chatNextLabel);
    composer.addEventListener('submit',e=>{
      e.preventDefault();
      const st=CHAT_STEPS[chat.step]; if(!st) return;
      const text=g('diaryChatText')?.value.trim()||'';
      const err=g('diaryChatError');
      if(st.type==='text'){
        if(!text){ if(err){ err.textContent='한 줄이라도 적어주세요.'; err.hidden=false; } g('diaryChatText')?.focus(); return; }
        chatAnswer(text,text); return;
      }
      const values=[...chat.picks,text].filter(Boolean);
      if(!values.length && !st.skip){ if(err){ err.textContent='위에서 하나 이상 골라주세요.'; err.hidden=false; } return; }
      chatAnswer(values,values.length?values.join(', '):'');
    });
    composer.addEventListener('keydown',e=>{
      if(e.key==='Enter' && !e.shiftKey && e.target.matches('textarea#diaryChatText')){ e.preventDefault(); e.target.form?.requestSubmit(); }
    });
    setDiaryTab('write');
    loadDiaryTypeInfo().then(chatStart);
  }
  setupDiaryTabs();

  renderDiaryForm().then(renderExperiments); /* 내 유형이 바뀌었을 수 있어 추천을 다시 그림 */
    document.getElementById('page-diary')?.scrollTo({top:0});
  };

  /* 나의 공간은 작은 대시보드 한 페이지. 없앤 영역(ai·library·community) 주소는 맨 위로 */
  window.showMySpaceSection=function(key='dashboard',push=true){
    if(key==='reflection'){ showDiaryPage(push); return; }
    key='dashboard';
    currentMySpace=key;
    if(typeof activateBasePage==='function') activateBasePage('myspace');
    document.querySelectorAll('.myspace-panel').forEach(p=>p.classList.add('active'));
    const mobileTitle=document.getElementById('shellMobileTitle');
    if(mobileTitle) mobileTitle.textContent='나의 공간';
    if(push) history.replaceState(null,'',`#myspace-${key}`);
    if(typeof closeShellMenu==='function') closeShellMenu();
    renderDashboard();
    document.getElementById('page-myspace')?.scrollTo({top:0});
  };

  // ---- Myspace nav ----
  document.querySelector('.top-nav-main[data-top-page="myspace"]')?.addEventListener('click',()=>showMySpaceSection('dashboard'));
  document.querySelector('.shell-menu-btn[data-page="myspace"]')?.addEventListener('click',()=>showMySpaceSection('dashboard'));
  document.querySelector('.top-nav-main[data-top-page="diary"]')?.addEventListener('click',()=>showDiaryPage());
  document.querySelector('.shell-menu-btn[data-page="diary"]')?.addEventListener('click',()=>showDiaryPage());
  document.querySelectorAll('[data-myspace-jump]').forEach(b=>b.addEventListener('click',()=>showMySpaceSection(b.dataset.myspaceJump)));

  // ---- dashboard ----
  const myTypeSelect=document.getElementById('dashboardMyType');
  const myTypeStored=read(STORAGE.myType,'');
  if(myTypeSelect) myTypeSelect.value=myTypeStored;
  myTypeSelect?.addEventListener('change',()=>{
    write(STORAGE.myType,myTypeSelect.value);
    renderDashboard();
  });

  function aggregateMotives(reflections){
    const counts={};
    reflections.forEach(r=>(r.motives||[]).forEach(m=>counts[m]=(counts[m]||0)+1));
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  }
  function aggregateCategories(reflections){
    const counts={};
    reflections.forEach(r=>{if(r.category) counts[r.category]=(counts[r.category]||0)+1});
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  }
  function aggregateEmotions(reflections){
    const counts={};
    reflections.forEach(r=>(r.emotions||[]).forEach(e=>counts[e]=(counts[e]||0)+1));
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  }

  /* ---- 나의 변화 보기 (그래프는 모두 한 가지 색: 개수만 보여주므로 범주 색을 쓰지 않는다) ---- */
  let changePeriod='30';
  /* 받침 있으면 a(을·과), 없으면 b(를·와) */
  const josa=(w,a,b)=>{const c=String(w).charCodeAt(String(w).length-1);return (c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28)?a:b;};
  const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const startOfDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
  const mondayOf=d=>{const x=startOfDay(d);const w=(x.getDay()+6)%7;return addDays(x,-w);};

  function recordDayCounts(reflections){
    const m={};
    reflections.forEach(r=>{const d=new Date(r.createdAt);if(!Number.isNaN(d.getTime())){const k=dayKey(d);m[k]=(m[k]||0)+1;}});
    return m;
  }
  /* 오늘(오늘 기록이 없으면 어제)부터 거꾸로 이어진 기록한 날 수 */
  function recordStreak(counts){
    let d=startOfDay(new Date());
    if(!counts[dayKey(d)]) d=addDays(d,-1);
    let n=0;
    while(counts[dayKey(d)]){ n++; d=addDays(d,-1); }
    return n;
  }
  function barsHTML(entries,labelFn,unit){
    if(!entries.length) return '<div class="empty-state small"><strong>아직 보여줄 흐름이 없어요.</strong><p>다이어리에 기록을 남기면 여기에 모여요.</p></div>';
    const top=entries.slice(0,5), max=top[0][1];
    return `<div class="change-bar-list" role="list">${top.map(([k,c])=>`
      <div class="change-bar-row" role="listitem" aria-label="${esc(labelFn(k))} ${c}${unit}">
        <span class="change-bar-label">${esc(labelFn(k))}</span>
        <span class="change-bar-track"><span class="change-bar-fill" style="width:${Math.max(8,Math.round(c/max*100))}%"></span></span>
        <b class="change-bar-value">${c}</b>
      </div>`).join('')}</div>`;
  }
  function calendarHTML(counts){
    const today=startOfDay(new Date());
    const start=addDays(mondayOf(today),-28);
    const cells=[];
    for(let i=0;i<35;i++){
      const d=addDays(start,i);
      if(d>today){ cells.push('<span class="change-day is-future" aria-hidden="true"></span>'); continue; }
      const c=counts[dayKey(d)]||0;
      const label=`${d.getMonth()+1}월 ${d.getDate()}일 · ${c?`기록 ${c}개`:'기록 없음'}`;
      cells.push(`<span class="change-day level-${Math.min(c,2)}${dayKey(d)===dayKey(today)?' is-today':''}" role="img" aria-label="${label}" title="${label}" data-tip="${label}"></span>`);
    }
    return `<div class="change-weekdays" aria-hidden="true">${['월','화','수','목','금','토','일'].map(w=>`<span>${w}</span>`).join('')}</div>
      <div class="change-days">${cells.join('')}</div>
      <div class="change-legend" aria-hidden="true"><span class="change-day level-0"></span>없음<span class="change-day level-1"></span>1개<span class="change-day level-2"></span>2개 이상</div>`;
  }
  function weeksHTML(reflections){
    const thisMonday=mondayOf(new Date());
    const weeks=[];
    for(let i=7;i>=0;i--){
      const from=addDays(thisMonday,-7*i), to=addDays(from,7);
      const c=reflections.filter(r=>{const d=new Date(r.createdAt);return d>=from&&d<to;}).length;
      weeks.push({from,c});
    }
    const max=Math.max(1,...weeks.map(w=>w.c));
    return `<div class="change-week-cols">${weeks.map(w=>{
      const label=`${w.from.getMonth()+1}/${w.from.getDate()} 주`;
      return `<div class="change-week" role="img" aria-label="${label} 기록 ${w.c}개" title="${label} · 기록 ${w.c}개">
        <span class="change-week-value">${w.c||''}</span>
        <span class="change-week-bar${w.c?'':' is-empty'}" style="height:${w.c?Math.max(8,Math.round(w.c/max*100)):4}%"></span>
        <span class="change-week-label">${w.from.getMonth()+1}/${w.from.getDate()}</span>
      </div>`;}).join('')}</div>`;
  }

  function renderDashboard(){
    const all=readReflections();
    const since=changePeriod==='all'?null:addDays(startOfDay(new Date()),-29);
    const reflections=since?all.filter(r=>new Date(r.createdAt)>=since):all;
    const motives=aggregateMotives(reflections);
    const cats=aggregateCategories(reflections);
    const emotions=aggregateEmotions(reflections);
    const counts=recordDayCounts(all);
    const exp=experimentSummary();
    const set=(id,v)=>{const el=document.getElementById(id);if(el) el.textContent=v;};

    set('dashReflectionCount',reflections.length);
    set('dashReflectionSub',changePeriod==='all'?'개의 장면을 돌아봤어요.':'개의 장면을 최근 30일에 돌아봤어요.');
    set('dashStreak',recordStreak(counts));
    set('dashExperiment',`${exp.done} / ${exp.total}`);

    const html=(id,v)=>{const el=document.getElementById(id);if(el) el.innerHTML=v;};
    const catName=v=>(DIARY_CATEGORIES.find(c=>c[0]===v)||[v,v])[1];
    html('changeCalendar',calendarHTML(counts));
    html('changeWeeks',weeksHTML(all));
    html('changeEmotions',barsHTML(emotions,x=>x,'번'));
    html('dashMotiveBars',barsHTML(motives,x=>x,'번'));
    html('changeScenes',barsHTML(cats,catName,'개'));

    const summary=document.getElementById('dashPatternSummary');
    const myType=read(STORAGE.myType,'');
    if(!summary) return;
    if(!reflections.length){
      summary.innerHTML=changePeriod==='all'||!all.length
        ?'기록이 생기면 <b>어떤 상황에서 무엇을 중요하게 보고 어떤 방식으로 반응하는지</b>를 여기에 정리해요.'
        :'최근 30일에는 기록이 없어요. <b>전체</b>를 눌러 예전 기록의 흐름을 보거나, 다이어리에 오늘의 장면을 남겨보세요.';
    }else{
      const m=motives[0]?.[0];
      const c=cats[0]?.[0];
      const e=emotions[0]?.[0];
      const second=motives[1]?.[0];
      let text=`${changePeriod==='all'?'지금까지':'최근 30일'} ${reflections.length}개의 기록에서는 `;
      if(c) text+=`<b>${esc(catName(c))}</b> 장면이 가장 자주 등장했고, `;
      if(e) text+=`<b>${esc(e)}</b>${josa(e,'을','를')} 가장 자주 느꼈어요. `;
      if(m) text+=`<b>${esc(m)}</b>${second?`${josa(m,'과','와')} <b>${esc(second)}</b>`:''} 단서가 반복됐어요. `;
      text+=`이게 여러 상황에서 같은 이유로 반복되는지 다음 기록에서도 살펴보세요.`;
      if(myType && TYPES[myType]) text+=` <br><br><b>${myType}번 ${TYPES[myType].name}</b>${josa(TYPES[myType].name,'을','를')} 탐색 중이라면, 이 기록들이 ${TYPES[myType].focus}${josa(TYPES[myType].focus,'이라는','라는')} 유형 설명과 실제로 어떻게 이어지는지 비교해볼 수 있어요.`;
      summary.innerHTML=text;
    }
  }
  document.getElementById('changePeriod')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-change-period]');
    if(!b) return;
    changePeriod=b.dataset.changePeriod;
    b.parentElement.querySelectorAll('[data-change-period]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on?'true':'false');});
    renderDashboard();
  });
  document.querySelectorAll('[data-share-open]').forEach(b=>b.addEventListener('click',()=>{ if(typeof showSharePage==='function') showSharePage(); }));

  // ---- Diary (성찰 기록) ----
  /* 기록 형식 schemaVersion 2: 감정(emotions)을 추가했다.
     예전 기록(버전 없음)은 읽을 때 emotions:[]를 붙여 v2로 옮겨 저장한다.
     배열 구조는 그대로라 다른 화면(홈 '이어서 보기', 나의 변화)도 같은 키를 그대로 읽는다. */
  function readReflections(){
    const arr=read(STORAGE.reflections,[]);
    if(!Array.isArray(arr)) return [];
    let changed=false;
    const out=arr.filter(Boolean).map(r=>{
      if(r.schemaVersion===REFLECTION_SCHEMA) return r;
      changed=true;
      return {...r,schemaVersion:REFLECTION_SCHEMA,emotions:Array.isArray(r.emotions)?r.emotions:[]};
    });
    if(changed) write(STORAGE.reflections,out);
    return out;
  }

  const DIARY_CATEGORIES=[['일상','일상'],['관계','사람 사이'],['연애','사랑'],['가족','가족'],['일','일'],['돈','돈'],['리더십','이끄는 나'],['취미','쉼·취미']];
  const DIARY_EMOTIONS=['서운함','불안','답답함','화남','부끄러움','외로움','뿌듯함','기쁨','편안함','설렘'];
  const DIARY_MOTIVES=['올바름','사랑·필요됨','인정·가치','정체성·의미','유능함·이해','안전·신뢰','자유·가능성','자율성·통제','평화·조화'];
  /* 유형별 단서: 내 유형의 단서를 맨 앞에 */
  const DIARY_TYPE_MOTIVE={1:'올바름',2:'사랑·필요됨',3:'인정·가치',4:'정체성·의미',5:'유능함·이해',6:'안전·신뢰',7:'자유·가능성',8:'자율성·통제',9:'평화·조화'};
  const DIARY_REACTIONS=['괜찮은 척 넘겼다','바로 사과했다','자리를 피했다','더 열심히 했다','화를 냈다','아무 말도 못 했다','웃으며 분위기를 맞췄다','도움을 요청했다','혼자 정리하려 했다','상대를 설득하려 했다'];
  /* 왜 그랬을까: 유형마다 자주 보이는 이유 한 줄씩(9개) — 내 유형 것을 맨 앞에 두고 '내 유형' 표시 */
  const DIARY_WHY_BY_TYPE={1:'틀리거나 잘못될까 봐',2:'상대를 실망시키기 싫어서',3:'인정받고 싶어서',4:'나답지 않다고 느껴서',5:'충분히 알기 전엔 움직이기 어려워서',6:'혹시 잘못될까 불안해서',7:'답답한 건 견디기 힘들어서',8:'내 방식대로 하고 싶어서',9:'갈등이 생기는 게 싫어서'};
  const DIARY_WHY_LABELS=[
    ['왜 그렇게 반응했을까요?','첫 번째 이유'],
    ['그게 왜 나에게 중요했을까요?','한 단계 더'],
    ['그게 충족되지 않으면 무엇이 불편하거나 두려울까요?','두려움이나 불편함'],
    ['그 순간 나는 무엇을 지키거나 얻고 싶었을까요?','욕구나 가치'],
    ['결국 내게 정말 중요했던 것은 무엇 같나요?','가장 깊은 이유']
  ];
  const WHY_KEYS=['why1','why2','why3','why4','why5'];
  const DIARY_NEXT_GENERIC=['“생각해보고 알려줄게”라고 말해보기','대답하기 전에 10초 쉬기','도움이 필요하다고 말해보기'];

  const dayKeyOf=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const longDate=d=>`${d.getMonth()+1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일`;
  const catLabel=v=>(DIARY_CATEGORIES.find(c=>c[0]===v)||[v,v||'기타'])[1];

  /* 내 유형: 내가 고른 유형 > 검사 결과 (홈과 같은 규칙) */
  function diaryMyType(){
    const p=typeof getHomeProfile==='function'?getHomeProfile():null;
    return p?Number(p.type):null;
  }
  /* 유형별 추천(핸드북 원문에서): 성장 행동 · 자동 패턴 */
  let diaryTypeInfo={type:null,actions:[],patterns:[],name:''};
  async function loadDiaryTypeInfo(){
    const t=diaryMyType();
    if(!t || typeof getTypeProfile!=='function'){ diaryTypeInfo={type:null,actions:[],patterns:[],name:''}; return; }
    if(diaryTypeInfo.type===t) return;
    try{
      const d=await getTypeProfile(t);
      diaryTypeInfo={type:t,name:d.name,actions:(d.actions||[]).slice(0,6),patterns:(d.autoPattern||[]).slice(0,3)};
    }catch(e){ diaryTypeInfo={type:t,actions:[],patterns:[],name:TYPES[t]?.name||''}; }
  }

  /* ---- 작성 상태 ---- */
  const emptyDraft=()=>({date:dayKeyOf(new Date()),category:'일상',emotions:[],emotionOther:'',reactionPicks:[],whyPicks:{why1:[],why2:[],why3:[],why4:[],why5:[]},motives:[],nextPicks:[]});
  let diaryDraft=emptyDraft();
  let diaryFilter='전체';
  const g=id=>document.getElementById(id);
  const chip=(value,label,on,attr,extra='')=>`<button type="button" class="ui-chip${on?' active':''}" ${attr}="${esc(value)}" aria-pressed="${on?'true':'false'}"${extra}>${esc(label)}</button>`;

  function renderDiaryDateChips(){
    const box=g('diaryDateChips'); if(!box) return;
    const today=new Date(); today.setHours(0,0,0,0);
    const days=[];
    for(let i=0;i<7;i++){ const d=new Date(today); d.setDate(d.getDate()-i); days.push(d); }
    box.innerHTML=days.map((d,i)=>chip(dayKeyOf(d),i===0?'오늘':i===1?'어제':`${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}`,diaryDraft.date===dayKeyOf(d),'data-diary-date')).join('');
    const input=g('diaryDateInput');
    if(input){ input.max=dayKeyOf(today); const min=new Date(today); min.setDate(min.getDate()-6); input.min=dayKeyOf(min); input.value=diaryDraft.date; }
  }
  function renderDiaryChips(){
    const t=diaryTypeInfo.type;
    const set=(id,html)=>{const el=g(id); if(el) el.innerHTML=html;};
    set('diaryCategoryChips',DIARY_CATEGORIES.map(([v,l])=>chip(v,l,diaryDraft.category===v,'data-diary-category')).join(''));
    set('diaryEmotionChips',DIARY_EMOTIONS.map(e=>chip(e,e,diaryDraft.emotions.includes(e),'data-diary-emotion')).join('')+chip('기타','기타',!!diaryDraft.emotionOther,'data-diary-emotion-other'));
    const other=g('diaryEmotionOther'); if(other) other.hidden=!diaryDraft.emotionOther && !other.dataset.open;
    set('diaryReactionChips',DIARY_REACTIONS.map(r=>chip(r,r,diaryDraft.reactionPicks.includes(r),'data-diary-pick','data-field="reaction"')).join(''));
    /* 왜: 내 유형 이유를 맨 앞(표시), 나머지 유형 이유, 핸드북 자동 패턴 */
    const whyOptions=[];
    if(t && DIARY_WHY_BY_TYPE[t]) whyOptions.push([DIARY_WHY_BY_TYPE[t],`${DIARY_WHY_BY_TYPE[t]} · 내 유형`]);
    Object.entries(DIARY_WHY_BY_TYPE).forEach(([k,v])=>{ if(Number(k)!==t) whyOptions.push([v,v]); });
    diaryTypeInfo.patterns.forEach(p=>{ const s=p.length>34?p.slice(0,33)+'…':p; whyOptions.splice(1,0,[p,s+' · 내 유형']); });
    const help=g('diaryWhyHelp');
    if(help) help.textContent=t?`한 번의 “왜?”로 끝내지 말고 한 단계씩 내려가요. ‘내 유형’ 표시는 ${t}번 ${diaryTypeInfo.name||TYPES[t]?.name||''}에게 자주 보이는 이유예요.`:'한 번의 “왜?”로 끝내지 말고 한 단계씩 내려가요. 유형 검사를 하면 내 유형에서 자주 보이는 이유를 먼저 보여줘요.';
    set('diaryWhyList',WHY_KEYS.map((k,i)=>`
      <div class="diary-why" data-why="${k}">
        <label class="diary-why-label" for="diary_${k}"><span class="diary-why-no">${i+1}</span>${esc(DIARY_WHY_LABELS[i][0])}</label>
        <div class="ui-chips diary-why-chips">${whyOptions.slice(0,i===0?whyOptions.length:6).map(([v,l])=>chip(v,l,diaryDraft.whyPicks[k].includes(v),'data-diary-pick',`data-field="${k}"`)).join('')}</div>
        <textarea class="ui-field" id="diary_${k}" placeholder="직접 쓰기: ${esc(DIARY_WHY_LABELS[i][1])}" rows="2">${esc(document.getElementById('diary_'+k)?.value||'')}</textarea>
      </div>`).join(''));
    const motives=t?[DIARY_TYPE_MOTIVE[t],...DIARY_MOTIVES.filter(m=>m!==DIARY_TYPE_MOTIVE[t])]:DIARY_MOTIVES;
    set('diaryMotiveChips',motives.map(m=>chip(m,m===DIARY_TYPE_MOTIVE[t]?`${m} · 내 유형`:m,diaryDraft.motives.includes(m),'data-diary-motive')).join(''));
    const nexts=(diaryTypeInfo.actions.length?diaryTypeInfo.actions.slice(0,3):DIARY_NEXT_GENERIC);
    const nextHelp=g('diaryNextHelp');
    if(nextHelp) nextHelp.textContent=t&&diaryTypeInfo.actions.length?`저장하면 ‘해보기로 한 것’에 들어가요. 아래는 ${t}번에게 권하는 성장 행동이에요. 직접 써도 좋아요.`:'저장하면 ‘해보기로 한 것’에 들어가요. 아주 작은 행동 하나면 충분해요.';
    set('diaryNextChips',nexts.map(x=>chip(x,x.length>40?x.slice(0,39)+'…':x,diaryDraft.nextPicks.includes(x),'data-diary-pick','data-field="next"')).join(''));
  }
  async function renderDiaryForm(){
    renderDiaryDateChips();
    renderDiaryChips();
    await loadDiaryTypeInfo();
    renderDiaryChips();
  }
  function joinPicks(picks,free){
    return [...picks,free.trim()].filter(Boolean).join(' · ');
  }
  function collectDiary(){
    const situation=g('diarySituation').value.trim();
    const whys=WHY_KEYS.map(k=>joinPicks(diaryDraft.whyPicks[k],g('diary_'+k).value));
    const emotions=[...diaryDraft.emotions, diaryDraft.emotionOther.trim()].filter(Boolean);
    const next=joinPicks(diaryDraft.nextPicks,g('diaryNext').value);
    const title=g('diaryTitle').value.trim()||situation.split(/[.\n!?]/)[0].slice(0,30);
    /* 날짜: 오늘이면 지금 시각, 지난 날이면 정오 */
    const isToday=diaryDraft.date===dayKeyOf(new Date());
    const createdAt=isToday?today():`${diaryDraft.date}T12:00:00.000`;
    return {id:'r_'+Date.now(),schemaVersion:REFLECTION_SCHEMA,createdAt:new Date(createdAt).toISOString(),title,category:diaryDraft.category,emotions,situation,reaction:joinPicks(diaryDraft.reactionPicks,g('diaryReaction').value),whys,motives:[...diaryDraft.motives],next};
  }
  function clearDiaryForm(){
    diaryDraft=emptyDraft();
    ['diarySituation','diaryReaction','diaryNext','diaryTitle',...WHY_KEYS.map(k=>'diary_'+k)].forEach(id=>{const el=g(id); if(el) el.value='';});
    const other=g('diaryEmotionOther'); if(other){ other.value=''; delete other.dataset.open; }
    renderDiaryDateChips(); renderDiaryChips();
  }

  g('diaryForm')?.addEventListener('click',e=>{
    const date=e.target.closest('[data-diary-date]');
    if(date){ diaryDraft.date=date.dataset.diaryDate; renderDiaryDateChips(); return; }
    const cat=e.target.closest('[data-diary-category]');
    if(cat){ diaryDraft.category=cat.dataset.diaryCategory; renderDiaryChips(); return; }
    const emo=e.target.closest('[data-diary-emotion]');
    if(emo){ const v=emo.dataset.diaryEmotion; diaryDraft.emotions=diaryDraft.emotions.includes(v)?diaryDraft.emotions.filter(x=>x!==v):[...diaryDraft.emotions,v]; renderDiaryChips(); return; }
    if(e.target.closest('[data-diary-emotion-other]')){ const other=g('diaryEmotionOther'); other.dataset.open='1'; other.hidden=false; other.focus(); return; }
    const mot=e.target.closest('[data-diary-motive]');
    if(mot){ const v=mot.dataset.diaryMotive; diaryDraft.motives=diaryDraft.motives.includes(v)?diaryDraft.motives.filter(x=>x!==v):[...diaryDraft.motives,v]; renderDiaryChips(); return; }
    const pick=e.target.closest('[data-diary-pick]');
    if(pick){
      const v=pick.dataset.diaryPick, f=pick.dataset.field;
      const arr=f==='reaction'?diaryDraft.reactionPicks:f==='next'?diaryDraft.nextPicks:diaryDraft.whyPicks[f];
      const i=arr.indexOf(v); if(i>=0) arr.splice(i,1); else arr.push(v);
      pick.classList.toggle('active',i<0); pick.setAttribute('aria-pressed',i<0?'true':'false');
      return;
    }
  });
  g('diaryDateInput')?.addEventListener('change',e=>{ if(e.target.value){ diaryDraft.date=e.target.value; renderDiaryDateChips(); } });
  g('diaryEmotionOther')?.addEventListener('input',e=>{ diaryDraft.emotionOther=e.target.value; });
  g('diarySituation')?.addEventListener('input',()=>{ const err=g('diarySituationError'); if(err) err.hidden=true; });
  g('diaryClear')?.addEventListener('click',()=>{ clearDiaryForm(); g('diaryNotice').hidden=true; });
  g('diaryForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const err=g('diarySituationError');
    if(!g('diarySituation').value.trim()){ if(err){ err.textContent='장면을 한 줄이라도 적어주세요.'; err.hidden=false; } g('diarySituation').focus(); return; }
    const record=collectDiary();
    const arr=readReflections(); arr.unshift(record); write(STORAGE.reflections,arr);
    clearDiaryForm();
    const notice=g('diaryNotice');
    if(notice){ notice.textContent=record.next?'기록을 저장했어요. ‘다음엔’은 해보기로 한 것에 들어갔어요.':'기록을 저장했어요. 아래 ‘나의 기록’에서 볼 수 있어요.'; notice.hidden=false; }
    renderReflectionHistory(); renderExperiments(); renderDashboard();
    g('experimentList')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  });

  /* ---- 나의 기록: 장면별 필터 · 자주 나온 단서와 감정 · 날짜별 카드 ---- */
  function topCount(list){
    const m={}; list.forEach(x=>{m[x]=(m[x]||0)+1;});
    return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]||null;
  }
  function renderReflectionHistory(){
    const all=readReflections();
    const list=g('reflectionHistoryList');
    const badge=g('reflectionCountBadge');
    if(badge) badge.textContent=all.length;
    if(!list) return;
    const cats=[...new Set(all.map(r=>r.category).filter(Boolean))];
    if(diaryFilter!=='전체' && !cats.includes(diaryFilter)) diaryFilter='전체';
    const filter=g('diaryFilter');
    if(filter) filter.innerHTML=all.length?[['전체','전체'],...cats.map(c=>[c,catLabel(c)])].map(([val,label])=>chip(val,label,diaryFilter===val,'data-diary-filter')).join(''):'';
    const insight=g('diaryInsight');
    const often=x=>x&&x[1]>=2?x:null;
    const motive=often(topCount(all.flatMap(r=>r.motives||[])));
    const emotion=often(topCount(all.flatMap(r=>r.emotions||[])));
    if(insight) insight.innerHTML=(motive||emotion)?[motive?`자주 나온 단서 <b>${esc(motive[0])}</b> ${motive[1]}회`:'',emotion?`자주 느낀 감정 <b>${esc(emotion[0])}</b> ${emotion[1]}회`:''].filter(Boolean).join(' · '):'';
    const arr=all.filter(r=>diaryFilter==='전체'||r.category===diaryFilter);
    if(!arr.length){
      list.innerHTML='<div class="ui-empty"><strong>아직 기록이 없어요.</strong><p>위에서 오늘의 장면 하나를 적어보세요.</p></div>';
      return;
    }
    const groups=[];
    arr.forEach(r=>{
      const key=formatDate(r.createdAt);
      let gr=groups.find(x=>x.key===key);
      if(!gr){ const d=new Date(r.createdAt); gr={key,label:Number.isNaN(d.getTime())?'날짜 없음':longDate(d),items:[]}; groups.push(gr); }
      gr.items.push(r);
    });
    list.innerHTML=groups.map(gr=>`
      <div class="diary-day">
        <div class="diary-day-label">${esc(gr.label)}</div>
        ${gr.items.map(r=>{
          /* 기록은 펼치기 없이 전부 보여준다 (2026-10-03, 토글 없애기) */
          const detail=[['무슨 일이 있었나요?',r.situation],['나는 어떻게 반응했나요?',r.reaction],...(r.whys||[]).map((w,i)=>[DIARY_WHY_LABELS[i][0],w]),['다음엔',r.next]].filter(x=>x[1]);
          return `<article class="diary-card">
            <div class="diary-card-head">
              <h3>${esc(r.title||'제목 없는 기록')}</h3>
              <div class="diary-card-emotions">${(r.emotions||[]).map(e=>`<span>${esc(e)}</span>`).join('')}</div>
            </div>
            <div class="diary-card-meta">${esc(catLabel(r.category))}</div>
            ${(r.motives||[]).length?`<div class="history-tags">${r.motives.map(m=>`<span>${esc(m)}</span>`).join('')}</div>`:''}
            <div class="diary-card-detail"><dl class="diary-review">${detail.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>
            <div class="diary-card-actions">
              <button type="button" class="ui-btn ui-btn-ghost" data-delete-reflection="${esc(r.id)}">삭제</button>
            </div>
          </article>`;}).join('')}
      </div>`).join('');
  }
  g('diaryFilter')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-diary-filter]');
    if(!b) return;
    diaryFilter=b.dataset.diaryFilter;
    renderReflectionHistory();
  });
  g('reflectionHistoryList')?.addEventListener('click',e=>{
    const del=e.target.closest('[data-delete-reflection]');
    if(del){
      const all=readReflections();
      const removed=all.find(r=>r.id===del.dataset.deleteReflection);
      if(!removed) return;
      write(STORAGE.reflections,all.filter(r=>r.id!==removed.id));
      renderReflectionHistory(); renderExperiments(); renderDashboard();
      showUndo(`‘${removed.title||'제목 없는 기록'}’을 삭제했어요.`,()=>{
        const cur=readReflections(); if(cur.some(r=>r.id===removed.id)) return;
        cur.push(removed); cur.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        write(STORAGE.reflections,cur); renderReflectionHistory(); renderExperiments(); renderDashboard();
      });
    }
  });

  /* 되돌리기 줄: 목록 위에 8초 동안. 되돌릴 수 없는 작업이 아니므로 확인창을 띄우지 않는다 */
  let undoTimer=null;
  function showUndo(text,onUndo){
    const host=g('diaryUndo');
    if(!host) return;
    clearTimeout(undoTimer);
    host.innerHTML=`<span>${esc(text)}</span><button type="button" class="ui-btn ui-btn-ghost" data-undo>되돌리기</button>`;
    host.hidden=false;
    host.querySelector('[data-undo]').addEventListener('click',()=>{ onUndo(); host.hidden=true; clearTimeout(undoTimer); });
    undoTimer=setTimeout(()=>{ host.hidden=true; },8000);
  }

  /* ---- 해보기로 한 것(성장 실험): 다이어리의 '다음엔' + 유형별 추천 + 직접 추가 ----
     저장 키 enneagram_experiments_v1, schemaVersion 2:
     { schemaVersion, status:{ [기록 id 또는 실험 id]: { done, note, updatedAt, routine?:{ freq:'daily'|'weekdays'|'three', since }, log?:{ 'YYYY-MM-DD':true } } },
       custom:[{ id, text, createdAt, src? }] }
     v1 → v2: 구조는 그대로이고 routine·log는 없으면 '루틴 아님'으로 읽으므로, 버전 숫자만 올려 다시 저장한다. */
  function readExperiments(){
    const v=read(STORAGE.experiments,null);
    if(v && v.schemaVersion===EXPERIMENT_SCHEMA && v.status && Array.isArray(v.custom)) return v;
    if(v && v.schemaVersion===1 && v.status && Array.isArray(v.custom)){
      const migrated={...v,schemaVersion:EXPERIMENT_SCHEMA};
      write(STORAGE.experiments,migrated);
      return migrated;
    }
    return {schemaVersion:EXPERIMENT_SCHEMA,status:{},custom:[]};
  }

  /* 루틴: 매일 · 평일 · 일주일에 3번. 이번 주(월~일) 체크 칸과 연속 기록 */
  const ROUTINE_FREQ={daily:['매일',7],weekdays:['평일',5],three:['일주일에 3번',3]};
  function weekDays(){
    const now=new Date(); now.setHours(0,0,0,0);
    const mon=new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7));
    return Array.from({length:7},(_,i)=>{const d=new Date(mon); d.setDate(mon.getDate()+i); return d;});
  }
  function routineStats(it){
    const log=it.log||{}, freq=it.routine?.freq;
    const todayKey=dayKeyOf(new Date());
    const week=weekDays().map(d=>({key:dayKeyOf(d),label:'월화수목금토일'[(d.getDay()+6)%7],done:!!log[dayKeyOf(d)],today:dayKeyOf(d)===todayKey,future:dayKeyOf(d)>todayKey,weekend:d.getDay()===0||d.getDay()===6}));
    const count=week.filter(w=>w.done&&!(freq==='weekdays'&&w.weekend)).length;
    let streak=0; const d=new Date(); d.setHours(0,0,0,0);
    if(!log[dayKeyOf(d)]) d.setDate(d.getDate()-1);
    while(log[dayKeyOf(d)]){ streak++; d.setDate(d.getDate()-1); }
    return {week,count,target:(ROUTINE_FREQ[freq]||ROUTINE_FREQ.daily)[1],label:(ROUTINE_FREQ[freq]||ROUTINE_FREQ.daily)[0],streak,todayDone:!!log[todayKey]};
  }
  function experimentItems(){
    const store=readExperiments();
    const fromDiary=readReflections().filter(r=>(r.next||'').trim()).map(r=>{
      const d=new Date(r.createdAt);
      return {id:r.id,text:r.next.trim(),src:`${Number.isNaN(d.getTime())?'':longDate(d)+' 기록 · '}${r.title||'제목 없는 기록'}`,custom:false,createdAt:r.createdAt};
    });
    const custom=store.custom.map(c=>({id:c.id,text:c.text,src:c.src||'직접 추가',custom:true,createdAt:c.createdAt}));
    return [...fromDiary,...custom]
      .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
      .map(it=>({...it,done:!!store.status[it.id]?.done,note:store.status[it.id]?.note||'',routine:store.status[it.id]?.routine||null,log:store.status[it.id]?.log||{}}));
  }
  function experimentSummary(){
    const items=experimentItems();
    return {total:items.length,done:items.filter(i=>i.done).length};
  }
  let experimentFilter=null; /* 처음에는 루틴이 있으면 '루틴', 없으면 '해볼 것' */
  function renderExperiments(){
    const list=g('experimentList');
    if(!list) return;
    const items=experimentItems();
    const done=items.filter(i=>i.done).length;
    const badge=g('experimentCountBadge');
    if(badge) badge.textContent=`${done} / ${items.length}`;
    const routines=items.filter(i=>i.routine).length;
    if(!experimentFilter) experimentFilter=routines?'routine':'todo';
    const filter=g('experimentFilter');
    if(filter) filter.innerHTML=[['routine',`루틴 ${routines}`],['todo',`해볼 것 ${items.length-done}`],['done',`해봤어요 ${done}`],['all','전체']]
      .map(([k,l])=>chip(k,l,experimentFilter===k,'data-exp-filter')).join('');
    const shown=items.filter(i=>experimentFilter==='all'||(experimentFilter==='routine'?!!i.routine:(experimentFilter==='done')===i.done));
    const routineHTML=it=>{
      if(!it.routine) return `<div class="routine-start"><span class="routine-start-label">루틴으로 만들기</span>`
        +`<div class="ui-chips routine-pick">${Object.entries(ROUTINE_FREQ).map(([k,[l]])=>`<button type="button" class="ui-chip" data-routine-set="${esc(it.id)}" data-freq="${k}">${l}</button>`).join('')}</div></div>`;
      const st=routineStats(it);
      return `<div class="routine">`
        +`<div class="routine-head"><span class="routine-freq">${esc(st.label)}</span><span class="routine-stat">이번 주 ${st.count} / ${st.target}${st.streak>1?` · 연속 ${st.streak}일`:''}</span></div>`
        +`<ol class="routine-week" aria-label="이번 주 체크">${st.week.map(w=>`<li class="${w.done?'is-done':''}${w.today?' is-today':''}${w.future?' is-future':''}" aria-label="${w.label}요일 ${w.done?'했어요':'안 했어요'}"><span>${w.label}</span><i aria-hidden="true">${w.done?'✓':''}</i></li>`).join('')}</ol>`
        +`<div class="routine-actions"><button type="button" class="ui-btn ui-btn-secondary routine-today${st.todayDone?' is-done':''}" data-routine-today="${esc(it.id)}" aria-pressed="${st.todayDone?'true':'false'}">${st.todayDone?'오늘 했어요 ✓':'오늘 했어요'}</button>`
        +`<button type="button" class="ui-btn ui-btn-ghost" data-routine-stop="${esc(it.id)}">루틴 그만하기</button></div></div>`;
    };
    list.innerHTML=shown.length?shown.map(it=>`
      <article class="experiment-item${it.done?' is-done':''}">
        <button type="button" class="experiment-check" data-exp-toggle="${esc(it.id)}" aria-pressed="${it.done?'true':'false'}" aria-label="${it.done?'해봤어요 해제':'해봤어요로 표시'}">${it.done?'✓':''}</button>
        <div class="experiment-body">
          <p class="experiment-text">${esc(it.text)}</p>
          <span class="experiment-src">${esc(it.src)}</span>
          ${it.done?`<input class="ui-field experiment-note" data-exp-note="${esc(it.id)}" type="text" maxlength="120" placeholder="예: 생각보다 어렵지 않았다" aria-label="해보니 어땠나요?" value="${esc(it.note)}">`:''}
          ${routineHTML(it)}
        </div>
        ${it.custom?`<button type="button" class="ui-btn ui-btn-ghost" data-exp-delete="${esc(it.id)}">삭제</button>`:''}
      </article>`).join('')
      :`<div class="ui-empty"><strong>${experimentFilter==='routine'&&items.length?'아직 루틴이 없어요.':items.length?(experimentFilter==='done'?'아직 해본 것이 없어요.':'해볼 것을 모두 해봤어요.'):'아직 해보기로 한 것이 없어요.'}</strong><p>${experimentFilter==='routine'&&items.length?'‘해볼 것’에서 꾸준히 하고 싶은 행동을 루틴으로 만들어 보세요.':items.length?'작은 것 하나라도 해봤다면 동그라미를 눌러 보세요.':'기록의 ‘다음엔’에 적거나, 아래 추천에서 골라보세요.'}</p></div>`;
    /* 유형별 추천 */
    const reco=g('experimentReco');
    if(reco){
      const t=diaryTypeInfo.type;
      const have=new Set(items.map(i=>i.text));
      const cands=(t&&diaryTypeInfo.actions.length?diaryTypeInfo.actions:DIARY_NEXT_GENERIC).filter(x=>!have.has(x)).slice(0,3);
      reco.innerHTML=cands.length?`<div class="diary-exp-reco-head">${t?`${t}번 ${esc(diaryTypeInfo.name||'')}에게 권하는 실험`:'이런 것부터 해볼 수 있어요'}</div>`
        +cands.map(x=>`<button type="button" class="diary-exp-reco-item" data-exp-reco="${esc(x)}"><span>${esc(x)}</span><b>추가하기</b></button>`).join(''):'';
    }
  }
  function saveExperimentStatus(id,patch){
    const store=readExperiments();
    store.status[id]={...(store.status[id]||{}),...patch,updatedAt:today()};
    write(STORAGE.experiments,store);
  }
  function addCustomExperiment(text,src){
    const store=readExperiments();
    store.custom.unshift({id:'x_'+Date.now(),text,createdAt:today(),src});
    write(STORAGE.experiments,store);
    experimentFilter='todo';
    renderExperiments(); renderDashboard();
  }
  g('experimentFilter')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-exp-filter]');
    if(!b) return;
    experimentFilter=b.dataset.expFilter;
    renderExperiments();
  });
  g('experimentReco')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-exp-reco]');
    if(b) addCustomExperiment(b.dataset.expReco,diaryTypeInfo.type?`추천 · ${diaryTypeInfo.type}번`:'추천');
  });
  g('experimentList')?.addEventListener('click',e=>{
    /* 루틴 고르기는 펼치기 없이 늘 보인다 (2026-10-03, 토글 없애기) */
    const rs=e.target.closest('[data-routine-set]');
    if(rs){ saveExperimentStatus(rs.dataset.routineSet,{routine:{freq:rs.dataset.freq,since:dayKeyOf(new Date())}}); experimentFilter='routine'; renderExperiments(); return; }
    const rt=e.target.closest('[data-routine-today]');
    if(rt){
      const id=rt.dataset.routineToday, store=readExperiments(), key=dayKeyOf(new Date());
      const log={...(store.status[id]?.log||{})};
      if(log[key]) delete log[key]; else log[key]=true;
      saveExperimentStatus(id,{log});
      renderExperiments(); renderDashboard();
      return;
    }
    const rstop=e.target.closest('[data-routine-stop]');
    if(rstop){ saveExperimentStatus(rstop.dataset.routineStop,{routine:null}); renderExperiments(); return; }
    const t=e.target.closest('[data-exp-toggle]');
    if(t){
      const id=t.dataset.expToggle;
      const wasDone=t.getAttribute('aria-pressed')==='true';
      saveExperimentStatus(id,{done:!wasDone});
      renderExperiments(); renderDashboard();
      if(!wasDone) document.querySelector(`[data-exp-note="${CSS.escape(id)}"]`)?.focus();
      return;
    }
    const d=e.target.closest('[data-exp-delete]');
    if(d){
      const store=readExperiments();
      const item=store.custom.find(c=>c.id===d.dataset.expDelete);
      const status=store.status[d.dataset.expDelete];
      store.custom=store.custom.filter(c=>c.id!==d.dataset.expDelete);
      delete store.status[d.dataset.expDelete];
      write(STORAGE.experiments,store);
      renderExperiments(); renderDashboard();
      if(item) showUndo(`‘${item.text.slice(0,20)}${item.text.length>20?'…':''}’을 삭제했어요.`,()=>{
        const cur=readExperiments(); if(cur.custom.some(c=>c.id===item.id)) return;
        cur.custom.unshift(item); if(status) cur.status[item.id]=status;
        write(STORAGE.experiments,cur); renderExperiments(); renderDashboard();
      });
    }
  });
  g('experimentList')?.addEventListener('change',e=>{
    const n=e.target.closest('[data-exp-note]');
    if(n) saveExperimentStatus(n.dataset.expNote,{note:n.value.trim()});
  });
  g('experimentAddForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const input=g('experimentAddInput');
    const err=g('experimentAddError');
    const text=input.value.trim();
    if(!text){ if(err){ err.textContent='해볼 행동을 한 줄 적어주세요.'; err.hidden=false; } input.focus(); return; }
    if(err) err.hidden=true;
    addCustomExperiment(text,'직접 추가');
    input.value='';
  });
  g('experimentAddInput')?.addEventListener('input',()=>{const err=g('experimentAddError');if(err) err.hidden=true;});

  renderDiaryForm().then(renderExperiments);

  // Myspace page remote
  if(typeof PAGE_REMOTE_CONFIG!=='undefined'){
    PAGE_REMOTE_CONFIG.myspace={title:'나의 공간',selector:'#myspaceGroup .shell-myspace-target'};
  }

  // Activate base page myspace group
  const originalActivate=window.activateBasePage;
  if(originalActivate){
    window.activateBasePage=function(name){
      originalActivate(name);
      document.getElementById('myspaceGroup')?.classList.toggle('open',name==='myspace');
    };
  }

  /* =========================================================
     보석 닦기 (2026-10-03, 하단 메뉴 신설): 강의 '6. 성장을 향한 방식'을 옮긴 실천 화면.
     1분 연습(알아차리기 → 멈추기 → 선택하기) · 내 유형의 실천 행동 · 해보기로 한 것(다이어리 '실천' 칸을 옮겨 옴).
     문구 출처: 강의 슬라이드 #78 일깨우는 신호 · #84 건강해지는 법 · #85 성장 키워드 · #86~88 유형별 실천 행동
     ========================================================= */
  const POLISH={
    signals:{1:'자신이 모든 것을 개선시켜야 한다는 의무감을 느껴요',2:'다른 사람들의 마음을 얻기 위해 다가가야 한다고 믿어요',3:'지위와 관심을 얻기 위해 자신을 몰아세워요',4:'상상을 통해서 자신의 느낌을 강화하고 붙들어요',5:'현실과 동떨어져 개념과 내면의 세계로 움츠려요',6:'안내를 구하며 자신이 아닌 외부의 무엇인가에 의존해요',7:'어딘가에 더 나은 것이 있다고 느껴요',8:'어떤 일이 성사되게 하려고 밀어붙이고 투쟁해야 한다고 느껴요',9:'다른 사람들의 요구를 잘 들어줘요'},
    integration:{1:7,2:4,3:6,4:1,5:8,6:9,7:5,8:2,9:3},
    fix:{1:'비판과 완벽주의의 강도 낮추기',2:'도움과 사랑을 거래로 만들지 않기',3:'성과가 나를 증명하지 않아도 괜찮기',4:'감정은 느끼되, 해석은 현실에서 확인하기',5:'‘충분히 준비되면’이 아니라 작은 참여부터',6:'확신이 100%가 아니어도 한쪽을 선택하기',7:'새것을 더하기 전에 지금 것을 충분히 경험하기',8:'밀어붙이기 전에 상대의 선택권 남기기',9:'중요한 일을 편안함보다 먼저 두기'},
    remember:{1:['수용','지혜','유연성','휴식','도움받기'],2:['자기돌봄','경계','직접 요청','받아들이기'],3:['진실함','감정 인식','휴식','협력'],4:['현실 확인','행동','자기수용','가벼움'],5:['참여','행동','몸','나눔'],6:['자기신뢰','안정','용기','선택'],7:['깊이','집중','절제','현재'],8:['절제','취약성','보호','신뢰'],9:['우선순위','자기주장','행동','존재감']},
    practice:{
      1:{direction:'타인을 고치기보다 나를 돌보기',actions:['‘해야 해’ 목소리를 하나의 생각으로 보기','‘충분히 괜찮은 수준’에서 마무리하기','화가 나면 그 아래 욕구부터 알아차리기','피곤함·서운함을 커지기 전에 말하기','증명하지 않아도 되는 쉼을 일정에 넣기','잘못보다 잘된 점을 먼저 한 번 보기']},
      2:{direction:'사랑을 얻기 위해 나를 잃지 않기',actions:['남을 돌보기 전에 내 몸과 감정 확인하기','돕기 전에 ‘보답을 기대하나?’ 점검하기','내 방식 말고 원하는 걸 먼저 묻기','해준 일을 상기시키지 않고 놓아주기','의존보다 스스로 해내도록 돕기','내가 원하는 것을 직접 요청하기']},
      3:{direction:'성과를 내는 나와 진짜 나를 분리하기',actions:['나를 증명하고 싶을 때 한발 물러나기','성과와 무관하게 쉬는 시간 갖기','남의 기대 전에 내가 원하는 것 확인하기','다른 사람의 기여를 먼저 인정하기','실패는 ‘일이 잘 안 됐다’로 분리하기','대가 없는 활동에 재능 써보기']},
      4:{direction:'감정은 느끼되 현실에서 확인하기',actions:['감정을 지나가는 경험으로 바라보기','영감을 기다리지 말고 작게 바로 시작','감정과 상관없이 생활 리듬 지키기','상상보다 사람을 만나고 몸 움직이기','‘아무도 날 몰라’를 대화로 검증하기','상처가 됐다면 의미를 직접 묻기']},
      5:{direction:'아는 것을 행동으로 꺼내 쓰기',actions:['생각에서 나와 몸으로 현실에 참여하기','걷기·운동·요가로 긴장 풀기','미룰 땐 우선순위 정하고 조언 듣기','수집보다 지금 필요한 책임에 집중','갈등 때 거리 두기보다 차이 말하기','내 지식을 사람의 성장에 나누기']},
      6:{direction:'불안이 있어도 내 판단을 믿기',actions:['사실을 점검했다면 긴장 속에서도 시작','‘사실 / 해석 / 두려움’ 구분하기','최악의 상상 중 실제로 일어난 것 세기','지지는 받되 선택은 내가 하기','실수는 방어 대신 인정하고 수정하기','‘나는 감당할 수 있다’ 경험 쌓기']},
      7:{direction:'한 경험에 깊이 머물기',actions:['새 계획 전에 진행 중인 일 하나 끝내기','불편한 감정을 5분간 그대로 느끼기','하루 한 번, 한 가지에만 집중하기','충동 구매·예약은 24시간 뒤 결정','이번 주 ‘하지 않을 것’ 세 가지 정하기']},
      8:{direction:'힘을 필요한 만큼 정확하게 쓰기',actions:['힘은 조절하고 약한 사람을 세우는 데 쓰기','때로는 양보하고 남이 주도하게 두기','나를 아끼는 신호를 그대로 받아들이기','의지하고 있음을 인정하고 고마워하기','정답을 밀기 전에 한 번 묻고 기다리기','영향력으로 남에게 기회 만들어주기']},
      9:{direction:'평화를 지키며 내 삶에 참여하기',actions:['맞춰주기 전에 정말 동의하는지 확인','작은 일부터 능동적으로 참여하기','분노·불편함도 내 감정으로 인정하기','규칙적으로 몸을 움직여 감각 깨우기','믿을 만한 사람에게 욕구 말하기','하루의 첫 에너지를 내 목표에 쓰기']}
    }
  };
  function renderPolish(){
    const host=g('polishApp'); if(!host) return;
    const t=diaryMyType();
    const gem=n=>typeof gemImg==='function'?gemImg(n,'',true):'';
    const name=n=>(typeof CHECK_TYPE_NAMES!=='undefined'&&CHECK_TYPE_NAMES[n])||TYPES[n]?.name||'';
    const steps=[
      ['1','알아차리기','“지금 내 성격이 작동하고 있구나”',t?`내 신호: ${POLISH.signals[t]}`:'몸·감정·생각의 변화를 판단 없이 관찰해요.'],
      ['2','멈추기','자동반응을 바로 따르지 않기','“해야 해”, “이러면 안 돼” 같은 목소리를 사실이 아닌 하나의 생각으로 봐요.'],
      ['3','선택하기','평소와 다른 작은 행동 하나',t?`통합 방향인 ${POLISH.integration[t]}번의 장점을 하나 골라 작게 연습해요.`:'통합 방향의 장점을 의식적으로 연습하고 작은 성공 경험을 쌓아요.']
    ];
    const stepsHTML=`<section class="polish-sec" aria-labelledby="polishStepsTitle"><h2 class="polish-title" id="polishStepsTitle">1분 연습</h2>`
      +`<ol class="polish-steps">${steps.map(([n,h,q,d])=>`<li class="polish-step"><span class="polish-step-no" aria-hidden="true">${n}</span><div><strong>${h}</strong><p class="polish-step-q">${esc(q)}</p><p class="polish-step-d">${esc(d)}</p></div></li>`).join('')}</ol></section>`;
    if(!t){
      host.innerHTML=`<section class="polish-find"><span class="polish-find-gems" aria-hidden="true">${[2,5,7].map(gem).join('')}</span>`
        +`<strong>내 보석을 먼저 찾아볼까요?</strong><p>유형을 알면 내 유형에 맞는 실천 행동을 골라 줄 수 있어요.</p>`
        +`<button class="ui-btn ui-btn-primary" data-polish-check type="button">간편 검사하기</button></section>`+stepsHTML;
      return;
    }
    const p=POLISH.practice[t], have=new Set(readExperiments().custom.map(x=>x.text));
    host.innerHTML=stepsHTML
      +`<section class="polish-sec" aria-labelledby="polishPickTitle"><h2 class="polish-title" id="polishPickTitle">이번 주에 닦아 볼 것</h2>`
      +`<div class="polish-type"><span class="polish-type-gem" aria-hidden="true">${gem(t)}</span><div><span class="polish-type-name">${t}번 ${esc(name(t))}</span><strong class="polish-type-dir">${esc(p.direction)}</strong></div></div>`
      +`<p class="polish-fix"><b>이것만 고치면</b> ${esc(POLISH.fix[t])}</p>`
      +`<div class="polish-keys" aria-label="자주 기억하면 좋은 방향">${POLISH.remember[t].map(k=>`<span>${esc(k)}</span>`).join('')}</div>`
      +`<ul class="polish-actions">${p.actions.map(a=>{const on=have.has(a);return `<li><span>${esc(a)}</span><button class="ui-btn ${on?'ui-btn-ghost':'ui-btn-secondary'}" data-polish-add="${esc(a)}" type="button"${on?' disabled':''}>${on?'담았어요':'담기'}</button></li>`;}).join('')}</ul></section>`;
  }
  window.showPolishPage=function(push=true){
    if(typeof activateBasePage==='function') activateBasePage('polish');
    const mobileTitle=document.getElementById('shellMobileTitle');
    if(mobileTitle) mobileTitle.textContent='보석 닦기';
    if(push) history.replaceState(null,'','#polish');
    if(typeof closeShellMenu==='function') closeShellMenu();
    renderPolish(); renderExperiments();
    document.getElementById('page-polish')?.scrollTo({top:0});
  };
  g('polishApp')?.addEventListener('click',e=>{
    const add=e.target.closest('[data-polish-add]');
    if(add){ const t=diaryMyType(); addCustomExperiment(add.dataset.polishAdd,`보석 닦기 · ${t}번`); renderPolish(); return; }
    if(e.target.closest('[data-polish-check]') && typeof showCheckTarget==='function') showCheckTarget('quick');
  });
  document.querySelector('.top-nav-main[data-top-page="polish"]')?.addEventListener('click',()=>showPolishPage());

  // Hash route for new page (runs after existing route)
  function handleMySpaceHash(){
    const hash=location.hash.replace(/^#/,'');
    const m=hash.match(/^myspace-(dashboard|ai|reflection|library|community)$/); /* 없앤 영역 주소는 대시보드로, 성찰 기록은 다이어리로 */
    if(m) showMySpaceSection(m[1],false);
    else if(hash==='diary') showDiaryPage(false);
    else if(hash==='polish') showPolishPage(false);
  }
  window.addEventListener('hashchange',handleMySpaceHash);
  handleMySpaceHash();

  // initial renders
  renderDashboard(); renderReflectionHistory();
})();
