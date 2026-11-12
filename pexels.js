// Bring-your-own-key: never persist or send the key anywhere except the Pexels API.
const pexelsState={results:[],selected:new Set(),controller:null,busy:false,cache:new Map()};
function pexelsMessage(text){$('#pexelsStatus').textContent=text}
function syncPexelsControls(){const locked=!!run||loading||starting||aiBusy();for(const el of document.querySelectorAll('[data-pexels-control]'))el.disabled=locked||pexelsState.busy;$('#pexelsImport').disabled=locked||pexelsState.busy||!pexelsState.selected.size;$('#pexelsCredits').disabled=!imgs.some(i=>i.pexels)}
function pexelsError(error){if(error.name==='AbortError')return 'Đã hủy thao tác. Các tư liệu đã thêm vẫn được giữ.';return error.message||'Không kết nối được. Kiểm tra mạng và thử lại.'}
async function searchPexels(){return searchPexelsQueries([$('#pexelsQuery').value.trim()])}
async function fetchPexelsResults(query,key,orientation,height,signal){
 const cacheId=JSON.stringify([key,query,orientation,height]);let results=pexelsState.cache.get(cacheId);if(results)return results;
 const params=new URLSearchParams({query,orientation,per_page:'24',locale:'en-US'});const response=await fetch('https://api.pexels.com/v1/videos/search?'+params,{headers:{Authorization:key},signal,credentials:'omit',cache:'no-store',redirect:'error'});
 if(!response.ok)throw Error(response.status===401?'API key chưa hợp lệ. Kiểm tra lại key.':response.status===429?'Đã hết lượt API tạm thời. Chờ rồi thử lại.':response.status===403?'Pexels từ chối yêu cầu. Kiểm tra quyền của key.':'Pexels trả lỗi '+response.status+'. Hãy thử lại sau.');
 const data=await response.json();if(!Array.isArray(data.videos))throw Error('Dữ liệu Pexels không hợp lệ.');results=data.videos.map(v=>PexelsCore.normalize(v,height)).filter(Boolean);if(pexelsState.cache.size>=8)pexelsState.cache.delete(pexelsState.cache.keys().next().value);pexelsState.cache.set(cacheId,results);
 const remaining=response.headers.get('X-Ratelimit-Remaining');$('#pexelsQuota').textContent=remaining===null?'':'Còn '+remaining+' lượt API trong kỳ hiện tại.';return results;
}
async function searchPexelsQueries(queries){
 if(pexelsState.busy||run||loading||starting||aiBusy())return;
 queries=[...new Set(queries.map(q=>String(q).trim().slice(0,100)).filter(Boolean))].slice(0,3);
 const key=$('#pexelsKey').value.trim();if(!key||!queries.length){pexelsMessage('Nhập API key và chủ đề để tìm video.');return}
 const orientation=$('#pexelsOrientation').value,height=Number($('#pexelsResolution').value);
 pexelsState.busy=true;const controller=pexelsState.controller=new AbortController();$('#cancelPexels').hidden=false;syncPexelsControls();const groups=[];let issue='';
 try{
  for(const [index,query]of queries.entries()){
   if(controller.signal.aborted)break;pexelsMessage('Đang tìm '+(index+1)+'/'+queries.length+': '+query+'…');const timeout=setTimeout(()=>controller.abort(),25000);
   try{groups.push(await fetchPexelsResults(query,key,orientation,height,controller.signal))}catch(error){issue=pexelsError(error);break}finally{clearTimeout(timeout)}
  }
  if(groups.length){
   // Interleave themes so auto-selection isn't dominated by the first search.
   const merged=[],seen=new Set();for(let i=0;i<24;i++)for(const group of groups){const video=group[i];if(video&&!seen.has(video.id)){seen.add(video.id);merged.push(video)}}
   pexelsState.results=merged.slice(0,48);pexelsState.selected.clear();renderPexels();
   pexelsMessage((merged.length?'Tìm thấy '+pexelsState.results.length+' clip từ '+groups.length+' chủ đề. Xem trước, tự chọn cảnh rồi thêm vào MV.':'Chưa có clip phù hợp. Sửa từ khóa hoặc chọn phong cách khác.')+(issue?' '+issue:''));
  }else pexelsMessage(issue||'Đã hủy tìm kiếm.');
 }finally{pexelsState.busy=false;pexelsState.controller=null;$('#cancelPexels').hidden=true;syncPexelsControls()}
}

