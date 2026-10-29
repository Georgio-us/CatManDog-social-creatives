const COLORS = {ink:'#20221E',white:'#FFFFFF',surface:'#F3F3F0',lime:'#D8F36A',muted:'#75766F'};
const DEFAULTS = [
  {id:'silence',name:'Поведение кошек - вопросы',kind:'Редакционный хук',description:'Кот и пустая реплика',title:'Почему кошки\nтак делают',sub:'Разбираем кошачьи привычки вместе',palette:'base',showArt:true,showLogo:true,image:'catup'},
  {id:'comparison',name:'Корм: сравнение',kind:'Контраст',description:'Два поля и два рациона',title:'Готовый корм\nНатуральное питание',sub:'Что подходит вашему питомцу?',palette:'base',showArt:true,showLogo:true,image:'foodpair'},
  {id:'interruption',name:'Игры и активность',kind:'Движение',description:'Кот в движении',title:'Игры делают\nжизнь ярче',sub:'Активные кошки - счастливые кошки',palette:'base',showArt:true,showLogo:true,image:'play'},
  {id:'editorial',name:'Здоровье кошек',kind:'Журнал',description:'Фото и спокойная типографика',title:'Здоровье начинается\nс внимания',sub:'Регулярные осмотры, сбалансированное питание и активность помогают кошкам оставаться в хорошей форме',palette:'base',showArt:true,showLogo:true,image:'catcare'},
  {id:'object',name:'Игрушки для питомцев',kind:'Предмет',description:'Предметы крупным планом',title:'Больше поводов\nдля игр',sub:'Игрушки, которые развивают и увлекают',palette:'base',showArt:true,showLogo:true,image:'toys'},
  {id:'diagram',name:'Приветственное предложение',kind:'Промо',description:'Типографика и масштаб',title:'Добро пожаловать\nв CatManDog',sub:'Забота о питомцах начинается здесь',palette:'base',showArt:true,showLogo:true,image:'catup'}
];

const ASSETS = window.CMD_EMBEDDED_ASSETS || {
  logo:'assets/brand/CatManDog-wordmark-black-transparent.png',
  symbol:'assets/brand/CatManDog-symbol-black-transparent.png',
  catup:'assets/reference/cat-looking-up.png',
  foodpair:'assets/reference/food-compare.png',
  play:'assets/reference/cat-playing.png',
  catcare:'assets/reference/cat-care.png',
  toys:'assets/reference/toys.png'
};
document.querySelector('.brand-logo').src=ASSETS.logo;
const images = {};
const state = {font:'Manrope',format:'portrait',selected:'interruption',items:structuredClone(DEFAULTS)};
const gallery = document.getElementById('gallery');
const titleInput = document.getElementById('titleInput');
const subInput = document.getElementById('subInput');
const status = document.getElementById('saveStatus');
let statusTimer;

