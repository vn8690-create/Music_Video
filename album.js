const ALBUM_THEMES={
 pearl:{bg:'#f6f4ef',ink:'#222b34',muted:'#66717b',accent:'#087f99'},
 ink:{bg:'#101c24',ink:'#f5efe5',muted:'#a2b1b9',accent:'#d6b882'},
 rose:{bg:'#f6e9e8',ink:'#563539',muted:'#987276',accent:'#b35872'}
};

function albumPhoto(context,img,x,y,w,h,scale=1){
 const ratio=Math.max(w/img.width,h/img.height)*scale,iw=img.width*ratio,ih=img.height*ratio;
 const pan=number('#albumPhotoPan',50,0,100)/100;
 context.save();context.beginPath();context.rect(x,y,w,h);context.clip();context.drawImage(img,x-(iw-w)*pan,y-(ih-h)*.34,iw,ih);context.restore();
}

function drawAlbumScene(img,index,age,amp,time){
 const G=albumGeometry(),C=albumColors(),P=albumFx(),gain=number('#strength',70,0,150)/100;
 const zoom=1+P.drift*.18*(.5+.5*Math.sin(time*.10+index)) + P.zoom*amp*gain*.28;
 cx.save();cx.fillStyle=C.bg;cx.fillRect(0,0,G.W,G.H);cx.filter=gradeFilter();
 if(G.portrait)albumPhoto(cx,img,0,0,G.W,G.A*.61,zoom);else albumPhoto(cx,img,G.W*.25,0,G.W*.75,G.A,zoom);
 cx.filter='none';
 const a=G.portrait?G.A*.38:G.W*.34,b=G.portrait?G.A*.62:G.W*.64;
 const fade=G.portrait?cx.createLinearGradient(0,a,0,b):cx.createLinearGradient(a,0,b,0);
 fade.addColorStop(0,C.bg+'00');fade.addColorStop(1,C.bg);
 if(!G.portrait){const f=cx.createLinearGradient(a,0,b,0);f.addColorStop(0,C.bg);f.addColorStop(1,C.bg+'00');cx.fillStyle=f;cx.fillRect(a,0,b-a,G.A);cx.fillStyle=C.bg;cx.fillRect(0,0,a,G.H)}
 else{cx.fillStyle=fade;cx.fillRect(0,a,G.W,b-a);cx.fillStyle=C.bg;cx.fillRect(0,b,G.W,G.H-b)}
 if(G.A<G.H){cx.fillStyle=C.bg;cx.fillRect(0,G.A,G.W,G.H-G.A)}
 // A very soft wash reacts to bass without shaking the typography or the disc.
 if(P.glow&&amp>.02){cx.fillStyle=$('#accent').value;cx.globalAlpha=Math.min(.10,P.glow*amp*gain*.12);cx.fillRect(0,0,G.W,G.A)}
 cx.restore();
}

function albumLines(text,maxWidth,font,maxLines=3){
 cx.font=font;const chunks=String(text).split(/(\s+)/),lines=[];let line='';
 for(const chunk of chunks){if(cx.measureText(line+chunk).width<=maxWidth){line+=chunk;continue}if(line.trim()){lines.push(line.trim());line=''}
  for(const char of Array.from(chunk)){if(cx.measureText(line+char).width>maxWidth&&line){lines.push(line.trim());line=''}line+=char}}
 if(line.trim())lines.push(line.trim());if(lines.length>maxLines){lines.length=maxLines;let last=lines[maxLines-1];while(last&&cx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);lines[maxLines-1]=last+'…'}return lines;
}

