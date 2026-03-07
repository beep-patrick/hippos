(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();function re(e,n,t){const a=t.split(`
`).map(p=>p.trim()).filter(p=>p.length>0);if(a.length===0)throw new Error("parseCsvLevel: CSV is empty");const i=a.map(p=>p.split(",").map(w=>w.trim())),s=Math.max(...i.map(p=>p.length));for(const p of i)for(;p.length<s;)p.push("");const c=i.length,l=new Set,d=[];let o=null;const r=[],f=new Map,h=[],u=new Map,g=[];for(let p=0;p<c;p++)for(let w=0;w<s;w++){const v=i[p][w];if(v.includes("~")&&l.add(`${p},${w}`),v.includes("*")){d.push({row:p,col:w});continue}const M=v.match(/[A-Za-z]/);if(!M)continue;const y=M[0];if(y==="H"){if(o!==null)throw new Error("parseCsvLevel: multiple H cells found; only one hippo start is allowed");o={row:p,col:w},l.add(`${p},${w}`)}else y==="M"?r.push({row:p,col:w}):y===y.toUpperCase()?(f.has(y)||(h.push(y),f.set(y,[])),f.get(y).push({row:p,col:w})):(u.has(y)||(g.push(y),u.set(y,[])),u.get(y).push({row:p,col:w}))}if(!o)throw new Error("parseCsvLevel: missing H (hippo start)");if(r.length===0)throw new Error("parseCsvLevel: missing M (mama hippo)");if(r.length>2)throw new Error("parseCsvLevel: too many M cells; mama can span at most 2 cells");let E,A,P;if(r.length===2){const p=r[0].row===r[1].row,w=r[0].col===r[1].col;if(!p&&!w)throw new Error("parseCsvLevel: two M cells must be in the same row or same column");if(p){const[v,M]=r[0].col<r[1].col?r:[r[1],r[0]];if(M.col-v.col!==1)throw new Error("parseCsvLevel: two M cells must be adjacent (no gap)");E={row:v.row,col:v.col},A=2,P=1}else{const[v,M]=r[0].row<r[1].row?r:[r[1],r[0]];if(M.row-v.row!==1)throw new Error("parseCsvLevel: two M cells must be adjacent (no gap)");E={row:v.row,col:v.col},A=1,P=2}}else E=r[0],A=1,P=1;const S=[];for(const p of h){const w=f.get(p),v=w.every($=>$.row===w[0].row),M=w.every($=>$.col===w[0].col);if(!v&&!M)throw new Error(`parseCsvLevel: log '${p}' spans both rows and columns — logs must be straight lines`);const y=v?"horizontal":"vertical",C=[...w].sort(($,B)=>y==="horizontal"?$.col-B.col:$.row-B.row);for(let $=1;$<C.length;$++){const B=C[$-1],D=C[$];if((y==="horizontal"?D.col-B.col:D.row-B.row)!==1)throw new Error(`parseCsvLevel: log '${p}' cells are non-contiguous`)}const x=C.length;if(x<2||x>50)throw new Error(`parseCsvLevel: log '${p}' has length ${x}; logs must be 2–50 cells`);S.push({id:`log-${p}`,orientation:y,row:C[0].row,col:C[0].col,length:x})}const T=[];for(const p of g){const w=u.get(p),v=w.every(x=>x.row===w[0].row),M=w.every(x=>x.col===w[0].col);if(!v&&!M)throw new Error(`parseCsvLevel: obstacle hippo '${p}' spans both rows and columns — must be a straight line`);const y=v?"horizontal":"vertical",C=[...w].sort((x,$)=>y==="horizontal"?x.col-$.col:x.row-$.row);for(let x=1;x<C.length;x++){const $=C[x-1],B=C[x];if((y==="horizontal"?B.col-$.col:B.row-$.row)!==1)throw new Error(`parseCsvLevel: obstacle hippo '${p}' cells are non-contiguous`)}if(C.length!==2)throw new Error(`parseCsvLevel: obstacle hippo '${p}' must be exactly 2 cells (got ${C.length})`);for(const x of C)if(!l.has(`${x.row},${x.col}`))throw new Error(`parseCsvLevel: obstacle hippo '${p}' at row ${x.row}, col ${x.col} is not a river cell — mark with ~`);T.push({id:`obstacle-${p}`,orientation:y,row:C[0].row,col:C[0].col})}const oe=1,ne=1;o.row+=1,E.row+=1;for(const p of S)p.row+=1;for(const p of T)p.row+=1;for(const p of d)p.row+=1;let U=l;if(l.size>0){const p=new Set;for(const v of l){const[M,y]=v.split(",");p.add(`${Number(M)+1},${y}`)}for(let v=0;v<s;v++)p.has(`1,${v}`)&&p.add(`0,${v}`);const w=c;for(let v=0;v<s;v++)p.has(`${w},${v}`)&&p.add(`${w+1},${v}`);U=p}const te=c+2;return{id:e,label:n,rows:te,cols:s,logs:S,hippoObstacles:T,hippoStart:o,mamaPos:E,mamaWidth:A,mamaHeight:P,riverCells:U,boulders:d,bleedTop:oe,bleedBottom:ne}}function L(e,n,t){return e.riverCells?e.riverCells.has(`${n},${t}`):!0}function le(e){return{level:e,logs:e.logs.map(n=>({...n})),hippoObstacles:e.hippoObstacles.map(n=>({...n})),hippoPos:{...e.hippoStart},moves:0,won:!1}}function H(e,n,t,a,i,s,c,l){const d=new Set;for(const o of l??[])d.add(`${o.row},${o.col}`);for(const o of e)if(o.id!==t)for(let r=0;r<o.length;r++){const f=o.orientation==="vertical"?o.row+r:o.row,h=o.orientation==="horizontal"?o.col+r:o.col;d.add(`${f},${h}`)}for(const o of n)if(o.id!==t)for(let r=0;r<2;r++){const f=o.orientation==="vertical"?o.row+r:o.row,h=o.orientation==="horizontal"?o.col+r:o.col;d.add(`${f},${h}`)}if(a&&d.add(`${a.row},${a.col}`),i){const o=s??1,r=c??1;for(let f=0;f<r;f++)for(let h=0;h<o;h++)d.add(`${i.row+f},${i.col+h}`)}return d}function ie(e,n,t){const a=[];for(let i=0;i<e.length;i++)a.push({row:e.orientation==="vertical"?n+i:n,col:e.orientation==="horizontal"?t+i:t});return a}function j(e,n,t,a){return e>=0&&e<t&&n>=0&&n<a}function X(e,n){return e<(n.bleedTop??0)||e>=n.rows-(n.bleedBottom??0)}function se(e,n,t,a){const i=e.logs.find(o=>o.id===n);if(!i||e.won||i.orientation==="horizontal"&&t!==i.row||i.orientation==="vertical"&&a!==i.col)return!1;const{rows:s,cols:c}=e.level,l=ie(i,t,a);if(!l.every(o=>j(o.row,o.col,s,c))||l.some(o=>X(o.row,e.level)))return!1;const d=H(e.logs,e.hippoObstacles,n,e.hippoPos,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders);return l.some(o=>d.has(`${o.row},${o.col}`))?!1:(i.row=t,i.col=a,e.moves+=1,!0)}function ce(e,n,t,a){const i=e.hippoObstacles.find(o=>o.id===n);if(!i||e.won||i.orientation==="horizontal"&&t!==i.row||i.orientation==="vertical"&&a!==i.col)return!1;const{rows:s,cols:c}=e.level,l=[];for(let o=0;o<2;o++)l.push({row:i.orientation==="vertical"?t+o:t,col:i.orientation==="horizontal"?a+o:a});if(!l.every(o=>j(o.row,o.col,s,c))||l.some(o=>X(o.row,e.level))||!l.every(o=>L(e.level,o.row,o.col)))return!1;const d=H(e.logs,e.hippoObstacles,n,e.hippoPos,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders);return l.some(o=>d.has(`${o.row},${o.col}`))?!1:(i.row=t,i.col=a,e.moves+=1,!0)}function O(e,n,t){const{row:a,col:i}=e.hippoPos,s=a+n,c=i+t,{rows:l,cols:d}=e.level;return!j(s,c,l,d)||X(s,e.level)||!L(e.level,s,c)||H(e.logs,e.hippoObstacles,null,null,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders).has(`${s},${c}`)?!1:(e.hippoPos={row:s,col:c},!0)}function ae(e){const{row:n,col:t}=e.hippoPos,{row:a,col:i}=e.level.mamaPos,s=e.level.mamaWidth??1,c=e.level.mamaHeight??1;return n>=a-1&&n<=a+c&&t>=i-1&&t<=i+s}function de(e,n,t){const{rows:a}=e.level,i=e.level.bleedTop??0,s=e.level.bleedBottom??0,c=H(e.logs,e.hippoObstacles,null,null,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders);let l=n;for(let o=n-1;o>=i&&!(c.has(`${o},${t}`)||!L(e.level,o,t));o--)l=o;let d=n;for(let o=n+1;o<a-s&&!(c.has(`${o},${t}`)||!L(e.level,o,t));o++)d=o;return{min:l,max:d}}function pe(e,n,t){const{cols:a}=e.level,i=H(e.logs,e.hippoObstacles,null,null,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders);let s=t;for(let l=t-1;l>=0&&!(i.has(`${n},${l}`)||!L(e.level,n,l));l--)s=l;let c=t;for(let l=t+1;l<a&&!(i.has(`${n},${l}`)||!L(e.level,n,l));l++)c=l;return{min:s,max:c}}function he(e,n){const t=e.logs.find(d=>d.id===n);if(!t)return{min:0,max:0};const{rows:a,cols:i}=e.level,s=H(e.logs,e.hippoObstacles,n,e.hippoPos,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders),c=e.level.bleedTop??0,l=e.level.bleedBottom??0;if(t.orientation==="horizontal"){let d=t.col;for(let r=t.col-1;r>=0&&!s.has(`${t.row},${r}`);r--)d=r;let o=t.col;for(let r=t.col+1;r+t.length-1<i&&!s.has(`${t.row},${r+t.length-1}`);r++)o=r;return{min:d,max:o}}else{let d=t.row;for(let r=t.row-1;r>=c&&!s.has(`${r},${t.col}`);r--)d=r;let o=t.row;for(let r=t.row+1;r+t.length-1<a-l&&!s.has(`${r+t.length-1},${t.col}`);r++)o=r;return{min:d,max:o}}}function fe(e,n){const t=e.hippoObstacles.find(d=>d.id===n);if(!t)return{min:0,max:0};const{rows:a,cols:i}=e.level,s=H(e.logs,e.hippoObstacles,n,e.hippoPos,e.level.mamaPos,e.level.mamaWidth,e.level.mamaHeight,e.level.boulders),c=e.level.bleedTop??0,l=e.level.bleedBottom??0;if(t.orientation==="horizontal"){let d=t.col;for(let r=t.col-1;r>=0&&!(s.has(`${t.row},${r}`)||!L(e.level,t.row,r));r--)d=r;let o=t.col;for(let r=t.col+1;r+1<i&&!(s.has(`${t.row},${r+1}`)||!L(e.level,t.row,r+1));r++)o=r;return{min:d,max:o}}else{let d=t.row;for(let r=t.row-1;r>=c&&!(s.has(`${r},${t.col}`)||!L(e.level,r,t.col));r--)d=r;let o=t.row;for(let r=t.row+1;r+1<a-l&&!(s.has(`${r+1},${t.col}`)||!L(e.level,r+1,t.col));r++)o=r;return{min:d,max:o}}}const me=`<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 2.5 100 102" style="display:block;width:100%;height:100%">
  <defs>
    <radialGradient id="blush">
      <stop offset="0%"   stop-color="#FF9EB5" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#FF9EB5" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- tail (behind body) -->
  <rect x="44" y="91" width="8" height="12" rx="4" ry="4" fill="#6D91C8" stroke="#4A6FA5" stroke-width="3" />
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
`,N=`<svg xmlns="http://www.w3.org/2000/svg"
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
`,ue=`<svg xmlns="http://www.w3.org/2000/svg"
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
`;let m=56;function we(e){return me}function ve(e,n){const t=document.getElementById("game-container"),a=t.clientWidth,i=t.clientHeight;return Math.min(a/n,i/e)}function V(){return m}function ge(e,n,t,a,i){var l;m=ve(i??n,t);const s=e.querySelector("#grid");s.style.width=`${t*m}px`,s.style.height=`${n*m}px`,s.style.gridTemplateColumns=`repeat(${t}, ${m}px)`,s.style.gridTemplateRows=`repeat(${n}, ${m}px)`;const c=s._heartInterval;c!==void 0&&(clearInterval(c),delete s._heartInterval),(l=s.querySelector("#hearts-container"))==null||l.remove(),s.querySelectorAll(".cell").forEach(d=>d.remove());for(let d=0;d<n;d++)for(let o=0;o<t;o++){const r=document.createElement("div");r.dataset.row=String(d),r.dataset.col=String(o);const f=!a||a.has(`${d},${o}`)?"river":"bank",h=i!==void 0&&i<n&&(d===0||d===n-1);r.className=`cell ${f}${h?" bleed":""}`,s.appendChild(r)}}function ye(e,n){const t=e.querySelector("#grid");t.querySelectorAll(".piece").forEach(c=>c.remove());for(const c of n.logs){const l=document.createElement("div");l.className=`piece ${c.orientation==="horizontal"?"log-horizontal":"log-vertical"}`,l.dataset.id=c.id;const d=c.orientation==="horizontal"?c.length*m:m,o=c.orientation==="vertical"?c.length*m:m;l.style.left=`${c.col*m}px`,l.style.top=`${c.row*m}px`,l.style.width=`${d}px`,l.style.height=`${o}px`,l.style.zIndex="2",t.appendChild(l)}for(const c of n.hippoObstacles){const l=document.createElement("div");l.className=`piece hippo-obstacle-${c.orientation}`,l.dataset.id=c.id;const d=c.orientation==="horizontal"?2*m:m,o=c.orientation==="vertical"?2*m:m;l.style.left=`${c.col*m}px`,l.style.top=`${c.row*m}px`,l.style.width=`${d}px`,l.style.height=`${o}px`,l.style.zIndex="3";const h=(c.id.replace("obstacle-","").charCodeAt(0)-97+1)%2===0;if(c.orientation==="horizontal"){const u=h?"matrix(0,1,1,0,0,0)":"translate(200,0) rotate(90)",g=N.replace('viewBox="0 0 100 200"','viewBox="0 0 200 100"').replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/,`$1<g transform="${u}">$2</g>$3`);l.innerHTML=g}else{const u=h?N.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/,'$1<g transform="translate(0,200) scale(1,-1)">$2</g>$3'):N;l.innerHTML=u}t.appendChild(l)}for(const c of n.level.boulders??[]){const l=document.createElement("div");l.className="piece boulder",l.style.left=`${c.col*m}px`,l.style.top=`${c.row*m}px`,l.style.width=`${m}px`,l.style.height=`${m}px`,l.style.zIndex="2",t.appendChild(l)}const a=document.createElement("div");a.className="piece hippo",a.dataset.id="hippo",a.innerHTML=we(),a.style.left=`${n.hippoPos.col*m}px`,a.style.top=`${n.hippoPos.row*m}px`,a.style.width=`${m}px`,a.style.height=`${m}px`,a.style.zIndex="5",t.appendChild(a);const i=ue.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/,'$1<g transform="translate(0,200) scale(1,-1)">$2</g>$3'),s=document.createElement("div");s.className="piece mama",s.dataset.id="mama",s.innerHTML=i,s.style.left=`${n.level.mamaPos.col*m}px`,s.style.top=`${n.level.mamaPos.row*m}px`,s.style.width=`${m}px`,s.style.height=`${(n.level.mamaHeight??1)*m}px`,s.style.zIndex="4",t.appendChild(s)}function Y(e,n,t,a){const s=e.querySelector("#grid").querySelector(`[data-id="${n}"]`);s&&(s.style.left=`${a*m}px`,s.style.top=`${t*m}px`)}function q(e){const n=document.getElementById("move-count");n&&(n.textContent=String(e))}function xe(e,n){const t=e.querySelector("#win-overlay"),a=t.querySelector("#win-message");a&&(a.innerHTML=n),t.classList.add("show")}function Z(e){var n;(n=e.querySelector("#win-overlay"))==null||n.classList.remove("show")}const J=["❤️","💕","💗"];function be(e){var f;const n=e.querySelector("#grid"),t=n._heartInterval;t!==void 0&&(clearInterval(t),delete n._heartInterval),(f=n.querySelector("#hearts-container"))==null||f.remove();const a=n.querySelector('[data-id="hippo"]'),i=n.querySelector('[data-id="mama"]');if(!a||!i)return;const s=parseFloat(a.style.left)+m/2,c=parseFloat(a.style.top)+m/2,l=parseFloat(i.style.left)+m/2,d=parseFloat(i.style.top)+m/2,o=document.createElement("div");o.id="hearts-container",o.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:50;overflow:visible;",n.appendChild(o);function r(){const h=document.createElement("div");h.className="floating-heart";const u=Math.random(),g=m*.9,E=s+(l-s)*u+(Math.random()-.5)*g,A=c+(d-c)*u+(Math.random()-.5)*g*.4,P=m*(.35+Math.random()*.35),S=1.8+Math.random()*.9;h.style.left=`${E-P/2}px`,h.style.top=`${A-P/2}px`,h.style.fontSize=`${P}px`,h.style.setProperty("--dur",`${S}s`),h.textContent=J[Math.floor(Math.random()*J.length)],o.appendChild(h),h.addEventListener("animationend",()=>h.remove())}for(let h=0;h<4;h++)setTimeout(()=>r(),h*130);n._heartInterval=window.setInterval(r,360)}function $e(e){var a;const n=e.querySelector("#grid"),t=n._heartInterval;t!==void 0&&(clearInterval(t),delete n._heartInterval),(a=n.querySelector("#hearts-container"))==null||a.remove()}function z(e){return{x:e.clientX,y:e.clientY}}function k(e,n,t){return Math.max(n,Math.min(t,e))}function K(e,n,t){const a=Math.sign(n-e.hippoPos.row),i=Math.sign(t-e.hippoPos.col),s=Math.abs(n-e.hippoPos.row),c=Math.abs(t-e.hippoPos.col);if(s>=c){if(a!==0&&O(e,a,0)||i!==0&&O(e,0,i))return!0}else if(i!==0&&O(e,0,i)||a!==0&&O(e,a,0))return!0;return!1}let b=null;function Ce(e,n,t){const a=e.querySelector("#grid"),i=new AbortController,s={signal:i.signal};return a.addEventListener("pointerdown",c=>{const l=c.target.closest(".piece");if(!l)return;const d=l.dataset.id??"";if(c.preventDefault(),c.target.setPointerCapture(c.pointerId),d==="hippo"){b={kind:"hippo",startPointer:z(c),startRow:n.hippoPos.row,startCol:n.hippoPos.col};return}const o=n.logs.find(f=>f.id===d);if(o){b={kind:"log",logId:d,startPointer:z(c),startRow:o.row,startCol:o.col,range:he(n,d)};return}const r=n.hippoObstacles.find(f=>f.id===d);r&&(b={kind:"hippoObstacle",obstacleId:d,startPointer:z(c),startRow:r.row,startCol:r.col,range:fe(n,d)})},s),window.addEventListener("pointermove",c=>{if(!b)return;c.preventDefault();const l=V(),d=z(c);if(b.kind==="log"){const o=b,r=n.logs.find(g=>g.id===o.logId);if(!r)return;const f=d.x-o.startPointer.x,h=d.y-o.startPointer.y,u=e.querySelector(`[data-id="${o.logId}"]`);if(!u)return;r.orientation==="horizontal"?u.style.left=`${k(o.startCol+f/l,o.range.min,o.range.max)*l}px`:u.style.top=`${k(o.startRow+h/l,o.range.min,o.range.max)*l}px`}if(b.kind==="hippoObstacle"){const o=b,r=n.hippoObstacles.find(g=>g.id===o.obstacleId);if(!r)return;const f=d.x-o.startPointer.x,h=d.y-o.startPointer.y,u=e.querySelector(`[data-id="${o.obstacleId}"]`);if(!u)return;r.orientation==="horizontal"?u.style.left=`${k(o.startCol+f/l,o.range.min,o.range.max)*l}px`:u.style.top=`${k(o.startRow+h/l,o.range.min,o.range.max)*l}px`}if(b.kind==="hippo"){const o=b,r=d.x-o.startPointer.x,f=d.y-o.startPointer.y,h=e.querySelector('[data-id="hippo"]');if(!h)return;const{rows:u,cols:g}=n.level,E=k(Math.round(o.startRow+f/l),0,u-1),A=k(Math.round(o.startCol+r/l),0,g-1);for(;(n.hippoPos.row!==E||n.hippoPos.col!==A)&&K(n,E,A););const P=pe(n,n.hippoPos.row,n.hippoPos.col),S=de(n,n.hippoPos.row,n.hippoPos.col);h.style.left=`${k(o.startCol+r/l,P.min,P.max)*l}px`,h.style.top=`${k(o.startRow+f/l,S.min,S.max)*l}px`}},s),window.addEventListener("pointerup",c=>{if(!b)return;c.preventDefault();const l=V(),d=z(c);if(b.kind==="log"){const o=b,r=n.logs.find(f=>f.id===o.logId);if(r){const f=d.x-o.startPointer.x,h=d.y-o.startPointer.y;let u=o.startRow,g=o.startCol;r.orientation==="horizontal"?g=k(Math.round(o.startCol+f/l),o.range.min,o.range.max):u=k(Math.round(o.startRow+h/l),o.range.min,o.range.max),se(n,o.logId,u,g),Y(e,o.logId,r.row,r.col),q(n.moves)}}if(b.kind==="hippoObstacle"){const o=b,r=n.hippoObstacles.find(f=>f.id===o.obstacleId);if(r){const f=d.x-o.startPointer.x,h=d.y-o.startPointer.y;let u=o.startRow,g=o.startCol;r.orientation==="horizontal"?g=k(Math.round(o.startCol+f/l),o.range.min,o.range.max):u=k(Math.round(o.startRow+h/l),o.range.min,o.range.max),ce(n,o.obstacleId,u,g),Y(e,o.obstacleId,r.row,r.col),q(n.moves)}}if(b.kind==="hippo"){const o=b,r=d.x-o.startPointer.x,f=d.y-o.startPointer.y,{rows:h,cols:u}=n.level,g=k(Math.round(o.startRow+f/l),0,h-1),E=k(Math.round(o.startCol+r/l),0,u-1);for(;(n.hippoPos.row!==g||n.hippoPos.col!==E)&&!(!K(n,g,E)||n.won););const A=e.querySelector('[data-id="hippo"]');A&&(A.style.left=`${n.hippoPos.col*l}px`,A.style.top=`${n.hippoPos.row*l}px`),q(n.moves),ae(n)&&t()}b=null},s),()=>i.abort()}const ke=""+new URL("hippo-BWiNM3sC.mp3",import.meta.url).href,Ee=[{name:"1",csv:`,,,,~,~M,~,,,,
,,,,~,~M,~,,,,
,B,,~,~,~,~,,X,,
,B,A,~A,~A,~A,~A,A,X,,
,,,,~,~,~,,X,,
,,,,~,~,~,~,X,,
,,,,~,~,~e,~e,,,
,,,,~f,~f,~,~,,,
,,,,~,~,~,,,,
,,,C,~C,~C,~C,C,,,
,,,,~,~,~,,,,
,,,,~,~,~,,,,
,,,,~,~,~,,,,
,,,,~,~H,~,,,,`},{name:"2",csv:`,,,~,~,~M,~,,,
,,,~,~,~M,~,,,
,,,~,~,~,~,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~,~,~,,,
*,,,~,~E,~E,~E,E,*,
,,,~,~,~,~,,,
*,,,~D,~D,~D,~c,,,
,,,~,~a,~,~c,,,
,,,~H,~a,~b,~b,,,
,,,~,~,~,,,,`},{name:"3",csv:`,,,~,~M,~,,,,
,,,~,~M,~,,,,
,,,~,~,~,~,,,
,,,~,~A,~A,~A,A,,
,,,~,~,~,~,,,
,,,~,~h,~h,,,,
,,,~,~,~g,,,,
,,,~f,~f,~g,,,,
,,,~e,~,~,,,,
,,,~e,~d,~d,,,,
,,,~c,~c,~b,,,,
,,,~a,~a,~b,,,,
,,,~,~,~,,,,
,,,~,~H,~,,,,
,,,~,~,~,,,,`},{name:"4",csv:`,,,~,~,~,,,,
,~,~,~,~,~v,~,~,~,
,~,~,~,~,~v,~u,~u,~,
,~,~j,~j,~k,~k,~l,~z,~,
,~,~i,~c,~c,~d,~l,~z,~,
,~,~i,~b,~M,~d,~m,~,~,
,~,~h,~b,~M,~e,~m,~x,~y,
,~,~h,~a,~a,~e,~n,~x,~y,
,~,~g,~g,~f,~f,~n,~r,~t,
,~q,~q,~p,~p,~o,~o,~r,~t,
,~,~,~,~,~,~s,~s,~,
,~,~,~,~,~,~,~,~,
,,,~,~,~,,,,
,,,~,~H,~,,,,
,,,~,~,~,,,,`},{name:"5",csv:`,,,,,~,~M,~,,
,,,,,~,~M,~,,
,,,~,~,~,~,~,,
,,,~,,,,,,
,,~,~w,~,~,,,,
,,~,~w,~,~,,,,
,,~,~c,~c,~f,,,,
,,~a,~,~,~f,,,,
,,~a,~,~,~e,,,,
,,~n,~b,~b,~e,,,,
,,~n,~,~,~,,,,
,,~,~,~,~,,,,
,,,~,~,~,,,,
,,,~,~H,~,,,,
,,,~,~,~,,,,`},{name:"6",csv:`,,,,,,,,,,,,,,,,,~,~,~,,,,,,,,,,,,,,,,,,,,,
,~,,~,~,~,~,~,~,~,,~,~,~,~,~,~,~,~M,~,,~,~,~,,~,~,~,~,~,~,~,~,~,~,~,~,~,~,~,
,~,,~,,~,,,,~,,~,,,,,,~,~M,~,,~,,~,,~,,,,,,,,,,,,,,~,
,~,~,~,,~,,~,~,~,,~,~,~,,~,,~,~,~,,~,,~,~,~,,~,~,~,,~,~,~,,~,~,~,~,~,
,~,,,,~,,,,,,,,~,,~,,,,~,,~,,,,,,~,,,,~,,~,,~,,,,~,
,~,,~,,~,,~,~,~,~,~,,~,,~,~,~,,~,~,~,~,~,~,~,~,~,,~,~,~,,~,~,~,,~,,~,
,~,,~,,~,,~,,,,~,,~,,~,,,,,,,,,,,,,,~,,,,,,,,~,,~,
,~,,~,,~,,~,~,~,,~,,~,,~,,~,~,~,~,~,~,~,,~,~,~,~,~,,~,,~,~,~,,~,~,~,
,~,,~,,~,,,,~,,~,,~,,~,,~,,,,,,~,,~,,,,,,~,,~,,~,,~,,,
,~,~,~,,~,~,~,~,~,,~,~,~,~,~,,~,~,~,~,~,,~,~,~,,~,~,~,,~,~,~,,~,~,~,~,~,
,,,~,,,,,,,,,,,,,,~,,,,~,,,,,,~,,,,~,,,,,,,,,
,~,~,~,,~,~,~,~,~,~,~,,~,~,~,,~,~,~,,~,~,~,,~,,~,~,~,~,~,~,~,~,~,,~,~,~,
,~,,,,,,,,~,,,,~,,~,,,,,,,,~,,~,,~,,,,,,,,,,~,,~,
,~,~,~,~,~,~,~,~,~,,~,~,~,,~,~,~,~,~,,~,~,~,,~,~,~,~,~,~,~,,~,~,~,~,~,,~,
,,,,,,,~,,,,~,,,,,,,,~,,~,,,,~,,,,,,,,~,,,,,,~,
,~,~,~,~,~,,~,,~,~,~,,~,~,~,,~,~,~,,~,,~,~,~,~,~,,~,~,~,~,~,,~,~,~,,~,
,~,,,,,,~,,~,,,,~,,~,,~,,,,~,,,,,,~,,~,,,,,,~,,~,,~,
,~,~,~,~,~,~,~,,~,,~,~,~,,~,,~,,~,~,~,~,~,,~,~,~,,~,,~,~,~,,~,,~,~,~,
,~,,,,,,~,,~,,~,,,,~,,~,,,,,,~,,,,,,~,,,,~,,~,,,,~,
,~,,~,~,~,,~,,~,,~,,~,~,~,,~,,~,~,~,,~,,~,~,~,~,~,~,~,~,~,,~,~,~,,~,
,~,,~,,~,,,,~,,~,,~,,,,~,,~,,~,,~,,~,,,,,,,,~,,,,~,,,
,~,,~,,~,~,~,~,~,,~,,~,~,~,,~,~,~,,~,,~,,~,,~,~,~,~,~,,~,~,~,,~,~,~,
,~,,~,,,,~,,,,~,,,,~,,,,,,~,,~,,~,,~,,,,~,,,,,,,,~,
,~,,~,,~,~,~,,~,~,~,,~,~,~,,~,,~,~,~,,~,~,~,,~,~,~,,~,~,~,,~,~,~,~,~,
,~,,~,,,,,,~,,,,~,,,,~,,~,,,,,,,,,,~,,,,~,,~,,,,~,
,~,,~,~,~,,~,~,~,,~,~,~,,~,~,~,,~,~,~,~,~,~,~,~,~,,~,~,~,,~,,~,~,~,,~,
,~,,,,~,,~,,,,~,,,,~,,,,,,,,,,,,~,,,,~,,~,,,,~,,~,
,~,,~,,~,,~,~,~,,~,~,~,,~,~,~,~,~,~,~,,~,~,~,,~,~,~,~,~,,~,,~,~,~,,~,
,~,,~,,~,,,,~,,,,~,,,,,,~,,~,,~,,,,,,,,,,~,,~,,,,~,
,~,,~,,~,,~,~,~,,~,~,~,,~,~,~,~,~,,~,,~,,~,~,~,~,~,~,~,,~,~,~,,~,,~,
,~,,~,,~,,~,,,,~,,,,~,,,,,,~,,~,,~,,,,~,,~,,,,,,~,,~,
,~,~,~,,~,~,~,,~,~,~,,~,~,~,,~,~,~,~,~,~,~,,~,~,~,,~,,~,,~,~,~,~,~,,~,
,,,~,,,,,,~,,,,~,,,,~,,,,,,,,,,~,,~,,~,,~,,~,,,,~,
,~,,~,~,~,,~,~,~,,~,~,~,~,~,,~,,~,~,~,~,~,~,~,,~,,~,,~,,~,,~,~,~,,~,
,~,,,,~,,~,,,,,,~,,~,,,,~,,,,~,,,,~,,~,,,,~,,,,~,,~,
,~,~,~,,~,,~,~,~,~,~,,~,,~,,~,~,~,,~,,~,~,~,~,~,,~,~,~,,~,~,~,,~,~,~,
,~,,~,,~,,,,,,~,,,,~,,~,,,,~,,,,,,,,,,~,,,,~,,,,,
,~,,~,~,~,,~,~,~,,~,~,~,,~,,~,,~,~,~,~,~,,~,~,~,~,~,,~,~,~,~,~,,~,~,~,
,~,,,,,,~,,,,,,~,,~,,~,,~,,,,,,~,,~,,,,,,,,,,~,,~,
,~,~,~,~,~,~,~,,~,~,~,~,~,,~,~,~,,~,~,~,~,~,~,~,,~,~,~,~,~,,~,~,~,~,~,,~,
,~,,,,,,,,~,,,,,,~,,,,,,,,~,,,,,,,,~,,~,,,,~,,,
,~,,~,~,~,~,~,,~,,~,~,~,,~,,~,~,~,~,~,,~,~,~,,~,~,~,,~,~,~,~,~,,~,~,~,
,~,,~,,,,~,,~,,,,~,,~,,,,~,,~,,,,,,~,,~,,,,,,,,,,~,
,~,,~,,~,,~,,~,,~,~,~,,~,,~,~,~,,~,~,~,~,~,~,~,,~,~,~,~,~,,~,~,~,~,~,
,,,~,,~,,~,,~,,~,,,,~,,~,,,,,,,,,,,,,,,,~,,~,,,,~,
,~,~,~,,~,,~,,~,,~,~,~,~,~,,~,~,~,,~,,~,~,~,~,~,~,~,~,~,,~,~,~,,~,~,~,
,~,,,,~,,~,,~,,~,,,,,,,,~,,~,,~,,~,,,,,,,,,,,,~,,,
,~,~,~,,~,,~,,~,,~,~,~,~,~,~,~,~,~,,~,~,~,,~,~,~,,~,~,~,~,~,,~,~,~,,~,
,~,,~,,~,,~,,~,,,,,,,,,,,,,,,,,,~,,~,,~,,,,~,,,,~,
,~,,~,,~,~,~,~,~,,~,~,~,~,~,~,~,,~,~,~,~,~,,~,~,~,,~,,~,~,~,,~,~,~,,~,
,~,,~,,,,,,,,~,,,,,,~,,~,,,,~,,~,,~,,~,,,,~,,,,~,,~,
,~,,~,~,~,~,~,~,~,~,~,,~,~,~,~,~,,~,,~,,~,~,~,,~,,~,,~,,~,~,~,~,~,,~,
,~,,,,,,,,,,,,~,,,,,,~,,~,,,,,,~,,~,,~,,,,,,,,~,
,~,,~,~,~,,~,,~,~,~,~,~,,~,~,~,~,~,,~,~,~,~,~,~,~,,~,~,~,~,~,~,~,,~,~,~,
,~,,~,,~,,~,,~,,,,,,~,,~,,,,,,,,,,,,,,,,,,~,,~,,~,
,~,~,~,,~,,~,,~,~,~,,~,~,~,,~,~,~,,~,~,~,~,~,~,~,~,~,~,~,~,~,,~,~,~,,~,
,,,,,~,,~,,,,~,,~,,,,,,~,,~,,,,,,,,,,~,,~,,,,,,~,
,~,~,~,,~,,~,,~,~,~,,~,,~,~,~,,~,,~,,~,~,~,~,~,,~,~,~,,~,~,~,,~,,~,
,,,~,,~,,~,,~,,,,~,,~,,~,,~,,~,,~,,,,~,,~,,,,,,~,,~,,~,
,~,~,~,,~,~,~,,~,~,~,,~,~,~,,~,,~,~,~,,~,,~,~,~,,~,~,~,,~,,~,,~,,~,
,~,,,,,,~,,,,~,,,,,,~,,,,,,~,,~,,,,,,~,,~,,~,,~,,~,
,~,,~,~,~,~,~,~,~,,~,~,~,~,~,,~,,~,~,~,~,~,,~,~,~,,~,~,~,,~,,~,~,~,,~,
,~,,~,,,,,,,,,,,,~,,~,,,,~,,,,,,,,~,,,,~,,,,~,,~,
,~,~,~,~,~,,~,~,~,~,~,~,~,~,~,,~,~,~,~,~,,~,~,~,~,~,~,~,,~,~,~,~,~,~,~,,~,
,~,,,,,,~,,,,,,,,,,,,,,~,,~,,,,,,~,,,,,,~,,,,~,
,~,~,~,,~,~,~,,~,~,~,~,~,~,~,~,~,,~,~,~,,~,,~,~,~,,~,,~,~,~,,~,,~,~,~,
,~,,,,~,,,,~,,,,,,,,,,~,,,,~,,~,,~,,,,~,,~,,,,~,,,
,~,,~,~,~,,~,,~,~,~,,~,~,~,~,~,,~,~,~,,~,,~,,~,~,~,~,~,,~,~,~,~,~,,~,
,~,,~,,,,~,,~,,~,,~,,,,~,,~,~,~,,~,,~,,,,,,,,,,,,,,~,
,~,,~,,~,~,~,~,~,,~,~,~,~,~,,~,~,~,~H,~,,~,~,~,~,~,~,~,~,~,~,~,~,~,~,~,~,~,
,,,,,,,,,,,,,,,,,,,~,~,~,,,,,,,,,,,,,,,,,,,`},{name:"7",csv:`,,,,,~,~M,~,,,,,
,,,,,~,~M,~,~,~,~,~,
,,,,,,,,,,,~,
,~,~,~,~,~,~,~,~,~,~,~,
,~,,,,,,,,,,,
,~,~,~,~,~,~,~,~,~,~,~,
,,,,,,,,,,,~,
,~,~,~,~,~,~,~,~,~,~,~,
,~,,,,,,,,,,,
,~,~,~,~,~,~,~,~,~,~,~,
,,,,,,,,,,,~,
,~,~,~,~,~,~,~,~,~,~,~,
,~,,,,,,,,,,,
,~,~,~,~,~,~,~,~,~,~,~,
,,,,,,,,,,,~,
,~H,~,~,~,~,~,~,~,~,~,~,
,~,,,,,,,,,,,`},{name:"8",csv:`,,~,~,~,~,~,~,~M,~
,,~,,,,,~,~M,~
~,~,~g,~,~k,~,,~,~,~
~,~,~g,~,~k,~,,,~,
~,~d,~,~,~,~,,,~,
~,~d,~,~I,~I,~I,*,,~,
,,,~,~*,~*,,,~,
~,~,~e,~,~,~L,,,~,
~,~,~e,~,~,~L,,,~n,
~a,~C,~C,~C,~,~L,*,,~n,
~a,~,~,~h,~,~,,,~,
~,~b,~b,~h,~j,~j,,,~,
~,~,~,~,~,~,,,~,
~H,~,~,~,~,~,~,~,~,`},{name:"9",csv:`,,~,~M,~,,,
,,~f,~M,~,,,
,,~f,~,~k,,,
,,~e,~j,~k,,,
,,~e,~j,~l,,,
,,~d,~i,~l,,,
,,~d,~i,~m,,,
,,~c,~h,~m,,,
,,~c,~h,~n,,,
,,~b,~g,~n,,,
,,~b,~g,~o,,,
,,~H,~a,~o,,,
,,~,~a,~,,,`},{name:"10",csv:`,,~M,,*,
,,~M,,,*
~E,~E,~E,~A,~g,~
~I,~I,~I,~A,~g,~F
~,~,~,~A,~,~F
~D,~D,~D,~,~B,~F
~C,~C,~C,~H,~B,~j
~k,~k,~,~,~B,~j`}],F=Ee.map(({name:e,csv:n})=>re(e.toLowerCase().replace(/\s+/g,"-"),e,n));if(F.length===0)throw new Error("No levels found in levels.generated.json");const I=document.getElementById("game-container"),Ae=document.getElementById("restart-btn");let W=0,R=null;function G(e){W=e;const n=F[e];R==null||R();const t=le(n),a=document.getElementById("level-label");a&&(a.textContent=/^\d+$/.test(n.label)?`Level ${n.label}`:n.label),Z(I);const i=n.riverCells!==void 0&&n.riverCells.size===n.rows*n.cols;document.body.style.background=i?"#3a7bbf":"#4a7a30";const s=n.rows-(n.bleedTop??0)-(n.bleedBottom??0);ge(I,n.rows,n.cols,n.riverCells,s),ye(I,t),q(0),R=Ce(I,t,()=>{const c=new Audio(ke);be(I),c.play(),c.addEventListener("ended",()=>{$e(I),W+1<F.length?ee(W+1):xe(I,"You finished the game!<br>Ask your dad for more levels :)")})})}function Q(){const e=window.location.pathname.match(/\/(\d+)$/);if(e){const n=parseInt(e[1],10);if(n>=1&&n<=F.length)return n-1}return 0}function ee(e){history.pushState({levelIndex:e},"",`/${e+1}`),G(e)}window.addEventListener("popstate",e=>{var n;G(((n=e.state)==null?void 0:n.levelIndex)??Q())});Ae.addEventListener("click",()=>{Z(I),ee(0)});const _=Q();history.replaceState({levelIndex:_},"",`/${_+1}`);G(_);
