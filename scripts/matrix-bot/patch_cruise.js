// Inject patchDashboard() into cruise.js
const fs = require('fs');
let cruise = fs.readFileSync('cruise.js', 'utf8');

// 1. Apply patchDashboard to generated HTML
cruise = cruise.replace(
  'const html = generateDashboard(data);',
  'const html = patchDashboard(generateDashboard(data));'
);

// 2. Build the patch function
const patchFn = `
// ═══════════════════════════════════════════════════════════════════
//  PATCH — Inject custom features into generated dashboard
// ═══════════════════════════════════════════════════════════════════
function patchDashboard(html) {
  // --- CSS: progress bar + image picker ---
  html = html.replace(
    '.cmd-input:focus { border-color:rgba(88,166,255,0.5); }',
    '.cmd-input:focus { border-color:rgba(88,166,255,0.5); }\\n' +
    '\\t  .cmd-progress { width:100%;height:4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:3px;margin:10px 0 6px;overflow:hidden }\\n' +
    '\\t  .cmd-progress-fill { height:100%;width:0%;background:linear-gradient(90deg,#58a6ff,#3fb950);border-radius:2px;transition:width .35s ease }\\n' +
    '\\t  .cmd-image-row { display:flex;align-items:center;gap:8px;margin-bottom:10px }\\n' +
    '\\t  .cmd-image-btn { padding:4px 10px;border:1px dashed rgba(255,255,255,0.15);border-radius:3px;color:#8b949e;font-size:9px;cursor:pointer;background:transparent;transition:all .2s }\\n' +
    '\\t  .cmd-image-btn:hover { border-color:rgba(88,166,255,0.4);color:#58a6ff }\\n' +
    '\\t  .cmd-image-btn.has-image { border-color:rgba(63,185,80,0.4);color:#3fb950;border-style:solid }\\n' +
    '\\t  .cmd-image-preview { width:32px;height:32px;border-radius:3px;object-fit:cover;display:none;border:1px solid rgba(255,255,255,0.1) }\\n' +
    '\\t  .cmd-image-preview.show { display:block }\\n' +
    '\\t  .cmd-image-remove { font-size:9px;color:#e84e4c;cursor:pointer;display:none }\\n' +
    '\\t  .cmd-image-remove.show { display:inline }\\n' +
    '\\t  .cmd-image-name { font-size:9px;color:#484f58;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:none }\\n' +
    '\\t  .cmd-image-name.show { display:block }\\n' +
    '\\t  #cmd-image-input { display:none }'
  );

  // --- CSS: add char counter color hints ---
  html = html.replace(
    '.cmd-fail { background:rgba(232,78,76,0.15);color:#e84e4c }',
    '.cmd-fail { background:rgba(232,78,76,0.15);color:#e84e4c }\\n' +
    '\\t  .cmd-char-warn { color:#d2991d } .cmd-char-over { color:#e84e4c }'
  );

  // --- HTML: image picker row + char counter after textarea ---
  html = html.replace(
    '</textarea>\\n\\t\\t  <div class=\\"cmd-platforms\\"',
    '</textarea>\\n' +
    '\\t\\t  <div class=\\"cmd-image-row\\">\\n' +
    '\\t\\t    <button class=\\"cmd-image-btn\\" id=\\"cmd-image-btn\\" onclick=\\"document.getElementById(\\\\'cmd-image-input\\\\').click()\\">🖼 添加图片</button>\\n' +
    '\\t\\t    <input type=\\"file\\" id=\\"cmd-image-input\\" accept=\\"image/*\\" onchange=\\"handleImagePick(event)\\">\\n' +
    '\\t\\t    <img class=\\"cmd-image-preview\\" id=\\"cmd-image-preview\\" />\\n' +
    '\\t\\t    <span class=\\"cmd-image-name\\" id=\\"cmd-image-name\\"></span>\\n' +
    '\\t\\t    <span class=\\"cmd-image-remove\\" id=\\"cmd-image-remove\\" onclick=\\"removeImage()\\">✕ 移除</span>\\n' +
    '\\t\\t    <span style=\\"margin-left:auto;font-size:9px;color:#484f58\\" id=\\"cmd-char-count\\"></span>\\n' +
    '\\t\\t  </div>\\n' +
    '\\t\\t  <div class=\\"cmd-platforms\\"'
  );

  // --- HTML: progress bar before cmd-results ---
  html = html.replace(
    '<div class=\\"cmd-results\\" id=\\"cmd-results\\"></div>',
    '<div class=\\"cmd-progress\\" id=\\"cmd-progress\\"><div class=\\"cmd-progress-fill\\" id=\\"cmd-progress-fill\\"></div></div>\\n' +
    '\\t\\t  <div class=\\"cmd-results\\" id=\\"cmd-results\\"></div>'
  );

  // --- JS: PLATFORM_LIMITS ---
  html = html.replace(
    'var PLATFORM_URLS = {x:',
    'var PLATFORM_LIMITS = {bluesky:300, linkedin:3000, farcaster:320, discord:2000, telegram:4096, reddit:40000, x:280, xiaohongshu:1000, threads:500, hn:2000};\\n' +
    '\\t\\tvar PLATFORM_URLS = {x:'
  );

  // --- JS: extractEN function + updated Copy/Fill ---
  html = html.replace(
    '// -- Card buttons: Copy + Fill --',
    '// -- Extract English-only text (skip [中文] section) --\\n' +
    '\\t\\tfunction extractEN(t) {\\n' +
    '\\t\\t  if (!t) return \\"\\";\\n' +
    '\\t\\t  var idx = t.indexOf(\\"[中文]\\");\\n' +
    '\\t\\t  if (idx > -1) t = t.slice(0, idx);\\n' +
    '\\t\\t  return t.replace(/^\\\\s*\\\\[English\\\\]\\\\s*/i, \\"\\").trim();\\n' +
    '\\t\\t}\\n' +
    '\\t\\t\\n' +
    '\\t\\t// -- Card buttons: Copy + Fill --'
  );
  html = html.replace('navigator.clipboard.writeText(t.trim())', 'navigator.clipboard.writeText(extractEN(t))');
  html = html.replace("document.getElementById('cmd-text').value=t.trim()", "document.getElementById('cmd-text').value=extractEN(t)");

  // --- JS: char counter ---
  html = html.replace(
    "l.querySelector('input').onchange=function(){l.classList.toggle('checked',this.checked)};",
    "l.querySelector('input').onchange=function(){l.classList.toggle('checked',this.checked)};\\n" +
    "\\t\\t\\n" +
    "\\t\\t// -- Character counter --\\n" +
    "\\t\\tfunction updateCharCount() {\\n" +
    "\\t\\t  var text = document.getElementById('cmd-text').value;\\n" +
    "\\t\\t  var len = text.length;\\n" +
    "\\t\\t  var el = document.getElementById('cmd-char-count');\\n" +
    "\\t\\t  if (!el) return;\\n" +
    "\\t\\t  var checked = document.querySelectorAll('#cmd-platforms input:checked');\\n" +
    "\\t\\t  if (!checked.length) { el.textContent = len + ' chars'; el.style.color = '#484f58'; return; }\\n" +
    "\\t\\t  var minLimit = Infinity, minP = '';\\n" +
    "\\t\\t  checked.forEach(function(c) {\\n" +
    "\\t\\t    var p = c.parentElement.getAttribute('data-p');\\n" +
    "\\t\\t    var l = PLATFORM_LIMITS[p] || Infinity;\\n" +
    "\\t\\t    if (l < minLimit) { minLimit = l; minP = p; }\\n" +
    "\\t\\t  });\\n" +
    "\\t\\t  var over = len > minLimit;\\n" +
    "\\t\\t  el.textContent = len + '/' + minLimit + (over ? ' OVER ' + minP.toUpperCase() : '') + ' chars';\\n" +
    "\\t\\t  el.style.color = over ? '#e84e4c' : len > minLimit*0.8 ? '#d2991d' : '#484f58';\\n" +
    "\\t\\t}\\n" +
    "\\t\\tdocument.getElementById('cmd-text').addEventListener('input', updateCharCount);\\n" +
    "\\t\\tdocument.querySelectorAll('#cmd-platforms input').forEach(function(c) {\\n" +
    "\\t\\t  c.addEventListener('change', updateCharCount);\\n" +
    "\\t\\t});\\n" +
    "\\t\\tupdateCharCount();"
  );

  // --- JS: image picker functions ---
  html = html.replace(
    '// -- Selector shortcuts --',
    '// -- Image Picker --\\n' +
    '\\t\\tvar selectedImage = null;\\n' +
    '\\t\\tfunction handleImagePick(e) {\\n' +
    '\\t\\t  var file = e.target.files[0];\\n' +
    '\\t\\t  if (!file) return;\\n' +
    '\\t\\t  var reader = new FileReader();\\n' +
    '\\t\\t  reader.onload = function(ev) {\\n' +
    '\\t\\t    selectedImage = ev.target.result;\\n' +
    '\\t\\t    document.getElementById(\\"cmd-image-preview\\").src = selectedImage;\\n' +
    '\\t\\t    document.getElementById(\\"cmd-image-preview\\").classList.add(\\"show\\");\\n' +
    '\\t\\t    document.getElementById(\\"cmd-image-name\\").textContent = file.name;\\n' +
    '\\t\\t    document.getElementById(\\"cmd-image-name\\").classList.add(\\"show\\");\\n' +
    '\\t\\t    document.getElementById(\\"cmd-image-remove\\").classList.add(\\"show\\");\\n' +
    '\\t\\t    document.getElementById(\\"cmd-image-btn\\").classList.add(\\"has-image\\");\\n' +
    '\\t\\t  };\\n' +
    '\\t\\t  reader.readAsDataURL(file);\\n' +
    '\\t\\t}\\n' +
    '\\t\\tfunction removeImage() {\\n' +
    '\\t\\t  selectedImage = null;\\n' +
    '\\t\\t  document.getElementById(\\"cmd-image-input\\").value = \\"\\";\\n' +
    '\\t\\t  document.getElementById(\\"cmd-image-preview\\").classList.remove(\\"show\\");\\n' +
    '\\t\\t  document.getElementById(\\"cmd-image-name\\").classList.remove(\\"show\\");\\n' +
    '\\t\\t  document.getElementById(\\"cmd-image-remove\\").classList.remove(\\"show\\");\\n' +
    '\\t\\t  document.getElementById(\\"cmd-image-btn\\").classList.remove(\\"has-image\\");\\n' +
    '\\t\\t}\\n' +
    '\\t\\t\\n' +
    '\\t\\t// -- Selector shortcuts --'
  );

  // --- JS: replace fireAll with blocking version ---
  var oldFireAll = /async function fireAll\\(\\)\\{[\\s\\S]*?\\n\\t\\t\\}/;
  var newFireAll = 'async function fireAll(){\\n' +
    '\\t\\t  var text=document.getElementById(\\"cmd-text\\").value.trim();if(!text)return alert(\\"请先输入文案\\");\\n' +
    '\\t\\t  var selected=[];document.querySelectorAll(\\"#cmd-platforms input:checked\\").forEach(function(c){selected.push(c.parentElement.getAttribute(\\"data-p\\"))});\\n' +
    '\\t\\t  if(!selected.length)return alert(\\"请选择至少一个平台\\");\\n' +
    '\\t\\t\\n' +
    '\\t\\t  // --- 字数拦截：任一平台超限则阻止发射 ---\\n' +
    '\\t\\t  var len=text.length;\\n' +
    '\\t\\t  var over=selected.filter(function(p){var lim=PLATFORM_LIMITS[p];return lim && len>lim;});\\n' +
    '\\t\\t  if(over.length){\\n' +
    '\\t\\t    var msg=over.map(function(p){return p.toUpperCase()+\\" 限 \\"+PLATFORM_LIMITS[p]+\\" 字，当前 \\"+len+\\" 字 (超 \\"+(len-PLATFORM_LIMITS[p])+\\")\\"}).join(\\"\\\\n\\");\\n' +
    '\\t\\t    alert(\\"以下平台字数超限，请删减后重试：\\\\n\\\\n\\"+msg);\\n' +
    '\\t\\t    return;\\n' +
    '\\t\\t  }\\n' +
    '\\t\\t\\n' +
    '\\t\\t  var status=document.getElementById(\\"cmd-status\\");var results=document.getElementById(\\"cmd-results\\");\\n' +
    '\\t\\t\\t  var progress=document.getElementById(\\"cmd-progress\\");var progressFill=document.getElementById(\\"cmd-progress-fill\\");\\n' +
    '\\t\\t  status.textContent=\\"发射中...\\";results.innerHTML=\\"\\";\\n' +
    '\\t\\t\\t  progressFill.style.width=\\"0%\\";\\n' +
    '\\t\\t  var ok=[],fail=[];\\n' +
    '\\t\\t  for(var i=0;i<selected.length;i++){\\n' +
    '\\t\\t    var p=selected[i];var type=PLATFORM_TYPES[p]||\\"API\\";\\n' +
    '\\t\\t    status.textContent=\\"发射中...(\\"+(i+1)+\\"/\\"+selected.length+\\") \\"+p;\\n' +
    '\\t\\t    if(type===\\"API\\"){\\n' +
    '\\t\\t      try{\\n' +
    '\\t\\t        var res=await fetch(\\"/api/matrix/publish\\",{method:\\"POST\\",headers:{\\"Content-Type\\":\\"application/json\\"},body:JSON.stringify({platform:p,content:text,title:\\"MyShape Update\\",url:\\"\\",image:selectedImage||\\"\\"})});\\n' +
    '\\t\\t        var d=await res.json();\\n' +
    '\\t\\t        var tag=document.createElement(\\"span\\");tag.className=\\"cmd-res \\"+(d.success?\\"cmd-ok\\":\\"cmd-fail\\");tag.textContent=(d.success?\\"OK\\":\\"FAIL\\")+\\" \\"+p;results.appendChild(tag);\\n' +
    '\\t\\t        if(d.success)ok.push(p);else fail.push(p+\\"(\\"+(d.error||\\"\\")+\\")\\");\\n' +
    '\\t\\t      }catch(e){\\n' +
    '\\t\\t        console.log(\\"Publish preview for \\"+p+\\":\\",text.slice(0,100));\\n' +
    '\\t\\t        var tag=document.createElement(\\"span\\");tag.className=\\"cmd-res cmd-ok\\";tag.textContent=\\"PREVIEW \\"+p;results.appendChild(tag);\\n' +
    '\\t\\t        ok.push(p);\\n' +
    '\\t\\t      }\\n' +
    '\\t\\t    } else {\\n' +
    '\\t\\t      try{await navigator.clipboard.writeText(text);if(PLATFORM_URLS[p])window.open(PLATFORM_URLS[p]+encodeURIComponent(text),\\"_blank\\");}catch(e){}\\n' +
    '\\t\\t      var tag=document.createElement(\\"span\\");tag.className=\\"cmd-res cmd-ok\\";tag.textContent=\\"LINK \\"+p;results.appendChild(tag);\\n' +
    '\\t\\t      ok.push(p);\\n' +
    '\\t\\t    }\\n' +
    '\\t\\t    await new Promise(function(r){setTimeout(r,800)});\\n' +
    '\\t\\t\\t    progressFill.style.width=((i+1)/selected.length*100)+\\"%\\";\\n' +
    '\\t\\t  }\\n' +
    '\\t\\t  progressFill.style.width=\\"100%\\";\\n' +
    '\\t\\t\\t  status.textContent=\\"完成! \\"+ok.length+\\" 成功\\"+(fail.length?\\", \\"+fail.length+\\" 失败\\":\\"\\");\\n' +
    '\\t\\t\\t  setTimeout(function(){progressFill.style.width=\\"0%\\"},1500);\\n' +
    '\\t\\t  if(fail.length)console.log(\\"Failures:\\",fail.join(\\"; \\"));\\n' +
    '\\t\\t}';
  html = html.replace(oldFireAll, newFireAll);

  return html;
}
`;

// Insert patchDashboard before main() call
cruise = cruise.replace(
  "main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });",
  patchFn + "\nmain().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });"
);

fs.writeFileSync('cruise.js', cruise, 'utf8');
console.log('cruise.js patched successfully');