function loadSaved(){
  try{
    const saved=JSON.parse(localStorage.getItem('catmandog-creative-sandbox-v2'));
    if(!saved)return;
    if(['Manrope','Golos Text','Onest','Helvetica','Inter'].includes(saved.font))state.font=saved.font;
    if(['portrait','square'].includes(saved.format))state.format=saved.format;
    if(DEFAULTS.some(x=>x.id===saved.selected))state.selected=saved.selected;
    if(Array.isArray(saved.items)){
      state.items=DEFAULTS.map(base=>{
        const s=saved.items.find(x=>x.id===base.id)||{};
        return {...base,title:typeof s.title==='string'?s.title:base.title,sub:typeof s.sub==='string'?s.sub:base.sub,palette:['base','light','lime','dark'].includes(s.palette)?s.palette:'base',showArt:typeof s.showArt==='boolean'?s.showArt:base.showArt,showLogo:typeof s.showLogo==='boolean'?s.showLogo:base.showLogo};
      });
    }
  }catch(error){console.warn('Не удалось прочитать сохранённые настройки',error)}
}
function save(){
  try{
    localStorage.setItem('catmandog-creative-sandbox-v2',JSON.stringify({font:state.font,format:state.format,selected:state.selected,items:state.items.map(({id,title,sub,palette,showArt,showLogo})=>({id,title,sub,palette,showArt,showLogo}))}));
    status.textContent='Сохранено';
  }catch(error){status.textContent='Сохранение недоступно'}
  clearTimeout(statusTimer);
  statusTimer=setTimeout(()=>status.textContent='Готово к работе',2200);
}
function current(){return state.items.find(x=>x.id===state.selected)}
function scheme(item){
  const mode=item.palette==='base'?({silence:'light',interruption:'lime',comparison:'dark',editorial:'light',object:'light',diagram:'dark'}[item.id]):item.palette;
  if(mode==='dark')return {bg:COLORS.ink,fg:COLORS.white,accent:COLORS.lime,soft:COLORS.muted};
  if(mode==='lime')return {bg:COLORS.lime,fg:COLORS.ink,accent:COLORS.white,soft:COLORS.surface};
  return {bg:COLORS.white,fg:COLORS.ink,accent:COLORS.lime,soft:COLORS.surface};
}
function font(weight,size){return `${weight} ${size}px "${state.font}",Arial,sans-serif`}
function setFont(ctx,weight,size){ctx.font=font(weight,size);ctx.textBaseline='top'}
function roundedRect(ctx,x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function circle(ctx,x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function rule(ctx,x1,y1,x2,y2,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function text(ctx,value,x,y,size,weight,color,align='left'){
  ctx.save();setFont(ctx,weight,size);ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(value,x,y);ctx.restore();
}
function wrap(ctx,input,maxWidth){
  const lines=[];
  for(const paragraph of String(input).split('\n')){
    if(!paragraph.trim()){lines.push('');continue}
    let line='';
    for(const word of paragraph.trim().split(/\s+/)){
      const next=line?`${line} ${word}`:word;
      if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word}else line=next;
    }
    lines.push(line);
  }
  return lines;
}
function headline(ctx,value,x,y,maxWidth,maxLines,initial,min,color,weight=800,lineFactor=1.03,align='left'){
  let size=initial,lines=[];
  while(size>=min){setFont(ctx,weight,size);lines=wrap(ctx,value,maxWidth);if(lines.length<=maxLines&&lines.every(line=>ctx.measureText(line).width<=maxWidth))break;size-=3}
  if(lines.length>maxLines){lines=lines.slice(0,maxLines);let last=lines[maxLines-1];while(ctx.measureText(last+'…').width>maxWidth&&last.length)last=last.slice(0,-1);lines[maxLines-1]=last+'…'}
  ctx.save();setFont(ctx,weight,size);ctx.fillStyle=color;ctx.textAlign=align;
  lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*lineFactor));ctx.restore();
  return y+lines.length*size*lineFactor;
}
function caption(ctx,value,x,y,maxWidth,size,color,weight=500,maxLines=4){return headline(ctx,value,x,y,maxWidth,maxLines,size,Math.max(25,size-8),color,weight,1.27)}
function drawContain(ctx,img,x,y,w,h,filter='none'){if(!img?.complete||!img.naturalWidth)return;const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight);const iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;ctx.save();ctx.filter=filter;ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);ctx.restore()}
function drawCover(ctx,img,x,y,w,h,focusX=.5,focusY=.5,filter='none'){if(!img?.complete||!img.naturalWidth)return;const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/scale,sh=h/scale,sx=Math.max(0,Math.min(img.naturalWidth-sw,(img.naturalWidth-sw)*focusX)),sy=Math.max(0,Math.min(img.naturalHeight-sh,(img.naturalHeight-sh)*focusY));ctx.save();ctx.filter=filter;ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);ctx.restore()}
function imageFor(item){return item.customImage||images[item.image]}
function drawLogo(ctx,x,y,w,color){
  const img=images.logo;if(!img?.complete||!img.naturalWidth)return;
  const h=w*img.naturalHeight/img.naturalWidth;
  const mask=document.createElement('canvas');mask.width=Math.ceil(w);mask.height=Math.ceil(h);
  const m=mask.getContext('2d');m.drawImage(img,0,0,w,h);m.globalCompositeOperation='source-in';m.fillStyle=color;m.fillRect(0,0,w,h);ctx.drawImage(mask,x,y);
}
function defaultLogo(ctx,item,p,x=70,y=1250,w=180){if(item.showLogo)drawLogo(ctx,x,y,w,p.fg)}

