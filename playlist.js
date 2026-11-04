// Keep each decoded track once. Sources share one Web Audio clock; no giant PCM copy.
const playlist=[];
let playlistNextId=1,playlistGlobalCues=[],playlistActive=-1;
const AUDIO_MEMORY_LIMIT=(matchMedia('(pointer:coarse)').matches?256:768)*1024*1024;
function audioBytes(buffer){return buffer.length*buffer.numberOfChannels*4}
function trackAt(time){return playlist.length?playlist[search(playlist,Math.max(0,time),t=>t.start)]:null}
function displayTitle(time){const track=trackAt(time);return playlist.length>1&&$('#playlistTitles').checked?track.title:$('#title').value.trim()}
function trackClock(time){const track=trackAt(time);return track&&playlist.length>1?{time:clamp(time-track.start,0,track.duration),duration:track.duration}:{time,duration:buf?.duration||0}}
function playlistControls(){const locked=!!run||loading||starting||aiBusy();for(const button of document.querySelectorAll('#playlist button,#playlist input'))button.disabled=locked||button.dataset.edge==='true';$('#clearPlaylist').disabled=locked||!playlist.length}
function playlistNow(time){const track=trackAt(time),index=track?playlist.indexOf(track):-1;if(index!==playlistActive){playlistActive=index;for(const row of document.querySelectorAll('#playlist .track-row'))row.classList.toggle('is-playing',Number(row.dataset.track)===track?.id)}
 $('#playlistNow').textContent=track?(index+1)+' / '+playlist.length+' · '+track.title:'';
 if(playlist.length>1&&$('#playlistTitles').checked)$('#projectName').textContent=track?.title||'Album mới';
}
function shiftTrackCues(track){return(track.cues||[]).filter(c=>c.start<track.duration&&c.end>0).map(c=>({
 ...c,start:track.start+Math.max(0,c.start),end:track.start+Math.min(track.duration,c.end),
 words:c.words.filter(w=>w.start<track.duration&&w.end>0).map(w=>({...w,start:track.start+Math.max(0,w.start),end:track.start+Math.min(track.duration,w.end)}))
})).filter(c=>c.end>c.start)}
function playlistCues(){cues=[...playlistGlobalCues,...playlist.flatMap(shiftTrackCues)].sort((a,b)=>a.start-b.start);tapLines=[];tapTimes=[];$('#tapStatus').textContent='Chưa có danh sách câu.';updateLyricsStatus()}
function playlistLrc(){return cues.map(c=>'['+lrcTime(c.start)+']'+(c.words.length?c.words.map(w=>'<'+lrcTime(w.start)+'>'+w.text+'<'+lrcTime(w.end)+'>').join(''):c.text)).join('\n')}
function captureSingleSub(){if(playlist.length===1&&cues.length&&!playlist[0].cues.length){playlist[0].cues=structuredClone(cues);playlistGlobalCues=[]}}
function clearGlobalTiming(){const had=playlistGlobalCues.length>0||tapTimes.length>0;playlistGlobalCues=[];tapLines=[];tapTimes=[];return had}
function adoptedAlbumLyrics(){playlistGlobalCues=structuredClone(cues);for(const track of playlist)track.cues=[];renderPlaylist()}
function buildPlaylist(){
 let duration=0;for(const track of playlist){track.start=duration;duration+=track.duration}
 if(!playlist.length){buf=env=null;position=0;$('#audioName').textContent='Chưa chọn nhạc';return}
 // A virtual buffer holds only duration. sourceAt schedules the real track buffers.
 buf={duration};const n=Math.max(1,Math.ceil(duration*FPS)),keys=['lo','mi','hi','pulse','kick'];env={n,drops:[]};
 for(const key of keys)env[key]=key==='kick'?new Uint8Array(n):new Float32Array(n);
 let ti=0;for(let i=0;i<n;i++){const time=i/FPS;while(ti+1<playlist.length&&time>=playlist[ti+1].start)ti++;const track=playlist[ti],j=clamp(Math.floor((time-track.start)*FPS),0,track.env.n-1);for(const key of keys)env[key][i]=track.env[key][j]}
 for(const track of playlist)for(const drop of track.env.drops)env.drops.push(Math.round(track.start*FPS)+drop);
 position=0;playlistActive=-1;const mb=playlist.reduce((sum,t)=>sum+audioBytes(t.buffer),0)/1048576;
 $('#audioName').textContent=playlist.length+' bài · '+clock(duration)+' · '+Math.round(mb)+' MB âm thanh đã giải mã';
}
function renderPlaylist(){
 const box=$('#playlist');box.replaceChildren();playlistActive=-1;playlist.forEach((track,index)=>{
  const row=document.createElement('div');row.className='track-row';row.setAttribute('role','listitem');row.dataset.track=track.id;
  const number=document.createElement('span');number.className='track-number';number.textContent=String(index+1).padStart(2,'0');
  const info=document.createElement('div');info.className='track-info';const title=document.createElement('strong');title.textContent=track.title;title.title=track.name;const meta=document.createElement('small');meta.textContent=clock(track.duration)+' · bắt đầu '+clock(track.start)+(track.cues.length?' · '+track.cues.length+' câu sub':'');info.append(title,meta);
  const actions=document.createElement('div');actions.className='track-actions';
  for(const[text,label,fn,disabled]of[
   ['▶','Nghe bài '+(index+1),()=>{position=track.start;updateClock(position);redraw();if(imgs.length)start(false);else say('Thêm ít nhất một ảnh để xem thử video.')},false],
   ['↑','Đưa bài '+(index+1)+' lên',()=>moveTrack(index,-1),index===0],
   ['↓','Đưa bài '+(index+1)+' xuống',()=>moveTrack(index,1),index===playlist.length-1],
   ['×','Xóa bài '+(index+1),()=>{captureSingleSub();const cleared=clearGlobalTiming();playlist.splice(index,1);refreshPlaylistTimeline(cleared)},false]
  ]){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=b.ariaLabel=label;b.onclick=()=>{if(aiBusy()||run||loading)return;fn()};b.dataset.edge=String(disabled);b.disabled=disabled;actions.append(b)}
  const sub=document.createElement('button');sub.type='button';sub.textContent=track.cues.length?'Đổi sub':'Thêm sub';sub.className='track-sub';sub.ariaLabel='Phụ đề bài '+(index+1);
  const picker=document.createElement('input');picker.type='file';picker.accept='.ass,.ssa,.lrc,.srt,.vtt';picker.hidden=true;picker.ariaLabel='Chọn phụ đề bài '+(index+1);sub.onclick=()=>picker.click();picker.onchange=async()=>{const file=picker.files[0];picker.value='';if(!file||run||loading)return;try{const rows=parseLyrics(await file.text(),track.duration);if(aiBusy()||run||loading||!playlist.includes(track))return;if(!rows.length)throw Error('File chưa có mốc thời gian. Dùng ASS/LRC/SRT đã căn.');const cleared=clearGlobalTiming();track.cues=rows;playlistCues();$('#lyrics').value=playlistLrc();renderPlaylist();redraw();say('Đã gắn sub cho '+track.title+'. Mốc bài tự dời theo thứ tự album.'+(cleared?' Đã thay sub toàn album.':''))}catch(e){say('Không đọc được sub: '+e.message)}};
  info.append(sub,picker);row.append(number,info,actions);box.append(row);
 });playlistNow(position);playlistControls();
}
function refreshPlaylistTimeline(cleared=false){buildPlaylist();playlistCues();$('#lyrics').value=playlistLrc();plan();renderPlaylist();ready();redraw();updateClock(0);say('Đã cập nhật '+playlist.length+' bài.'+(cleared?' Sub toàn album cần nhập lại vì thứ tự/thời lượng đã đổi. Sub gắn từng bài vẫn giữ đúng mốc.':''))}
function moveTrack(index,delta){if(aiBusy()||run||loading||!playlist[index+delta])return;captureSingleSub();const cleared=clearGlobalTiming();[playlist[index],playlist[index+delta]]=[playlist[index+delta],playlist[index]];refreshPlaylistTimeline(cleared)}
function importStatus(text,state='busy'){
 const status=$('#audioImportStatus');status.hidden=false;status.textContent=text;status.dataset.state=state;status.setAttribute('aria-busy',String(state==='busy'));say(text);
}
function prepareAudioImport(){
 if(!AudioCtx)throw Error('Trình duyệt thiếu Web Audio. Hãy mở bằng Safari hoặc Chrome.');
 if(!AC||AC.state==='closed')AC=new AudioCtx();
 AC.onstatechange=()=>{if(run?.mode==='record'&&!run.stopping&&!run.paused&&AC.state!=='running')pauseExport('audio')};
 // Resume directly in the picker/change gesture; never wait for autoplay permission to decode.
 if(AC.state!=='running')AC.resume().catch(()=>{});
}
function audioTask(promise,ms,message){return new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(Error(message)),ms);
 Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
})}
async function basicAudioEnvelope(decoded){
 const n=Math.max(1,Math.ceil(decoded.duration*FPS)),values=new Float32Array(n),channels=Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i));
 for(let frame=0;frame<n;frame++){
  const begin=Math.floor(frame*decoded.sampleRate/FPS),end=Math.min(decoded.length,Math.floor((frame+1)*decoded.sampleRate/FPS)),step=Math.max(1,Math.floor((end-begin)/64));let sum=0,count=0;
  for(let i=begin;i<end;i+=step)for(const channel of channels){sum+=channel[i]*channel[i];count++}values[frame]=Math.sqrt(sum/Math.max(1,count));
  if(frame%600===599)await new Promise(resolve=>setTimeout(resolve,0));
 }
 const levels=normalize(values);return buildAudioEnvelope([levels,levels,levels],n);
}
async function addSongs(files){
 if(aiBusy()||run||loading)return;
 files=Array.from(files||[]);if(!files.length)return;
 const initial=playlist.length;captureSingleSub();loading=true;ready();let added=0,failures=[],basicUsed=false;let memory=playlist.reduce((n,t)=>n+audioBytes(t.buffer),0);
 importStatus('Đã nhận '+files.length+' file. Đang chuẩn bị đọc nhạc…');
 try{
  prepareAudioImport();
  for(let i=0;i<files.length;i++){
   const file=files[i],prefix=(i+1)+' / '+files.length+' · '+file.name;
   try{
    if(!(file.type||'').startsWith('audio/')&&!/\.(wav|wave|mp3|m4a|flac|ogg|aac|aif|aiff|opus|mp4|webm|weba)$/i.test(file.name.trim()))throw Error('Chưa nhận ra định dạng nhạc. Hãy chọn MP3, WAV hoặc M4A.');
    if(!file.size)throw Error('File rỗng. Hãy tải đầy đủ file về ứng dụng Tệp rồi chọn lại.');
    importStatus('Đang đọc file '+prefix);
    const data=await audioTask(file.arrayBuffer(),60000,'Chưa đọc được file. Nếu file ở iCloud/Drive, hãy tải về máy trong ứng dụng Tệp rồi chọn lại.');
    importStatus('Đang giải mã '+prefix);
    let decoded;try{decoded=await audioTask(AC.decodeAudioData(data),60000,'Giải mã quá lâu. Thử một bản MP3 hoặc WAV ngắn hơn.')}catch(e){throw Error(e.name==='EncodingError'||e.name==='NotSupportedError'?'Trình duyệt không giải mã được file này. Hãy xuất lại thành MP3/WAV; chỉ đổi đuôi file sẽ không đủ.':e.message)}
    const bytes=audioBytes(decoded);if(memory+bytes>AUDIO_MEMORY_LIMIT){decoded=null;failures.push('Album vượt bộ nhớ âm thanh của trình duyệt; hãy chia thành vài video nhỏ hơn.');break}
    importStatus('Đang phân tích nhịp '+prefix);
    let features;try{if(!OfflineCtx||basicUsed)throw Error('Use volume analysis');features=await audioTask(analyzeAudio(decoded),20000,'Phân tích nhịp quá lâu')}catch{
     basicUsed=true;importStatus('Đang phân tích âm lượng '+prefix);features=await basicAudioEnvelope(decoded);
    }
    playlist.push({id:playlistNextId++,name:file.name,title:file.name.replace(/\.[^.]+$/,''),buffer:decoded,duration:decoded.duration,env:features,cues:[],start:0});memory+=bytes;added++;
    // Show each successful song immediately, even while subsequent files are loading.
    let offset=0;for(const track of playlist){track.start=offset;offset+=track.duration}renderPlaylist();
   }catch(e){failures.push(file.name+': '+e.message)}
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(added){const cleared=clearGlobalTiming();buildPlaylist();if(!initial&&playlist.length===1&&$('#lyrics').value.trim())playlistGlobalCues=parseLyrics($('#lyrics').value,buf.duration);playlistCues();plan();renderPlaylist();updateClock(0);redraw();importStatus('Đã thêm '+added+' bài · tổng '+playlist.length+' bài, '+clock(buf.duration)+'.'+(cleared?' Sub toàn album cần nhập lại.':'')+(basicUsed?' Hiệu ứng đang dùng nhịp theo âm lượng.':'')+(failures.length?' '+failures.join(' · '):''),failures.length?'warning':'success')}
  else importStatus(failures.join(' · ')||'Không thêm được bài mới.','error');
 }catch(e){importStatus('Không đọc được nhạc: '+e.message,'error')}
 finally{loading=false;ready();renderPlaylist()}
}
function playlistSourceAt(offset){
 const nodes=[],when=AC.currentTime;
 try{for(const track of playlist){if(track.start+track.duration<=offset)continue;const src=AC.createBufferSource();src.buffer=track.buffer;src.connect(AC.destination);if(run?.dest)src.connect(run.dest);nodes.push(src);src.start(when+Math.max(0,track.start-offset),Math.max(0,offset-track.start))}}
 catch(error){for(const src of nodes){try{src.stop()}catch{}src.disconnect()}throw error}
 return{nodes,stop(){for(const src of nodes)try{src.stop()}catch{}},disconnect(){for(const src of nodes)try{src.disconnect()}catch{}}};
}
function initPlaylist(){
 $('#audioFile').onclick=e=>{if(aiBusy()||run||loading)return;e.target.value='';try{prepareAudioImport()}catch(error){importStatus(error.message,'error')}};
 $('#audioFile').onchange=e=>{const files=[...e.target.files];addSongs(files)};
 drop('#audioDrop',addSongs);
 $('#clearPlaylist').onclick=()=>{if(aiBusy()||run||loading)return;playlist.length=0;clearGlobalTiming();refreshPlaylistTimeline();$('#audioImportStatus').hidden=true};
 $('#playlistTitles').oninput=()=>{playlistActive=-1;studioStatus();playlistNow(currentTime());redraw()};
 renderPlaylist();
}

