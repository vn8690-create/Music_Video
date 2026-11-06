// Mixed local image/video backgrounds. Only the selected song enters the recording audio bus.
let mediaSequence=0,mediaPreparing=false,mediaImportController=null;
function isVideoFile(file){return(file.type||'').startsWith('video/')||/\.(mp4|mov|m4v|webm)$/i.test(file.name)}
function mediaDuration(item){return item.kind==='video'?item.sceneDuration:number('#gap',8,2,120)}
function clipTime(item,age){const span=item.trimEnd-item.trimStart,safeEnd=Math.max(item.trimStart,item.trimEnd-.035),elapsed=SpeedCurve.elapsed(item,age);return Math.min(safeEnd,item.trimStart+(item.loop?elapsed%span:Math.min(span,elapsed)))}
function transitionSeconds(index){const current=((switches[index+1]??env?.n??FPS*8)-switches[index])/FPS,previous=index?(switches[index]-switches[index-1])/FPS:current;return Math.min(number('#transitionDuration',.7,.2,2.5),Math.max(.02,Math.min(current,previous)*.45))}
function mediaStatus(message){$('#mediaStatus').textContent=message;say(message)}
function captureMedia(item){if(!item.attached||item.video.readyState<2||item.video.seeking)return;item.image.getContext('2d').drawImage(item.video,0,0,item.image.width,item.image.height);item.cachedTime=item.video.currentTime}
function releaseMediaDecoder(item){
 if(!item.video||!item.attached)return;item.decodeController?.abort();item.attached=false;const video=item.video;video.pause();video.removeAttribute('src');video.load();video.remove();item.lastScene=-1;item.playPending=false;
}
function createMediaDecoder(item){
 const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.volume=0;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.preload='metadata';video.setAttribute('aria-hidden','true');$('#videoDecoders').append(video);item.video=video;
 video.addEventListener('seeked',()=>{if(item.video!==video||!item.attached)return;captureMedia(item);if(!mediaPreparing&&!loading&&(!run||run.paused))redraw()});
 video.addEventListener('error',()=>{if(item.video===video&&item.attached&&imgs.includes(item))mediaFailure(item,'Không đọc tiếp được clip')});
 return video;
}
async function attachMedia(item,signal){
 if(item.attached&&item.video?.readyState>=1)return;
 if(item.attachPending)return item.attachPending;
 const controller=new AbortController();item.decodeController=controller;
 const video=item.attached?item.video:createMediaDecoder(item);
 const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
 const operation=VideoLoader.wait(video,()=>video.readyState>=1&&Number.isFinite(video.duration)&&video.videoWidth>0,['loadedmetadata','loadeddata','canplay'],()=>{
  item.attached=true;video.preload='metadata';video.src=item.url;video.load();
 },{signal:controller.signal,timeout:60000});
 item.attachPending=operation;
 try{await operation}finally{signal?.removeEventListener('abort',cancel);if(item.attachPending===operation)item.attachPending=null}
}
async function seekMedia(item,time,signal){
 await attachMedia(item,signal);const video=item.video;
 await VideoLoader.wait(video,()=>!video.seeking&&video.readyState>=2&&Math.abs(video.currentTime-time)<.05,['loadeddata','canplay','seeked','timeupdate'],()=>{
  if(video.readyState<2||Math.abs(video.currentTime-time)>=.025)video.currentTime=time;
 },{signal:signal||item.decodeController?.signal,timeout:30000});if(item.video!==video||!item.attached)throw new DOMException('Đã đổi cảnh.','AbortError');captureMedia(item);
}
function disposeMedia(item){if(item.video){releaseMediaDecoder(item);item.video.remove()}else item.image.close?.();URL.revokeObjectURL(item.url)}
async function openVideo(file,signal){
 const url=URL.createObjectURL(file);
 const item={id:++mediaSequence,kind:'video',name:file.name,url,video:null,image:document.createElement('canvas'),loop:true,speed:1,trimStart:0,lastScene:-1,failed:false,attached:false,cachedTime:0};
 try{
  await attachMedia(item,signal);const video=item.video;if(video.duration<=.05)throw Error('Video chưa có thời lượng hợp lệ.');
  item.sourceWidth=video.videoWidth;item.sourceHeight=video.videoHeight;item.fileSize=file.size;item.duration=item.trimEnd=video.duration;item.sceneDuration=Math.min(600,video.duration);
  const maxEdge=MOBILE?960:1280,scale=Math.min(1,maxEdge/Math.max(video.videoWidth,video.videoHeight));item.image.width=Math.round(video.videoWidth*scale);item.image.height=Math.round(video.videoHeight*scale);
  mediaStatus('Đang đọc khung hình đầu: '+file.name+' · '+Math.round(item.duration/60)+' phút…');
  await seekMedia(item,0,signal);
  const thumb=document.createElement('canvas');thumb.width=160;thumb.height=Math.max(1,Math.round(160*item.image.height/item.image.width));thumb.getContext('2d').drawImage(item.image,0,0,thumb.width,thumb.height);item.poster=thumb.toDataURL('image/jpeg',.7);
  // Retain only the poster and blob URL. Do not buffer every long movie at import.
  releaseMediaDecoder(item);return item;
 }catch(error){disposeMedia(item);throw error}
}
async function addMedia(files){
 if(run||loading||starting||aiBusy())return;files=[...files];if(!files.length)return;pauseBackgroundMedia();for(const item of imgs)if(item.kind==='video')releaseMediaDecoder(item);loading=true;mediaImportController=new AbortController();const signal=mediaImportController.signal;$('#cancelMedia').hidden=false;ready();let added=0,errors=[];
 try{for(const file of files){if(signal.aborted)break;mediaStatus('Đang mở '+file.name+' · '+(file.size/1048576).toFixed(1)+' MB…');try{
  let item;if(isVideoFile(file)){if(imgs.filter(m=>m.kind==='video').length>=(MOBILE?6:12))throw Error('Đã đạt số clip cho một lượt. Hãy chia MV hoặc bớt clip.');item=await openVideo(file,signal)}
  else{const image=await openImage(file);item={id:++mediaSequence,kind:'image',image,url:URL.createObjectURL(file),name:file.name}}
  imgs.push(item);added++;
 }catch(e){if(e.name==='AbortError')break;errors.push(file.name+': '+e.message)}}thumbs();plan();redraw();mediaStatus((signal.aborted?'Đã hủy đọc. ':'')+'Đã thêm '+added+' tư liệu · '+imgs.length+' ảnh/clip.'+(errors.length?' '+errors.join(' · '):''));}
 finally{loading=false;mediaImportController=null;$('#cancelMedia').hidden=true;ready()}
}
function renderMedia(){
 const box=$('#thumbs');box.replaceChildren();imgs.forEach((item,index)=>{
  const card=document.createElement('div');card.className='media-card';const im=document.createElement('img');im.src=item.poster||item.url;im.alt=item.name;card.append(im);const name=document.createElement('strong');name.textContent=(index+1)+'. '+(item.kind==='video'?'VIDEO · ':'ẢNH · ')+item.name;card.append(name);
  const actions=document.createElement('div');actions.className='buttons';
  for(const[label,title,fn,disabled]of[['←','Đưa tư liệu '+(index+1)+' sang trái',()=>{[imgs[index-1],imgs[index]]=[imgs[index],imgs[index-1]]},index===0],['→','Đưa tư liệu '+(index+1)+' sang phải',()=>{[imgs[index+1],imgs[index]]=[imgs[index],imgs[index+1]]},index===imgs.length-1],['×','Xóa tư liệu '+(index+1),()=>{disposeMedia(item);imgs.splice(index,1)},false]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.ariaLabel=b.title=title;b.dataset.edge=String(disabled);b.disabled=disabled;b.onclick=()=>{if(run||loading||starting||aiBusy())return;pauseBackgroundMedia();fn();renderMedia();plan();redraw();ready()};actions.append(b)}card.append(actions);
  if(item.kind==='video'){
   const info=document.createElement('p');info.className='hint';info.textContent=Math.floor(item.duration/60)+':'+String(Math.floor(item.duration%60)).padStart(2,'0')+' · '+item.sourceWidth+'×'+item.sourceHeight+' · '+((item.fileSize||0)/1048576).toFixed(1)+' MB';card.append(info);
   const grid=document.createElement('div');grid.className='grid';
   for(const[key,label]of[['trimStart','Từ giây'],['trimEnd','Đến giây'],['sceneDuration','Hiện trong MV (giây)']]){const field=document.createElement('label');field.className='field';field.textContent=label;const input=document.createElement('input');input.type='number';input.min=key==='sceneDuration'?'.1':'0';input.max=String(key==='sceneDuration'?600:item.duration);input.step='.1';input.value=item[key].toFixed(2);input.dataset.mediaField=key;input.onchange=()=>{if(run||loading||starting||aiBusy()){input.value=item[key];return}const value=Number(input.value),next={...item,[key]:value};if(input.value===''||!Number.isFinite(value)||next.trimStart<0||next.trimEnd>item.duration||next.trimEnd-next.trimStart<.05||next.sceneDuration<.1||next.sceneDuration>600){input.value=item[key].toFixed(2);mediaStatus('Mốc cắt phải nằm trong clip; thời lượng hiện từ 0,1 đến 600 giây.');return}item[key]=value;item.lastScene=-1;pauseBackgroundMedia();plan();redraw();mediaStatus('Đã cập nhật đoạn clip '+item.name)};field.append(input);grid.append(field)}card.append(grid);
   renderSpeedControls(card,item);
   const check=document.createElement('label');check.className='media-loop';const input=document.createElement('input');input.type='checkbox';input.checked=item.loop;input.dataset.mediaField='loop';input.onchange=()=>{if(run||loading||starting||aiBusy())return;item.loop=input.checked;item.lastScene=-1;redraw()};check.append(input,document.createTextNode('Lặp đoạn cắt'));card.append(check);
  }box.append(card);
 });syncMediaControls();
}
function renderSpeedControls(card,item){
 const busy=()=>run||loading||starting||aiBusy();
 const field=(title,control)=>{const label=document.createElement('label');label.className='field';label.append(document.createTextNode(title),control);card.append(label);return label};
 const mode=document.createElement('select');mode.dataset.mediaField='speedMode';
 for(const[value,text]of [['constant','Tốc độ cố định'],...Object.entries(SpeedCurve.presets).map(([k,v])=>[k,v.label])]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option)}
 mode.value=item.speedMode||'constant';field('Đường cong tốc độ',mode);
 const change=(mutate,rebuild=true)=>{if(busy())return;const previous=SpeedCurve.mean(item);mutate();item.sceneDuration=Math.min(600,Math.max(.1,item.sceneDuration*previous/SpeedCurve.mean(item)));item.lastScene=-1;pauseBackgroundMedia();plan();if(rebuild)renderMedia();else card.querySelector('[data-media-field=sceneDuration]').value=item.sceneDuration.toFixed(2);redraw()};
 mode.onchange=()=>change(()=>{item.speedMode=mode.value;if(mode.value!=='constant')item.speedPoints=[...SpeedCurve.presets[mode.value].points]});
 if(mode.value==='constant'){
  const speed=document.createElement('select');speed.dataset.mediaField='speed';
  for(const rate of [.25,.5,.75,1,1.5,2,4]){const option=document.createElement('option');option.value=rate;option.textContent=rate+'×'+(rate<1?' · Slow':rate>1?' · Nhanh':' · Bình thường');speed.append(option)}speed.value=item.speed||1;
  speed.onchange=()=>change(()=>{item.speed=Number(speed.value)});field('Tốc độ clip',speed);return;
 }
 const panel=document.createElement('div');panel.className='speed-curve-panel';
 const ns='http://www.w3.org/2000/svg',graph=document.createElementNS(ns,'svg');graph.setAttribute('viewBox','0 0 280 110');graph.setAttribute('role','img');graph.classList.add('speed-curve-graph');
 const chart=()=>{
  const points=SpeedCurve.pointsFor(item),y=rate=>90-(rate-.25)/3.75*72;
  graph.setAttribute('aria-label','Đường cong tốc độ: '+points.map((v,i)=>i*25+'%: '+v.toFixed(2)+' lần').join(', '));
  graph.innerHTML='<path d="M18 18V90H262" stroke="#53616e" fill="none"/><path d="M18 '+y(1)+'H262" stroke="#53616e" stroke-dasharray="3 4" fill="none"/>';
  const path=document.createElementNS(ns,'path');path.setAttribute('d',Array.from({length:81},(_,i)=>(i?'L':'M')+(18+i/80*244).toFixed(2)+' '+y(SpeedCurve.rate(points,i/80)).toFixed(2)).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke','#a5efd4');path.setAttribute('stroke-width','2.5');graph.append(path);
  points.forEach((v,i)=>{const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',18+i*61);dot.setAttribute('cy',y(v));dot.setAttribute('r','4');dot.setAttribute('fill','#f2bc70');graph.append(dot)});
 };
 chart();panel.append(graph);
 const caption=document.createElement('p');caption.className='hint';caption.textContent='Đầu clip → cuối clip · cao = nhanh, thấp = slow';panel.append(caption);
 SpeedCurve.pointsFor(item).forEach((value,i)=>{
  const row=document.createElement('label');row.className='speed-point';const label=document.createElement('span');label.textContent=i*25+'%';const slider=document.createElement('input');slider.type='range';slider.min='.25';slider.max='4';slider.step='.05';slider.value=value;slider.dataset.speedPoint=i;slider.setAttribute('aria-label','Tốc độ tại '+i*25+'% clip');const output=document.createElement('output');output.textContent=value.toFixed(2)+'×';
  slider.oninput=()=>{if(busy())return;change(()=>{item.speedMode='custom';mode.value='custom';item.speedPoints[i]=Number(slider.value)},false);output.textContent=Number(slider.value).toFixed(2)+'×';chart()};row.append(label,slider,output);panel.append(row);
 });
 const note=document.createElement('p');note.className='hint';note.textContent='Các mốc theo % thời lượng cảnh. Chuyển tốc độ mượt; thời lượng tự điều chỉnh, nhạc và sub giữ nguyên.';panel.append(note);card.append(panel);
}
function syncMediaControls(){for(const input of document.querySelectorAll('#thumbs button,#thumbs input,#thumbs select'))input.disabled=!!run||loading||starting||aiBusy()||input.dataset.edge==='true'}
function planMedia(){
 switches=[0];if(!env)return;let frame=0,index=0;
 while(frame<env.n){const item=imgs[index%imgs.length];if(!item)break;let next=frame+Math.max(1,Math.round(mediaDuration(item)*FPS));if(item.kind!=='video'&&$('#beatCuts').checked){const limit=next+Math.round(FPS*1.5);while(next<limit&&next<env.n&&!env.kick[next])next++}if(next>=env.n)break;switches.push(next);frame=next;index++}
}
function activeMedia(time){if(!imgs.length)return[];const frame=Math.floor(time*FPS),index=search(switches,frame),entries=[{item:imgs[index%imgs.length],scene:index,age:Math.max(0,time-switches[index]/FPS),playing:!!run&&!run.paused&&!run.stopping}];
 if(imgs.length>1&&index>0&&time-switches[index]/FPS<transitionSeconds(index)&&transitionAt(index)!=='cut'){const previous=index-1;entries.push({item:imgs[previous%imgs.length],scene:previous,age:Math.max(0,(switches[index]-switches[previous])/FPS-.035),playing:false})}return entries;
}
function mediaFailure(item,message){if(item.failed)return;item.failed=true;item.video.pause();if(run?.mode==='record')pauseExport('video');else if(run)stop(false);mediaStatus(message+' · '+item.name+'. Đã dừng để tránh xuất clip bị đứng. Bấm tiếp tục để thử lại, hoặc đổi clip MP4 H.264.');}
function playMedia(item){const video=item.video;if(item.playPending||item.failed||!video.paused)return;item.playPending=video;video.play().catch(error=>{if(item.video===video&&error.name!=='AbortError'&&run&&!run.paused)mediaFailure(item,'Trình duyệt chưa phát được video')}).finally(()=>{if(item.playPending===video)item.playPending=false})}
function requestMediaFrame(entry){
 const item=entry.item;if(item.framePending||item.failed)return;
 const operation=(async()=>{
  await seekMedia(item,clipTime(item,entry.age));item.lastScene=entry.scene;
 })();item.framePending=operation;
 operation.catch(error=>{if(error.name!=='AbortError'&&imgs.includes(item))mediaFailure(item,error.message)}).finally(()=>{
  if(item.framePending===operation)item.framePending=null;
  if(imgs.includes(item)&&!run&&!loading)redraw();
 });
}
function syncBackgroundMedia(time){
 if(mediaPreparing||loading)return;
 const entry=activeMedia(time)[0],main=entry?.item;
 // Crossfades use the cached outgoing canvas. One active native decoder avoids
 // keeping two full-resolution long movies buffered on memory-limited phones.
 for(const item of imgs)if(item.kind==='video'&&item!==main)releaseMediaDecoder(item);
 if(!entry||main.kind!=='video'||main.failed)return;
 const item=main,v=item.video,target=clipTime(item,entry.age),hold=!item.loop&&SpeedCurve.elapsed(item,entry.age)>=item.trimEnd-item.trimStart;
 if(!item.attached||v.readyState<2){
  if(entry.playing||Math.abs((item.cachedTime??-1)-target)>.04)requestMediaFrame(entry);
  return;
 }
 v.muted=true;v.volume=0;const rate=SpeedCurve.at(item,entry.age);if(Math.abs(v.playbackRate-rate)>.005)v.playbackRate=rate;
 if(!v.seeking&&(item.lastScene!==entry.scene||Math.abs(v.currentTime-target)>(entry.playing?.35*Math.max(1,rate):.035))){item.lastScene=entry.scene;v.currentTime=target}
 if(entry.playing&&!hold)playMedia(item);else v.pause();captureMedia(item);
}
function pauseBackgroundMedia(){for(const item of imgs)if(item.kind==='video')item.video.pause()}
async function prepareBackgroundMedia(time){
 const entries=activeMedia(time),entry=entries[0];if(!entry||entry.item.kind!=='video')return;
 mediaPreparing=true;
 try{
  pauseBackgroundMedia();for(const item of imgs)if(item.kind==='video'&&item!==entry.item)releaseMediaDecoder(item);
  const item=entry.item;item.failed=false;await seekMedia(item,clipTime(item,entry.age));item.video.playbackRate=SpeedCurve.at(item,entry.age);item.lastScene=entry.scene;
  // Do not await video.play(): it may stay pending indefinitely while buffering.
  // The regular playback tick starts the muted video once the first frame is ready.
 }finally{mediaPreparing=false}
}
function initMedia(){
 $('#cancelMedia').onclick=()=>mediaImportController?.abort();
 $('#imageFiles').onchange=async e=>{const files=[...e.target.files];await addMedia(files);e.target.value=''};
 drop('#imageDrop',addMedia);
}