function drawSilence(ctx,item,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,1080,1350);
  if(item.showLogo)drawLogo(ctx,60,54,205,p.fg);
  headline(ctx,item.title,58,162,850,4,132,82,p.fg,850,.91);
  if(item.showArt){
    ctx.save();ctx.strokeStyle=p.fg;ctx.lineWidth=8;ctx.fillStyle=p.bg;ctx.beginPath();ctx.moveTo(205,702);ctx.bezierCurveTo(208,590,302,557,442,557);ctx.lineTo(822,557);ctx.bezierCurveTo(964,557,1020,632,1020,729);ctx.lineTo(1020,868);ctx.bezierCurveTo(1020,973,935,1040,814,1040);ctx.lineTo(746,1040);ctx.lineTo(687,1120);ctx.lineTo(704,1040);ctx.lineTo(431,1040);ctx.bezierCurveTo(292,1040,205,968,205,855);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    rule(ctx,103,725,169,758,p.accent,11);rule(ctx,93,817,161,817,p.accent,11);
    rule(ctx,998,609,1048,553,p.accent,11);rule(ctx,1017,677,1070,651,p.accent,11);
    const img=imageFor(item);if(img?.naturalWidth){const h=842*img.naturalHeight/img.naturalWidth;ctx.drawImage(img,-56,770,842,h)}
  }
  caption(ctx,item.sub,790,1090,245,37,p.fg,600,4);
}

function drawInterruption(ctx,item,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,1080,1350);
  const words=item.title.replace(/\s+/g,' ').trim().split(' ');const emphasis=words.pop()||'';const main=words.join(' ');
  headline(ctx,main,62,151,800,3,141,87,p.fg,870,.96);
  if(item.showArt){
    ctx.fillStyle=p.accent;ctx.beginPath();ctx.ellipse(285,680,245,91,-.1,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=p.accent;ctx.lineWidth=13;ctx.beginPath();ctx.ellipse(284,681,253,96,-.1,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(870,1198,360,-2.55,.2);ctx.stroke();
    const img=imageFor(item);if(img?.naturalWidth){const w=740,h=w*img.naturalHeight/img.naturalWidth;ctx.drawImage(img,400,480,w,h)}
    rule(ctx,677,336,710,266,p.fg,10);rule(ctx,733,380,793,338,p.fg,10);rule(ctx,758,435,829,435,p.fg,10);
  }
  text(ctx,emphasis,115,614,126,850,p.fg);
  caption(ctx,item.sub,65,892,310,38,p.fg,650,4);
  if(item.showLogo)drawLogo(ctx,65,1260,210,p.fg);
}

function drawComparison(ctx,item,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,1080,1350);
  rule(ctx,540,0,540,1200,p.fg,2);
  if(item.showLogo)drawLogo(ctx,58,56,205,p.fg);
  const parts=item.title.split('\n');const left=parts[0]||'Готовый корм';const right=parts.slice(1).join(' ')||parts[0]||'Натуральное питание';
  headline(ctx,left,60,238,425,3,82,57,p.fg,800,1.02);
  headline(ctx,right,594,238,430,3,77,54,p.fg,800,1.02);
  if(item.showArt){
    const img=imageFor(item);if(img?.naturalWidth){
      const w=1060,h=w*img.naturalHeight/img.naturalWidth,x=10,y=508;
      ctx.drawImage(img,x,y,w,h);
      ctx.save();ctx.beginPath();ctx.rect(540,485,540,690);ctx.clip();ctx.filter='grayscale(1)';ctx.drawImage(img,x,y,w,h);ctx.restore();
    }
    circle(ctx,540,889,78,p.accent);text(ctx,'VS',540,860,51,750,p.bg,'center');
  }
  caption(ctx,'Удобство и\nсбалансированный состав',65,1030,430,32,p.fg,500,3);
  caption(ctx,'Больше контроля\nнад ингредиентами',590,1030,430,32,p.fg,500,3);
  ctx.save();ctx.strokeStyle=p.fg;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(68,1195,944,111,56);ctx.stroke();ctx.restore();
  caption(ctx,item.sub,120,1224,745,32,p.fg,550,2);
  rule(ctx,920,1250,973,1250,p.fg,3);rule(ctx,956,1236,973,1250,p.fg,3);rule(ctx,956,1264,973,1250,p.fg,3);
}

