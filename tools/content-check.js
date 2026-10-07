/* 글 형식 검사 (2026-10-07): docs/콘텐츠_가이드라인.md §0-1 기준
   node tools/content-check.js
   content/explore-posts.js의 ARTICLES와 content/type-posts.js의 글을 읽어 길이·말투·금지어를 본다.
   문제 있는 글만 출력하고, 하나라도 있으면 종료 코드 1 */
const fs=require('fs');
global.window={};
eval(fs.readFileSync('content/explore-posts.js','utf8'));
eval(fs.readFileSync('content/type-posts.js','utf8'));
const posts={...window.EXPLORE_TEXT};
for(const a of window.EXPLORE_DATA.ARTICLES) posts[a.id]=a;

const plain=h=>(h||'').replace(/<[^>]+>/g,'');
const BAN=/진단|검진|점수|레벨|등급|치료|증상|결함|불량|최악|당신|무조건|반드시|…|\.\.\.|!|[✓★※→✨💎💭🌱]/;
/* 합니다체·한다체: 따옴표 밖에서 '~다.'로 끝나는 문장 */
const FORMAL=/(니다|한다|이다|있다|없다|된다|않다|했다|였다)[.?]/;

let bad=0;
for(const [id,p] of Object.entries(posts)){
  const body=plain(p.body);
  const all=[p.title,p.lead,body,...(p.ask||[]),p.try,JSON.stringify([p.quiz,p.ox,p.mission])].join(' ');
  const outside=all.replace(/[“"‘'][^”"’']*[”"’']/g,'');
  const why=[];
  if(p.title.length>20) why.push(`제목 ${p.title.length}자`);
  if((p.lead||'').length>80) why.push(`리드 ${p.lead.length}자`);
  if(!p.ask||!p.ask.length||p.ask.length>2) why.push(`질문 ${p.ask?.length||0}개`);
  if(!p.try) why.push('해볼 것 없음');
  if(/<table/i.test(p.body||'')) why.push('표');
  if(BAN.test(outside)) why.push('금지어·기호: '+outside.match(BAN)[0]);
  if(FORMAL.test(outside)) why.push('합니다·한다체: '+outside.match(new RegExp('.{0,12}'+FORMAL.source))[0]);
  if(why.length){ bad++; console.log(id.padEnd(16),why.join(' / ')); }
}
/* 비슷해 보이지 않게 (2026-10-07, 가이드라인 9-1 다양성 규칙)
   - 한 유형의 31편: 질문으로 여는 리드 8편 이하, '~건 어때요?'로 끝나는 해볼 것 10편 이하
   - 같은 종류의 9편: 유형 이름을 뺀 제목 틀이 서로 달라야 한다 */
const typed=Object.keys(posts).filter(id=>/-[1-9]$/.test(id));
for(let t=1;t<=9;t++){
  const mine=typed.filter(id=>id.endsWith('-'+t)).map(id=>posts[id]);
  const q=mine.filter(p=>/^[^.]*\?/.test(p.lead||'')).length, tr=mine.filter(p=>/건 어때요\?$/.test(p.try||'')).length;
  if(q>8||tr>10){ bad++; console.log(`${t}번 글 ${mine.length}편`.padEnd(16),`질문 리드 ${q}편(8 이하) · '건 어때요?' ${tr}편(10 이하)`); }
}
const NAMES=/[1-9]번( (개혁가|조력가|성취자|개인주의자|탐구자|충실가|열정가|도전자|평화주의자))?/g;
for(const k of new Set(typed.map(id=>id.replace(/-[1-9]$/,'')))){
  const frames=typed.filter(id=>id.startsWith(k+'-')).map(id=>posts[id].title.replace(NAMES,'○'));
  const dup=frames.length-new Set(frames).size;
  if(dup>2){ bad++; console.log(k.padEnd(16),`제목 틀이 겹치는 글 ${dup}편: ${frames[0]}`); }
}
console.log(`글 ${Object.keys(posts).length}편 · 확인 필요 ${bad}건`);
process.exit(bad?1:0);