function renderPexels(){
 const grid=$('#pexelsResults');grid.replaceChildren();
 for(const video of pexelsState.results){const card=document.createElement('article');card.className='stock-card';card.classList.toggle('is-selected',pexelsState.selected.has(video.id));const label=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.checked=pexelsState.selected.has(video.id);check.dataset.pexelsControl='';check.ariaLabel='Chọn clip '+video.id;check.onchange=()=>{if(check.checked)pexelsState.selected.add(video.id);else pexelsState.selected.delete(video.id);card.classList.toggle('is-selected',check.checked);syncPexelsControls()};const im=document.createElement('img');im.loading='lazy';if(video.poster)im.src=video.poster;im.alt='Video của '+video.author;const tag=document.createElement('span');tag.textContent=Math.round(video.duration)+'s · '+video.width+'×'+video.height;label.append(im,check,tag);card.append(label);
 const author=document.createElement('a');author.textContent=video.author;author.href=video.url||'https://www.pexels.com';author.target='_blank';author.rel='noopener noreferrer';card.append(author);const preview=document.createElement('button');preview.type='button';preview.textContent='▷ Xem clip';preview.dataset.pexelsControl='';preview.onclick=()=>previewPexels(video);card.append(preview);grid.append(card)
 }syncPexelsControls();
}
function previewPexels(video){const dialog=$('#pexelsPreview'),player=$('#pexelsPlayer');player.src=video.link;$('#pexelsPreviewTitle').textContent=video.author+' · '+Math.round(video.duration)+' giây';dialog.showModal()}
async function downloadPexels(video,signal,budget){
 const response=await fetch(video.link,{signal,credentials:'omit',redirect:'error'});if(!response.ok)throw Error('Không tải được clip '+video.id+' ('+response.status+').');
 const declared=Number(response.headers.get('Content-Length'));if(declared>budget)throw Error('Clip quá lớn. Chọn HD 720p hoặc clip khác.');if(!response.body)throw Error('Trình duyệt không hỗ trợ tải clip an toàn.');
 const reader=response.body.getReader(),chunks=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>budget){await reader.cancel();throw Error('Clip vượt giới hạn bộ nhớ. Chọn HD 720p hoặc clip ngắn hơn.')}chunks.push(value)}}finally{reader.releaseLock()}
 if(!size)throw Error('Clip tải về trống.');return new File(chunks,'pexels-'+video.id+'.mp4',{type:'video/mp4'});
}
async function importPexels(){
 if(run||loading||starting||aiBusy()||pexelsState.busy)return;
 const cap=(MOBILE?6:12)-imgs.filter(i=>i.kind==='video').length;
 const selected=PexelsCore.choose(pexelsState.results.filter(v=>pexelsState.selected.has(v.id)),cap,imgs.filter(i=>i.pexels).map(i=>i.pexels.id));
 if(!selected.length){pexelsMessage(cap<=0?'Đã đạt giới hạn clip. Xóa bớt clip hoặc chia MV.':'Các clip đã có trong MV. Chọn clip khác.');return}
 pauseBackgroundMedia();for(const item of imgs)if(item.kind==='video')releaseMediaDecoder(item);
 loading=true;pexelsState.busy=true;const controller=pexelsState.controller=new AbortController();$('#cancelPexels').hidden=false;ready();let count=0,total=0;const errors=[];
 try{for(const video of selected){if(controller.signal.aborted)break;const timeout=setTimeout(()=>controller.abort(),90000);try{
   pexelsMessage('Đang tải clip '+(count+1)+'/'+selected.length+' · '+video.author+'…');const limit=Math.min((MOBILE?50:120)*1048576,(MOBILE?120:360)*1048576-total);if(limit<=0)throw Error('Đã đạt giới hạn tải cho lượt này. Chia thành MV nhỏ hơn.');
   const file=await downloadPexels(video,controller.signal,limit);const item=await openVideo(file,controller.signal);total+=file.size;item.pexels={id:video.id,url:video.url,author:video.author,authorUrl:video.authorUrl};item.sceneDuration=Math.min(Number($('#pexelsSeconds').value)||8,item.duration);item.trimEnd=Math.min(item.duration,item.sceneDuration);imgs.push(item);count++;pexelsState.selected.delete(video.id);
  }catch(error){if(error.name==='AbortError')break;errors.push(error.message)}finally{clearTimeout(timeout)}}
  thumbs();plan();redraw();renderPexels();pexelsMessage((controller.signal.aborted?'Đã hủy. ':'')+'Đã thêm '+count+' clip vào Tư liệu.'+(errors.length?' '+errors.join(' '):' Có thể đổi thứ tự, cắt đoạn và phối hiệu ứng như clip trên máy.'));
 }finally{loading=false;pexelsState.busy=false;pexelsState.controller=null;$('#cancelPexels').hidden=true;ready()}
}
function initPexels(){
 $('#pexelsSearch').onclick=searchPexels;$('#pexelsQuery').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();searchPexels()}};
 $('#pexelsClearKey').onclick=()=>{$('#pexelsKey').value='';pexelsState.cache.clear();$('#pexelsQuota').textContent='';pexelsMessage('Đã xóa key khỏi phiên này.')};
 $('#cancelPexels').onclick=()=>pexelsState.controller?.abort();$('#pexelsImport').onclick=importPexels;
 $('#pexelsAuto').onclick=()=>{const cap=(MOBILE?6:12)-imgs.filter(i=>i.kind==='video').length;const picked=PexelsCore.choose(pexelsState.results,Math.min(cap,Number($('#pexelsCount').value)),imgs.filter(i=>i.pexels).map(i=>i.pexels.id));pexelsState.selected=new Set(picked.map(v=>v.id));renderPexels();pexelsMessage('Đã chọn '+picked.length+' cảnh theo kết quả tìm kiếm. Bấm “Thêm vào MV” để tải.');};
 for(const chip of document.querySelectorAll('[data-stock-query]'))chip.onclick=()=>{$('#pexelsQuery').value=chip.dataset.stockQuery};
 $('#openPexels').onclick=()=>showTab('pexels');$('#pexelsPreviewClose').onclick=()=>$('#pexelsPreview').close();$('#pexelsPreview').addEventListener('close',()=>{const video=$('#pexelsPlayer');video.pause();video.removeAttribute('src');video.load()});
 $('#pexelsCredits').onclick=()=>{const url=URL.createObjectURL(new Blob([PexelsCore.credits(imgs)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='nguon-video-pexels.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};syncPexelsControls();
}