function drawEditorial(ctx,item,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,1080,1350);
  if(item.showArt){
    drawCover(ctx,imageFor(item),535,0,545,1350,.54,.5);
  }
  if(item.showLogo)drawLogo(ctx,60,57,205,p.fg);
  headline(ctx,item.title,59,202,433,5,99,59,p.fg,820,1.01);
  ctx.save();ctx.strokeStyle=p.accent;ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(60,725);ctx.quadraticCurveTo(120,711,191,719);ctx.stroke();ctx.restore();
  caption(ctx,item.sub,60,935,422,35,p.fg,500,7);
}

function drawObject(ctx,item,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,1080,1350);
  if(item.showLogo)drawLogo(ctx,58,57,205,p.fg);
  headline(ctx,item.title,58,181,650,4,106,67,p.fg,830,1.02);
  if(item.showArt){
    circle(ctx,900,890,390,p.accent);
    drawContain(ctx,imageFor(item),430,540,670,620);
    rule(ctx,660,133,711,201,p.fg,9);rule(ctx,728,112,756,193,p.fg,9);
    rule(ctx,90,787,199,759,p.accent,13);rule(ctx,91,840,212,825,p.accent,13);
  }
  caption(ctx,item.sub,58,1080,367,35,p.fg,520,5);
}

function drawDiagram(ctx,item,p){
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,1080,1350);
  if(item.showLogo)drawLogo(ctx,60,58,205,p.fg);
  const title=item.title.replace(/\s+/g,' ').trim();const marker=title.includes('CatManDog')?'CatManDog':'';const main=marker?title.replace('CatManDog','').trim():title;
  headline(ctx,main,62,203,670,4,92,58,p.fg,820,1.01);
  if(marker)text(ctx,marker,62,472,88,850,p.accent);
  caption(ctx,item.sub,768,230,235,34,p.fg,550,4);
  if(item.showArt){
    text(ctx,'10',-130,605,700,900,p.fg);
    const img=imageFor(item);if(img?.naturalWidth){ctx.save();ctx.beginPath();ctx.ellipse(820,1143,198,205,0,0,Math.PI*2);ctx.clip();const h=430*img.naturalHeight/img.naturalWidth;ctx.drawImage(img,600,948,430,h);ctx.restore()}
    rule(ctx,996,900,1025,841,p.accent,10);rule(ctx,1021,945,1073,919,p.accent,10);
  }
}

