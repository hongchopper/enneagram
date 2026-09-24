(function(){
  const STORAGE={
    reflections:'enneagram_reflections_v1',
    myType:'enneagram_my_type_v1',
    experiments:'enneagram_experiments_v1'
  };
  const REFLECTION_SCHEMA=2; /* 성찰 기록 한 건의 형식 버전 (readReflections에서 옮김) */
  const EXPERIMENT_SCHEMA=1; /* 성장 실험 저장 형식 버전 (readExperiments) */

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
          const whys=(r.whys||[]).filter(Boolean);
          const deep=whys[whys.length-1]||'';
          const detail=[['무슨 일이 있었나요?',r.situation],['나는 어떻게 반응했나요?',r.reaction],...(r.whys||[]).map((w,i)=>[DIARY_WHY_LABELS[i][0],w]),['다음엔',r.next]].filter(x=>x[1]);
          const body=r.situation||r.reaction||'';
          return `<article class="diary-card">
            <div class="diary-card-head">
              <h3>${esc(r.title||'제목 없는 기록')}</h3>
              <div class="diary-card-emotions">${(r.emotions||[]).map(e=>`<span>${esc(e)}</span>`).join('')}</div>
            </div>
            <div class="diary-card-meta">${esc(catLabel(r.category))}</div>
            ${body && body.trim()!==String(r.title||'').trim()?`<p class="diary-card-text">${esc(body.slice(0,120))}${body.length>120?'…':''}</p>`:''}
            ${deep?`<div class="diary-card-line"><span>가장 깊은 이유</span>${esc(deep)}</div>`:''}
            ${r.next?`<div class="diary-card-line"><span>다음엔</span>${esc(r.next)}</div>`:''}
            ${(r.motives||[]).length?`<div class="history-tags">${r.motives.map(m=>`<span>${esc(m)}</span>`).join('')}</div>`:''}
            <div class="diary-card-detail" hidden><dl class="diary-review">${detail.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>
            <div class="diary-card-actions">
              <button type="button" class="ui-btn ui-btn-ghost" data-diary-detail aria-expanded="false">자세히</button>
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
    const more=e.target.closest('[data-diary-detail]');
    if(more){
      const detail=more.closest('.diary-card').querySelector('.diary-card-detail');
      detail.hidden=!detail.hidden;
      more.setAttribute('aria-expanded',detail.hidden?'false':'true');
      more.textContent=detail.hidden?'자세히':'접기';
      return;
    }
    const del=e.target.closest('[data-delete-reflection]');
    if(del){
      if(!confirm('이 기록을 삭제할까요? 삭제하면 되돌릴 수 없어요.')) return;
      const next=readReflections().filter(r=>r.id!==del.dataset.deleteReflection);
      write(STORAGE.reflections,next); renderReflectionHistory(); renderExperiments(); renderDashboard();
    }
  });

  /* ---- 해보기로 한 것(성장 실험): 다이어리의 '다음엔' + 유형별 추천 + 직접 추가 ----
     저장 키 enneagram_experiments_v1, schemaVersion 1:
     { schemaVersion, status:{ [기록 id 또는 실험 id]: { done, note, updatedAt } }, custom:[{ id, text, createdAt, src? }] } */
  function readExperiments(){
    const v=read(STORAGE.experiments,null);
    if(v && v.schemaVersion===EXPERIMENT_SCHEMA && v.status && Array.isArray(v.custom)) return v;
    return {schemaVersion:EXPERIMENT_SCHEMA,status:{},custom:[]};
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
      .map(it=>({...it,done:!!store.status[it.id]?.done,note:store.status[it.id]?.note||''}));
  }
  function experimentSummary(){
    const items=experimentItems();
    return {total:items.length,done:items.filter(i=>i.done).length};
  }
  let experimentFilter='todo';
  function renderExperiments(){
    const list=g('experimentList');
    if(!list) return;
    const items=experimentItems();
    const done=items.filter(i=>i.done).length;
    const badge=g('experimentCountBadge');
    if(badge) badge.textContent=`${done} / ${items.length}`;
    const filter=g('experimentFilter');
    if(filter) filter.innerHTML=[['todo',`해볼 것 ${items.length-done}`],['done',`해봤어요 ${done}`],['all','전체']]
      .map(([k,l])=>chip(k,l,experimentFilter===k,'data-exp-filter')).join('');
    const shown=items.filter(i=>experimentFilter==='all'||(experimentFilter==='done')===i.done);
    list.innerHTML=shown.length?shown.map(it=>`
      <article class="experiment-item${it.done?' is-done':''}">
        <button type="button" class="experiment-check" data-exp-toggle="${esc(it.id)}" aria-pressed="${it.done?'true':'false'}" aria-label="${it.done?'해봤어요 해제':'해봤어요로 표시'}">${it.done?'✓':''}</button>
        <div class="experiment-body">
          <p class="experiment-text">${esc(it.text)}</p>
          <span class="experiment-src">${esc(it.src)}</span>
          ${it.done?`<input class="ui-field experiment-note" data-exp-note="${esc(it.id)}" type="text" maxlength="120" placeholder="해보니 어땠나요? (한 줄)" aria-label="해보니 어땠나요?" value="${esc(it.note)}">`:''}
        </div>
        ${it.custom?`<button type="button" class="ui-btn ui-btn-ghost" data-exp-delete="${esc(it.id)}">삭제</button>`:''}
      </article>`).join('')
      :`<div class="ui-empty"><strong>${items.length?(experimentFilter==='done'?'아직 해본 것이 없어요.':'해볼 것을 모두 해봤어요.'):'아직 해보기로 한 것이 없어요.'}</strong><p>${items.length?'작은 것 하나라도 해봤다면 동그라미를 눌러 보세요.':'기록의 ‘다음엔’에 적거나, 아래 추천에서 골라보세요.'}</p></div>`;
    /* 유형별 추천 */
    const reco=g('experimentReco');
    if(reco){
      const t=diaryTypeInfo.type;
      const have=new Set(items.map(i=>i.text));
      const cands=(t&&diaryTypeInfo.actions.length?diaryTypeInfo.actions:DIARY_NEXT_GENERIC).filter(x=>!have.has(x)).slice(0,3);
      reco.innerHTML=cands.length?`<div class="diary-exp-reco-head">${t?`${t}번 ${esc(diaryTypeInfo.name||'')}에게 권하는 실험`:'이런 것부터 해볼 수 있어요'}</div>`
        +cands.map(x=>`<button type="button" class="diary-exp-reco-item" data-exp-reco="${esc(x)}"><span>${esc(x)}</span><b>+ 추가</b></button>`).join(''):'';
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
      store.custom=store.custom.filter(c=>c.id!==d.dataset.expDelete);
      delete store.status[d.dataset.expDelete];
      write(STORAGE.experiments,store);
      renderExperiments(); renderDashboard();
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

  // Hash route for new page (runs after existing route)
  function handleMySpaceHash(){
    const hash=location.hash.replace(/^#/,'');
    const m=hash.match(/^myspace-(dashboard|ai|reflection|library|community)$/); /* 없앤 영역 주소는 대시보드로, 성찰 기록은 다이어리로 */
    if(m) showMySpaceSection(m[1],false);
    else if(hash==='diary') showDiaryPage(false);
  }
  window.addEventListener('hashchange',handleMySpaceHash);
  handleMySpaceHash();

  // initial renders
  renderDashboard(); renderReflectionHistory();
})();
