/* 상세 검사 상태 문항: docs/상세검사_상태문항_초안.md 표 → content/state-check.js
   문서를 고친 뒤 `node tools/state-check-build.js`로 다시 만든다. 화면 문구는 문서가 원본이다. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..');
const md=fs.readFileSync(path.join(root,'docs/상세검사_상태문항_초안.md'),'utf8').split(/\r?\n/);
const BAND={'빛':'high','연':'mid','흐':'low'}, RES={'빛남':'high','연마 중':'mid','흐려짐':'low'};
const cells=l=>l.split('|').slice(1,-1).map(s=>s.trim());
const types={}, common=[];
let t=0;
for(const line of md){
  const h=line.match(/^### ([1-9])번 /); if(h){ t=Number(h[1]); types[t]={items:[],scenes:[],result:{}}; continue; }
  if(/^## 7\./.test(line)) t=0;
  const c=line.startsWith('|')?cells(line):null;
  if(c && /^C[1-5]$/.test(c[0])) common.push({id:c[0],q:c[1],opts:c[2].split(' · ')});
  if(!t) continue;
  if(c && new RegExp(`^${t}-[0-9]+$`).test(c[0]) && BAND[c[1]]) types[t].items.push({id:c[0],band:BAND[c[1]],text:c[2]});
  else if(c && new RegExp(`^${t}-S[0-9]$`).test(c[0])) types[t].scenes.push({id:c[0],text:c[1],opts:{high:c[2],mid:c[3],low:c[4]}});
  const r=line.match(/^- (빛남|연마 중|흐려짐): (.+)$/); if(r) types[t].result[RES[r[1]]]=r[2];
}
for(let n=1;n<=9;n++){
  const x=types[n];
  if(!x||x.items.length!==12||x.scenes.length!==3||Object.keys(x.result).length!==3) throw new Error(`${n}번 문항 수가 맞지 않아요 (${x?[x.items.length,x.scenes.length,Object.keys(x.result).length]:"없음"})`);
  for(const b of ['high','mid','low']) if(x.items.filter(i=>i.band===b).length!==4) throw new Error(`${n}번 ${b} 문항이 4개가 아니에요`);
}
if(common.length!==5 || common.some(c=>c.opts.length!==4)) throw new Error('공통 문항(C1~C5)이 맞지 않아요');
const data={version:1,scale:['거의 없었어요','가끔 있었어요','자주 있었어요','거의 매일 있었어요'],common,types};
const out='/* 상세 검사 상태 문항 (만든 파일 — 직접 고치지 말 것).\n   원본: docs/상세검사_상태문항_초안.md · 다시 만들기: node tools/state-check-build.js\n   band: high=빛남 · mid=연마 중 · low=흐려짐 */\nwindow.STATE_CHECK='+JSON.stringify(data,null,1)+';\n';
fs.writeFileSync(path.join(root,'content/state-check.js'),out);
console.log('content/state-check.js 만들었어요:',Object.keys(types).length+'개 유형,',common.length+'개 공통 문항');
