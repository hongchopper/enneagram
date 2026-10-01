/* =========================================================
   모바일 가로 줄 정리 (2026-10-01)
   옆으로 넘기는 줄(탭·칩·선반·카드)이 "그냥 잘린 것"처럼 보이지 않게:
   - 넘길 내용이 남은 쪽 가장자리를 흐리게 (data-edge = start | mid | end | none → CSS 마스크)
   - 탭·칩 줄은 선택된 항목이 화면 안에 오도록 가운데로 옮긴다
   표: 폰 폭에서 옆으로 밀어 보는 대신, 행마다 카드로 쌓아 보이게 칸 이름(data-label)을 붙인다
   ========================================================= */
(function(){
  const SCROLLERS='.page-subnav-inner, .hb-tabs, .explore-chips, .shelf-rail, .pcard-rail, .continue-grid';
  const TAB_ROWS='.page-subnav-inner, .hb-tabs, .explore-chips';

  function updateEdge(el){
    const max=el.scrollWidth-el.clientWidth;
    const edge=max<=2?'none':el.scrollLeft<=2?'start':el.scrollLeft>=max-2?'end':'mid';
    if(el.dataset.edge!==edge) el.dataset.edge=edge;
  }
  function centerActive(el){
    const a=el.querySelector('.active, [aria-current="page"], [aria-selected="true"]');
    if(!a || el.scrollWidth<=el.clientWidth+2) return;
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

  let timer=0;
  const later=()=>{ clearTimeout(timer); timer=setTimeout(()=>{ labelTables(); refresh(); },80); };
  window.addEventListener('resize',later);
  document.addEventListener('click',later);
  new MutationObserver(later).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  later();
})();
