const aiState={busy:false,id:0,worker:null,draft:null,timer:null,watchdog:null,wake:null,listen:null,lastMessage:'Chọn một bài nhạc ở Tư liệu để bắt đầu.',started:0};
function aiBusy(){return aiState.busy}
function aiMessage(message){aiState.lastMessage=message;$('#aiStatus').textContent=message}
function syncAIControls(){
 const select=$('#aiTrack');if(!select)return;
 const old=select.value,key=playlist.map(t=>t.id+':'+t.title).join('|');
 if(select.dataset.key!==key){select.replaceChildren();for(const track of playlist){const option=document.createElement('option');option.value=track.id;option.textContent=track.title+' · '+clock(track.duration);select.append(option)}if(playlist.some(t=>String(t.id)===old))select.value=old;select.dataset.key=key}
 const locked=aiState.busy||!!run||loading||starting;
 for(const id of ['aiTrack','aiLanguage','aiScope','aiStartAt','aiReference'])$('#'+id).disabled=locked;
 $('#aiGenerate').disabled=locked||!playlist.length||typeof Worker==='undefined';$('#aiCancel').disabled=!aiState.busy;
 const validDraft=aiState.draft&&playlist.includes(aiState.draft.track);
 for(const id of ['aiApply','aiDownload'])$('#'+id).disabled=locked||!validDraft;
 for(const input of document.querySelectorAll('#aiReview input,#aiReview textarea,#aiReview button'))input.disabled=locked;
 $('#aiReplaceNote').hidden=!validDraft;
}
function stopAIListen(){if(aiState.listen){try{aiState.listen.stop()}catch{}aiState.listen.disconnect();aiState.listen=null}}
function aiCleanup(){
 aiState.worker?.terminate();aiState.worker=null;clearInterval(aiState.timer);clearTimeout(aiState.watchdog);aiState.timer=aiState.watchdog=null;aiState.wake?.release().catch(()=>{});aiState.wake=null;aiState.busy=false;$('#aiProgress').hidden=true;ready();
}
function cancelAISubtitles(){if(!aiState.busy)return;aiState.id++;aiCleanup();aiMessage('Đã hủy AI. Nhạc và sub đang dùng vẫn giữ nguyên.')}
function aiWatchdog(id,ms){clearTimeout(aiState.watchdog);aiState.watchdog=setTimeout(()=>{if(aiState.id===id&&aiState.busy){aiState.id++;aiCleanup();aiMessage('AI chờ quá lâu. Thử lại đoạn 30 giây, kiểm tra mạng hoặc dùng file sub từ máy tính.')}},ms)}
async function generateAISubtitles(){
 if(aiState.busy||run||loading||starting)return;
 const track=playlist.find(t=>String(t.id)===$('#aiTrack').value);if(!track)return aiMessage('Thêm nhạc ở Tư liệu trước nhé.');
 const full=$('#aiScope').value==='full',start=full?0:Number($('#aiStartAt').value),end=full?track.duration:Math.min(track.duration,start+30),reference=$('#aiReference').value.trim();
 if(!Number.isFinite(start)||start<0||start>=track.duration)return aiMessage('Mốc thử phải nằm trong bài hát (tính bằng giây).');
 if(end-start>600)return aiMessage('Bản thử hỗ trợ tối đa 10 phút mỗi bài. Hãy dùng đoạn 30 giây hoặc chia bài dài.');
 if(location.protocol==='file:')return aiMessage('AI cần mở Studio bằng link HTTPS, không mở file HTML trực tiếp.');
 stopAIListen();aiState.busy=true;const id=++aiState.id;aiState.started=Date.now();ready();aiMessage('Đang chuẩn bị âm thanh cho AI…');$('#aiProgress').hidden=false;$('#aiProgress').removeAttribute('value');
 aiState.timer=setInterval(()=>{$('#aiStatus').textContent=aiState.lastMessage+' · '+Math.floor((Date.now()-aiState.started)/1000)+' giây đã chạy'+(document.hidden?' · Quay lại tab để tiếp tục.':'')},1000);
 try{
  if(navigator.wakeLock)navigator.wakeLock.request('screen').then(lock=>{if(aiState.busy&&aiState.id===id)aiState.wake=lock;else lock.release()}).catch(()=>{});
  const audio=await KaraokeAI.resample(track.buffer,start,end,()=>aiState.busy&&aiState.id===id);
  if(!aiState.busy||aiState.id!==id)return;
  const worker=aiState.worker=new Worker('./ai-subtitles-worker.js?v=5.4',{type:'module'});
  const fail=message=>{if(aiState.id!==id||!aiState.busy)return;aiCleanup();aiMessage('Chưa tạo được sub AI: '+message+'. Thử Wi-Fi, giữ tab mở và chọn đoạn 30 giây. Sub cũ vẫn giữ nguyên.')};
  worker.onerror=event=>fail(event.message||'Không tải/chạy được bộ AI trong trình duyệt');
  worker.onmessage=({data})=>{
   if(aiState.id!==id||!aiState.busy||data.id!==id)return;
   if(data.type==='status'){aiMessage(data.message);aiWatchdog(id,data.stage==='download'?180000:600000);if(Number.isFinite(data.progress))$('#aiProgress').value=data.progress;return}
   if(data.type==='error'){fail(data.message);return}
   if(data.type==='result'){
    try{
     const words=KaraokeAI.cleanWords(data.chunks,start,end);let rows=KaraokeAI.groupWords(words);
     if(!rows.length){aiCleanup();aiMessage('AI chưa nhận được lời có mốc. Hãy thử đoạn có giọng hát rõ, đổi ngôn ngữ, hoặc nhập sub đã căn. Sub cũ vẫn giữ nguyên.');return}
     if(reference)rows=KaraokeAI.alignReference(rows,reference);
     aiState.draft={track,start,end,rows,reference:!!reference};aiCleanup();renderAIReview();aiMessage('Đã tạo '+rows.length+' câu nháp cho '+track.title+'. Nghe và sửa trước khi bấm Áp dụng.'+(reference?' Mốc theo câu được ghép từ lời AI, phần tô từ là ước lượng.':''));
    }catch(error){fail(error.message)}
   }
  };
  aiWatchdog(id,180000);worker.postMessage({type:'transcribe',id,audio,language:$('#aiLanguage').value},[audio.buffer]);
 }catch(error){if(aiState.id===id&&aiState.busy){aiCleanup();aiMessage('Chưa chạy được AI: '+error.message+'. Thử đoạn 30 giây hoặc mở bằng Safari/Chrome.')}}
}
function renderAIReview(){
 const box=$('#aiReview');box.replaceChildren();const draft=aiState.draft;if(!draft)return;
 $('#aiDraftName').textContent='Bản nháp · '+draft.track.title+' · '+clock(draft.start)+'–'+clock(draft.end);
 draft.rows.forEach((row,index)=>{
  const card=document.createElement('div');card.className='ai-cue';
  const heading=document.createElement('strong');heading.textContent='Câu '+(index+1)+(row.unmatched?' · Chưa ghép được mốc':row.review?' · Kiểm tra mốc câu':' · Mốc từ AI');card.append(heading);
  const textLabel=document.createElement('label');textLabel.className='field';textLabel.textContent='Lời hát';const text=document.createElement('textarea');text.rows=2;text.value=row.text;text.maxLength=1000;text.oninput=()=>{row.text=text.value;row.words=[];row.timing='line';heading.textContent='Câu '+(index+1)+' · Đã sửa, tô từ ước lượng'};textLabel.append(text);card.append(textLabel);
  const grid=document.createElement('div');grid.className='grid';
  for(const [key,label]of[['start','Bắt đầu (giây)'],['end','Kết thúc (giây)']]){const wrap=document.createElement('label');wrap.className='field';wrap.textContent=label;const input=document.createElement('input');input.type='number';input.min='0';input.max=String(draft.track.duration);input.step='.01';input.value=Number.isFinite(row[key])?row[key].toFixed(2):'';input.oninput=()=>{row[key]=input.value===''?null:Number(input.value);row.words=[];row.timing='line';heading.textContent='Câu '+(index+1)+' · Đã sửa, tô từ ước lượng'};wrap.append(input);grid.append(wrap)}card.append(grid);
  const actions=document.createElement('div');actions.className='buttons';const listen=document.createElement('button');listen.type='button';listen.textContent='Nghe câu';listen.onclick=()=>listenAICue(row);const remove=document.createElement('button');remove.type='button';remove.textContent='Bỏ câu';remove.onclick=()=>{draft.rows.splice(index,1);renderAIReview()};actions.append(listen,remove);card.append(actions);box.append(card);
 });$('#aiDraft').hidden=false;syncAIControls();
}
async function listenAICue(row){
 const draft=aiState.draft;if(!draft||run||aiState.busy)return;const error=KaraokeAI.validateRows([row],draft.track.duration);if(error)return aiMessage(error);
 try{stopAIListen();prepareAudioImport();await AC.resume();const src=AC.createBufferSource();src.buffer=draft.track.buffer;src.connect(AC.destination);aiState.listen=src;src.onended=()=>{src.disconnect();if(aiState.listen===src)aiState.listen=null};src.start(0,Math.max(0,row.start-.2),Math.min(draft.track.duration-row.start+.2,row.end-row.start+.4));aiMessage('Đang nghe: '+row.text)}catch(e){aiMessage('Không phát được câu: '+e.message)}
}
function checkedAIDraft(){const draft=aiState.draft;if(!draft||!playlist.includes(draft.track)){aiMessage('Bài nhạc của bản nháp đã bị xóa. Hãy tạo lại.');return null}const error=KaraokeAI.validateRows(draft.rows,draft.track.duration);if(error){aiMessage(error);return null}return draft}
function applyAISubtitles(){
 if(aiState.busy||run||loading)return;const draft=checkedAIDraft();if(!draft)return;stopAIListen();
 // Materialize any album-wide subtitles first, retaining subtitles on all other tracks.
 if(playlistGlobalCues.length){for(const track of playlist)track.cues=KaraokeAI.clipRows(cues,track.start,track.start+track.duration).map(r=>({...r,start:r.start-track.start,end:r.end-track.start,words:r.words.map(w=>({...w,start:w.start-track.start,end:w.end-track.start}))}));playlistGlobalCues=[]}
 const start=Math.min(draft.start,draft.rows[0].start),end=Math.max(draft.end,draft.rows.at(-1).end),before=KaraokeAI.clipRows(draft.track.cues,0,start),after=KaraokeAI.clipRows(draft.track.cues,end,draft.track.duration);
 draft.track.cues=[...before,...structuredClone(draft.rows),...after];playlistCues();$('#lyrics').value=playlistLrc();$('#showLyrics').checked=true;renderPlaylist();updateLyricsStatus();redraw();aiMessage('Đã áp dụng sub cho '+draft.track.title+'. Bấm Xem thử để kiểm tra khớp nhạc, hoặc Tải LRC để giữ bản sub.');
}
function downloadAISubtitles(){const draft=checkedAIDraft();if(!draft)return;const content=draft.rows.map(r=>'['+lrcTime(r.start)+']'+(r.words.length?r.words.map(w=>'<'+lrcTime(w.start)+'>'+w.text+'<'+lrcTime(w.end)+'>').join(''):r.text)).join('\n'),url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=draft.track.title.replace(/[\\/:*?"<>|]/g,'_')+'-AI.lrc';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function initAISubtitles(){
 $('#aiGenerate').onclick=generateAISubtitles;$('#aiCancel').onclick=cancelAISubtitles;$('#aiApply').onclick=applyAISubtitles;$('#aiDownload').onclick=downloadAISubtitles;$('#aiStopListen').onclick=stopAIListen;
 $('#aiScope').onchange=()=>{$('#aiStartField').hidden=$('#aiScope').value==='full'};
 window.addEventListener('beforeunload',event=>{if(aiState.busy){event.preventDefault();event.returnValue=''}});syncAIControls();
}