const drawFunctions={silence:drawSilence,interruption:drawInterruption,comparison:drawComparison,editorial:drawEditorial,object:drawObject,diagram:drawDiagram};
function renderBase(item){const c=document.createElement('canvas');c.width=1080;c.height=1350;const ctx=c.getContext('2d');drawFunctions[item.id](ctx,item,scheme(item));return c}
function renderTo(canvas,item){const base=renderBase(item);canvas.width=1080;canvas.height=state.format==='square'?1080:1350;const ctx=canvas.getContext('2d');if(state.format==='square')ctx.drawImage(base,0,135,1080,1080,0,0,1080,1080);else ctx.drawImage(base,0,0)}
function drawAll(){state.items.forEach(item=>{const canvas=document.querySelector(`canvas[data-id="${item.id}"]`);if(canvas)renderTo(canvas,item)})}
function buildGallery(){
  gallery.innerHTML=state.items.map((item,i)=>`<button type="button" class="concept-card ${item.id===state.selected?'is-selected':''}" data-select="${item.id}" aria-label="Выбрать вариант ${i+1}: ${item.name}"><span class="card-topline"><span class="card-number">${String(i+1).padStart(2,'0')}</span><span class="card-title">${item.name}</span><span class="card-kind">${item.kind}</span></span><span class="poster-wrap"><canvas data-id="${item.id}" width="1080" height="1350" role="img" aria-label="Превью креатива ${item.name}"></canvas></span><span class="card-description"><span>${item.description}</span><span>1080 × ${state.format==='square'?'1080':'1350'}</span></span></button>`).join('');
  gallery.querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.select)));
  drawAll();
}
function syncInspector(){
  const item=current();const index=state.items.findIndex(x=>x.id===item.id)+1;
  document.getElementById('selectedNumber').textContent=String(index).padStart(2,'0');
  document.getElementById('selectedName').textContent=item.name;
  document.getElementById('selectedDescription').textContent=item.description;
  titleInput.value=item.title;subInput.value=item.sub;
  document.getElementById('artToggle').checked=item.showArt;
  document.getElementById('logoToggle').checked=item.showLogo;
  document.getElementById('imagePreview').src=item.customImage?.src||ASSETS[item.image];
  document.querySelectorAll('[data-palette]').forEach(button=>{const active=button.dataset.palette===item.palette;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active)});
  document.querySelectorAll('[data-font]').forEach(button=>{const active=button.dataset.font===state.font;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active)});
  document.querySelectorAll('[data-format]').forEach(button=>{const active=button.dataset.format===state.format;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active)});
}
function select(id){state.selected=id;document.querySelectorAll('[data-select]').forEach(button=>button.classList.toggle('is-selected',button.dataset.select===id));syncInspector();save()}
function redrawSelected(){const item=current();const canvas=document.querySelector(`canvas[data-id="${item.id}"]`);if(canvas)renderTo(canvas,item);save()}
function bind(){
  document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>{
    const panel=button.dataset.panel;
    document.querySelectorAll('[data-panel]').forEach(tab=>{const active=tab===button;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',active)});
    document.getElementById('settingsPanel').hidden=panel!=='settings';
    document.getElementById('libraryPanel').hidden=panel!=='library';
  }));
  document.getElementById('fontButtons').addEventListener('click',async e=>{const button=e.target.closest('[data-font]');if(!button)return;state.font=button.dataset.font;syncInspector();await document.fonts.load(`800 20px "${state.font}"`);drawAll();save()});
  document.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>{state.format=button.dataset.format;buildGallery();syncInspector();save()}));
  document.getElementById('paletteButtons').addEventListener('click',e=>{const button=e.target.closest('[data-palette]');if(!button)return;current().palette=button.dataset.palette;syncInspector();redrawSelected()});
  titleInput.addEventListener('input',()=>{current().title=titleInput.value;redrawSelected()});
  subInput.addEventListener('input',()=>{current().sub=subInput.value;redrawSelected()});
  document.getElementById('artToggle').addEventListener('change',e=>{current().showArt=e.target.checked;redrawSelected()});
  document.getElementById('logoToggle').addEventListener('change',e=>{current().showLogo=e.target.checked;redrawSelected()});
  document.getElementById('imageInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const item=current();const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{item.customImage=img;item.showArt=true;syncInspector();redrawSelected()};img.src=reader.result};reader.readAsDataURL(file);e.target.value=''});
  document.getElementById('clearImageButton').addEventListener('click',()=>{delete current().customImage;current().showArt=false;syncInspector();redrawSelected()});
  document.getElementById('resetButton').addEventListener('click',()=>{const index=state.items.findIndex(x=>x.id===state.selected);state.items[index]=structuredClone(DEFAULTS[index]);syncInspector();redrawSelected()});
  document.getElementById('downloadButton').addEventListener('click',()=>{const item=current();const canvas=document.querySelector(`canvas[data-id="${item.id}"]`);const a=document.createElement('a');a.download=`catmandog-${item.id}-${state.format==='square'?'1080x1080':'1080x1350'}.png`;a.href=canvas.toDataURL('image/png');document.body.append(a);a.click();a.remove();status.textContent='PNG готов'});
}
function buildLibrary(){
  const labels={catup:'Кот и реплика',foodpair:'Два рациона',play:'Кот в игре',catcare:'Кот и забота',toys:'Игрушки'};
  const container=document.getElementById('libraryGrid');
  container.innerHTML=Object.entries(labels).map(([key,label])=>`<button class="library-item" type="button" data-library="${key}"><img src="${ASSETS[key]}" alt=""><span>${label}</span></button>`).join('');
  container.querySelectorAll('[data-library]').forEach(button=>button.addEventListener('click',()=>{
    const item=current();item.customImage=images[button.dataset.library];item.showArt=true;syncInspector();redrawSelected();
    document.querySelector('[data-panel="settings"]').click();
  }));
}
function loadImages(){return Promise.all(Object.entries(ASSETS).map(([key,src])=>new Promise(resolve=>{const img=new Image();images[key]=img;img.onload=()=>{drawAll();resolve()};img.onerror=()=>{console.warn('Изображение недоступно',src);resolve()};img.src=src})))}

loadSaved();bind();buildGallery();buildLibrary();syncInspector();
Promise.all([loadImages(),...['Manrope','Golos Text','Onest','Inter'].map(name=>document.fonts.load(`800 20px "${name}"`).catch(()=>[]))]).then(drawAll);
