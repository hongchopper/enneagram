(function(){
  const STORAGE={
    reflections:'enneagram_reflections_v1',
    myType:'enneagram_my_type_v1',
    experiments:'enneagram_experiments_v1',
    prefs:'enneagram_prefs_v1',
    wishes:'enneagram_wishes_v1',
    stateChecks:'enneagram_state_checks_v1',
    interest:'enneagram_interest_v1'
  };
  const WISH_SCHEMA=1; /* 소원과 기도 저장 형식 (readWishes). v1: { schemaVersion, items:[{id, kind:'wish'|'prayer', text, at, done, doneAt}] } */
  const PREFS_SCHEMA=1; /* 보기 설정 저장 형식 버전 (readPrefs). v1: 기도제목 보기(showPrayer) */
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

  let diaryTab='write'; /* 이제 'write'만 쓴다. 기록 목록은 #page-records */
  function setDiaryTab(tab){
    diaryTab=tab;
    const wrap=document.querySelector('#page-diary .diary-wrap');
    if(wrap) wrap.dataset.diaryTab=tab;
    /* 쓰기 칸에만 있는 설명 한 줄 */
    const lead=wrap?.querySelector('.state-lead'); if(lead) lead.hidden=tab!=='write';
    if(tab==='history') renderReflectionHistory();
  }

  /* ---- 분석 노트 안에서 오가기 (2026-10-07) ----
     분석 노트(#page-state) 한 화면 + 안쪽 화면: 이야기하기(#page-diary) · 행동 고르기(#page-polish) · 나의 기록(#page-records).
     예전 칸 나눔 메뉴(살펴보기 · 다이어리 · 보석 닦기)는 한 과정을 셋으로 잘라 어색해서 뺐다 */
  function goState(k,push=true){
    if(k==='state') showStatePage(push);
    else if(k==='history') showRecordsPage(push);
    else if(k==='polish') showPolishPage(push);
    else showDiaryPage(push,k);
  }
  /* 메뉴 칸과 화면 안의 '다이어리 쓰기' 같은 버튼이 같이 쓴다 */
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-state-go]'); if(b) goState(b.dataset.stateGo); });

  /* 다이어리(성찰 기록)는 '내 상태' 탭의 쓰기 · 기록 칸 (2026-10-07). 예전 '나의 공간 > 성찰 기록' 링크도 여기로.
     tab: 'write'(쓰기) · 'history'(기록). 주소는 #diary · #records */
  window.showDiaryPage=function(push=true,tab){
    if(tab==='history'){ showRecordsPage(push); return; } /* 기록 목록은 분석 노트 > 나의 기록 */
    if(typeof activateBasePage==='function') activateBasePage('diary');
    const mobileTitle=document.getElementById('shellMobileTitle');
    if(mobileTitle) mobileTitle.textContent='오늘 이야기하기';
    setDiaryTab('write');
    if(push) history.replaceState(null,'','#diary');
    if(typeof closeShellMenu==='function') closeShellMenu();
    renderReflectionHistory();
    /* ---- 다이어리 탭: 쓰기(채팅) · 기록 · 실천 (2026-10-03) ----
     쓰기는 긴 폼 대신 채팅: 정해진 순서로 질문이 하나씩 말풍선으로 나오고, 답을 모아 다이어리 한 편으로 정리해 저장한다.
     저장 형식은 기존 성찰 기록(schemaVersion 2)과 같다 — '왜'는 다섯 단계 대신 한 번(whys[0])만 묻는다. */
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
  /* 쓸 거리 먼저 (2026-10-05): "오늘 있었던 일을 쓰세요"는 막막해서, 주제를 먼저 건넨다. 내 유형 추천 1개 + 일반 주제 4개 + 자유 주제.
     주제를 고르면 장면 분류는 자동으로 정하고, '무슨 일' 질문과 예시가 그 주제에 맞춰 바뀐다. 주제 자체는 저장하지 않는다(기록 형식 그대로) */
  const DIARY_TOPICS=[
    {k:'mind',label:'괜히 마음이 쓰였던 순간',cat:'일상',ex:'예: 동료의 짧은 답장이 계속 신경 쓰였다'},
    {k:'hurt',label:'누군가의 말에 서운했던 일',cat:'관계',ex:'예: 친구가 내 이야기를 끝까지 듣지 않았다'},
    {k:'angry',label:'나도 모르게 욱했던 순간',cat:'일상',ex:'예: 회의에서 말이 끊겨 목소리가 커졌다'},
    {k:'delay',label:'계속 미루고 있는 일',cat:'일',ex:'예: 보고서 시작을 사흘째 미루고 있다'},
    {k:'proud',label:'오늘 조금 뿌듯했던 순간',cat:'일상',ex:'예: 어려운 부탁을 정중하게 거절했다'},
    {k:'family',label:'가족과 있었던 작은 일',cat:'가족',ex:'예: 잔소리에 대답 없이 방에 들어갔다'}
  ];
  const DIARY_TYPE_TOPIC={
    1:{label:'기준에 어긋나 신경 쓰였던 일',cat:'일상',ex:'예: 팀원이 마감을 대충 넘겨서 하루 종일 거슬렸다'},
    2:{label:'부탁을 거절하지 못한 순간',cat:'관계',ex:'예: 피곤했는데 친구 이사를 돕겠다고 했다'},
    3:{label:'잘 보이고 싶었던 순간',cat:'일',ex:'예: 발표 자료를 밤새 다듬었다'},
    4:{label:'누군가와 나를 비교한 순간',cat:'일상',ex:'예: 친구의 소식을 보고 내가 작게 느껴졌다'},
    5:{label:'혼자 있고 싶었던 순간',cat:'관계',ex:'예: 모임 중간에 먼저 집에 가고 싶었다'},
    6:{label:'걱정이 커졌던 순간',cat:'일상',ex:'예: 메일 답이 없어 혹시 실수했나 계속 생각했다'},
    7:{label:'지루해서 다른 걸 찾은 순간',cat:'취미',ex:'예: 하던 일을 두고 새 계획을 세우기 시작했다'},
    8:{label:'밀어붙이고 싶었던 순간',cat:'일',ex:'예: 회의가 늘어져서 내가 결론을 내버렸다'},
    9:{label:'괜찮다고 넘어간 순간',cat:'관계',ex:'예: 메뉴를 정할 때 아무거나 좋다고 했다'}
  };
  /* 테마 (2026-10-05): 회사·연애·시간… 테마를 먼저 고르고, 테마마다 쓸 거리 세 개를 건넨다. 테마가 장면 분류를 정한다.
     '시간'·'나 자신'은 기존 분류에 없어 '일상'으로 저장한다 (기록 형식은 그대로) */
  const DIARY_THEMES=[
    {k:'work',label:'회사·일',cat:'일',topics:[['회의에서 마음이 걸렸던 순간','예: 내 의견이 묻혀서 하루 종일 신경 쓰였다'],['일을 떠안거나 미뤘던 일','예: 거절을 못 해 남의 일까지 맡았다'],['칭찬이나 피드백을 들은 순간','예: 팀장의 한마디가 계속 마음에 남았다']]},
    {k:'love',label:'연애',cat:'연애',topics:[['연인에게 서운했던 순간','예: 답장이 늦어서 마음이 식은 것 같았다'],['말하지 못하고 삼킨 말','예: 서운했는데 괜찮다고 했다'],['가까워질수록 불안했던 순간','예: 행복한데 갑자기 이게 깨질까 봐 무서웠다']]},
    {k:'family',label:'가족',cat:'가족',topics:[['가족의 말에 욱했던 순간','예: 잔소리에 대답 없이 방에 들어갔다'],['가족 앞에서 나도 모르게 맡는 역할','예: 또 내가 분위기를 맞추고 있었다'],['고마웠지만 표현 못 한 일','예: 엄마가 챙겨 준 반찬을 그냥 받았다']]},
    {k:'people',label:'사람 사이',cat:'관계',topics:[['누군가의 말에 서운했던 일','예: 친구가 내 이야기를 끝까지 듣지 않았다'],['거절하지 못한 부탁','예: 피곤했는데 약속을 또 잡았다'],['분위기를 맞추느라 지친 순간','예: 모임 내내 웃었는데 집에 와서 녹초가 됐다']]},
    {k:'money',label:'돈',cat:'돈',topics:[['돈 때문에 마음이 쓰였던 순간','예: 통장 잔고를 보고 하루 종일 불안했다'],['충동적으로 사거나 꾹 참았던 일','예: 필요 없는 걸 장바구니에 담았다가 결제했다'],['돈 이야기가 불편했던 순간','예: 더치페이를 말하지 못하고 내가 냈다']]},
    {k:'time',label:'시간',cat:'일상',topics:[['시간에 쫓겼던 순간','예: 마감 전날 밤을 새웠다'],['계속 미루고 있는 일','예: 보고서 시작을 사흘째 미루고 있다'],['쉬어도 쉰 것 같지 않았던 날','예: 주말 내내 누워 있었는데 더 피곤했다']]},
    {k:'self',label:'나 자신',cat:'일상',topics:[['오늘 조금 뿌듯했던 순간','예: 어려운 부탁을 정중하게 거절했다'],['나도 모르게 욱했던 순간','예: 말이 끊겨 목소리가 커졌다'],['괜히 마음이 쓰였던 순간','예: 동료의 짧은 답장이 계속 신경 쓰였다']]}
  ];
  function themeOptions(){ return [...DIARY_THEMES.map(x=>[x.k,x.label]),['free','자유 주제']]; }
  const chosenTheme=()=>DIARY_THEMES.find(x=>x.k===chat.answers.theme)||null;
  function topicOptions(){
    const th=chosenTheme(); if(!th) return [];
    const t=diaryTypeInfo.type, out=[];
    /* 내 유형 추천 주제는 테마의 분류와 맞을 때만 맨 앞에 */
    if(t && DIARY_TYPE_TOPIC[t] && DIARY_TYPE_TOPIC[t].cat===th.cat) out.push(['type',`${DIARY_TYPE_TOPIC[t].label} · 내 유형 추천`]);
    th.topics.forEach(([label],i)=>out.push([String(i),label]));
    out.push(['free','직접 쓸래요']);
    return out;
  }
  function chosenTopic(){
    const k=chat.answers.topic, th=chosenTheme();
    if(k==='type') return DIARY_TYPE_TOPIC[diaryTypeInfo.type]||null;
    if(th && /^\d$/.test(String(k))){ const [label,ex]=th.topics[Number(k)]; return {label,ex,cat:th.cat}; }
    return null;
  }
  /* 5Why를 한 단계씩 (2026-10-05): 첫 '왜' 다음에 '그게 왜 중요했을까?' → '채워지지 않으면?' → '결국 정말 중요했던 것'.
     언제든 '여기까지'로 멈춘다. 답은 기존 기록 형식 whys[0·1·2·4]에 담는다 (whys[3] 자리는 '지키고 싶었던 것' 단계가 따로 있다) */
  const WHY_DEEP={
    2:{1:'잘하고 싶었어요',2:'좋은 사이로 지내고 싶었어요',3:'인정받고 싶었어요',4:'나답고 싶었어요',5:'충분히 알고 싶었어요',6:'안심하고 싶었어요',7:'즐겁고 자유롭고 싶었어요',8:'내가 정하고 싶었어요',9:'편안하고 싶었어요'},
    3:{1:'틀리거나 나쁜 사람이 될까 봐',2:'사랑받지 못할까 봐',3:'가치 없어 보일까 봐',4:'평범해지고 나를 잃을까 봐',5:'무능해 보일까 봐',6:'혼자 위험해질까 봐',7:'갇히고 괴로워질까 봐',8:'약해 보이고 휘둘릴까 봐',9:'관계가 깨질까 봐'},
    5:{1:'나는 괜찮은 사람이라는 믿음',2:'사랑받고 있다는 느낌',3:'있는 그대로의 가치',4:'나다움',5:'충분히 해낼 수 있다는 감각',6:'안심',7:'자유',8:'내 삶을 내가 정하는 것',9:'마음의 평화'}
  };
  function whyDeepOptions(level){
    const t=diaryTypeInfo.type, map=WHY_DEEP[level], out=[];
    if(t && map[t]) out.push([map[t],`${map[t]} · 내 유형`]);
    Object.entries(map).forEach(([k,v])=>{ if(Number(k)!==t) out.push([v,v]); });
    return out;
  }
  const lastWhy=key=>{ const v=chat.answers[key]; const s=(Array.isArray(v)?v.join(' · '):String(v||'')).trim(); return s.length>24?s.slice(0,23)+'…':s; };
  const answered=key=>{ const v=chat.answers[key]; return Array.isArray(v)?v.length>0:!!String(v||'').trim(); };
  const CHAT_STEPS=[
    {key:'theme',ask:'오늘은 어떤 테마의 원석을 연마해 볼까요?',type:'single',options:themeOptions},
    {key:'topic',ask:()=>`‘${chosenTheme()?.label||''}’에서 이런 장면은 어때요? 떠오르는 게 없다면 하나를 골라 보세요.`,type:'single',options:topicOptions,when:()=>!!chosenTheme()},
    {key:'date',ask:'언제 있었던 일이에요?',type:'single',options:()=>[['today','오늘'],['yesterday','어제']]},
    {key:'category',ask:'어떤 장면의 이야기예요?',type:'single',options:()=>DIARY_CATEGORIES,when:()=>!chat.answers.category},
    {key:'situation',ask:()=>{ const tp=chosenTopic(); return tp?`‘${tp.label}’ 하나를 떠올려 보세요. 언제, 누구와, 무슨 일이 있었나요? 해석보다 실제로 있었던 일을 적어요.`:'무슨 일이 있었나요? 해석보다 실제로 있었던 일을 적어보세요.'; },
      type:'text',placeholder:()=>chosenTopic()?.ex||'예: 회의에서 내 의견이 묻혔다'},
    {key:'emotions',ask:'그때 어떤 감정이 들었어요? 여러 개 골라도 돼요.',type:'multi',options:()=>DIARY_EMOTIONS.map(e=>[e,e]),text:'다른 감정이면 적어주세요'},
    {key:'reaction',ask:'그 순간 나는 어떻게 반응했나요?',type:'multi',options:()=>DIARY_REACTIONS.map(r=>[r,r]),text:'직접 쓰기',skip:true},
    {key:'why',ask:DIARY_WHY_LABELS[0][0],type:'multi',options:chatWhyOptions,text:'직접 쓰기',skip:true},
    {key:'why2',ask:()=>`‘${lastWhy('why')}’ 한 단계 더 들어가 볼까요? ${DIARY_WHY_LABELS[1][0]}`,type:'multi',options:()=>whyDeepOptions(2),text:'직접 쓰기',skip:true,stop:true,when:()=>answered('why')},
    {key:'why3',ask:()=>`‘${lastWhy('why2')}’ ${DIARY_WHY_LABELS[2][0]}`,type:'multi',options:()=>whyDeepOptions(3),text:'직접 쓰기',skip:true,stop:true,when:()=>answered('why2')},
    {key:'why5',ask:()=>`거의 다 왔어요. ${DIARY_WHY_LABELS[4][0]}`,type:'multi',options:()=>whyDeepOptions(5),text:'직접 쓰기',skip:true,stop:true,when:()=>answered('why3')},
    {key:'motives',ask:DIARY_WHY_LABELS[3][0],type:'multi',options:chatMotiveOptions,skip:true},
    {key:'next',ask:'다음에 비슷한 일이 생기면 해보고 싶은 작은 행동이 있나요? 적어 두면 분석 노트의 ‘이번 주 해볼 것’에 모여요.',type:'multi',options:chatNextOptions,text:'직접 쓰기',skip:true}
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
    chatBot(esc(typeof st.ask==='function'?st.ask():st.ask));
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
    field.placeholder=!st?(chat.saved?'저장했어요':'위에서 저장해주세요'):st.type==='text'?((typeof st.placeholder==='function'?st.placeholder():st.placeholder)||''):(st.text||'위에서 골라주세요');
    if(st && st.type==='single') field.placeholder='위에서 하나를 골라주세요';
    const askText=st?(typeof st.ask==='function'?st.ask():st.ask):'';
    field.setAttribute('aria-label',st?(st.type==='text'?askText:(st.text||askText)):'대화 입력');
    const err=g('diaryChatError'); if(err) err.hidden=true;
    chatNextLabel();
  }
  function chatNextLabel(){
    const st=CHAT_STEPS[chat.step], send=g('diaryChatSend');
    if(!send) return;
    const has=chat.picks.length || (g('diaryChatText')?.value.trim());
    send.disabled=!st || st.type==='single';
    send.textContent=st && st.type==='multi' && st.skip && !has?(st.stop?'여기까지':'건너뛰기'):'보내기';
  }
  function chatAnswer(value,label){
    const st=CHAT_STEPS[chat.step];
    chat.answers[st.key]=value;
    if(st.key==='theme'){ const th=chosenTheme(); if(th) chat.answers.category=th.cat; }
    if(st.key==='topic'){ const tp=chosenTopic(); if(tp?.cat) chat.answers.category=tp.cat; }
    g('diaryChatLog')?.querySelector('.chat-quick')?.remove();
    chatMe(label||(st.stop?'여기까지 할게요':'건너뛰었어요'));
    chat.step++;
    while(chat.step<CHAT_STEPS.length && CHAT_STEPS[chat.step].when && !CHAT_STEPS[chat.step].when()) chat.step++;
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
      reaction:(a.reaction||[]).join(' · '),whys:['why','why2','why3','','why5'].map(k=>k?(Array.isArray(a[k])?a[k].join(' · '):String(a[k]||'')):''),motives:a.motives||[],next:(a.next||[]).join(' · ')};
  }
  function chatSummary(){
    const r=chatRecord();
    const rows=[['무슨 일',r.situation],['감정',r.emotions.join(', ')],['나의 반응',r.reaction],['그렇게 한 이유',r.whys.filter(Boolean).join(' → ')],['지키고 싶었던 것',r.motives.join(', ')],['다음엔',r.next]].filter(x=>x[1]);
    const d=new Date(r.createdAt);
    chatBot('오늘의 장면을 이렇게 정리했어요.'
      +`<article class="chat-summary"><div class="chat-summary-meta">${esc(longDate(d))} · ${esc(catLabel(r.category))}</div>`
      +`<h3 class="chat-summary-title">${esc(r.title||'제목 없는 기록')}</h3>`
      +`<dl class="diary-review">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></article>`);
    renderChatComposer();
    chatScroll();
  }
  /* 연마 처방전 (2026-10-05): 같은 장면 분류의 기록을 모아 반복되는 결 · 가장 깊은 이유 · 이번 주 처방을 만든다.
     지금은 이 브라우저 안의 규칙형(기록은 밖으로 보내지 않는다). 실제 생성형 AI는 서버리스 함수를 거쳐 이 함수만 바꿔 끼운다
     (docs/기능_운영_요구사항.md: 1차 로컬 규칙형, 프론트에 API 키를 넣지 않는다, 기록은 동의 없이 외부로 보내지 않는다) */
  function diaryPrescribe(record,all){
    const same=all.filter(r=>r.category===record.category);
    const top=list=>{ const c={}; list.filter(Boolean).forEach(x=>c[x]=(c[x]||0)+1); return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]||null; };
    const emo=top(same.flatMap(r=>r.emotions||[])), mot=top(same.flatMap(r=>r.motives||[]));
    const deep=[...(record.whys||[])].reverse().find(Boolean)||'';
    const pool=diaryTypeInfo.actions.length?diaryTypeInfo.actions:DIARY_NEXT_GENERIC;
    const action=record.next||pool[(same.length+new Date().getDate())%pool.length];
    const pattern=same.length>1
      ?`‘${catLabel(record.category)}’ 장면을 ${same.length}번 연마했어요.${emo?` ‘${emo[0]}’을(를) ${emo[1]}번 느꼈고`:''}${mot?`, ‘${mot[0]}’을(를) 지키려 할 때가 많았어요.`:'.'}`
      :'첫 연마예요. 같은 테마로 두세 번 더 쓰면 반복되는 결이 보여요.';
    return {count:same.length,pattern,deep,action,fromNext:!!record.next};
  }
  function prescriptionHTML(rx,record){
    const d=new Date(record.createdAt);
    return `<article class="rx-card"><header class="rx-head"><strong>연마 처방전</strong><span>${esc(longDate(d))} · ${esc(catLabel(record.category))}</span></header>`
      +`<dl class="rx-rows"><div><dt>반복되는 결</dt><dd>${esc(rx.pattern)}</dd></div>`
      +(rx.deep?`<div><dt>가장 깊은 이유</dt><dd>${esc(rx.deep)}</dd></div>`:'')
      +`<div><dt>이번 주 처방</dt><dd>${esc(rx.action)}</dd></div>`
      +'<div><dt>복용법</dt><dd>비슷한 장면이 오면 한 번만 해 보세요. 못 했어도 괜찮아요.</dd></div></dl>'
      +(rx.fromNext?'':`<button type="button" class="ui-btn ui-btn-secondary rx-add" data-rx-add="${esc(rx.action)}">이번 주 해볼 것에 담기</button>`)
      +'<p class="rx-note">진단이나 치료가 아니라, 다음 연마를 위한 제안이에요.</p></article>';
  }
  function chatSave(){
    const record=chatRecord();
    const arr=readReflections(); arr.unshift(record); write(STORAGE.reflections,arr);
    chat.saved=true;
    renderReflectionHistory(); renderExperiments(); renderDashboard(); renderNoteRecent();
    chatBot(record.next?'분석 노트에 쌓았어요. 해보기로 한 행동은 ‘이번 주 해볼 것’에 모였어요.':'분석 노트에 쌓았어요. ‘나의 기록’에서 다시 볼 수 있어요.');
    chatBot('오늘 연마한 기록으로 처방전을 써 봤어요.'+prescriptionHTML(diaryPrescribe(record,arr),record));
    renderChatComposer();
    chatScroll();
    /* 위험한 표현이 보이면 기록은 저장하고 도움 안내를 띄운다 (PRD SF-1·2) */
    const text=[record.situation,record.reaction,...record.whys,record.next,...record.emotions].join(' ');
    if(typeof window.prdHasCrisisSignal==='function' && window.prdHasCrisisSignal(text) && typeof window.openCrisisGuide==='function') window.openCrisisGuide({fromDiary:true});
  }
  function chatStart(){
    chat={step:0,answers:{},picks:[],saved:false};
    const log=g('diaryChatLog'); if(!log) return;
    log.innerHTML='';
    chatBot('오늘의 장면 하나를 원석처럼 꺼내 함께 연마해 볼까요? 질문에 하나씩 답하면 오늘의 이야기와 연마 처방전이 나와요. ‘왜’는 한 단계씩 더 물어볼게요. 언제든 멈춰도 괜찮아요.');
    chatAsk();
  }

  function setupDiaryTabs(){
    const wrap=document.querySelector('#page-diary .diary-wrap');
    if(!wrap || wrap.querySelector('.diary-chat')) return;
    (wrap.querySelector('.state-lead')||wrap.querySelector('.state-head'))?.insertAdjacentHTML('afterend',
      '<section class="diary-chat" data-diary-panel="write" aria-label="다이어리 쓰기"><div class="chat-log" id="diaryChatLog" role="log" aria-live="polite"></div>'
      +'<form class="chat-bar" id="diaryChatComposer" data-chat-form><p class="diary-error" hidden id="diaryChatError" role="alert"></p>'
      +'<textarea class="ui-field" id="diaryChatText" rows="1" aria-label="대화 입력"></textarea>'
      +'<button type="submit" class="ui-btn ui-btn-primary" id="diaryChatSend">보내기</button></form></section>');
    wrap.querySelector('.diary-layout')?.setAttribute('data-diary-panel','practice');
    wrap.querySelector('.diary-list')?.setAttribute('data-diary-panel','history');
    const composer=g('diaryChatComposer'), chatPanel=wrap.querySelector('.diary-chat');
    chatPanel.addEventListener('click',e=>{
      const pick=e.target.closest('[data-chat-pick]');
      if(pick){ chatAnswer(pick.dataset.chatPick,pick.textContent); return; }
      const tog=e.target.closest('[data-chat-toggle]');
      if(tog){ const v=tog.dataset.chatToggle, i=chat.picks.indexOf(v); if(i>=0) chat.picks.splice(i,1); else chat.picks.push(v); tog.classList.toggle('active',i<0); tog.setAttribute('aria-pressed',i<0?'true':'false'); if(g('diaryChatError')) g('diaryChatError').hidden=true; chatNextLabel(); return; }
      if(e.target.closest('[data-chat-save]')){ chatSave(); return; }
      if(e.target.closest('[data-chat-restart]')){ chatStart(); return; }
      const rx=e.target.closest('[data-rx-add]'); /* 연마 처방전의 처방을 보석 닦기 '해보기로 한 것'에 */
      if(rx){ addCustomExperiment(rx.dataset.rxAdd,'연마 처방전'); rx.disabled=true; rx.textContent='이번 주 해볼 것에 담았어요'; renderExperiments(); return; }
      const go=e.target.closest('[data-chat-go]');
      if(go) showDiaryPage(true,go.dataset.chatGo);
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
    setDiaryTab(diaryTab);
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
    renderDashboard(); renderMyLog(); renderMyStats(); renderMyPatterns();
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

  /* ---- 요즘 나의 흐름 (2026-10-05 기록 수·달력·그래프 대시보드를 뺐다) ---- */
  /* 받침 있으면 a(을·과), 없으면 b(를·와) */
  const josa=(w,a,b)=>{const c=String(w).charCodeAt(String(w).length-1);return (c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28)?a:b;};
  const startOfDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};

  function renderDashboard(){
    renderStatePage(); /* 내 상태 > 살펴보기의 '지금 내 보석 상태' */
    const all=readReflections();
    const catName=v=>(DIARY_CATEGORIES.find(c=>c[0]===v)||[v,v])[1];
    /* 요즘 나의 흐름 한 줄 (2026-10-05): 최근 30일 기록이 2개 이상이면 그걸로, 아니면 전체 기록으로 */
    const summary=document.getElementById('dashPatternSummary');
    const meta=document.getElementById('dashInsightMeta');
    if(!summary) return;
    const recent=all.filter(r=>new Date(r.createdAt)>=addDays(startOfDay(new Date()),-29));
    const base=recent.length>=2?recent:all;
    if(base.length<2){
      summary.innerHTML=all.length?'기록이 하나 더 쌓이면 반복되는 흐름을 한 줄로 알려드릴게요.':'다이어리에 기록이 쌓이면 반복되는 흐름을 한 줄로 알려드릴게요.';
      if(meta) meta.textContent=all.length?`지금 기록 ${all.length}개`:'';
      return;
    }
    const top=list=>{const t=list[0];return t&&t[1]>=2?t[0]:null;}; /* 두 번 넘게 나온 것만 흐름으로 본다 */
    const c=top(aggregateCategories(base)), e=top(aggregateEmotions(base)), mo=top(aggregateMotives(base));
    const B=w=>`<b>${esc(w)}</b>`;
    let line;
    if(c&&e&&mo) line=`요즘 ${B(catName(c))} 장면에서 ${B(e)}${josa(e,'을','를')} 자주 느꼈고, 그 밑엔 ${B(mo)}${josa(mo,'을','를')} 지키고 싶은 마음이 보여요.`;
    else if(e&&mo) line=`요즘 ${B(e)}${josa(e,'을','를')} 자주 느꼈고, 그 밑엔 ${B(mo)}${josa(mo,'을','를')} 지키고 싶은 마음이 보여요.`;
    else if(c&&e) line=`요즘 ${B(catName(c))} 장면에서 ${B(e)}${josa(e,'을','를')} 자주 느꼈어요.`;
    else if(mo) line=`요즘 기록마다 ${B(mo)}${josa(mo,'을','를')} 지키고 싶은 마음이 반복돼요.`;
    else if(e) line=`요즘 ${B(e)}${josa(e,'을','를')} 자주 느꼈어요.`;
    else if(c) line=`요즘 ${B(catName(c))} 장면을 자주 돌아봤어요.`;
    else line='아직 반복되는 흐름은 없어요. 기록이 더 쌓이면 다시 알려드릴게요.';
    summary.innerHTML=line;
    if(meta) meta.textContent=`${base===recent?'최근 30일':'지금까지'} 기록 ${base.length}개를 보고 찾았어요`;
  }
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
      list.innerHTML='<div class="ui-empty"><img class="art3d is-empty" src="assets/illust/notebook.png" alt="" width="256" height="256"><strong>아직 기록이 없어요.</strong><p>‘쓰기’에서 오늘의 장면 하나를 적어보세요.</p><button class="ui-btn ui-btn-primary" data-state-go="write" type="button">다이어리 쓰기</button></div>';
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
      .map(it=>({...it,done:!!store.status[it.id]?.done,note:store.status[it.id]?.note||'',routine:store.status[it.id]?.routine||null,log:store.status[it.id]?.log||{},updatedAt:store.status[it.id]?.updatedAt||''}));
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
      :`<div class="ui-empty"><img class="art3d is-empty" src="assets/illust/seedling.png" alt="" width="256" height="256"><strong>${experimentFilter==='routine'&&items.length?'아직 루틴이 없어요.':items.length?(experimentFilter==='done'?'아직 해본 것이 없어요.':'해볼 것을 모두 해봤어요.'):'아직 해보기로 한 것이 없어요.'}</strong><p>${experimentFilter==='routine'&&items.length?'‘해볼 것’에서 꾸준히 하고 싶은 행동을 루틴으로 만들어 보세요.':items.length?'작은 것 하나라도 해봤다면 동그라미를 눌러 보세요.':'기록의 ‘다음엔’에 적거나, 아래 추천에서 골라보세요.'}</p></div>`;
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

  /* ---- 지금 내 상태는? (2026-10-05): 강의 슬라이드 #89~107 '상태별 플랜 · 기도제목'.
     원고 docs/콘텐츠_유형별_액션플랜.md. 고른 상태는 저장하지 않는다(핸드북 '요즘 나는 어떤가요?'와 같음) ---- */
  /* 이름은 보석 상태(빛남 · 연마 중 · 흐려짐)와 같은 말로 (2026-10-07, 콘텐츠 가이드라인 용어표). 키(low·mid·high)는 그대로 */
  const POLISH_STATES=[['high','빛남','편안하게 흐르는 중이에요. 이 리듬을 지키고, 받은 것을 나눠요.'],['mid','연마 중','그럭저럭 굴러가는 중이에요. 버릇 하나를 관찰하고, 작은 행동 하나를 더해요.'],['low','흐려짐','억지로 버티는 중이에요. 고치려 하기보다 몸부터 챙기고, 하루에 하나만 해요.']];
  const POLISH_STATE_GENERAL={
    low:{feel:['잠·식사가 흐트러졌어요','같은 생각이 계속 돌아요','작은 일에도 크게 반응해요','‘원래 나는 이렇지 않은데’라는 말이 자주 나와요'],start:['몸부터 챙기고 할 일 줄이기','하루 1개, 이번 주 1개만 하기']},
    mid:{feel:['일상은 돌아가는데 즐거움이 적어요','내 버릇이 보이지만 멈추진 못해요'],start:['버릇 하나 골라 관찰하기','통합 방향의 행동 하나 더하기','오늘 1개, 이번 주 2개 해보기']},
    high:{feel:['내가 나여서 편해요','내 장점이 남을 살려요','실수해도 금방 돌아와요'],start:['지키는 습관 2개를 달력에 고정하기','받은 것을 나누기']}
  };
  const POLISH_STATE_TYPE={
    1:{verse:'마태복음 11:28-30',
      low:{signs:['‘해야 한다’가 머릿속에서 쉬지 않아요','남의 실수가 계속 눈에 걸려요','쉬면 죄책감이 들어요'],acts:['할 일 2개에 줄 긋고 ‘안 함’ 쓰기','지적할 말은 메모하고 24시간 뒤 다시 보기','화난 순간 3번 기록하기 · 상황, 내 기준, 진짜 원한 것','메일 한 통은 한 번만 검토하고 보내기'],prays:['모든 것을 내가 바로잡아야 한다는 무게를 내려놓게 해주세요. 내가 고치지 않아도 세상을 붙드시는 분이 계심을 믿게 해주세요.','화 아래 있는 지침과 서러움을 숨기지 않고 꺼내놓게 해주세요.','실수한 나를 정죄하지 않고, 하나님이 보시는 눈으로 나를 보게 해주세요.']},
      mid:{signs:['일은 되는데 즐거움이 적어요','칭찬보다 부족한 점이 먼저 떠올라요','‘내가 하는 게 빨라’ 하며 맡기지 못해요'],acts:['고칠 점보다 좋은 점 1개 먼저 말하기','일 하나 맡기고 결과에 손대지 않기','계획 없는 2시간 보내기'],prays:['내 기준이 아니라 은혜의 눈으로 사람을 보게 해주세요.','옳은 것보다 사랑하는 것을 먼저 고르게 해주세요.']},
      high:{signs:['옳고 그름보다 사람이 먼저 보여요','다른 방식도 인정해요','쉬는 게 편해요'],acts:['매주 노는 시간 고정하기','하루 끝에 받은 것 3가지 적기','기준은 ‘이렇게 하면 어때요?’로 제안하기','실수한 사람에게 먼저 괜찮다고 말하기'],prays:['주신 분별력을 정죄가 아니라 세우는 데 쓰게 해주세요.','바르게 사는 기쁨이 다른 사람에게 짐이 아니라 초대가 되게 해주세요.']}},
    2:{verse:'요한일서 4:19',
      low:{signs:['거절을 못 해 일정이 넘쳐요','‘내가 이만큼 해줬는데’ 하는 서운함이 자주 올라와요','참다가 갑자기 강하게 따지게 돼요'],acts:['남을 위한 약속 1개 정중히 미루기','부탁엔 ‘확인하고 알려줄게요’라고 하고 하루 뒤 답하기','내가 먹고 싶은 메뉴로 혼자 한 끼 먹기','서운한 순간 기록하기 · 해준 것, 바란 반응, 말했는지'],prays:['무언가를 해줘야만 사랑받는다는 생각에서 놓여나게 해주세요. 아무것도 하지 않아도 사랑받는 존재임을 믿게 해주세요.','나에게도 필요가 있음을 인정하고 말할 용기를 주세요.','서운함 뒤에 있는 외로움을 하나님 앞에 정직하게 내려놓게 해주세요.']},
      mid:{signs:['혼자 있으면 허전해요','고맙다는 말을 듣고 싶어 움직여요','내 감정보다 상대 기분이 먼저예요'],acts:['자기 전 5분, 내 감정 3개 적기','필요한 것 1가지 직접 부탁하기','연락을 받지 않는 나만의 2시간 보내기'],prays:['사람의 인정이 아니라 하나님의 사랑으로 마음이 채워지게 해주세요.','사랑해서 하는 일과 사랑받으려고 하는 일을 구별하게 해주세요.']},
      high:{signs:['돌려받을 기대 없이 도와요','거절해도 관계가 괜찮아요','나도 남도 돌봐요'],acts:['일주일에 반나절, 나를 위한 시간 갖기','돕기 전 ‘원해서 하는 일인가?’ 묻기','대신해주기보다 옆에서 기다려주기','받은 도움에 먼저 고마워하기'],prays:['내 따뜻함이 사람을 묶지 않고 자유롭게 하는 사랑이 되게 해주세요.','받는 것도 은혜임을 알고 기쁘게 받게 해주세요.']}},
    3:{verse:'시편 46:10',
      low:{signs:['쉬는 날에도 일 생각이 끊기지 않아요','성과가 없으면 쓸모없게 느껴져요','갑자기 멍해지고 다 하기 싫어져요'],acts:['보여주기 위한 일 1개 빼기','휴대폰을 두고 10분 가만히 앉기','성과 없는 일 1개 하기 · 목적 없는 산책','믿는 사람 1명에게 힘든 점 그대로 말하기'],prays:['내가 이룬 것이 아니라 나라는 존재 자체로 사랑받고 있음을 믿게 해주세요.','바쁨 뒤에 숨겨둔 진짜 마음을 하나님 앞에서 마주할 용기를 주세요.','실패해도 나는 괜찮다는 것을 몸으로 알게 해주세요.']},
      mid:{signs:['잘하는데 공허할 때가 있어요','나를 어떻게 보여줄지 먼저 계산해요','느린 사람에게 조급해져요'],acts:['대화에서 내 얘기 대신 질문 3개 하기','뒤에서 받쳐주는 팀 작업 1개 하기','실수 1개를 먼저 털어놓기'],prays:['성공보다 진실함을 고르게 해주세요.','내 목표가 하나님의 뜻과 같은 방향인지 멈춰서 묻게 해주세요.']},
      high:{signs:['결과보다 과정과 사람이 보여요','있는 그대로 보여줘도 편해요','남의 성장을 진심으로 기뻐해요'],acts:['일주일에 하루는 일을 멈추는 날로 지키기','하루 한 번 ‘지금 내 기분은?’ 묻기','동료 1명의 목표를 함께 계획하기','받은 공을 함께한 사람에게 돌리기'],prays:['주신 실행력으로 내 이름이 아니라 다른 사람을 세우게 해주세요.','진짜 나로 사는 기쁨을 잃지 않게 해주세요.']}},
    4:{verse:'시편 139:14',
      low:{signs:['하루 종일 같은 감정에 머물러요','나만 못 가진 것 같아요','누군가에게 매달리게 돼요'],acts:['기분 말고 시간으로 정한 일 1개 하기 · 아침 9시 이불 개기','햇빛 아래 15분 걷기','감정 일기 끝에 괜찮았던 일 1개 적기','비교를 부르는 SNS 계정 일주일 숨기기'],prays:['내게 없는 것이 아니라 이미 주신 것을 보게 해주세요.','깊은 감정 속에서도 함께 계심을 느끼게 해주세요. 내가 버려진 사람이 아님을 믿게 해주세요.','기분이 아니라 신실함으로 오늘을 살아낼 힘을 주세요.']},
      mid:{signs:['평범한 일상이 지루해요','특별하게 보이고 싶어요','기분 따라 몰입하거나 손을 놓아요'],acts:['감정과 상관없는 루틴 1개 정하기','끝내지 않은 일 1개 마무리하기','내 얘기를 얹지 않고 끝까지 듣기'],prays:['특별해지려 애쓰지 않아도 이미 고유한 존재임을 알게 해주세요.','평범한 하루 속 아름다움을 보는 눈을 주세요.']},
      high:{signs:['감정을 느끼되 휩쓸리지 않아요','내 아픔이 남을 이해하는 힘이 돼요','작은 것에서 의미를 찾아요'],acts:['매일 창작 시간 30분 갖기','주 1회 누군가에게 감사 메모 쓰기','힘든 사람 곁에 조용히 있어주기','내 창작물을 1명과 나누기'],prays:['내 상처가 다른 사람을 위로하는 통로가 되게 해주세요.','나를 지으신 방식 그대로를 기뻐하게 해주세요.']}},
    5:{verse:'잠언 3:5',
      low:{signs:['연락을 피하고 혼자 숨어요','생각만 많고 행동이 안 돼요','이것저것 손대며 산만해져요'],acts:['제대로 된 식사 한 끼 먹기','미뤄둔 답장 1개 보내기','걷기나 스트레칭 30분, 이번 주 3번','지금 아는 만큼으로 작은 결정 1개 내리기'],prays:['다 알지 못해도 괜찮다는 것을, 모든 것을 아시는 분께 맡기게 해주세요.','에너지가 모자랄까 두려워 사람을 피할 때, 공급하시는 힘을 믿게 해주세요.','머릿속에서 나와 몸과 마음으로 오늘을 살게 해주세요.']},
      mid:{signs:['혼자가 편하지만 조금 외로워요','아는 건 많은데 나서지 않아요','감정은 나중에 혼자 정리해요'],acts:['회의에서 내 의견 1개 먼저 말하기','배운 것을 1명에게 나누기','만나는 약속을 내가 먼저 잡기'],prays:['지식이 아니라 사랑으로 사람에게 다가가게 해주세요.','나를 지키는 벽을 조금씩 낮출 용기를 주세요.']},
      high:{signs:['생각과 행동이 이어져요','지식을 나눌 때 기뻐요','사람과 있어도 덜 지쳐요'],acts:['충전 시간과 만남 시간을 둘 다 달력에 넣기','하루 한 번 몸 상태 확인하기 · 배고픔, 피곤, 긴장','필요한 사람에게 자료나 방법 건네기','분석보다 공감 먼저 하기'],prays:['주신 통찰이 사람을 살리는 데 쓰이게 해주세요.','하나님을 아는 지식이 머리에만 머물지 않고 삶으로 흘러가게 해주세요.']}},
    6:{verse:'이사야 41:10',
      low:{signs:['‘혹시 잘못되면?’이 멈추지 않아요','결정을 여러 사람에게 계속 물어요','불안을 잊으려 일을 과하게 해요'],acts:['걱정을 적고 할 수 있는 것과 없는 것 나누기','자기 전 30분은 뉴스와 SNS 끄기','걱정한 일이 실제로 어땠는지 기록하기','작은 결정 3개는 묻지 않고 내가 정하기'],prays:['두려움이 아니라 믿음으로 오늘을 살게 해주세요. 내가 붙들지 않아도 나를 붙들고 계신 분이 계심을 믿게 해주세요.','일어나지 않은 일을 미리 짊어지지 않게 해주세요.','의심하는 내 마음까지도 정직하게 내어놓게 해주세요.']},
      mid:{signs:['책임감 있지만 늘 긴장해 있어요','확인을 여러 번 해요','권위에 기대거나 반발해요'],acts:['계획 없이 10분 쉬기','확인은 한 번만 하고 넘어가기','직감으로 내린 결정 1개와 결과 기록하기'],prays:['내 안에 주신 분별력과 직감을 신뢰하게 해주세요.','사람보다 하나님께 안전함을 두게 해주세요.']},
      high:{signs:['불안해도 행동할 수 있어요','사람을 믿고 맡겨요','공동체를 든든하게 지켜요'],acts:['주 1회 걱정 대신 감사 적기','쉬는 시간을 일정처럼 지키기','불안한 사람 곁에서 ‘같이 있어요’ 말하기','공동체의 작은 책임 1개 먼저 맡기'],prays:['내 신실함이 공동체를 안전하게 하는 힘이 되게 해주세요.','담대하게 옳은 편에 서는 용기를 주세요.']}},
    7:{verse:'시편 23:1',
      low:{signs:['일정을 꽉 채워 혼자 있을 틈이 없어요','불편한 감정은 농담으로 넘겨요','예민해지고 날카롭게 비판해요'],acts:['오늘 저녁 일정 1개 비우기','피하는 감정에 이름 붙여 적기','새로 시작하지 말고 하던 일 1개 끝내기','사고 싶을 땐 장바구니에 담고 48시간 기다리기'],prays:['아픔을 피하지 않고 하나님 앞에서 마주할 용기를 주세요. 고통 속에서도 함께 계심을 믿게 해주세요.','더 가져야 행복하다는 생각에서 놓여나 이미 받은 것으로 충분함을 알게 해주세요.','흩어진 내 마음을 한곳에 모아주세요.']},
      mid:{signs:['재밌지만 깊이가 부족해요','지루하면 견디기 힘들어요','계획은 많고 실행은 일부예요'],acts:['알림 끄고 한 가지에 30분 몰입하기','책 1권이나 강의 1개 끝까지 하기','친한 사람과 진지한 대화 1번 나누기'],prays:['지금 이 자리에 머무는 기쁨을 알게 해주세요.','가벼움 뒤에 숨은 내 마음을 정직하게 보게 해주세요.']},
      high:{signs:['작은 것에도 만족해요','즐거움과 깊이가 함께 있어요','힘든 순간도 피하지 않아요'],acts:['하루 10분 조용히 머무는 시간 갖기','일주일 일정에 빈칸 2개 남기기','지친 사람을 밥 한 끼에 초대하기','아이디어를 실행할 사람과 연결하기'],prays:['내 기쁨이 다른 사람에게 소망이 되게 해주세요.','더 얻기보다 지금 주신 것에 감사하는 사람이 되게 해주세요.']}},
    8:{verse:'고린도후서 12:9',
      low:{signs:['화가 쉽게 나고 목소리가 커져요','지쳐도 계속 밀어붙여요','갑자기 사람들에게서 물러나 숨어요'],acts:['화가 나면 10까지 세고 물 한 잔 마시기','오늘 밤 7시간 이상 자기','믿는 사람에게 ‘요즘 좀 힘들어’ 말하기','상처 줬을 수 있는 사람에게 먼저 연락하기'],prays:['약해져도 괜찮다는 것을 알게 해주세요. 내가 강하지 않아도 나를 지키시는 분이 계심을 믿게 해주세요.','분노 아래 있는 상처를 하나님 앞에서 꺼내게 해주세요.','내 힘으로 상처를 준 사람에게 먼저 손 내밀 용기를 주세요.']},
      mid:{signs:['잘 이끄는데 사람들이 나를 어려워해요','부드러운 감정 표현이 어색해요','내 방식이 아니면 답답해요'],acts:['‘고마워’, ‘미안해’를 구체적으로 말하기','결정 전에 다른 의견 먼저 다 듣기','약한 사람을 위해 힘 쓰는 일 1개 하기'],prays:['내 힘을 지배가 아니라 섬김에 쓰게 해주세요.','부드러움도 강함임을 알게 해주세요.']},
      high:{signs:['강하면서도 따뜻해요','약한 사람을 지켜줘요','내 약함을 보여줘도 편해요'],acts:['잠, 운동, 절제 리듬 고정하기','하루 끝에 ‘오늘 누구를 지켜줬나’ 돌아보기','다른 사람에게 이끌 자리 내주기','억울한 사람 편에 서주기'],prays:['주신 힘이 정의와 보호를 위해 쓰이게 해주세요.','마음을 열고 사람들과 깊이 연결되는 기쁨을 누리게 해주세요.']}},
    9:{verse:'이사야 43:4',
      low:{signs:['할 일을 미루고 영상이나 잠으로 보내요','‘아무거나 괜찮아’가 입버릇이에요','갑자기 걱정과 불안이 커져요'],acts:['가장 미룬 일 5분만 하기 · 타이머 켜고','점심 메뉴는 내가 고르기','아침에 꼭 할 일 1개 적고 저녁에 체크하기','불편했던 마음 1개 짧게 말하기'],prays:['내가 이 자리에 있는 것이 중요하다는 것을 믿게 해주세요. 내 목소리도 귀하다는 것을 알게 해주세요.','갈등이 두려워 나를 지우지 않게 해주세요.','잠든 것 같은 마음을 깨워 오늘 할 일 하나를 해낼 힘을 주세요.']},
      mid:{signs:['편하게 지내지만 내 목표는 흐릿해요','중요한 일보다 쉬운 일부터 해요','남의 계획에 맞추는 게 편해요'],acts:['이번 달 목표 1개 적고 첫 단계 하기','모임에서 내 의견 먼저 1번 말하기','하루 첫 1시간은 가장 중요한 일 하기'],prays:['주신 삶의 방향을 알고, 그 길로 한 걸음 걷게 해주세요.','평화를 지키는 것이 마음을 숨기는 것이 아니라 진실하게 함께하는 것이 되게 해주세요.']},
      high:{signs:['내 의견을 말하며 남도 품어요','할 일을 하면서도 평안해요','사람들을 하나로 모아요'],acts:['아침마다 할 일 1개와 기도제목 1개 정하기','주 1회 ‘요즘 나는 무엇을 원하나?’ 적기','갈등 있는 사람들 사이에서 말 이어주기','불안한 사람 곁을 지켜주기'],prays:['갈등을 덮지 않고 회복시키는, 화평케 하는 사람이 되게 해주세요.','주신 자리에서 깨어 있는 사람이 되게 해주세요.']}}
  };
  /* 유형 탐구 '기도제목' 글(js/10)이 같은 기도제목 · 말씀을 읽는다 (2026-10-08). 읽기만 한다 */
  window.POLISH_PRAYERS=POLISH_STATE_TYPE;
  let polishState='mid'; /* 처음에는 가장 많은 사람이 해당하는 '연마 중'. 상태를 살펴본 결과가 있으면 그 구간으로 */
  let polishStatePicked=false; /* 빠르게 고르기 칩을 직접 누른 뒤에는 결과 구간으로 되돌리지 않는다 */

  /* ---- 보석 상태 살펴보기 (2026-10-07, PRD DT-2~4): 내 유형 문항 15개 + 공통 5개 → 빛남 · 연마 중 · 흐려짐 + 압박 속 경향.
     문항 content/state-check.js (원본 docs/상세검사_상태문항_초안.md, 계산은 그 문서 §4).
     저장 키 enneagram_state_checks_v1, schemaVersion 1: { schemaVersion, results:[{type, at, s, band, stress, care, answers}] } 최근 것부터 12개.
     v1이 첫 형식이라 옮길 이전 형식은 없다. 형식이 바뀌면 readStateChecks에서 옮긴다. 화면에는 구간과 경향만, s(1~7)는 보이지 않는다 (DT-4) ---- */
  const STATE_SCHEMA=1, STATE_KEEP=12, STATE_RECHECK_DAYS=28;
  const STATE_LABEL={high:'빛남',mid:'연마 중',low:'흐려짐'};
  const STATE_STRESS={high:'압박 속에서도 빛을 지키는 편이에요.',mid:'압박이 클 때는 연마 중 쪽으로 기우는 편이에요.',low:'압박이 클 때는 흐려지는 쪽으로 기우는 편이에요.'};
  /* 문항 순서: 빛남·연마 중·흐려짐이 묶여 보이지 않게 섞는다 (문서 순서 0~3 빛남, 4~7 연마 중, 8~11 흐려짐). 장면 선택지도 장면마다 순서를 돌린다 */
  const STATE_ITEM_ORDER=[0,8,4,1,5,9,10,2,6,3,11,7];
  const STATE_OPT_ORDER=[['high','mid','low'],['mid','low','high'],['low','high','mid']];
  const stateData=()=>window.STATE_CHECK||null;
  function readStateChecks(){
    const v=read(STORAGE.stateChecks,null);
    const results=(v && Array.isArray(v.results)?v.results:[])
      .filter(r=>r && Number.isInteger(r.type) && r.type>=1 && r.type<=9 && STATE_LABEL[r.band] && !isNaN(new Date(r.at)));
    return {schemaVersion:STATE_SCHEMA,results};
  }
  const lastStateCheck=t=>readStateChecks().results.find(r=>r.type===t)||null;
  const stateDue=r=>!!r && (Date.now()-new Date(r.at).getTime())/864e5>=STATE_RECHECK_DAYS;
  function saveStateCheck(r){
    const d=readStateChecks();
    d.results.unshift(r);
    d.results=d.results.slice(0,STATE_KEEP);
    write(STORAGE.stateChecks,d);
  }
  function scoreStateCheck(t,ans){
    const T=stateData().types[t];
    const avg=b=>{ const xs=T.items.filter(i=>i.band===b).map(i=>ans[i.id]); return xs.reduce((a,x)=>a+x,0)/xs.length; };
    const L=avg('high'), M=avg('mid'), D=avg('low');
    let s=1+(2*D+M-2*L+6)*6/15;
    const c=['C1','C2','C3','C4'].reduce((a,k)=>a+ans[k],0)/4;
    if(c>=2) s=Math.min(7,s+0.5);
    const cnt={high:0,mid:0,low:0};
    T.scenes.forEach(sc=>{ cnt[ans[sc.id]]++; });
    return {s:Math.round(s*10)/10,band:s<3.5?'high':s<5.5?'mid':'low',stress:cnt.low>=2?'low':cnt.high>=2?'high':'mid',care:ans.C5===3};
  }
  const stateDay=v=>{ const x=new Date(v); return `${x.getMonth()+1}월 ${x.getDate()}일`; };
  /* 심화 리포트 출시 알림 (2026-10-07, 지불 의향 측정용 '가짜 문'): 누른 것만 이 기기에 남긴다.
     저장 키 enneagram_interest_v1, schemaVersion 1: { schemaVersion, report:{at, type, band} | null }. 집계 도구가 붙으면 그쪽으로도 보낸다 */
  const INTEREST_SCHEMA=1;
  function readInterest(){ const v=read(STORAGE.interest,null); return {schemaVersion:INTEREST_SCHEMA,report:v && v.report && v.report.at?v.report:null}; }

  let stateRun=null; /* 살펴보는 중이면 { t, ans } */
  function stateCheckHTML(){
    const D=stateData(), t=stateRun.t, T=D.types[t], ans=stateRun.ans;
    const total=T.items.length+T.scenes.length+D.common.length, done=Object.keys(ans).length;
    const pick=(id,val,label)=>`<button type="button" class="polish-mood${ans[id]===val?' is-on':''}" data-sc-q="${esc(id)}" data-sc-v="${esc(String(val))}" aria-pressed="${ans[id]===val}">${esc(label)}</button>`;
    const q=(id,text,opts,cls)=>`<li class="sc-q"><p class="sc-text" id="sc-${esc(id)}">${esc(text)}</p><div class="sc-opts${cls?' '+cls:''}" role="group" aria-labelledby="sc-${esc(id)}">${opts}</div></li>`;
    const items=STATE_ITEM_ORDER.map(i=>T.items[i]).map(it=>q(it.id,it.text,D.scale.map((l,v)=>pick(it.id,v,l)).join(''),'is-scale')).join('');
    const scenes=T.scenes.map((sc,i)=>q(sc.id,sc.text,STATE_OPT_ORDER[i%3].map(b=>pick(sc.id,b,sc.opts[b])).join(''))).join('');
    const common=D.common.map(c=>q(c.id,c.q,c.opts.map((l,v)=>pick(c.id,v,l)).join(''))).join('');
    return `<section class="polish-sec sc" aria-labelledby="scTitle"><h2 class="polish-title" id="scTitle">보석 상태 살펴보기</h2>`
      +'<p class="polish-lead">최근 2주를 떠올리며 답해 주세요. 정답은 없어요. 답과 결과는 이 기기에만 저장돼요.</p>'
      +'<h3 class="polish-sub">요즘의 나 · 최근 2주 동안 얼마나 자주 있었나요?</h3>'
      +`<ol class="sc-list">${items}</ol>`
      +'<h3 class="polish-sub">이런 장면이라면 · 나는 어떻게 할 것 같나요?</h3>'
      +`<ol class="sc-list">${scenes}</ol>`
      +'<h3 class="polish-sub">요즘 나를 둘러싼 것</h3>'
      +`<ol class="sc-list">${common}</ol>`
      +`<div class="sc-foot"><p class="sc-count" id="scCount" aria-live="polite">${done} / ${total} 답했어요</p>`
      +`<div class="sc-actions"><button class="ui-btn ui-btn-primary" data-sc-done type="button"${done<total?' disabled':''}>결과 보기</button><button class="ui-btn ui-btn-ghost" data-sc-cancel type="button">그만하기</button></div></div></section>`;
  }
  /* 내 상태 > 살펴보기 (2026-10-07, docs/정보구조_IA.md): 지금 내 보석 상태 한 곳.
     예전에는 나의 공간 맨 위(요약)와 보석 닦기 ①(결과·20문항)에 나뉘어 있었다. 마지막으로 살펴본 결과를 기준선으로 (PRD MR-1·MR-4, 콘텐츠 가이드라인 A10) */
  const STATE_TEXT={
    high:{title:n=>`요즘 ${n}${josa(n,'이','가')} 빛나요`,feel:'요즘 마음에 힘이 차 있는 것 같아요.'},
    mid:{title:n=>`${n}${josa(n,'을','를')} 다듬는 중이에요`,feel:'좋은 날도 버거운 날도 함께 지나가고 있네요.'},
    low:{title:n=>`${n}에 먼지가 좀 앉았네요`,feel:'요즘 마음이 많이 바빴던 것 같아요.'}
  };
  /* 분석 노트의 기본 행동은 '이야기 시작하기' 하나라서 이 카드의 버튼은 모두 보조 (2026-10-07) */
  function stateCardHTML(t){
    const D=stateData();
    const gemName=(typeof HOME_PROFILES!=='undefined'&&HOME_PROFILES[t]?.gem)||`${t}번 보석`;
    const r=lastStateCheck(t);
    const gem=typeof gemImg==='function'?`<span class="my-gem-state-gem${r?' is-'+r.band:''}" aria-hidden="true">${gemImg(t,'',true)}</span>`:'';
    const open=`<section aria-labelledby="myGemStateTitle" class="my-insight my-gem-state" style="${typeof gemVars==='function'?gemVars(t):''}">`;
    if(!r) return open+`<div class="my-gem-state-head">${gem}<div><h2 class="my-insight-title" id="myGemStateTitle" tabindex="-1">지금 내 보석 상태</h2><p class="my-insight-line">${esc(gemName)}${josa(gemName,'은','는')} 지금 어떤 빛일까요?</p></div></div>`
      +'<p class="my-insight-meta">최근 2주를 떠올리며 20문항에 답하면 빛남 · 연마 중 · 흐려짐 중 어디쯤인지 살펴봐 줘요. 약 4분 걸려요.</p>'
      +'<div class="my-insight-actions"><button class="ui-btn ui-btn-secondary" data-sc-start type="button">자세히 살펴보기</button></div></section>';
    const x=STATE_TEXT[r.band], due=stateDue(r), asked=readInterest().report;
    const report=r.care?'<button class="ui-btn ui-btn-secondary" data-crisis-open type="button">도움이 필요할 때</button>'
      :asked?'':'<button class="ui-btn ui-btn-secondary" data-sc-report type="button">심화 리포트 받기</button>';
    const actions=due
      ?'<button class="ui-btn ui-btn-secondary" data-sc-start type="button">다시 살펴보기</button><button class="ui-btn ui-btn-secondary" data-state-go="polish" type="button">보석 닦으러 가기</button>'
      :'<button class="ui-btn ui-btn-secondary" data-state-go="polish" type="button">보석 닦으러 가기</button><button class="ui-btn ui-btn-ghost" data-sc-start type="button">다시 살펴보기</button>';
    /* 보석 옆에는 제목과 언제 살펴봤는지만, 풀어 쓴 말은 아래에 전체 폭으로 */
    return open+`<div class="my-gem-state-head">${gem}<div><h2 class="my-insight-title" id="myGemStateTitle" tabindex="-1">${esc(x.title(gemName))}</h2>`
      +`<p class="my-insight-meta">${esc(stateDay(r.at))}에 살펴봤어요 · <b>${esc(STATE_LABEL[r.band])}</b></p></div></div>`
      +`<p class="my-insight-line">${esc(x.feel)} ${esc(STATE_STRESS[r.stress])}</p>`
      +`<p class="my-insight-line">${esc(D.types[t].result[r.band])}</p>`
      +(due?`<p class="my-insight-line">${STATE_RECHECK_DAYS/7}주가 지났어요. 요즘의 나를 다시 살펴볼까요?</p>`:'')
      +`<div class="my-insight-actions">${actions}${report}</div>`
      +(asked&&!r.care?'<p class="sc-report-done my-insight-meta" role="status" tabindex="-1">심화 리포트는 준비 중이에요. 관심을 남겨 주셔서 고마워요.</p>':'')
      +'<p class="my-insight-meta">진단이 아니라 요즘의 나를 살펴보는 참고예요.</p></section>';
  }
  function renderStatePage(){
    const host=g('stateApp'); if(!host) return;
    const t=diaryMyType();
    if(!t){
      host.innerHTML='<section aria-labelledby="stateFindTitle" class="my-insight my-gem-state"><h2 class="my-insight-title" id="stateFindTitle">내 보석을 먼저 찾아볼까요?</h2>'
        +'<p class="my-insight-line">유형을 알면 내 보석이 지금 어떤 빛인지 살펴볼 수 있어요.</p>'
        +'<div class="my-insight-actions"><button class="ui-btn ui-btn-secondary" data-state-quick type="button">간편 검사하기</button></div></section>';
      return;
    }
    if(!stateData()){ host.innerHTML=''; return; }
    if(stateRun && stateRun.t!==t) stateRun=null; /* 살펴보는 중에 내 유형을 바꿨으면 그만둔다 */
    host.innerHTML=stateRun?stateCheckHTML():stateCardHTML(t);
  }
  function startStateCheck(){
    const t=diaryMyType();
    if(!t || !stateData()) return;
    stateRun={t,ans:{}};
    renderStatePage();
    document.getElementById('scTitle')?.scrollIntoView({block:'start'});
    document.querySelector('#stateApp .sc-q .polish-mood')?.focus({preventScroll:true});
  }
  function finishStateCheck(){
    const {t,ans}=stateRun;
    const r=scoreStateCheck(t,ans);
    saveStateCheck({type:t,at:new Date().toISOString(),...r,answers:ans});
    stateRun=null;
    polishState=r.band; polishStatePicked=false; /* 보석 닦기의 행동 추천도 이 상태로 */
    renderStatePage(); renderPolish();
    document.getElementById('page-state')?.scrollTo({top:0});
    document.getElementById('myGemStateTitle')?.focus?.({preventScroll:true});
    if(r.care && typeof window.openCrisisGuide==='function') window.openCrisisGuide(); /* 마음의 짐 '일상을 버티기 어려울 만큼' → 위기 안내 먼저 (SF-2·3) */
  }
  /* 답 하나 고를 때는 화면을 다시 그리지 않는다 (스크롤·포커스 유지) */
  function answerStateCheck(btn){
    const id=btn.dataset.scQ, raw=btn.dataset.scV, val=/^[0-3]$/.test(raw)?Number(raw):raw;
    stateRun.ans[id]=val;
    btn.parentElement.querySelectorAll('[data-sc-q]').forEach(b=>{ const on=b===btn; b.classList.toggle('is-on',on); b.setAttribute('aria-pressed',String(on)); });
    const D=stateData(), T=D.types[stateRun.t];
    const total=T.items.length+T.scenes.length+D.common.length, done=Object.keys(stateRun.ans).length;
    const count=document.getElementById('scCount'); if(count) count.textContent=`${done} / ${total} 답했어요`;
    const go=document.querySelector('#stateApp [data-sc-done]'); if(go) go.disabled=done<total;
  }
  g('stateApp')?.addEventListener('click',e=>{
    const sq=e.target.closest('[data-sc-q]');
    if(sq && stateRun){ answerStateCheck(sq); return; }
    if(e.target.closest('[data-sc-start]')){ startStateCheck(); return; }
    if(e.target.closest('[data-sc-done]') && stateRun){ finishStateCheck(); return; }
    if(e.target.closest('[data-sc-cancel]')){ stateRun=null; renderStatePage(); document.getElementById('page-state')?.scrollTo({top:0}); return; }
    if(e.target.closest('[data-sc-report]')){
      const t=diaryMyType(), r=lastStateCheck(t);
      write(STORAGE.interest,{schemaVersion:INTEREST_SCHEMA,report:{at:new Date().toISOString(),type:t,band:r?r.band:null}});
      renderStatePage(); document.querySelector('#stateApp .sc-report-done')?.focus?.();
      return;
    }
    if(e.target.closest('[data-state-quick]') && typeof showCheckTarget==='function') showCheckTarget('quick');
  });
  /* opts.check: 검사 결과 카드·홈의 '다시 살펴보기'에서 열 때 바로 20문항을 시작한다 */
  window.showStatePage=function(push=true,opts={}){
    if(typeof activateBasePage==='function') activateBasePage('state');
    const mobileTitle=document.getElementById('shellMobileTitle');
    if(mobileTitle) mobileTitle.textContent='분석 노트';
    if(push) history.replaceState(null,'','#state');
    if(typeof closeShellMenu==='function') closeShellMenu();
    renderDashboard(); renderExperiments(); renderStateWish(); renderNoteRecent(); /* 보석 상태 · 이번 주 해볼 것 · 소원과 기도 · 쌓인 분석 */
    document.getElementById('page-state')?.scrollTo({top:0});
    if(opts.check && diaryMyType()) startStateCheck();
  };
  /* 나의 공간 > 나의 기록 (2026-10-07): 다이어리 기록 목록. 하단 탭은 나의 공간, 위 뒤로 가기도 나의 공간 (js/00 PAGE_TAB · TOP_BACK) */
  window.showRecordsPage=function(push=true){
    if(typeof activateBasePage==='function') activateBasePage('records');
    const mobileTitle=document.getElementById('shellMobileTitle');
    if(mobileTitle) mobileTitle.textContent='나의 기록';
    if(push) history.replaceState(null,'','#records');
    if(typeof closeShellMenu==='function') closeShellMenu();
    renderReflectionHistory();
    document.getElementById('page-records')?.scrollTo({top:0});
  };
  /* 분석 노트 '쌓인 분석': 최근 분석 세 개. 누르면 나의 기록 */
  function renderNoteRecent(){
    const host=g('noteRecent'); if(!host) return;
    const recs=readReflections();
    const icon=typeof uiIcon==='function'?`<span class="icon-tile">${uiIcon('diary')}</span>`:'';
    const row=(title,desc,action)=>`<button class="home-next" data-state-go="history" type="button">${icon}<span class="home-next-copy"><strong class="home-next-title">${esc(title)}</strong><span class="home-next-desc">${esc(desc)}</span></span><span class="home-next-go">${esc(action)}</span></button>`;
    host.innerHTML=recs.length
      ?recs.slice(0,3).map(r=>{ const d=new Date(r.createdAt); return row(r.title||'제목 없는 이야기',`${isNaN(d)?'':longDate(d)+' · '}${catLabel(r.category)}${r.next?` · 다음엔 ${r.next}`:''}`,'보기'); }).join('')
        +(recs.length>3?row(`나의 기록 ${recs.length}개 모두 보기`,'지금까지 쌓인 분석을 날짜별로 봐요','전체'):'')
      :'';
    host.hidden=!recs.length;
  }
  /* 나의 공간 '통계 요약' · '찾은 패턴' (2026-10-08, 다이어리 앱들의 통계 요약 · 패턴 찾기 방식)
     통계: 이번 달 이야기 수(지난달과 비교) · 연속으로 이야기한 날 · 해 본 행동 · 자주 느낀 감정 막대 · 자주 이야기한 장면 막대.
           이번 달 이야기가 두 개 미만이면 지금까지 전체로 본다.
     패턴: 근거가 충분할 때만 한 문장씩 (장면×감정, 감정×지키려 한 것, 요일, '다음엔' 실천, 장면 게임 여유/지친 날).
           문장마다 근거(몇 개 중 몇 개)를 같이 적는다. 판정이 아니라 기록에서 보인 흐름 */
  const WEEKDAY=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
  const sameMonth=(d,y,m)=>d.getFullYear()===y && d.getMonth()===m;
  function barsHTML(rows,label){
    const max=Math.max(...rows.map(r=>r[1]),1);
    return `<ul class="my-bars" aria-label="${esc(label)}">${rows.map(([k,n])=>`<li><span class="my-bar-name">${esc(k)}</span><span class="my-bar-track"><span class="my-bar-fill" style="width:${Math.round(n/max*100)}%"></span></span><span class="my-bar-n">${n}번</span></li>`).join('')}</ul>`;
  }
  function streakDays(recs){
    const days=new Set(recs.map(r=>{ const d=new Date(r.createdAt); return isNaN(d)?'':dayKeyOf(d); }));
    const d=new Date(); d.setHours(0,0,0,0);
    if(!days.has(dayKeyOf(d))) d.setDate(d.getDate()-1);
    let n=0; while(days.has(dayKeyOf(d))){ n++; d.setDate(d.getDate()-1); }
    return n;
  }
  /* 기록이 모자랄 때 (2026-10-08): 빈 안내 대신 '예시' 데이터로 같은 모양을 미리 보여준다.
     예시는 옅게 그리고 화면 읽기에서 빼며(aria-hidden), 위에 '예시' 표시와 '기록하면 이렇게 보여요' 한 줄, 아래에 시작 버튼 */
  function sampleHTML(note,body,cta){
    return `<div class="my-sample-head"><span class="my-sample-tag">예시</span><p>${esc(note)}</p></div>`
      +`<div class="my-sample" aria-hidden="true">${body}</div>`
      +(cta||'');
  }
  const tileHTML=(n,label,sub)=>`<div class="my-tile"><b>${n}</b><span>${esc(label)}</span>${sub?`<small>${esc(sub)}</small>`:''}</div>`;
  /* 유형별 지친 날 쪽 (통합·비통합 화살표의 비통합 방향). 예시 문장에만 쓴다 */
  const STRESS_TO={1:4,2:8,3:9,4:2,5:7,6:3,7:1,8:5,9:6};
  function renderMyStats(){
    const host=g('myStats'); if(!host) return;
    const all=readReflections(), now=new Date(), y=now.getFullYear(), m=now.getMonth();
    const month=all.filter(r=>sameMonth(new Date(r.createdAt),y,m));
    const prev=all.filter(r=>sameMonth(new Date(r.createdAt),m?y:y-1,m?m-1:11));
    const useMonth=month.length>=2, base=useMonth?month:all;
    const title=useMonth?`${m+1}월 한눈에`:'지금까지 한눈에';
    if(base.length<2){
      host.innerHTML=`<h2 class="my-log-title" id="myStatsTitle">${m+1}월 한눈에</h2>`
        +sampleHTML(`이야기를 기록하면 이렇게 보여요. 두 개부터 시작해요 (지금 ${all.length}개).`,
          '<div class="my-tiles">'+tileHTML(7,'이야기','지난달 +2')+tileHTML('3일','연속 기록','')+tileHTML(2,'해 본 행동','')+'</div>'
          +`<h3 class="my-sub">자주 느낀 감정</h3>${barsHTML([['불안',4],['서운함',3],['뿌듯함',2]],'예시 감정')}`
          +`<h3 class="my-sub">자주 이야기한 장면</h3>${barsHTML([['일',3],['사람 사이',2],['가족',1]],'예시 장면')}`,
          '<button class="ui-btn ui-btn-secondary" data-state-go="write" type="button">이야기 시작하기</button>');
      return;
    }
    const diff=month.length-prev.length;
    const doneMonth=experimentItems().filter(i=>i.done && (i.updatedAt||'').slice(0,7)===now.toISOString().slice(0,7)).length;
    const emo=aggregateEmotions(base).slice(0,5), cat=aggregateCategories(base).slice(0,4).map(([k,n])=>[catLabel(k),n]);
    const tile=tileHTML;
    host.innerHTML=`<h2 class="my-log-title" id="myStatsTitle">${title}</h2>`
      +'<div class="my-tiles">'
      +tile(base.length,'이야기',useMonth&&prev.length?(diff>0?`지난달 +${diff}`:diff<0?`지난달 −${-diff}`:'지난달과 같아요'):'')
      +tile(`${streakDays(all)}일`,'연속 기록','')
      +tile(doneMonth,'해 본 행동','')
      +'</div>'
      +(emo.length?`<h3 class="my-sub">자주 느낀 감정</h3>${barsHTML(emo,'자주 느낀 감정')}`:'')
      +(cat.length?`<h3 class="my-sub">자주 이야기한 장면</h3>${barsHTML(cat,'자주 이야기한 장면')}`:'');
  }
  /* 장면 게임 값(js/11)은 이 파일보다 늦게 읽혀서, js/11이 다 읽힌 뒤 이걸 불러 숫자 칸 · 패턴을 다시 그린다 */
  window.refreshMySpaceScene=()=>{ renderMyLog(); renderMyPatterns(); };
  function renderMyPatterns(){
    const host=g('myPatterns'); if(!host) return;
    const all=readReflections(), found=[];
    const icon=k=>typeof uiIcon==='function'?`<span class="icon-tile">${uiIcon(k)}</span>`:'';
    /* 1) 장면 × 감정: 같은 장면 이야기가 세 개 넘고, 그중 절반 넘게 같은 감정 */
    aggregateCategories(all).filter(([,n])=>n>=3).forEach(([k,n])=>{
      const e=aggregateEmotions(all.filter(r=>r.category===k))[0];
      if(e && e[1]>=2 && e[1]/n>=0.5) found.push(['diary',`‘${catLabel(k)}’ 장면에서는 ‘${e[0]}’${josa(e[0],'을','를')} 자주 느꼈어요`,`${catLabel(k)} 이야기 ${n}개 중 ${e[1]}개`]);
    });
    /* 2) 감정 × 지키려 한 것: 가장 많은 감정(세 번 넘게)과 함께 가장 자주 고른 것 */
    const topE=aggregateEmotions(all)[0];
    if(topE && topE[1]>=3){
      const mo=aggregateMotives(all.filter(r=>(r.emotions||[]).includes(topE[0])))[0];
      if(mo && mo[1]>=2) found.push(['core',`‘${topE[0]}’${josa(topE[0],'을','를')} 느낄 때, 그 밑엔 ‘${mo[0]}’${josa(mo[0],'을','를')} 지키고 싶은 마음이 있었어요`,`${topE[0]} ${topE[1]}번 중 ${mo[1]}번`]);
    }
    /* 3) 요일: 이야기가 다섯 개 넘고, 한 요일에 40% 넘게 몰림 */
    if(all.length>=5){
      const c=Array(7).fill(0); all.forEach(r=>{ const d=new Date(r.createdAt); if(!isNaN(d)) c[d.getDay()]++; });
      const best=c.indexOf(Math.max(...c));
      if(c[best]>=3 && c[best]/all.length>=0.4) found.push(['read',`${WEEKDAY[best]}에 이야기가 많아요. 그날 마음이 바빠지는 이유가 있을지도 몰라요`,`이야기 ${all.length}개 중 ${c[best]}개`]);
    }
    /* 4) '다음엔' 실천: 다음엔을 적은 이야기가 세 개 넘을 때 해봤어요 비율 */
    const withNext=all.filter(r=>(r.next||'').trim());
    if(withNext.length>=3){
      const st=readExperiments().status, done=withNext.filter(r=>st[r.id]?.done).length;
      found.push(['polish',done?`‘다음엔’에 적은 행동을 ${done}번 직접 해봤어요`:'‘다음엔’에 적어 둔 행동이 아직 기다리고 있어요. 작은 것 하나부터 해 볼까요?',`다음엔 ${withNext.length}개 중 ${done}개`]);
    }
    /* 5) 장면 게임: 여유 있을 때와 지친 날 각각 세 번 넘게 고르고, 기운 유형이 다를 때 */
    const mt=window.sceneMoodTops?.();
    if(mt && mt.calm && mt.tired && mt.calm.of>=3 && mt.tired.of>=3 && mt.calm.t!==mt.tired.t)
      found.push(['quiz',`여유 있을 땐 ${mt.calm.t}번 ${TYPES[mt.calm.t].name}, 지친 날엔 ${mt.tired.t}번 ${TYPES[mt.tired.t].name} 쪽 반응을 자주 골랐어요`,`장면 반응 ${mt.total}번`]);
    const list=rows=>`<ul class="my-patterns">${rows.map(([ic,line,meta])=>`<li>${icon(ic)}<div><p>${esc(line)}</p><small>${esc(meta)}</small></div></li>`).join('')}</ul>`;
    const t=diaryMyType()||6, tt=STRESS_TO[t];
    host.innerHTML='<h2 class="my-log-title" id="myPatternsTitle">찾은 패턴</h2>'
      +(found.length
        ?list(found)+'<p class="my-month-note">판정이 아니라 지금까지의 기록에서 보인 흐름이에요. 기록이 쌓이면 바뀔 수 있어요.</p>'
        :sampleHTML(`기록이 쌓이면 반복되는 흐름을 이렇게 찾아 드려요. 같은 장면 이야기가 세 개쯤 모이면 보이기 시작해요 (지금 ${all.length}개).`,
          list([['diary','‘일’ 장면에서는 ‘불안’을 자주 느꼈어요','일 이야기 4개 중 3개'],
            ['core','‘서운함’을 느낄 때, 그 밑엔 ‘인정’을 지키고 싶은 마음이 있었어요','서운함 3번 중 2번'],
            ['quiz',`여유 있을 땐 ${t}번 ${TYPES[t].name}, 지친 날엔 ${tt}번 ${TYPES[tt].name} 쪽 반응을 자주 골랐어요`,'장면 반응 12번']]),
          '<div class="my-sample-actions"><button class="ui-btn ui-btn-secondary" data-state-go="write" type="button">이야기 시작하기</button><button class="ui-btn ui-btn-ghost" data-mylog-go="community" type="button">장면 게임 하기</button></div>'));
  }

  /* 나의 공간 '쌓인 나' (2026-10-07 두 번째): 홈 '오늘' 줄 목록과 같은 모양이라 두 화면이 비슷해 보여서, 프로필처럼 바꿨다.
     숫자 세 칸(쌓인 분석 · 해본 것 · 장면 반응, 누르면 그곳으로) + 보석 상태 변화 줄(최근 여섯 번, 왼쪽이 예전) */
  function renderMyLog(){
    const host=g('myLog'); if(!host) return;
    const t=diaryMyType(), recs=readReflections(), items=experimentItems();
    const done=items.filter(i=>i.done).length;
    const checks=t&&stateData()?readStateChecks().results.filter(r=>r.type===t):[];
    const sc=window.sceneSummary?.()||{picks:0,top:0};
    const stat=(go,n,label)=>`<button class="my-stat" data-mylog-go="${go}" type="button"><b>${n}</b><span>${esc(label)}</span></button>`;
    let html=`<h2 class="sr-only" id="myLogTitle">나에게 쌓인 것</h2><div class="my-stats">`
      +stat(recs.length?'records':'write',recs.length,'쌓인 분석')
      +stat('practice',done,'해본 것')
      +stat('community',sc.picks,'장면 반응')+'</div>';
    if(t){
      const line=checks.slice(0,6).reverse();
      html+='<section class="my-states" aria-labelledby="myStatesTitle"><h2 class="my-log-title" id="myStatesTitle">보석 상태 변화</h2>'
        +(line.length
          ?`<ol class="my-state-line" style="${typeof gemVars==='function'?gemVars(t):''}">${line.map(r=>`<li class="is-${r.band}"><span class="my-state-dot" aria-hidden="true"></span><b>${esc(STATE_LABEL[r.band])}</b><small>${esc(stateDay(r.at))}</small></li>`).join('')}</ol>`
            +'<p class="my-states-note">빛남 · 연마 중 · 흐려짐은 판정이 아니라 그때의 나를 살펴본 기록이에요.</p>'
            +'<button class="my-profile-link" data-mylog-go="state" type="button">다시 살펴보기</button>'
          :sampleHTML('20문항으로 살펴볼 때마다 그때의 보석 상태가 이렇게 이어져요.',
            `<ol class="my-state-line" style="${typeof gemVars==='function'?gemVars(t):''}">${[['high','7월'],['mid','8월'],['low','9월'],['mid','10월']].map(([b,d])=>`<li class="is-${b}"><span class="my-state-dot"></span><b>${esc(STATE_LABEL[b])}</b><small>${d}</small></li>`).join('')}</ol>`,
            '<button class="my-profile-link" data-mylog-go="state" type="button">처음 살펴보기</button>'))
        +'</section>';
    }
    host.innerHTML=html;
  }
  /* 숫자 칸 · 상태 변화 · 예시 미리보기의 버튼이 같이 쓴다 */
  g('page-myspace')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-mylog-go]'); if(!b) return;
    const k=b.dataset.mylogGo;
    if(k==='state') showStatePage();
    else if(k==='records'){
      /* 나의 공간에서 열었으면 뒤로 가기 · 켜진 탭도 나의 공간 */
      showRecordsPage();
      if(typeof setTopBack==='function') setTopBack('나의 공간',()=>showMySpaceSection('dashboard'));
      document.querySelectorAll('.bottom-tab[data-tab]').forEach(b=>{ const on=b.dataset.tab==='myspace'; b.classList.toggle('active',on); if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
    }
    else if(k==='write') showDiaryPage(true,'write');
    else if(k==='practice'){ showStatePage(); g('diaryExpTitle')?.scrollIntoView({block:'start'}); }
    else if(k==='community') window.showCommunityPage?.();
  });
  /* 홈 '오늘' 줄에 쓰는 요약 (js/00 renderHomeShelves): 보석 상태 · 오늘 쓴 기록 · 다음에 해볼 것 */
  window.myStateToday=function(){
    const t=diaryMyType(), r=t&&stateData()?lastStateCheck(t):null;
    const recs=readReflections(), todayKey=dayKeyOf(new Date());
    const todo=experimentItems().filter(i=>!i.done);
    const next=todo.find(i=>i.routine && !routineStats(i).todayDone)||todo.find(i=>!i.routine)||null;
    return {
      state:r?{band:r.band,label:STATE_LABEL[r.band],at:r.at,due:stateDue(r)}:null,
      records:recs.length,
      wroteToday:recs.some(x=>{ const d=new Date(x.createdAt); return !isNaN(d) && dayKeyOf(d)===todayKey; }),
      practice:next?{text:next.text,routine:!!next.routine,left:todo.length}:null
    };
  };

  /* 보기 설정: 저장 키 enneagram_prefs_v1, schemaVersion 1: { schemaVersion, showPrayer:boolean }
     v1이 첫 형식이라 옮길 이전 형식은 없다. 형식이 바뀌면 readPrefs에서 옮긴다. 기도제목은 원하는 사람만 본다(기본 꺼짐). */
  function readPrefs(){
    const v=read(STORAGE.prefs,null);
    if(v && v.schemaVersion===PREFS_SCHEMA) return {schemaVersion:PREFS_SCHEMA,showPrayer:v.showPrayer===true};
    return {schemaVersion:PREFS_SCHEMA,showPrayer:false};
  }
  /* 보석 닦기 다시 정리 (2026-10-05): 컨셉 하나 — "이번 주 작은 행동 하나를 고르고, 해보고, 체크한다".
     설명형 콘텐츠(1분 연습 · 신호 목록 · 고칠 점 · 키워드)는 유형 탐구 글로 넘기고, 여기는 고르기와 담기만 남긴다.
     화면: 내 보석 카드(이번 주 방향) → 지금 상태에 맞는 행동 담기. 해볼 것 목록과 소원과 기도는 분석 노트 첫 화면에 있다 (2026-10-08).
     2026-10-07: 상태를 자세히 살펴보는 20문항과 결과는 '내 상태 > 살펴보기'로 옮겼다. 여기서는 살펴본 상태를 기본으로 빠르게 고르기만 */
  function polishPicksHTML(t,have){
    const [key,label,lead]=POLISH_STATES.find(([k])=>k===polishState);
    const acts=t?POLISH_STATE_TYPE[t][key].acts:POLISH_STATE_GENERAL[key].start;
    const chips=POLISH_STATES.map(([k,l])=>`<button type="button" class="polish-mood${k===key?' is-on':''}" data-polish-state="${k}" aria-pressed="${k===key}">${l}</button>`).join('');
    const items=acts.map(a=>{const on=have.has(a);return `<li class="polish-pick${on?' is-on':''}"><span>${esc(a)}</span>`
      +(t?`<button class="polish-add" data-polish-add="${esc(a)}" data-polish-src="${esc(label)}" type="button"${on?' disabled':''}>${on?'담았어요':'담기'}</button>`:'')+'</li>';}).join('');
    let extra='';
    if(key==='low') extra+='<p class="polish-safe">여기 있는 내용은 성격 패턴을 이해하기 위한 것이지, 마음 상태를 진단하는 것이 아니에요. 힘든 마음이 여러 날 이어진다면 믿을 수 있는 사람이나 전문가에게 이야기해보세요.</p>';
    const last=t&&stateData()?lastStateCheck(t):null;
    const from=last?`<p class="polish-lead">${esc(stateDay(last.at))}에 살펴본 상태는 <b>${esc(STATE_LABEL[last.band])}</b>이에요. 오늘 느낌이 다르면 바꿔 골라요.</p>`
      :t?'<p class="polish-lead">지금 상태를 골라요. 20문항으로 자세히 보려면 <button class="polish-inline-link" data-state-go="state" type="button">살펴보기</button>로 가요.</p>':'';
    return `<section class="polish-sec polish-state" aria-labelledby="polishStateTitle"><h2 class="polish-title" id="polishStateTitle" tabindex="-1">지금 상태에 맞는 행동</h2>`
      +from
      +`<div class="polish-moods" role="group" aria-label="지금 내 상태">${chips}</div>`
      +`<p class="polish-lead">${esc(lead)}</p><ul class="polish-picks">${items}</ul>${extra}</section>`;
  }
  /* ③ 소원과 기도 (2026-10-05, 보석 닦기 컨셉 실험): 닦은 보석에 이번 주 바라는 것(소원)과 기도를 담는다.
     소원은 이뤄지면 '감사'로, 기도는 응답받으면 '응답'으로 바뀐다. 기도 제안은 내 유형 · 지금 고른 상태의 기도제목(강의 원고) */
  function readWishes(){
    const v=read(STORAGE.wishes,null);
    const items=(v && Array.isArray(v.items)?v.items:Array.isArray(v)?v:[])
      .filter(x=>x && typeof x.text==='string' && x.text.trim())
      .map(x=>({id:String(x.id||('w_'+Math.random().toString(36).slice(2))),kind:x.kind==='prayer'?'prayer':'wish',text:x.text.trim().slice(0,200),at:String(x.at||''),done:x.done===true,doneAt:String(x.doneAt||'')}));
    return {schemaVersion:WISH_SCHEMA,items};
  }
  function writeWishes(d){ write(STORAGE.wishes,{schemaVersion:WISH_SCHEMA,items:d.items}); }
  function addWish(kind,text){
    const tx=String(text||'').trim(); if(!tx) return false;
    const d=readWishes();
    if(d.items.some(x=>x.kind===kind && x.text===tx && !x.done)) return false;
    d.items.unshift({id:'w_'+Date.now(),kind,text:tx.slice(0,200),at:new Date().toISOString(),done:false,doneAt:''});
    writeWishes(d); return true;
  }
  function polishWishHTML(t){
    const {items}=readWishes();
    const day=d=>{ const x=new Date(d); return isNaN(x)?'':`${x.getMonth()+1}월 ${x.getDate()}일`; };
    const row=x=>`<li class="wish-item${x.done?' is-done':''}"><span class="wish-mark" aria-hidden="true">${x.kind==='wish'?(x.done?'감사':'소원'):(x.done?'응답':'기도')}</span>`
      +`<span class="wish-text">${esc(x.text)}<small>${esc(day(x.at))}${x.done?` · ${x.kind==='wish'?'이뤄졌어요':'응답받았어요'} ${esc(day(x.doneAt))}`:''}</small></span>`
      +(x.done?'':`<button class="wish-done" data-wish-done="${esc(x.id)}" type="button">${x.kind==='wish'?'이뤄졌어요':'응답받았어요'}</button>`)
      +`<button class="wish-del" data-wish-del="${esc(x.id)}" type="button" aria-label="지우기">×</button></li>`;
    const wishes=items.filter(x=>x.kind==='wish'), prayers=items.filter(x=>x.kind==='prayer');
    let suggest='';
    if(t){
      const [key]=POLISH_STATES.find(([k])=>k===polishState);
      const have=new Set(prayers.map(x=>x.text));
      suggest=`<ul class="pray-suggest">${POLISH_STATE_TYPE[t][key].prays.map(p=>`<li><p>${esc(p)}</p><button class="polish-add" data-pray-add="${esc(p)}" type="button"${have.has(p)?' disabled':''}>${have.has(p)?'담았어요':'내 기도로 담기'}</button></li>`).join('')}</ul>`
        +`<p class="polish-verse">함께 읽는 말씀 · ${esc(POLISH_STATE_TYPE[t].verse)}</p>`;
    }
    return `<section class="polish-sec polish-wish" aria-labelledby="polishWishTitle"><h2 class="polish-title" id="polishWishTitle">소원과 기도</h2>`
      +'<p class="polish-lead">닦은 보석에 이번 주 바라는 것을 담아요. 소원이 이뤄지면 감사로, 기도가 응답되면 응답으로 바뀌어요.</p>'
      +'<h3 class="polish-sub">나의 소원</h3>'
      +'<form class="wish-form" data-wish-form="wish"><input class="ui-field" maxlength="80" placeholder="예: 이번 주엔 내 마음을 한 번 솔직하게 말하기" aria-label="이번 주 나의 소원"><button class="polish-add" type="submit">소원 담기</button></form>'
      +(wishes.length?`<ul class="wish-list">${wishes.map(row).join('')}</ul>`:'<p class="wish-empty">아직 담은 소원이 없어요.</p>')
      +'<h3 class="polish-sub">나의 기도</h3>'
      +(t?`<p class="polish-lead">지금 고른 상태(${esc(POLISH_STATES.find(([k])=>k===polishState)[1])})의 ${t}번 기도제목이에요. 마음에 닿는 것을 담거나 직접 써요.</p>`+suggest:'')
      +'<form class="wish-form" data-wish-form="prayer"><input class="ui-field" maxlength="120" placeholder="예: 서두르지 않고 오늘에 머물게 해주세요" aria-label="나의 기도"><button class="polish-add" type="submit">기도 담기</button></form>'
      +(prayers.length?`<ul class="wish-list">${prayers.map(row).join('')}</ul>`:'')
      +'</section>';
  }
  /* 분석 노트 '소원과 기도' (2026-10-08): 보석 닦기 안쪽 화면 맨 아래에 숨어 있던 것을 분석 노트 '이번 주 해볼 것' 아래로 꺼냈다.
     기도제목 추천은 보석 닦기에서 고른 상태(polishState)를 그대로 쓴다 */
  function renderStateWish(){
    const host=g('stateWish'); if(!host) return;
    host.innerHTML=polishWishHTML(diaryMyType());
  }
  function renderPolish(){
    const host=g('polishApp'); if(!host) return;
    const t=diaryMyType();
    const gem=n=>typeof gemImg==='function'?gemImg(n,'',true):'';
    const name=n=>(typeof CHECK_TYPE_NAMES!=='undefined'&&CHECK_TYPE_NAMES[n])||TYPES[n]?.name||'';
    const vars=n=>typeof gemVars==='function'?gemVars(n):'';
    const flow=''; /* 순서 띠(상태 고르기 · 행동 담기 · 소원과 기도)는 섹션 번호와 겹쳐서 뺐다 (2026-10-07) */
    if(!t){
      host.innerHTML=`<section class="polish-hero is-find"><span class="polish-hero-gems" aria-hidden="true">${[2,5,7].map(gem).join('')}</span>`
        +'<strong class="polish-hero-title">내 보석을 먼저 찾아볼까요?</strong><p class="polish-hero-desc">유형을 알면 내 보석에 맞는 행동을 골라 줄 수 있어요.</p>'
        +'<button class="ui-btn ui-btn-primary" data-polish-check type="button">간편 검사하기</button></section>'+flow+polishPicksHTML(null,new Set());
      return;
    }
    const p=POLISH.practice[t], have=new Set(readExperiments().custom.map(x=>x.text));
    const gemName=(typeof HOME_PROFILES!=='undefined'&&HOME_PROFILES[t]?.gem)||'';
    const hero=`<section class="polish-hero" style="${vars(t)}"><span class="polish-hero-gem" aria-hidden="true">${gem(t)}</span>`
      +`<span class="polish-hero-name">${t}번 ${esc(name(t))}${gemName?` · ${esc(gemName)}`:''}</span>`
      +`<strong class="polish-hero-title">${esc(p.direction)}</strong><span class="polish-hero-desc">이번 주에 닦을 방향이에요.</span></section>`;
    const last=lastStateCheck(t);
    if(last && !polishStatePicked) polishState=last.band;
    host.innerHTML=hero+flow+polishPicksHTML(t,have);
  }
  /* state: 핸드북 '요즘 나는 어떤가요?'에서 고른 상태(low·mid·high)로 열 때.
     opts.check: 예전 주소 호환. 상태 문항은 이제 '내 상태 > 살펴보기'에서 한다 */
  window.showPolishPage=function(push=true,state,opts={}){
    if(opts.check){ showStatePage(push,{check:true}); return; }
    const fromState=POLISH_STATES.some(([k])=>k===state);
    if(fromState){ polishState=state; polishStatePicked=true; }
    if(typeof activateBasePage==='function') activateBasePage('polish');
    const mobileTitle=document.getElementById('shellMobileTitle');
    if(mobileTitle) mobileTitle.textContent='분석 노트';
    if(push) history.replaceState(null,'','#polish');
    if(typeof closeShellMenu==='function') closeShellMenu();
    renderPolish(); renderExperiments();
    document.getElementById('page-polish')?.scrollTo({top:0});
    if(fromState) document.querySelector('#polishApp .polish-state')?.scrollIntoView({block:'start'});
    /* 담은 행동이 바로 아래 '해보기로 한 것'에 쌓인다 */
  };
  g('polishApp')?.addEventListener('click',e=>{
    const add=e.target.closest('[data-polish-add]');
    if(add){ const t=diaryMyType(); addCustomExperiment(add.dataset.polishAdd,`보석 닦기 · ${t}번${add.dataset.polishSrc?' · '+add.dataset.polishSrc:''}`); renderPolish(); renderExperiments(); return; }
    const st=e.target.closest('[data-polish-state]');
    if(st){ polishState=st.dataset.polishState; polishStatePicked=true; renderPolish(); renderStateWish(); document.querySelector(`#polishApp [data-polish-state="${polishState}"]`)?.focus(); return; }
    if(e.target.closest('[data-polish-check]') && typeof showCheckTarget==='function') showCheckTarget('quick');
  });
  g('stateWish')?.addEventListener('click',e=>{
    const pa=e.target.closest('[data-pray-add]');
    if(pa){ addWish('prayer',pa.dataset.prayAdd); renderStateWish(); return; }
    const wd=e.target.closest('[data-wish-done]');
    if(wd){ const d=readWishes(); const it=d.items.find(x=>x.id===wd.dataset.wishDone); if(it){ it.done=true; it.doneAt=new Date().toISOString(); writeWishes(d); } renderStateWish(); return; }
    const wx=e.target.closest('[data-wish-del]');
    if(wx){ const d=readWishes(); d.items=d.items.filter(x=>x.id!==wx.dataset.wishDel); writeWishes(d); renderStateWish(); }
  });
  g('stateWish')?.addEventListener('submit',e=>{
    const form=e.target.closest('[data-wish-form]'); if(!form) return;
    e.preventDefault();
    const kind=form.dataset.wishForm, input=form.querySelector('input');
    if(addWish(kind,input.value)){ renderStateWish(); document.querySelector(`#stateWish [data-wish-form="${kind}"] input`)?.focus(); }
  });
  g('polishApp')?.addEventListener('change',e=>{
    const box=e.target.closest('[data-polish-pray]');
    if(!box) return;
    write(STORAGE.prefs,{...readPrefs(),showPrayer:box.checked});
    renderPolish();
    document.querySelector('#polishApp [data-polish-pray]')?.focus();
  });
  document.querySelector('.top-nav-main[data-top-page="polish"]')?.addEventListener('click',()=>showPolishPage());

  // Hash route for new page (runs after existing route)
  function handleMySpaceHash(){
    const hash=location.hash.replace(/^#/,'');
    const m=hash.match(/^myspace-(dashboard|ai|reflection|library|community)$/); /* 없앤 영역 주소는 대시보드로, 성찰 기록은 다이어리로 */
    if(m) showMySpaceSection(m[1],false);
    else if(hash==='diary') showDiaryPage(false,'write');
    else if(hash==='records') showRecordsPage(false);
    else if(hash==='polish') showPolishPage(false);
    else if(hash==='state') showStatePage(false);
  }
  window.addEventListener('hashchange',handleMySpaceHash);
  handleMySpaceHash();

  // initial renders
  renderDashboard(); renderReflectionHistory();
})();