function drawAlbumOverlay(time,frame,amp){
 const G=albumGeometry(),C=albumColors(),S=Math.min(G.W,G.A),left=G.W*.065;

 cx.save();cx.textAlign='left';cx.textBaseline='top';
 const label=($('#albumLabel').value.trim()||'YOUR MUSIC').toUpperCase();
 cx.fillStyle=C.muted;cx.font='600 '+Math.round(S*.017)+'px "Segoe UI",sans-serif';
 cx.fillText(label,left,G.A*(G.portrait?.56:.066),G.W*(G.portrait?.47:.40));
 const title=$('#title').value.trim()||'Tên bài hát',tw=G.W*(G.portrait?.46:.42);
 let size=S*(G.portrait?.050:.055),font='500 '+size+'px Georgia,"Yu Mincho",serif';
 let lines=albumLines(title,tw,font,3);while(lines.length>=3&&size>S*.028&&cx.measureText(title).width>tw*2.7){size*=.93;font='500 '+size+'px Georgia,"Yu Mincho",serif';lines=albumLines(title,tw,font,3)}
 cx.font=font;cx.fillStyle=C.ink;const ty=G.A*(G.portrait?.605:.12);
 lines.forEach((line,i)=>cx.fillText(line,left,ty+i*size*1.16,tw));
 let y=ty+lines.length*size*1.16+S*.018;
 cx.font='500 '+Math.round(S*.023)+'px "Segoe UI",sans-serif';cx.fillStyle=C.muted;
 cx.fillText($('#albumArtist').value.trim()||'Tên nghệ sĩ',left,y,tw);
 y+=S*.041;cx.font='400 '+Math.round(S*.0165)+'px "Segoe UI",sans-serif';cx.fillText($('#albumSubtitle').value.trim()||'OFFICIAL AUDIO',left,y,tw);
 if($('#albumProgress').checked){
  const x=G.portrait?left:left,w=G.W*(G.portrait?.87:.36),y=G.A*(G.portrait?.941:.929),progress=buf?clamp(time/buf.duration):0;
  cx.strokeStyle=C.muted+'55';cx.lineWidth=Math.max(1,S*.0018);cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+w,y);cx.stroke();
  cx.strokeStyle=$('#accent').value;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+w*progress,y);cx.stroke();cx.fillStyle=$('#accent').value;cx.beginPath();cx.arc(x+w*progress,y,S*.0045,0,Math.PI*2);cx.fill();
  cx.font='500 '+Math.round(S*.016)+'px "Segoe UI",sans-serif';cx.fillStyle=C.muted;cx.fillText(clock(time),x,y+S*.016);cx.textAlign='right';cx.fillText(clock(buf?.duration),x+w,y+S*.016);
 }
 cx.restore();
}

function isAlbum(){return document.querySelector('#layoutMode')?.value==='album'}
function albumColors(){return ALBUM_THEMES[$('#albumTheme').value]||ALBUM_THEMES.pearl}
function albumGeometry(){const W=cv.width,H=cv.height,portrait=H>W*1.12,A=H*(cues.length&&$('#showLyrics').checked?.76:1);return{W,H,A,portrait}}
function albumFx(){const p=PRESETS[preset];return{drift:selectedFx.has('drift')?(p.drift||.06):0,zoom:selectedFx.has('pulse')?(p.zoom||.1):0,glow:selectedFx.has('glow')?(p.glow||.5):0}}
function albumReflow(){
 if(!isAlbum())return;const g=albumGeometry(),a=g.A/g.H;
 Object.assign(layoutState.disc,{x:g.portrait?.73:.245,y:a*(g.portrait?.73:.58),size:Math.min(g.W*.185,g.A*(g.portrait?.19:.215))*2/Math.min(g.W,g.H)});
 for(const key of ['wave','bars'])Object.assign(layoutState[key],{x:g.portrait?.5:.245,y:a*(g.portrait?.865:.84),size:g.portrait?.84:.35});
 Object.assign(layoutState.ring,{x:layoutState.disc.x,y:layoutState.disc.y,size:layoutState.disc.size*1.15});
 for(const key of ['disc','wave','bars','ring'])constrainLayer(key);renderInspector();studioStatus();redraw();
}
let albumPrevious=null;
function albumUI(){document.querySelector('#albumOptions').hidden=!isAlbum()}
function activateAlbum(){
 if(!albumPrevious)albumPrevious={layout:layoutSnapshot(),effects:[...selectedFx],preset,accent:$('#accent').value};
 preset='soft';setPresetEffects();selectedFx.add('wave');layoutState.disc.enabled=true;$('#discSpeed').value='8';$('#discSpeedValue').textContent='8 vòng/phút';
 $('#accent').value=albumColors().accent;syncEffects();albumReflow();albumUI();
}
function initAlbumStudio(){
 $('#layoutMode').onchange=()=>{if(isAlbum())activateAlbum();else{if(albumPrevious){preset=albumPrevious.preset;selectedFx.clear();for(const fx of albumPrevious.effects)selectedFx.add(fx);$('#accent').value=albumPrevious.accent;restoreLayout(albumPrevious.layout);albumPrevious=null}albumUI();redraw()}};
 $('#albumQuick').onclick=()=>{$('#layoutMode').value='album';activateAlbum();showTab('layout')};
 $('#albumTheme').onchange=()=>{$('#accent').value=albumColors().accent;redraw()};
 for(const id of ['albumArtist','albumLabel','albumSubtitle','albumPhotoPan','albumProgress'])$('#'+id).addEventListener('input',redraw);
 $('#albumReset').onclick=()=>{rememberLayout();albumReflow()};
 $('#aspect').addEventListener('change',albumReflow);
 $('#showLyrics').addEventListener('change',albumReflow);
 albumUI();
}
