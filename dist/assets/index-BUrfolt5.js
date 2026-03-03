(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))p(s);new MutationObserver(s=>{for(const c of s)if(c.type==="childList")for(const i of c.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&p(i)}).observe(document,{childList:!0,subtree:!0});function l(s){const c={};return s.integrity&&(c.integrity=s.integrity),s.referrerPolicy&&(c.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?c.credentials="include":s.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function p(s){if(s.ep)return;s.ep=!0;const c=l(s);fetch(s.href,c)}})();const le=`,,,,~,~M,~,,,,
,,,,~,~M,~,,X,,
,B,,~,~,~,~,,X,,
,B,A,~A,~A,~A,~A,A,X,,
,,,,~,~,~,,X,,
,,,,~,~,~,~,X,,
,,D,D,~D,~D,~E,~E,E,,
,,,,~,~,~,~,,,
,,,,~,~,~,,,,
,,,C,~C,~C,~C,C,,,
,,,,~,~,~,,,,
,,,,~,~,~,,,,
,,,,~,~H,~,,,,
,,,,~,~,~,,,,
,,,,~,~,~,,,,
`,re=`,,,,~,~M,~,,,
,,,,~,~M,~,,,
,,,~,~,~,~,,,
,,,~,~,~,~,,,
,,,,~,~h,~h,,,
,,,,~,~,~g,~,,
,,,,~f,~f,~g,~,,
,,,,~e,~,~,~,,
,,,,~e,~d,~d,,,
,,,,~c,~c,~b,,,
,,,,~a,~a,~b,,,
,,,,~,~,~,,,
,,,,~,~H,~,,,
`,ne=`,,,,~,~M,~,~,,
,,,,~,~M,~,~,,
,,,,~,~,~,,,
,,,,~,~,~,,,
,,,,,~,~,,,
,,,,,~,~,,,
,,,,,~,~,,,
,,*,,,~,~E,~E,~E,*
,,,,,~,~,~,~,
,,*,,,~D,~D,~D,~c,
,,,,,~,~a,~,~c,
,,,,,~H,~a,~b,~b,
,,,,,~,,,,
`,se=`,,,~,~M,~,~,,,
,,,~,~M,~,~,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,,~,~,,,,
,,,,~,~,,,,
,,,,~,~,,,,
,*,,,~,~E,~E,~E,*,
,,,,~,~,~,~,,
,*,,,~D,~D,~D,~c,,
,,,,~e,~a,~,~c,,
,,,,~e,~a,~b,~b,,
,,,,~,~,,,,
,,,,~H,~,,,,
`,ie=[{name:"1",csv:`,,,~,~M,~,,,,
,,,~,~M,~,,,,
,,,~,~,~,~,,,
,,,~,~,~,~,,,
,,,~,~,~,~,,,
,,,~,~,~A,A,A,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~H,~,,,,
,,,~,~,~,,,,`},{name:"2",csv:`,,,~,~M,~,,,,
,,,~,~M,~,,,,
,,,~,~,~,~,,,
,,,~,~,~,~,,,
,,,~,~,~,~,,,
,,,~,~,~A,A,A,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~H,~,,,,
,,,~,~,~,,,,`}],ce=Object.freeze(Object.defineProperty({__proto__:null,default:ie},Symbol.toStringTag,{value:"Module"}));function Y(e,t,l){const p=l.split(`
`).map(d=>d.trim()).filter(d=>d.length>0);if(p.length===0)throw new Error("parseCsvLevel: CSV is empty");const s=p.map(d=>d.split(",").map(m=>m.trim())),c=Math.max(...s.map(d=>d.length));for(const d of s)for(;d.length<c;)d.push("");const i=s.length,n=new Set,a=[];let o=null;const r=[],h=new Map,w=[],g=new Map,b=[];for(let d=0;d<i;d++)for(let m=0;m<c;m++){const u=s[d][m];if(u.includes("~")&&n.add(`${d},${m}`),u.includes("*")){a.push({row:d,col:m});continue}const E=u.match(/[A-Za-z]/);if(!E)continue;const v=E[0];if(v==="H"){if(o!==null)throw new Error("parseCsvLevel: multiple H cells found; only one hippo start is allowed");o={row:d,col:m},n.add(`${d},${m}`)}else v==="M"?r.push({row:d,col:m}):v===v.toUpperCase()?(h.has(v)||(w.push(v),h.set(v,[])),h.get(v).push({row:d,col:m})):(g.has(v)||(b.push(v),g.set(v,[])),g.get(v).push({row:d,col:m}))}if(!o)throw new Error("parseCsvLevel: missing H (hippo start)");if(r.length===0)throw new Error("parseCsvLevel: missing M (mama hippo)");if(r.length>2)throw new Error("parseCsvLevel: too many M cells; mama can span at most 2 cells");let P,A,B;if(r.length===2){const d=r[0].row===r[1].row,m=r[0].col===r[1].col;if(!d&&!m)throw new Error("parseCsvLevel: two M cells must be in the same row or same column");if(d){const[u,E]=r[0].col<r[1].col?r:[r[1],r[0]];if(E.col-u.col!==1)throw new Error("parseCsvLevel: two M cells must be adjacent (no gap)");P={row:u.row,col:u.col},A=2,B=1}else{const[u,E]=r[0].row<r[1].row?r:[r[1],r[0]];if(E.row-u.row!==1)throw new Error("parseCsvLevel: two M cells must be adjacent (no gap)");P={row:u.row,col:u.col},A=1,B=2}}else P=r[0],A=1,B=1;const O=[];for(const d of w){const m=h.get(d),u=m.every($=>$.row===m[0].row),E=m.every($=>$.col===m[0].col);if(!u&&!E)throw new Error(`parseCsvLevel: log '${d}' spans both rows and columns — logs must be straight lines`);const v=u?"horizontal":"vertical",C=[...m].sort(($,L)=>v==="horizontal"?$.col-L.col:$.row-L.row);for(let $=1;$<C.length;$++){const L=C[$-1],F=C[$];if((v==="horizontal"?F.col-L.col:F.row-L.row)!==1)throw new Error(`parseCsvLevel: log '${d}' cells are non-contiguous`)}const y=C.length;if(y<2||y>50)throw new Error(`parseCsvLevel: log '${d}' has length ${y}; logs must be 2–50 cells`);O.push({id:`log-${d}`,orientation:v,row:C[0].row,col:C[0].col,length:y})}const N=[];for(const d of b){const m=g.get(d),u=m.every(y=>y.row===m[0].row),E=m.every(y=>y.col===m[0].col);if(!u&&!E)throw new Error(`parseCsvLevel: obstacle hippo '${d}' spans both rows and columns — must be a straight line`);const v=u?"horizontal":"vertical",C=[...m].sort((y,$)=>v==="horizontal"?y.col-$.col:y.row-$.row);for(let y=1;y<C.length;y++){const $=C[y-1],L=C[y];if((v==="horizontal"?L.col-$.col:L.row-$.row)!==1)throw new Error(`parseCsvLevel: obstacle hippo '${d}' cells are non-contiguous`)}if(C.length!==2)throw new Error(`parseCsvLevel: obstacle hippo '${d}' must be exactly 2 cells (got ${C.length})`);for(const y of C)if(!n.has(`${y.row},${y.col}`))throw new Error(`parseCsvLevel: obstacle hippo '${d}' at row ${y.row}, col ${y.col} is not a river cell — mark with ~`);N.push({id:`obstacle-${d}`,orientation:v,row:C[0].row,col:C[0].col})}const ee=1,oe=1;o.row+=1,P.row+=1;for(const d of O)d.row+=1;for(const d of N)d.row+=1;for(const d of a)d.row+=1;let U=n;if(n.size>0){const d=new Set;for(const u of n){const[E,v]=u.split(",");d.add(`${Number(E)+1},${v}`)}for(let u=0;u<c;u++)d.has(`1,${u}`)&&d.add(`0,${u}`);const m=i;for(let u=0;u<c;u++)d.has(`${m},${u}`)&&d.add(`${m+1},${u}`);U=d}const te=i+2;return{id:e,label:t,rows:te,cols:c,logs:O,hippoObstacles:N,hippoStart:o,mamaPos:P,mamaWidth:A,mamaHeight:B,riverCells:U,boulders:a,bleedTop:ee,bleedBottom:oe}}function M(e,t,l){return e.riverCells?e.riverCells.has(`${t},${l}`):!0}function ae(e){return{level:e,logs:e.logs.map(t=>({...t})),hippoObstacles:e.hippoObstacles.map(t=>({...t})),hippoPos:{...e.hippoStart},moves:0,won:!1}}function S(e,t,l,p,s,c,i,n){const a=new Set;for(const o of n??[])a.add(`${o.row},${o.col}`);for(const o of e)if(o.id!==l)for(let r=0;r<o.length;r++){const h=o.orientation==="vertical"?o.row+r:o.row,w=o.orientation==="horizontal"?o.col+r:o.col;a.add(`${h},${w}`)}for(const o of t)if(o.id!==l)for(let r=0;r<2;r++){const h=o.orientation==="vertical"?o.row+r:o.row,w=o.orientation==="horizontal"?o.col+r:o.col;a.add(`${h},${w}`)}if(p&&a.add(`${p.row},${p.col}`),s){const o=c??1,r=i??1;for(let h=0;h<r;h++)for(let w=0;w<o;w++)a.add(`${s.row+h},${s.col+w}`)}return a}function pe(e,t,l){const p=[];for(let s=0;s<e.length;s++)p.push({row:e.orientation==="vertical"?t+s:t,col:e.orientation==="horizontal"?l+s:l});return p}function j(e,t,l,p){return e>=0&&e<l&&t>=0&&t<p}function X(e,t){return e<(t.bleedTop??0)||e>=t.rows-(t.bleedBottom??0)}function de(e,t,l,p){const s=e.logs.find(o=>o.id===t);if(!s||e.won||s.orientation==="horizontal"&&l!==s.row||s.orientation==="vertical"&&p!==s.col)return!1;const{rows:c,cols:i}=e.level,n=pe(s,l,p);if(!n.every(o=>j(o.row,o.col,c,i))||n.some(o=>X(o.row,e.level)))return!1;const a=S(e.logs,e.hippoObstacles,t,e.hippoPos,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders);return n.some(o=>a.has(`${o.row},${o.col}`))?!1:(s.row=l,s.col=p,e.moves+=1,!0)}function he(e,t,l,p){const s=e.hippoObstacles.find(o=>o.id===t);if(!s||e.won||s.orientation==="horizontal"&&l!==s.row||s.orientation==="vertical"&&p!==s.col)return!1;const{rows:c,cols:i}=e.level,n=[];for(let o=0;o<2;o++)n.push({row:s.orientation==="vertical"?l+o:l,col:s.orientation==="horizontal"?p+o:p});if(!n.every(o=>j(o.row,o.col,c,i))||n.some(o=>X(o.row,e.level))||!n.every(o=>M(e.level,o.row,o.col)))return!1;const a=S(e.logs,e.hippoObstacles,t,e.hippoPos,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders);return n.some(o=>a.has(`${o.row},${o.col}`))?!1:(s.row=l,s.col=p,e.moves+=1,!0)}function I(e,t,l){const{row:p,col:s}=e.hippoPos,c=p+t,i=s+l,{rows:n,cols:a}=e.level;return!j(c,i,n,a)||X(c,e.level)||!M(e.level,c,i)||S(e.logs,e.hippoObstacles,null,null,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders).has(`${c},${i}`)?!1:(e.hippoPos={row:c,col:i},!0)}function fe(e){const{row:t,col:l}=e.hippoPos,{row:p,col:s}=e.level.mamaPos,c=e.level.mamaWidth??1,i=e.level.mamaHeight??1;return t>=p-1&&t<=p+i&&l>=s-1&&l<=s+c}function me(e,t,l){const{rows:p}=e.level,s=e.level.bleedTop??0,c=e.level.bleedBottom??0,i=S(e.logs,e.hippoObstacles,null,null,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders);let n=t;for(let o=t-1;o>=s&&!(i.has(`${o},${l}`)||!M(e.level,o,l));o--)n=o;let a=t;for(let o=t+1;o<p-c&&!(i.has(`${o},${l}`)||!M(e.level,o,l));o++)a=o;return{min:n,max:a}}function ue(e,t,l){const{cols:p}=e.level,s=S(e.logs,e.hippoObstacles,null,null,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders);let c=l;for(let n=l-1;n>=0&&!(s.has(`${t},${n}`)||!M(e.level,t,n));n--)c=n;let i=l;for(let n=l+1;n<p&&!(s.has(`${t},${n}`)||!M(e.level,t,n));n++)i=n;return{min:c,max:i}}function we(e,t){const l=e.logs.find(a=>a.id===t);if(!l)return{min:0,max:0};const{rows:p,cols:s}=e.level,c=S(e.logs,e.hippoObstacles,t,e.hippoPos,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders),i=e.level.bleedTop??0,n=e.level.bleedBottom??0;if(l.orientation==="horizontal"){let a=l.col;for(let r=l.col-1;r>=0&&!c.has(`${l.row},${r}`);r--)a=r;let o=l.col;for(let r=l.col+1;r+l.length-1<s&&!c.has(`${l.row},${r+l.length-1}`);r++)o=r;return{min:a,max:o}}else{let a=l.row;for(let r=l.row-1;r>=i&&!c.has(`${r},${l.col}`);r--)a=r;let o=l.row;for(let r=l.row+1;r+l.length-1<p-n&&!c.has(`${r+l.length-1},${l.col}`);r++)o=r;return{min:a,max:o}}}function ge(e,t){const l=e.hippoObstacles.find(a=>a.id===t);if(!l)return{min:0,max:0};const{rows:p,cols:s}=e.level,c=S(e.logs,e.hippoObstacles,t,e.hippoPos,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders),i=e.level.bleedTop??0,n=e.level.bleedBottom??0;if(l.orientation==="horizontal"){let a=l.col;for(let r=l.col-1;r>=0&&!(c.has(`${l.row},${r}`)||!M(e.level,l.row,r));r--)a=r;let o=l.col;for(let r=l.col+1;r+1<s&&!(c.has(`${l.row},${r+1}`)||!M(e.level,l.row,r+1));r++)o=r;return{min:a,max:o}}else{let a=l.row;for(let r=l.row-1;r>=i&&!(c.has(`${r},${l.col}`)||!M(e.level,r,l.col));r--)a=r;let o=l.row;for(let r=l.row+1;r+1<p-n&&!(c.has(`${r+1},${l.col}`)||!M(e.level,r+1,l.col));r++)o=r;return{min:a,max:o}}}const ve=`<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100" style="display:block;width:100%;height:100%">
  <defs>
    <radialGradient id="blush">
      <stop offset="0%"   stop-color="#FF9EB5" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#FF9EB5" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- body -->
  <rect x="16" y="36" width="68" height="61" rx="16" ry="16"
    fill="#6D91C8" stroke="#4A6FA5" stroke-width="3" />
  <!-- ears (behind head) -->
  <ellipse cx="28" cy="42" rx="7" ry="9" transform="rotate(15,28,42)"
    fill="#7B9FD4" stroke="#4A6FA5" stroke-width="3" />
  <ellipse cx="72" cy="42" rx="7" ry="9" transform="rotate(-15,72,42)"
    fill="#7B9FD4" stroke="#4A6FA5" stroke-width="3" />
  <!-- head (covers inner ear overlap) -->
  <rect x="26" y="4" width="48" height="38" rx="10" ry="10"
    fill="#7B9FD4" stroke="#4A6FA5" stroke-width="3" />
  <!-- ear fill on top of head stroke — smaller by stroke half-width so ear outline stays intact -->
  <ellipse cx="28" cy="42" rx="5.5" ry="7.5" transform="rotate(15,28,42)" fill="#7B9FD4" />
  <ellipse cx="72" cy="42" rx="5.5" ry="7.5" transform="rotate(-15,72,42)" fill="#7B9FD4" />
  <!-- inner ears -->
  <ellipse cx="28" cy="42" rx="3.5" ry="5" transform="rotate(15,28,42)" fill="#9BB8D8" />
  <ellipse cx="72" cy="42" rx="3.5" ry="5" transform="rotate(-15,72,42)" fill="#9BB8D8" />
  <!-- blush -->
  <ellipse cx="34" cy="22" rx="11" ry="11" fill="url(#blush)" />
  <ellipse cx="66" cy="22" rx="11" ry="11" fill="url(#blush)" />
  <!-- nostrils -->
  <ellipse cx="40" cy="14" rx="5" ry="3.5" fill="#5A7EB5" />
  <ellipse cx="60" cy="14" rx="5" ry="3.5" fill="#5A7EB5" />
  <!-- eyes -->
  <path d="M 33,27 A 7,7 0 0,0 47,27" fill="none" stroke="#3A5888" stroke-width="2.5" stroke-linecap="round" />
  <path d="M 53,27 A 7,7 0 0,0 67,27" fill="none" stroke="#3A5888" stroke-width="2.5" stroke-linecap="round" />
</svg>
`,q=`<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 200" style="display:block;width:100%;height:100%">
  <!-- tail (behind body) -->
  <rect x="45" y="184" width="10" height="14" rx="5" ry="5" fill="#7B8C9C" stroke="#3C4E5C" stroke-width="3" />
  <!-- body -->
  <rect x="3" y="67" width="94" height="125" rx="22" ry="22"
    fill="#7B8C9C" stroke="#3C4E5C" stroke-width="3" />
  <!-- ears (behind head) -->
  <ellipse cx="19" cy="76" rx="10" ry="12.5" transform="rotate(15,19,76)"
    fill="#8E9EAC" stroke="#3C4E5C" stroke-width="3" />
  <ellipse cx="81" cy="76" rx="10" ry="12.5" transform="rotate(-15,81,76)"
    fill="#8E9EAC" stroke="#3C4E5C" stroke-width="3" />
  <!-- head -->
  <rect x="17" y="3" width="67" height="73" rx="14" ry="14"
    fill="#8E9EAC" stroke="#3C4E5C" stroke-width="3" />
  <!-- ear fill on top of head stroke -->
  <ellipse cx="19" cy="76" rx="8.5" ry="11" transform="rotate(15,19,76)" fill="#8E9EAC" />
  <ellipse cx="81" cy="76" rx="8.5" ry="11" transform="rotate(-15,81,76)" fill="#8E9EAC" />
  <!-- inner ears -->
  <ellipse cx="19" cy="76" rx="5" ry="7" transform="rotate(15,19,76)" fill="#AABBC8" />
  <ellipse cx="81" cy="76" rx="5" ry="7" transform="rotate(-15,81,76)" fill="#AABBC8" />
  <!-- nostrils -->
  <ellipse cx="36" cy="17" rx="7" ry="5" fill="#3C4E5C" />
  <ellipse cx="64" cy="17" rx="7" ry="5" fill="#3C4E5C" />
  <!-- eyes -->
  <path d="M 26,50 A 10,10 0 0,0 46,50" fill="none" stroke="#1C2C3C" stroke-width="3.5" stroke-linecap="round" />
  <path d="M 54,50 A 10,10 0 0,0 74,50" fill="none" stroke="#1C2C3C" stroke-width="3.5" stroke-linecap="round" />
</svg>
`,ye=`<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 200" style="display:block;width:100%;height:100%">
  <!-- tail (behind body) -->
  <rect x="45" y="184" width="10" height="14" rx="5" ry="5" fill="#B07878" stroke="#5C3A42" stroke-width="3" />
  <!-- body -->
  <rect x="3" y="67" width="94" height="125" rx="22" ry="22"
    fill="#B07878" stroke="#5C3A42" stroke-width="3" />
  <!-- ears (behind head) -->
  <ellipse cx="19" cy="76" rx="10" ry="12.5" transform="rotate(15,19,76)"
    fill="#C08888" stroke="#5C3A42" stroke-width="3" />
  <ellipse cx="81" cy="76" rx="10" ry="12.5" transform="rotate(-15,81,76)"
    fill="#C08888" stroke="#5C3A42" stroke-width="3" />
  <!-- head -->
  <rect x="17" y="3" width="67" height="73" rx="14" ry="14"
    fill="#C08888" stroke="#5C3A42" stroke-width="3" />
  <!-- ear fill on top of head stroke -->
  <ellipse cx="19" cy="76" rx="8.5" ry="11" transform="rotate(15,19,76)" fill="#C08888" />
  <ellipse cx="81" cy="76" rx="8.5" ry="11" transform="rotate(-15,81,76)" fill="#C08888" />
  <!-- inner ears -->
  <ellipse cx="19" cy="76" rx="5" ry="7" transform="rotate(15,19,76)" fill="#E0A8A0" />
  <ellipse cx="81" cy="76" rx="5" ry="7" transform="rotate(-15,81,76)" fill="#E0A8A0" />
  <!-- nostrils -->
  <ellipse cx="36" cy="17" rx="7" ry="5" fill="#5C3A42" />
  <ellipse cx="64" cy="17" rx="7" ry="5" fill="#5C3A42" />
  <!-- eyes -->
  <path d="M 26,50 A 10,10 0 0,0 46,50" fill="none" stroke="#3C2028" stroke-width="3.5" stroke-linecap="round" />
  <path d="M 54,50 A 10,10 0 0,0 74,50" fill="none" stroke="#3C2028" stroke-width="3.5" stroke-linecap="round" />
</svg>
`;let f=56;function be(e){return ve}function xe(e,t){const l=document.getElementById("game-container"),p=l.clientWidth,s=l.clientHeight;return Math.min(p/t,s/e)}function V(){return f}function $e(e,t,l,p,s){f=xe(s??t,l);const c=e.querySelector("#grid");c.style.width=`${l*f}px`,c.style.height=`${t*f}px`,c.style.gridTemplateColumns=`repeat(${l}, ${f}px)`,c.style.gridTemplateRows=`repeat(${t}, ${f}px)`,c.querySelectorAll(".cell").forEach(i=>i.remove());for(let i=0;i<t;i++)for(let n=0;n<l;n++){const a=document.createElement("div");a.dataset.row=String(i),a.dataset.col=String(n);const o=!p||p.has(`${i},${n}`)?"river":"bank",r=s!==void 0&&s<t&&(i===0||i===t-1);a.className=`cell ${o}${r?" bleed":""}`,c.appendChild(a)}}function Ce(e,t){const l=e.querySelector("#grid");l.querySelectorAll(".piece").forEach(i=>i.remove());for(const i of t.logs){const n=document.createElement("div");n.className=`piece ${i.orientation==="horizontal"?"log-horizontal":"log-vertical"}`,n.dataset.id=i.id;const a=i.orientation==="horizontal"?i.length*f:f,o=i.orientation==="vertical"?i.length*f:f;n.style.left=`${i.col*f}px`,n.style.top=`${i.row*f}px`,n.style.width=`${a}px`,n.style.height=`${o}px`,n.style.zIndex="2",l.appendChild(n)}for(const i of t.hippoObstacles){const n=document.createElement("div");n.className=`piece hippo-obstacle-${i.orientation}`,n.dataset.id=i.id;const a=i.orientation==="horizontal"?2*f:f,o=i.orientation==="vertical"?2*f:f;n.style.left=`${i.col*f}px`,n.style.top=`${i.row*f}px`,n.style.width=`${a}px`,n.style.height=`${o}px`,n.style.zIndex="3";const w=(i.id.replace("obstacle-","").charCodeAt(0)-97+1)%2===0;if(i.orientation==="horizontal"){const g=w?"matrix(0,1,1,0,0,0)":"translate(200,0) rotate(90)",b=q.replace('viewBox="0 0 100 200"','viewBox="0 0 200 100"').replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/,`$1<g transform="${g}">$2</g>$3`);n.innerHTML=b}else{const g=w?q.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/,'$1<g transform="translate(0,200) scale(1,-1)">$2</g>$3'):q;n.innerHTML=g}l.appendChild(n)}for(const i of t.level.boulders??[]){const n=document.createElement("div");n.className="piece boulder",n.style.left=`${i.col*f}px`,n.style.top=`${i.row*f}px`,n.style.width=`${f}px`,n.style.height=`${f}px`,n.style.zIndex="2",l.appendChild(n)}const p=document.createElement("div");p.className="piece hippo",p.dataset.id="hippo",p.innerHTML=be(),p.style.left=`${t.hippoPos.col*f}px`,p.style.top=`${t.hippoPos.row*f}px`,p.style.width=`${f}px`,p.style.height=`${f}px`,p.style.zIndex="5",l.appendChild(p);const s=ye.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/,'$1<g transform="translate(0,200) scale(1,-1)">$2</g>$3'),c=document.createElement("div");c.className="piece mama",c.dataset.id="mama",c.innerHTML=s,c.style.left=`${t.level.mamaPos.col*f}px`,c.style.top=`${t.level.mamaPos.row*f}px`,c.style.width=`${f}px`,c.style.height=`${(t.level.mamaHeight??1)*f}px`,c.style.zIndex="4",l.appendChild(c)}function Z(e,t,l,p){const c=e.querySelector("#grid").querySelector(`[data-id="${t}"]`);c&&(c.style.left=`${p*f}px`,c.style.top=`${l*f}px`)}function D(e){const t=document.getElementById("move-count");t&&(t.textContent=String(e))}function ke(e){var t;(t=e.querySelector("#win-overlay"))==null||t.classList.add("show")}function Ee(e){var t;(t=e.querySelector("#win-overlay"))==null||t.classList.remove("show")}function z(e){return{x:e.clientX,y:e.clientY}}function k(e,t,l){return Math.max(t,Math.min(l,e))}function K(e,t,l){const p=Math.sign(t-e.hippoPos.row),s=Math.sign(l-e.hippoPos.col),c=Math.abs(t-e.hippoPos.row),i=Math.abs(l-e.hippoPos.col);if(c>=i){if(p!==0&&I(e,p,0)||s!==0&&I(e,0,s))return!0}else if(s!==0&&I(e,0,s)||p!==0&&I(e,p,0))return!0;return!1}let x=null;function Pe(e,t,l){const p=e.querySelector("#grid"),s=new AbortController,c={signal:s.signal};return p.addEventListener("pointerdown",i=>{const n=i.target.closest(".piece");if(!n)return;const a=n.dataset.id??"";if(i.preventDefault(),i.target.setPointerCapture(i.pointerId),a==="hippo"){x={kind:"hippo",startPointer:z(i),startRow:t.hippoPos.row,startCol:t.hippoPos.col};return}const o=t.logs.find(h=>h.id===a);if(o){x={kind:"log",logId:a,startPointer:z(i),startRow:o.row,startCol:o.col,range:we(t,a)};return}const r=t.hippoObstacles.find(h=>h.id===a);r&&(x={kind:"hippoObstacle",obstacleId:a,startPointer:z(i),startRow:r.row,startCol:r.col,range:ge(t,a)})},c),window.addEventListener("pointermove",i=>{if(!x)return;i.preventDefault();const n=V(),a=z(i);if(x.kind==="log"){const o=x,r=t.logs.find(b=>b.id===o.logId);if(!r)return;const h=a.x-o.startPointer.x,w=a.y-o.startPointer.y,g=e.querySelector(`[data-id="${o.logId}"]`);if(!g)return;r.orientation==="horizontal"?g.style.left=`${k(o.startCol+h/n,o.range.min,o.range.max)*n}px`:g.style.top=`${k(o.startRow+w/n,o.range.min,o.range.max)*n}px`}if(x.kind==="hippoObstacle"){const o=x,r=t.hippoObstacles.find(b=>b.id===o.obstacleId);if(!r)return;const h=a.x-o.startPointer.x,w=a.y-o.startPointer.y,g=e.querySelector(`[data-id="${o.obstacleId}"]`);if(!g)return;r.orientation==="horizontal"?g.style.left=`${k(o.startCol+h/n,o.range.min,o.range.max)*n}px`:g.style.top=`${k(o.startRow+w/n,o.range.min,o.range.max)*n}px`}if(x.kind==="hippo"){const o=x,r=a.x-o.startPointer.x,h=a.y-o.startPointer.y,w=e.querySelector('[data-id="hippo"]');if(!w)return;const{rows:g,cols:b}=t.level,P=k(Math.round(o.startRow+h/n),0,g-1),A=k(Math.round(o.startCol+r/n),0,b-1);for(;(t.hippoPos.row!==P||t.hippoPos.col!==A)&&K(t,P,A););const B=ue(t,t.hippoPos.row,t.hippoPos.col),O=me(t,t.hippoPos.row,t.hippoPos.col);w.style.left=`${k(o.startCol+r/n,B.min,B.max)*n}px`,w.style.top=`${k(o.startRow+h/n,O.min,O.max)*n}px`}},c),window.addEventListener("pointerup",i=>{if(!x)return;i.preventDefault();const n=V(),a=z(i);if(x.kind==="log"){const o=x,r=t.logs.find(h=>h.id===o.logId);if(r){const h=a.x-o.startPointer.x,w=a.y-o.startPointer.y;let g=o.startRow,b=o.startCol;r.orientation==="horizontal"?b=k(Math.round(o.startCol+h/n),o.range.min,o.range.max):g=k(Math.round(o.startRow+w/n),o.range.min,o.range.max),de(t,o.logId,g,b),Z(e,o.logId,r.row,r.col),D(t.moves)}}if(x.kind==="hippoObstacle"){const o=x,r=t.hippoObstacles.find(h=>h.id===o.obstacleId);if(r){const h=a.x-o.startPointer.x,w=a.y-o.startPointer.y;let g=o.startRow,b=o.startCol;r.orientation==="horizontal"?b=k(Math.round(o.startCol+h/n),o.range.min,o.range.max):g=k(Math.round(o.startRow+w/n),o.range.min,o.range.max),he(t,o.obstacleId,g,b),Z(e,o.obstacleId,r.row,r.col),D(t.moves)}}if(x.kind==="hippo"){const o=x,r=a.x-o.startPointer.x,h=a.y-o.startPointer.y,{rows:w,cols:g}=t.level,b=k(Math.round(o.startRow+h/n),0,w-1),P=k(Math.round(o.startCol+r/n),0,g-1);for(;(t.hippoPos.row!==b||t.hippoPos.col!==P)&&!(!K(t,b,P)||t.won););const A=e.querySelector('[data-id="hippo"]');A&&(A.style.left=`${t.hippoPos.col*n}px`,A.style.top=`${t.hippoPos.row*n}px`),D(t.moves),fe(t)&&l()}x=null},c),()=>s.abort()}const Ae=""+new URL("hippo-DzXLlrxj.mp3",import.meta.url).href,Me=Object.assign({"./levels/level1.csv":le,"./levels/level2.csv":re,"./levels/level3.csv":ne,"./levels/level4.csv":se}),Le=Object.assign({"./levels/level5.numbers":ce}),Be=Object.entries(Me).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>{const l=e.split("/").pop().replace(".csv",""),p=l.replace(/([A-Za-z])(\d)/g,"$1 $2").replace(/-/g," ").replace(/\b\w/g,s=>s.toUpperCase());return Y(l,p,t)}),Se=Object.entries(Le).sort(([e],[t])=>e.localeCompare(t)).flatMap(([,e])=>e.default.map(({name:t,csv:l})=>Y(t.toLowerCase().replace(/\s+/g,"-"),t,l))),H=[...Be,...Se];if(H.length===0)throw new Error("No levels found in src/levels/");const _=document.getElementById("game-container"),J=document.getElementById("restart-btn");let T=0,R=null;function G(e){T=e;const t=H[e];R==null||R();const l=ae(t),p=document.getElementById("level-label");p&&(p.textContent=t.label),Ee(_);const s=t.riverCells!==void 0&&t.riverCells.size===t.rows*t.cols;document.body.style.background=s?"#3a7bbf":"#4a7a30";const c=t.rows-(t.bleedTop??0)-(t.bleedBottom??0);$e(_,t.rows,t.cols,t.riverCells,c),Ce(_,l),D(0),R=Pe(_,l,()=>{new Audio(Ae).play();const i=T+1<H.length;J.textContent=i?"Next Level":"Play Again",ke(_)})}function Q(){const e=window.location.pathname.match(/\/(\d+)$/);if(e){const t=parseInt(e[1],10);if(t>=1&&t<=H.length)return t-1}return 0}function Oe(e){history.pushState({levelIndex:e},"",`/${e+1}`),G(e)}window.addEventListener("popstate",e=>{var t;G(((t=e.state)==null?void 0:t.levelIndex)??Q())});J.addEventListener("click",()=>{const e=T+1<H.length;Oe(e?T+1:0)});const W=Q();history.replaceState({levelIndex:W},"",`/${W+1}`);G(W);
