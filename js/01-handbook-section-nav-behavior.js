document.addEventListener('click',function(e){
  const tab=e.target.closest('#page-handbook .handbook-section-tab');
  if(!tab) return;
  const target=document.getElementById(tab.dataset.target);
  if(!target) return;
  target.scrollIntoView({behavior:'smooth',block:'start'});
});
