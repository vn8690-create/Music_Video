// Metadata/first-frame waits must not depend on loadeddata alone (mobile data saver).
(function(root){
 function wait(video,ready,events,action,{signal,timeout=30000}={}){
  return new Promise((resolve,reject)=>{
   let timer,finished=false;
   const finish=error=>{if(finished)return;finished=true;clearTimeout(timer);for(const event of events)video.removeEventListener(event,check);video.removeEventListener('error',fail);signal?.removeEventListener('abort',cancel);error?reject(error):resolve()};
   const check=()=>{try{if(ready())finish()}catch(error){finish(error)}};
   const fail=()=>finish(Error('Không giải mã được video (mã '+(video.error?.code||'?')+'). Thử bản MP4 H.264.'));
   const cancel=()=>finish(new DOMException('Đã hủy đọc video.','AbortError'));
   if(signal?.aborted){cancel();return}
   for(const event of events)video.addEventListener(event,check);video.addEventListener('error',fail);signal?.addEventListener('abort',cancel,{once:true});
   timer=setTimeout(()=>finish(Error('Đọc video quá lâu. Hãy dùng bản MP4 H.264 nhẹ hơn hoặc thử lại.')),timeout);
   try{action?.();check()}catch(error){finish(error)}
  });
 }
 const api={wait};if(typeof module==='object'&&module.exports)module.exports=api;else root.VideoLoader=api;
})(globalThis);
