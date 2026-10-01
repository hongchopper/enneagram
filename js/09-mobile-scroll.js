/* =========================================================
   모바일 가로 줄 정리 (2026-10-01)
   옆으로 넘기는 줄(탭·칩·선반·카드)이 "그냥 잘린 것"처럼 보이지 않게:
   - 넘길 내용이 남은 쪽 가장자리를 흐리게 (data-edge = start | mid | end | none → CSS 마스크)
   - 탭·칩 줄은 선택된 항목이 화면 안에 오도록 가운데로 옮긴다
   표: 폰 폭에서 옆으로 밀어 보는 대신, 행마다 카드로 쌓아 보이게 칸 이름(data-label)을 붙인다
   ========================================================= */
(function(){
  const SCROLLERS='.page-subnav-inner, .hb-tabs, .hb-chips, .explore-chips, .shelf-rail, .pcard-rail, .continue-grid';
  const TAB_ROWS='.page-subnav-inner, .hb-tabs, .hb-chips, .explore-chips';

  function updateEdge(el){
    const max=el.scrollWidth-el.clientWidth;
    const edge=max<=2?'none':el.scrollLeft<=2?'start':el.scrollLeft>=max-2?'end':'mid';
    if(el.dataset.edge!==edge) el.dataset.edge=edge;
  }
  let dragging=false;
  const lastActive=new WeakMap(); /* 선택 항목이 바뀌었을 때만 가운데로 (사람이 넘겨 둔 위치를 함부로 되돌리지 않게) */
  function centerActive(el){
    const a=el.querySelector('.active, [aria-current="page"], [aria-selected="true"]');
    if(!a || el.scrollWidth<=el.clientWidth+2) return;
    if(lastActive.get(el)===a) return;
    lastActive.set(el,a);
    const er=el.getBoundingClientRect(), ar=a.getBoundingClientRect();
    if(!er.width) return;
    const left=el.scrollLeft+(ar.left-er.left)-(el.clientWidth-ar.width)/2;
    el.scrollTo({left:Math.max(0,left)});
  }
  function bind(el){
    if(el.dataset.edgeBound) return;
    el.dataset.edgeBound='1';
    el.addEventListener('scroll',()=>updateEdge(el),{passive:true});
  }
  function refresh(){
    document.querySelectorAll(SCROLLERS).forEach(el=>{ bind(el); updateEdge(el); });
    document.querySelectorAll(TAB_ROWS).forEach(el=>{ centerActive(el); updateEdge(el); });
  }

  function labelTables(){
    document.querySelectorAll('table').forEach(t=>{
      if(t.dataset.labeled || !t.tHead) return;
      const heads=[...t.tHead.rows[0].cells].map(c=>c.textContent.trim());
      [...t.tBodies].forEach(b=>[...b.rows].forEach(r=>[...r.cells].forEach((c,i)=>{ if(heads[i]) c.dataset.label=heads[i]; })));
      t.dataset.labeled='1';
    });
  }

  /* ---- PC 마우스: 가로 줄을 잡고 끌기 + 휠로 옆으로 ----
     터치는 원래대로(손가락으로 넘김). 마우스로 5px 넘게 끌면 끌기로 보고, 그때 뒤따르는 클릭은 막는다 */
  const canScrollX=el=>el.scrollWidth>el.clientWidth+2;
  const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let drag=null;
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse' || e.button!==0) return;
    const el=e.target.closest(SCROLLERS);
    if(!el || !canScrollX(el)) return;
    drag={el,x:e.clientX,left:el.scrollLeft,moved:false,id:e.pointerId,vx:0,lastX:e.clientX,lastT:e.timeStamp};
  });
  document.addEventListener('pointermove',e=>{
    if(!drag || e.pointerId!==drag.id) return;
    const dx=e.clientX-drag.x;
    if(!drag.moved){
      if(Math.abs(dx)<5) return;
      drag.moved=true;
      dragging=true;
      drag.el.style.scrollSnapType='none'; /* 끄는 동안 칸 맞춤(snap)을 꺼야 손을 따라 움직인다 */
      drag.el.style.scrollBehavior='auto';
      drag.el.style.cursor='grabbing';
      drag.el.style.userSelect='none';
      try{ drag.el.setPointerCapture(e.pointerId); }catch(err){}
    }
    const dt=e.timeStamp-drag.lastT;
    if(dt>0) drag.vx=(e.clientX-drag.lastX)/dt; /* 놓을 때 휙 밀었는지 보려고 마지막 속도를 기억 */
    drag.lastX=e.clientX; drag.lastT=e.timeStamp;
    drag.el.scrollLeft=drag.left-dx;
  });

  /* 놓은 위치에서 가장 가까운 칸. 빠르게 밀었으면 민 방향의 다음 칸 */
  function settleTarget(el,vx){
    const pad=parseFloat(getComputedStyle(el).scrollPaddingInlineStart)||parseFloat(getComputedStyle(el).paddingLeft)||0;
    const base=el.getBoundingClientRect().left-el.scrollLeft;
    const stops=[...el.children].filter(c=>c.offsetWidth).map(c=>c.getBoundingClientRect().left-base-pad);
    const max=el.scrollWidth-el.clientWidth;
    if(!stops.length) return el.scrollLeft;
    let i=stops.reduce((best,s,k)=>Math.abs(s-el.scrollLeft)<Math.abs(stops[best]-el.scrollLeft)?k:best,0);
    if(Math.abs(vx)>.4){
      const dir=vx<0?1:-1; /* 손을 왼쪽으로 밀면(속도 음수) 다음 칸으로 */
      if((stops[i]-el.scrollLeft)*dir<=0) i=Math.min(stops.length-1,Math.max(0,i+dir));
    }
    return Math.max(0,Math.min(max,stops[i]));
  }

  const endDrag=e=>{
    if(!drag || (e && e.pointerId!==drag.id)) return;
    const {el,moved,vx}=drag;
    drag=null;
    if(!moved) return;
    el.style.cursor='';
    el.style.userSelect='';
    /* 칸 맞춤을 바로 켜면 Chrome이 끌기 전 칸으로 되돌린다. 먼저 가까운 칸까지 직접 옮긴 뒤에 켠다 */
    const target=settleTarget(el,vx);
    el.scrollTo({left:target,behavior:reduceMotion()?'auto':'smooth'});
    let done=false;
    const finish=()=>{
      if(done) return; done=true;
      el.style.scrollSnapType='';
      el.style.scrollBehavior='';
      el.scrollLeft=target; /* 켠 직후 같은 자리를 다시 지정해 이 칸을 '맞춰진 칸'으로 기억시킨다 */
      dragging=false;
      updateEdge(el);
    };
    el.addEventListener('scrollend',finish,{once:true});
    setTimeout(finish,500);
    /* 끌고 놓을 때 생기는 클릭 한 번만 막는다 (다음 진짜 클릭은 살린다) */
    const block=ev=>{ ev.preventDefault(); ev.stopPropagation(); };
    document.addEventListener('click',block,{capture:true,once:true});
    setTimeout(()=>document.removeEventListener('click',block,{capture:true}),0);
  };
  document.addEventListener('pointerup',endDrag);
  document.addEventListener('pointercancel',endDrag);
  /* 보석 이미지를 끌면 브라우저가 이미지 끌기를 시작하지 않게 */
  document.addEventListener('dragstart',e=>{ if(e.target.closest(SCROLLERS)) e.preventDefault(); });

  /* 휠: 가로 줄 위에서는 옆으로. 칸 맞춤 줄(카드·선반)은 한 칸씩, 탭·칩 줄은 굴린 만큼 */
  let wheelLock=0;
  document.addEventListener('wheel',e=>{
    if(e.ctrlKey) return;
    const el=e.target.closest(SCROLLERS);
    if(!el || !canScrollX(el)) return;
    const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    const max=el.scrollWidth-el.clientWidth;
    if((d<0 && el.scrollLeft<=1) || (d>0 && el.scrollLeft>=max-1)) return; /* 끝에 닿으면 화면 세로 스크롤로 넘긴다 */
    e.preventDefault();
    if(getComputedStyle(el).scrollSnapType.includes('mandatory')){
      const now=Date.now();
      if(now<wheelLock) return;
      wheelLock=now+350;
      const item=el.firstElementChild, gap=parseFloat(getComputedStyle(el).columnGap)||0;
      el.scrollBy({left:Math.sign(d)*((item?.offsetWidth||el.clientWidth*.8)+gap),behavior:'smooth'});
    }else{
      el.scrollLeft+=d;
    }
  },{passive:false});

  let timer=0;
  const later=()=>{ clearTimeout(timer); timer=setTimeout(()=>{ if(dragging){ later(); return; } labelTables(); refresh(); },80); };
  window.addEventListener('resize',later);
  document.addEventListener('click',later);
  new MutationObserver(later).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  later();
})();
