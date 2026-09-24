(function(){
  const STORAGE={
    reflections:'enneagram_reflections_v1',
    myType:'enneagram_my_type_v1',
    bookmarks:'enneagram_bookmarks_v1',
    community:'enneagram_community_local_v1',
    aiHistory:'enneagram_ai_explorer_v1'
  };

  const TYPES={
    1:{name:'개혁자',focus:'기준·올바름',fear:'잘못되거나 결함 있는 상태',desire:'좋고 올바른 사람이 되는 것',question:'그 상황에서 “제대로 해야 한다”는 기준이 얼마나 중요했나요?'},
    2:{name:'조력자',focus:'관계·필요됨',fear:'사랑받을 가치가 없는 상태',desire:'사랑받고 필요한 사람이 되는 것',question:'상대에게 필요한 사람이거나 좋은 관계를 유지하는 것이 얼마나 중요했나요?'},
    3:{name:'성취자',focus:'성과·가치',fear:'가치 없고 실패한 상태',desire:'가치 있고 인정받는 사람이 되는 것',question:'결과나 평가를 통해 내 가치가 확인되어야 한다는 느낌이 있었나요?'},
    4:{name:'개인주의자',focus:'정체성·의미',fear:'정체성이 없고 평범한 상태',desire:'나만의 정체성과 의미를 찾는 것',question:'그 상황에서 “진짜 나답다”거나 내 감정의 의미가 중요했나요?'},
    5:{name:'탐구자',focus:'이해·유능함',fear:'무능하고 압도되는 상태',desire:'유능하고 충분히 이해하는 것',question:'충분히 알고 준비할 시간이나 에너지가 확보되어야 마음이 놓였나요?'},
    6:{name:'충실가',focus:'안전·신뢰',fear:'지원과 안내가 없는 상태',desire:'안전하고 믿을 수 있는 기반을 갖는 것',question:'실패 자체보다 위험, 변수, 믿을 수 있는 기준이 있는지가 더 중요했나요?'},
    7:{name:'열정가',focus:'자유·가능성',fear:'고통과 박탈에 갇히는 상태',desire:'행복하고 자유로운 상태',question:'답답함을 피하고 다른 선택이나 더 좋은 가능성을 확보하는 것이 중요했나요?'},
    8:{name:'도전자',focus:'자율성·보호',fear:'통제당하고 해를 입는 상태',desire:'자신을 보호하고 주도하는 것',question:'누가 주도하는지, 내 경계와 선택권이 지켜지는지가 중요했나요?'},
    9:{name:'평화주의자',focus:'평화·연결',fear:'분리되고 연결을 잃는 상태',desire:'평화롭고 안정된 연결을 유지하는 것',question:'갈등이 커지지 않고 관계나 내적 평온이 유지되는 것이 중요했나요?'}
  };

  const LIBRARY=[
    {
      id:'paper-review-2021',type:'논문',
      title:'The Enneagram: A systematic review of the literature and directions for future research',
      source:'Journal of Clinical Psychology · 2021',
      summary:'에니어그램 연구의 신뢰도와 타당도, 연구 현황을 체계적으로 검토한 논문입니다.',
      tags:['연구','타당도','체계적 문헌고찰'],
      url:'https://pubmed.ncbi.nlm.nih.gov/33332604/'
    },
    {
      id:'ei-system',type:'공식자료',
      title:'How the Enneagram System Works',
      source:'The Enneagram Institute',
      summary:'9유형 구조, 세 중심, 날개, 발달 수준, 성장·스트레스 방향, 본능 등을 한 번에 볼 수 있는 대표 설명 자료입니다.',
      tags:['Riso-Hudson','세 중심','날개','발달 수준'],
      url:'https://www.enneagraminstitute.com/how-the-enneagram-system-works/'
    },
    {
      id:'narrative-tour',type:'공식자료',
      title:'Tour the Nine Types',
      source:'The Narrative Enneagram',
      summary:'각 유형의 주의 초점과 삶의 교훈, 실제 유형 당사자의 설명을 함께 볼 수 있는 입문 자료입니다.',
      tags:['9유형','주의의 방향','Narrative'],
      url:'https://www.narrativeenneagram.org/tour-the-nine-types/'
    },
    {
      id:'narrative-discover',type:'아티클',
      title:'Discover Your Type · An Inside Job',
      source:'The Narrative Enneagram',
      summary:'행동만으로 다른 사람의 유형을 정하기보다 자신의 내적 동기와 세계관을 관찰해야 한다는 관점을 설명합니다.',
      tags:['유형 찾기','동기','자기관찰'],
      url:'https://www.narrativeenneagram.org/discover-your-type/'
    },
    {
      id:'narrative-explore',type:'아티클',
      title:'Explore the Enneagram',
      source:'The Narrative Enneagram',
      summary:'세 중심, 유형 비교, 본능과 서브타입 등 에니어그램의 주요 개념을 주제별로 탐색할 수 있습니다.',
      tags:['세 중심','유형 비교','본능'],
      url:'https://www.narrativeenneagram.org/explore-the-enneagram/'
    }
  ];

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

  function populateTypeSelect(select,selected){
    if(!select) return;
    select.innerHTML=Object.entries(TYPES).map(([n,t])=>`<option value="${n}" ${String(selected)===n?'selected':''}>${n}번 · ${t.name}</option>`).join('');
  }

  window.showMySpaceSection=function(key='dashboard',push=true){
    if(!['dashboard','ai','reflection','library','community'].includes(key)) key='dashboard';
    currentMySpace=key;
    if(typeof activateBasePage==='function') activateBasePage('myspace');
    document.querySelectorAll('.myspace-panel').forEach(p=>p.classList.toggle('active',p.dataset.myspacePanel===key));
    document.querySelectorAll('.myspace-tab').forEach(b=>b.classList.toggle('active',b.dataset.myspaceTab===key));
    document.querySelectorAll('.shell-myspace-target').forEach(b=>b.classList.toggle('active',b.dataset.myspaceTarget===key));
    document.getElementById('myspaceGroup')?.classList.add('open');
    const titleMap={dashboard:'나의 대시보드',ai:'AI 유형 탐색',reflection:'성찰 기록',library:'라이브러리',community:'커뮤니티'};
    const mobileTitle=document.getElementById('shellMobileTitle');
    if(mobileTitle) mobileTitle.textContent='나의 공간 · '+titleMap[key];
    if(push) history.replaceState(null,'',`#myspace-${key}`);
    if(typeof closeShellMenu==='function') closeShellMenu();
    if(key==='dashboard') renderDashboard();
    if(key==='reflection') renderReflectionHistory();
    if(key==='library') renderLibrary();
    if(key==='community') renderCommunity();
    document.getElementById('page-myspace')?.scrollTo({top:0});
  };

  // ---- Myspace nav ----
  document.querySelector('.top-nav-main[data-top-page="myspace"]')?.addEventListener('click',()=>showMySpaceSection('dashboard'));
  document.querySelector('.shell-menu-btn[data-page="myspace"]')?.addEventListener('click',()=>showMySpaceSection('dashboard'));
  document.querySelectorAll('[data-top-myspace]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();showMySpaceSection(b.dataset.topMyspace);b.blur();}));
  document.querySelectorAll('.shell-myspace-target').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();showMySpaceSection(b.dataset.myspaceTarget);}));
  document.querySelectorAll('.myspace-tab').forEach(b=>b.addEventListener('click',()=>showMySpaceSection(b.dataset.myspaceTab)));
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
  function renderDashboard(){
    const reflections=read(STORAGE.reflections,[]);
    const bookmarks=read(STORAGE.bookmarks,[]);
    const motives=aggregateMotives(reflections);
    const cats=aggregateCategories(reflections);

    document.getElementById('dashReflectionCount').textContent=reflections.length;
    document.getElementById('dashBookmarkCount').textContent=bookmarks.length;
    document.getElementById('dashTopMotive').textContent=motives[0]?.[0]||'—';
    document.getElementById('dashTopMotiveSub').textContent=motives[0] ? `${motives[0][1]}개의 기록에서 선택됨` : '기록이 쌓이면 보여드려요.';
    document.getElementById('dashTopCategory').textContent=cats[0]?.[0]||'—';
    document.getElementById('dashTopCategorySub').textContent=cats[0] ? `${cats[0][1]}개의 기록` : '아직 기록이 없어요.';

    const bars=document.getElementById('dashMotiveBars');
    if(motives.length){
      const max=motives[0][1];
      bars.innerHTML=motives.slice(0,6).map(([m,c])=>`
        <div class="motive-bar-row">
          <span>${esc(m)}</span>
          <div class="motive-bar-track"><div class="motive-bar-fill" style="width:${Math.max(12,c/max*100)}%"></div></div>
          <b>${c}</b>
        </div>`).join('');
    }else{
      bars.innerHTML='<div class="empty-state small"><strong>아직 보여줄 패턴이 없어요.</strong><p>성찰 기록을 2~3개 남기면 반복 단서를 비교할 수 있어요.</p></div>';
    }

    const recent=document.getElementById('dashRecentReflection');
    if(reflections.length){
      recent.innerHTML=reflections.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4).map(r=>`
        <article class="recent-note" data-open-reflection="${r.id}">
          <div class="recent-note-head"><strong>${esc(r.title||'제목 없는 기록')}</strong><span>${formatDate(r.createdAt)}</span></div>
          <p>${esc((r.situation||'').slice(0,86))}${(r.situation||'').length>86?'…':''}</p>
        </article>`).join('');
      recent.querySelectorAll('[data-open-reflection]').forEach(el=>el.addEventListener('click',()=>showMySpaceSection('reflection')));
    }else{
      recent.innerHTML='<div class="empty-state small"><strong>첫 기록을 남겨보세요.</strong><p>오늘 기억에 남은 장면 하나면 충분합니다.</p></div>';
    }

    const summary=document.getElementById('dashPatternSummary');
    const myType=read(STORAGE.myType,'');
    if(!reflections.length){
      summary.innerHTML='기록이 생기면 <b>어떤 상황에서 무엇을 중요하게 보고 어떤 방식으로 반응하는지</b>를 여기에 정리합니다.';
    }else{
      const m=motives[0]?.[0];
      const c=cats[0]?.[0];
      const second=motives[1]?.[0];
      let text=`최근 ${reflections.length}개의 기록에서는 `;
      if(c) text+=`<b>${esc(c)}</b> 영역의 장면이 가장 자주 등장했고, `;
      if(m) text+=`<b>${esc(m)}</b>${second?`과 <b>${esc(second)}</b>`:''} 단서가 반복되었습니다. `;
      text+=`이것이 실제로 여러 상황에서 같은 이유로 반복되는지 다음 기록에서도 관찰해보세요.`;
      if(myType && TYPES[myType]) text+=` <br><br><b>${myType}번 ${TYPES[myType].name}</b>을 탐색 중이라면, 이 기록들이 ${TYPES[myType].focus}이라는 유형 설명과 실제로 어떻게 연결되는지 비교해볼 수 있습니다.`;
      summary.innerHTML=text;
    }
  }

  // ---- AI explorer local mode ----
  const aiA=document.getElementById('aiTypeA'), aiB=document.getElementById('aiTypeB');
  populateTypeSelect(aiA,'3'); populateTypeSelect(aiB,'6');

  let aiState={a:'3',b:'6',turn:0};
  const getChat=()=>document.getElementById('aiChatMessages');
  const addMessage=(role,html)=>{
    const wrap=document.createElement('div'); wrap.className='chat-message '+role;
    wrap.innerHTML=`<div class="chat-avatar">${role==='bot'?'AI':'ME'}</div><div class="chat-bubble">${html}</div>`;
    getChat().appendChild(wrap); getChat().scrollTop=getChat().scrollHeight;
  };
  const setQuickReplies=items=>{
    const q=document.getElementById('aiQuickReplies'); q.innerHTML='';
    items.forEach(txt=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=txt;
      b.addEventListener('click',()=>handleLocalChat(txt));
      q.appendChild(b);
    });
  };
  function startTypeCompare(){
    let a=aiA.value,b=aiB.value;
    if(a===b){ b=a==='9'?'1':String(Number(a)+1); aiB.value=b; }
    aiState={a,b,turn:0};
    const A=TYPES[a],B=TYPES[b];
    document.getElementById('chatPairTitle').textContent=`${a}번 ${A.name} ↔ ${b}번 ${B.name}`;
    getChat().innerHTML='';
    addMessage('bot',`<strong>${a}번과 ${b}번은 겉으로 비슷해 보여도 중심 동기가 다를 수 있어요.</strong>
      <p><b>${a}번</b>은 ${esc(A.focus)}을, <b>${b}번</b>은 ${esc(B.focus)}을 더 중요하게 볼 수 있습니다.<br><br>
      최근에 둘 중 어느 유형인지 헷갈렸던 <b>실제 장면 하나</b>를 떠올려볼까요?</p>`);
    setQuickReplies(['일할 때가 가장 헷갈려요','관계에서 헷갈려요','스트레스 받을 때 헷갈려요','직접 상황을 적을게요']);
  }
  function localCompareReply(text){
    const {a,b,turn}=aiState, A=TYPES[a],B=TYPES[b];
    const lower=text.toLowerCase();
    const typeAKeywords={
      1:['제대로','틀리','기준','실수','옳'],2:['도움','필요','사랑','챙'],3:['성과','인정','평가','잘해','효율'],
      4:['나답','의미','감정','특별'],5:['정보','알아','준비','혼자','에너지'],6:['위험','확인','불안','믿','안전'],
      7:['재미','가능','선택','자유','답답'],8:['통제','주도','직접','약해','경계'],9:['갈등','편안','조화','맞춰','평화']
    };
    const score=(n)=>(typeAKeywords[n]||[]).reduce((s,k)=>s+(lower.includes(k)?1:0),0);
    const sa=score(a), sb=score(b);
    let observation='';
    if(sa>sb) observation=`지금 표현에는 <b>${a}번의 ${A.focus}</b>과 연결되는 단어가 조금 더 보입니다.`;
    else if(sb>sa) observation=`지금 표현에는 <b>${b}번의 ${B.focus}</b>과 연결되는 단어가 조금 더 보입니다.`;
    else observation=`지금 문장만으로는 두 유형을 가르기보다, <b>그 반응이 왜 필요했는지</b>를 한 단계 더 보는 편이 좋겠습니다.`;

    if(turn===0){
      return `${observation}<p>${A.question}<br><br>반대로 ${B.question}</p>`;
    }
    if(turn===1){
      return `${observation}<p>좋아요. 이번에는 결과가 아니라 <b>그 반응을 하지 못했다면 무엇이 가장 불편했을지</b> 생각해보세요.<br>
      ${a}번이라면 “${A.fear}”, ${b}번이라면 “${B.fear}”이라는 주제와 연결되는지 비교해볼 수 있습니다.</p>`;
    }
    return `${observation}<p>현재 대화에서는 유형을 확정하지 않을게요. 다음 실제 장면에서도 <b>${A.focus}</b>과 <b>${B.focus}</b> 중 무엇이 더 반복해서 중요해지는지 기록해보면 구분에 도움이 됩니다.</p>`;
  }
  function handleLocalChat(text){
    if(!text.trim()) return;
    addMessage('user',`<p>${esc(text)}</p>`);
    const response=localCompareReply(text);
    setTimeout(()=>{ addMessage('bot',response); aiState.turn=Math.min(aiState.turn+1,3);
      if(aiState.turn===1) setQuickReplies(['평가받는 게 더 신경 쓰여요','잘못될 가능성이 더 신경 쓰여요','둘 다 비슷해요']);
      else if(aiState.turn===2) setQuickReplies(['다른 상황도 비교해볼게요','성찰 기록에 적어볼게요']);
      else setQuickReplies(['처음부터 다시 비교하기']);
    },180);
  }
  document.getElementById('aiStartCompare')?.addEventListener('click',startTypeCompare);
  document.getElementById('aiChatSend')?.addEventListener('click',()=>{
    const input=document.getElementById('aiChatInput'); const txt=input.value.trim(); if(!txt) return;
    input.value=''; handleLocalChat(txt);
  });
  document.getElementById('aiChatInput')?.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('aiChatSend').click();}
  });
  document.getElementById('aiResetChat')?.addEventListener('click',startTypeCompare);

  // ---- Reflection ----
  function reflectionValues(){
    return {
      id:'r_'+Date.now(),
      createdAt:today(),
      title:document.getElementById('reflectionTitle').value.trim(),
      category:document.getElementById('reflectionCategory').value,
      situation:document.getElementById('reflectionSituation').value.trim(),
      reaction:document.getElementById('reflectionReaction').value.trim(),
      whys:[1,2,3,4,5].map(n=>document.getElementById('why'+n).value.trim()),
      motives:[...document.querySelectorAll('#reflectionMotiveChips input:checked')].map(x=>x.value),
      next:document.getElementById('reflectionNext').value.trim()
    };
  }
  function localReflectionAnalysis(v){
    const text=[v.situation,v.reaction,...v.whys,v.next].join(' ');
    const auto=[];
    const patterns=[
      ['성과·평가',['성과','인정','평가','잘해','능력']],
      ['안전·확인',['안전','불안','확인','위험','걱정']],
      ['관계·사랑',['사랑','필요','관계','서운','챙']],
      ['기준·올바름',['제대로','기준','틀리','옳','실수']],
      ['자율성·통제',['통제','주도','내 뜻','강하게','경계']],
      ['평화·갈등 회피',['갈등','편안','맞춰','넘어가','평화']],
      ['자유·가능성',['자유','가능','재미','답답','선택']],
      ['정체성·의미',['나다운','의미','감정','특별']],
      ['이해·유능함',['정보','이해','알아','준비','혼자']]
    ];
    patterns.forEach(([name,ks])=>{const c=ks.filter(k=>text.includes(k)).length;if(c)auto.push([name,c])});
    auto.sort((a,b)=>b[1]-a[1]);
    const selected=v.motives.length?v.motives.join(', '):'아직 선택하지 않음';
    return `<strong>이번 기록에서 선택한 단서</strong><br>${esc(selected)}<br><br>
      <strong>문장 속에서 함께 보이는 주제</strong><br>${auto.length?auto.slice(0,3).map(x=>esc(x[0])).join(' · '):'특정 주제를 강하게 단정하기 어렵습니다.'}<br><br>
      이 결과는 유형 판정이 아니라 <b>다음 질문을 찾기 위한 로컬 요약</b>입니다. 가장 마지막 Why에서 적은 내용이 실제로 다른 상황에서도 반복되는지 확인해보세요.`;
  }
  document.getElementById('reflectionAnalyze')?.addEventListener('click',()=>{
    const v=reflectionValues();
    const box=document.getElementById('reflectionLocalAnalysis');
    box.innerHTML=localReflectionAnalysis(v); box.hidden=false;
  });
  document.getElementById('reflectionForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const v=reflectionValues();
    if(!v.situation && !v.reaction){alert('돌아볼 장면이나 반응을 하나 이상 적어주세요.');return;}
    const arr=read(STORAGE.reflections,[]); arr.unshift(v); write(STORAGE.reflections,arr);
    e.target.reset(); document.getElementById('reflectionLocalAnalysis').hidden=true;
    renderReflectionHistory(); renderDashboard();
  });
  function renderReflectionHistory(){
    const arr=read(STORAGE.reflections,[]);
    const list=document.getElementById('reflectionHistoryList');
    document.getElementById('reflectionCountBadge').textContent=arr.length;
    if(!arr.length){
      list.innerHTML='<div class="empty-state"><strong>아직 기록이 없어요.</strong><p>한 장면을 저장하면 이곳에 쌓입니다.</p></div>'; return;
    }
    list.innerHTML=arr.map(r=>`
      <article class="history-card">
        <div class="history-meta"><span>${esc(r.category||'기타')}</span><span>${formatDate(r.createdAt)}</span></div>
        <h4>${esc(r.title||'제목 없는 기록')}</h4>
        <p>${esc((r.situation||r.reaction||'').slice(0,110))}${(r.situation||r.reaction||'').length>110?'…':''}</p>
        <div class="history-tags">${(r.motives||[]).map(m=>`<span>${esc(m)}</span>`).join('')}</div>
        <div class="history-actions"><button type="button" data-delete-reflection="${r.id}">삭제</button></div>
      </article>`).join('');
    list.querySelectorAll('[data-delete-reflection]').forEach(b=>b.addEventListener('click',()=>{
      const next=read(STORAGE.reflections,[]).filter(r=>r.id!==b.dataset.deleteReflection);
      write(STORAGE.reflections,next); renderReflectionHistory(); renderDashboard();
    }));
  }

  // ---- Library ----
  function renderLibrary(){
    const saved=read(STORAGE.bookmarks,[]);
    const query=(document.getElementById('librarySearch')?.value||'').trim().toLowerCase();
    let items=LIBRARY.filter(item=>{
      if(libraryFilter==='북마크'&&!saved.includes(item.id)) return false;
      if(!['전체','북마크'].includes(libraryFilter)&&item.type!==libraryFilter) return false;
      const blob=[item.title,item.source,item.summary,...item.tags].join(' ').toLowerCase();
      return !query||blob.includes(query);
    });
    const grid=document.getElementById('libraryGrid');
    if(!items.length){grid.innerHTML='<div class="empty-state"><strong>조건에 맞는 자료가 없어요.</strong><p>검색어나 필터를 바꿔보세요.</p></div>';return;}
    grid.innerHTML=items.map(item=>`
      <article class="library-card">
        <div class="library-card-top">
          <span class="library-type">${esc(item.type)}</span>
          <button type="button" class="bookmark-btn ${saved.includes(item.id)?'saved':''}" data-bookmark="${item.id}" aria-label="북마크">${saved.includes(item.id)?'★':'☆'}</button>
        </div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.summary)}</p>
        <div class="library-source">${esc(item.source)}</div>
        <div class="library-tags">${item.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>
        <a class="library-open" href="${item.url}" target="_blank" rel="noopener noreferrer">원문 열기 &gt;</a>
      </article>`).join('');
    grid.querySelectorAll('[data-bookmark]').forEach(btn=>btn.addEventListener('click',()=>{
      let arr=read(STORAGE.bookmarks,[]),id=btn.dataset.bookmark;
      arr=arr.includes(id)?arr.filter(x=>x!==id):[...arr,id]; write(STORAGE.bookmarks,arr); renderLibrary(); renderDashboard();
    }));
  }
  document.getElementById('librarySearch')?.addEventListener('input',renderLibrary);
  document.querySelectorAll('[data-library-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    libraryFilter=btn.dataset.libraryFilter;
    document.querySelectorAll('[data-library-filter]').forEach(x=>x.classList.toggle('active',x===btn));
    renderLibrary();
  }));

  // ---- Community local preview ----
  document.getElementById('communityForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const content=document.getElementById('communityContent').value.trim();
    if(!content){alert('내용을 적어주세요.');return;}
    const post={
      id:'p_'+Date.now(),createdAt:today(),
      name:document.getElementById('communityName').value.trim()||'익명',
      type:document.getElementById('communityType').value,
      category:document.getElementById('communityCategory').value,
      content
    };
    const arr=read(STORAGE.community,[]); arr.unshift(post); write(STORAGE.community,arr);
    document.getElementById('communityContent').value=''; renderCommunity();
  });
  function renderCommunity(){
    const arr=read(STORAGE.community,[]);
    const list=document.getElementById('communityFeedList');
    if(!arr.length){list.innerHTML='<div class="empty-state"><strong>아직 글이 없어요.</strong><p>커뮤니티 UI를 미리 확인하려면 글을 하나 작성해보세요.</p></div>';return;}
    list.innerHTML=arr.map(p=>`
      <article class="community-post">
        <div class="community-post-meta"><span>${esc(p.name)}${p.type?` · ${p.type}번`:''}</span><span>${formatDate(p.createdAt)}</span></div>
        <h3>${esc(p.category)}</h3>
        <p>${esc(p.content)}</p>
        <div class="community-post-tags"><span>내 기기에만 저장</span></div>
      </article>`).join('');
  }

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
    const m=hash.match(/^myspace-(dashboard|ai|reflection|library|community)$/);
    if(m) showMySpaceSection(m[1],false);
  }
  window.addEventListener('hashchange',handleMySpaceHash);
  handleMySpaceHash();

  // initial renders
  renderDashboard(); renderReflectionHistory(); renderLibrary(); renderCommunity();
})();
