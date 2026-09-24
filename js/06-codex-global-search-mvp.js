(function(){
  const layer=document.getElementById('globalSearchLayer');
  const openBtn=document.getElementById('globalSearchOpen');
  const closeBtn=document.getElementById('globalSearchClose');
  const input=document.getElementById('globalSearchInput');
  const results=document.getElementById('globalSearchResults');
  const status=document.getElementById('globalSearchStatus');
  const recentBox=document.getElementById('globalSearchRecent');
  if(!layer||!openBtn||!closeBtn||!input||!results||!status||!recentBox) return;

  const RECENT_KEY='enneagram.globalSearch.recent.v1';
  const labels={
    home:'홈',
    overview:'에니어그램 이해',
    check:'유형 체크',
    handbook:'유형별 핸드북',
    compare:'전체 유형 비교',
    sharing:'나를 돌아보기',
    myspace:'나의 공간'
  };
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  const normalize=value=>clean(value).toLowerCase();
  const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const readRecent=()=>{
    try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]').filter(Boolean).slice(0,6);}catch(e){return [];}
  };
  const writeRecent=query=>{
    const q=clean(query);
    if(q.length<2) return;
    const next=[q,...readRecent().filter(item=>item!==q)].slice(0,6);
    try{localStorage.setItem(RECENT_KEY,JSON.stringify(next));}catch(e){}
  };

  let index=[];

  function titleFrom(el,fallback){
    return clean(el?.querySelector('h1,h2,h3,h4,strong')?.textContent)||fallback;
  }

  function addEntry(entry){
    const text=clean(entry.text);
    if(text.length<16) return;
    index.push({
      category:entry.category,
      pageTitle:entry.pageTitle,
      title:clean(entry.title)||entry.pageTitle,
      text,
      route:entry.route
    });
  }

  function buildIndex(){
    index=[];
    addEntry({
      category:'home',
      pageTitle:labels.home,
      title:'처음 화면',
      text:document.getElementById('page-home')?.innerText,
      route:{type:'home'}
    });

    document.querySelectorAll('#page-overview [data-overview-key]').forEach(panel=>{
      const key=panel.dataset.overviewKey;
      addEntry({
        category:'overview',
        pageTitle:labels.overview,
        title:titleFrom(panel,labels.overview),
        text:panel.innerText,
        route:{type:'overview',key}
      });
    });

    addEntry({
      category:'check',
      pageTitle:labels.check,
      title:'간편 체크',
      text:document.querySelector('#page-check [data-check-mode-panel="quick"]')?.innerText,
      route:{type:'check',target:'quick'}
    });
    document.querySelectorAll('#page-check .type-section[id^="type"]').forEach(section=>{
      const type=section.id.replace('type','');
      addEntry({
        category:'check',
        pageTitle:labels.check,
        title:titleFrom(section,`${type}번 유형 체크`),
        text:section.innerText,
        route:{type:'check',target:`detail-${type}`,anchor:section.id}
      });
    });

    document.querySelectorAll('#page-handbook .type-page[data-type]').forEach(page=>{
      const type=page.dataset.type;
      addEntry({
        category:'handbook',
        pageTitle:labels.handbook,
        title:titleFrom(page,`${type}번 핸드북`),
        text:page.innerText,
        route:{type:'handbook',n:type}
      });
      page.querySelectorAll('.chapter[id], section[id]').forEach(chapter=>{
        addEntry({
          category:'handbook',
          pageTitle:labels.handbook,
          title:titleFrom(chapter,`${type}번 세부 내용`),
          text:chapter.innerText,
          route:{type:'handbook',n:type,anchor:chapter.id}
        });
      });
    });

    document.querySelectorAll('#page-compare [data-compare-panel]').forEach(panel=>{
      const key=panel.dataset.comparePanel;
      addEntry({
        category:'compare',
        pageTitle:labels.compare,
        title:titleFrom(panel,labels.compare),
        text:panel.innerText,
        route:{type:'compare',key}
      });
    });

    document.querySelectorAll('#page-sharing .topic').forEach((topic,index)=>{
      addEntry({
        category:'sharing',
        pageTitle:labels.sharing,
        title:titleFrom(topic,`나를 돌아보기 ${index+1}`),
        text:topic.innerText,
        route:{type:'sharing',index}
      });
    });

    document.querySelectorAll('#page-myspace .myspace-panel[data-myspace-panel]').forEach(panel=>{
      const key=panel.dataset.myspacePanel;
      addEntry({
        category:'myspace',
        pageTitle:labels.myspace,
        title:titleFrom(panel,labels.myspace),
        text:panel.innerText,
        route:{type:'myspace',key}
      });
    });
  }

  function snippet(text,query){
    const lower=text.toLowerCase();
    const q=query.toLowerCase();
    let start=lower.indexOf(q);
    if(start<0) start=0;
    start=Math.max(0,start-42);
    const excerpt=text.slice(start,start+132);
    return (start>0?'...':'')+excerpt+(start+132<text.length?'...':'');
  }

  function search(query){
    const q=normalize(query);
    if(q.length<2) return [];
    const tokens=q.split(/\s+/).filter(Boolean);
    return index.map(item=>{
      const title=normalize(item.title);
      const page=normalize(item.pageTitle);
      const text=normalize(item.text);
      if(!tokens.every(token=>title.includes(token)||page.includes(token)||text.includes(token))) return null;
      let score=0;
      tokens.forEach(token=>{
        if(title.includes(token)) score+=5;
        if(page.includes(token)) score+=3;
        if(text.includes(token)) score+=1;
      });
      return {...item,score};
    }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,24);
  }

  function renderRecent(){
    const recent=readRecent();
    recentBox.innerHTML=recent.map(item=>`<button class="global-search-chip" type="button">${escapeHtml(item)}</button>`).join('');
    recentBox.hidden=recent.length===0 || clean(input.value).length>0;
  }

  function render(){
    const q=clean(input.value);
    renderRecent();
    if(q.length<2){
      status.textContent='검색어를 입력하면 사이트 전체에서 찾아요.';
      results.innerHTML='<p class="global-search-empty">예: 3번, 면접, 분노, 날개, 호니비언</p>';
      return;
    }
    const found=search(q);
    status.textContent=found.length ? `${found.length}개 결과` : '검색 결과가 없어요.';
    if(!found.length){
      results.innerHTML='<p class="global-search-empty">다른 단어로 검색해보세요. 예: 불안, 관계, 성장, 핵심 동기</p>';
      return;
    }
    results.innerHTML=found.map((item,i)=>`
      <button class="global-search-result" data-search-result="${i}" type="button">
        <span>${escapeHtml(item.pageTitle)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(snippet(item.text,q))}</p>
      </button>
    `).join('');
    results.querySelectorAll('[data-search-result]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const item=found[Number(btn.dataset.searchResult)];
        writeRecent(q);
        goTo(item.route);
        closeSearch();
      });
    });
  }

  function openSearch(){
    buildIndex();
    layer.classList.add('open');
    layer.setAttribute('aria-hidden','false');
    document.body.classList.add('global-search-opened');
    render();
    requestAnimationFrame(()=>input.focus());
  }

  function closeSearch(){
    layer.classList.remove('open');
    layer.setAttribute('aria-hidden','true');
    document.body.classList.remove('global-search-opened');
    openBtn.focus();
  }

  function scrollLater(anchor){
    if(!anchor) return;
    setTimeout(()=>{
      const target=document.getElementById(anchor);
      target?.scrollIntoView({behavior:'smooth',block:'start'});
    },140);
  }

  function goTo(route){
    if(!route) return;
    if(route.type==='home') window.showHomePage?.();
    if(route.type==='overview') window.showOverviewSection?.(route.key);
    if(route.type==='check') window.showCheckTarget?.(route.target);
    if(route.type==='handbook') window.showHandbookType?.(route.n);
    if(route.type==='compare') window.showCompareSection?.(route.key);
    if(route.type==='sharing') window.showSharingTopic?.(route.index);
    if(route.type==='myspace') window.showMySpaceSection?.(route.key);
    scrollLater(route.anchor);
  }

  openBtn.addEventListener('click',openSearch);
  closeBtn.addEventListener('click',closeSearch);
  input.addEventListener('input',render);
  recentBox.addEventListener('click',event=>{
    const chip=event.target.closest('.global-search-chip');
    if(!chip) return;
    input.value=chip.textContent.trim();
    render();
    input.focus();
  });
  layer.addEventListener('click',event=>{
    if(event.target===layer) closeSearch();
  });
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey) && event.key.toLowerCase()==='k'){
      event.preventDefault();
      openSearch();
    }
    if(event.key==='Escape' && layer.classList.contains('open')) closeSearch();
  });
})();
