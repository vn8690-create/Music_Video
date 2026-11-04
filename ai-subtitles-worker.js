// Dedicated worker: downloaded models execute locally through single-threaded WASM.
const LIBRARY='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
let active=false;
self.onmessage=async({data})=>{
 if(active||data.type!=='transcribe')return;active=true;
 const send=(type,payload={})=>self.postMessage({id:data.id,type,...payload});
 try{
  send('status',{message:'Đang tải bộ AI (lần đầu cần mạng)…',stage:'download'});
  const {pipeline,env}=await import(LIBRARY);
  env.allowLocalModels=false;env.useBrowserCache=true;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
  const transcriber=await pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{revision:'5332fcc35e32a33b86612b9a57a89be7906102b1',device:'wasm',dtype:'q8',progress_callback:p=>{
   if(p.status==='progress')send('status',{stage:'download',message:'Tải AI · '+(p.file||'model')+' · '+Math.round(p.progress||0)+'%'});
  }});
  const audio=data.audio,rate=16000,duration=audio.length/rate,step=20,context=2,chunks=[],total=Math.ceil(duration/step);
  for(let part=0;part<total;part++){
   const start=part*step,end=Math.min(duration,start+step),left=Math.max(0,start-context),right=Math.min(duration,end+context),samples=audio.subarray(Math.floor(left*rate),Math.floor(right*rate));
   send('status',{stage:'inference',message:'Đang nghe đoạn '+(part+1)+' / '+total+' · '+Math.floor(start)+'–'+Math.ceil(end)+' giây',progress:part/total});
   let energy=0;for(let i=0;i<samples.length;i+=16)energy+=samples[i]*samples[i];
   if(Math.sqrt(energy/Math.max(1,Math.ceil(samples.length/16)))<.0005)continue;
   const options={return_timestamps:'word',task:'transcribe',max_new_tokens:256};if(data.language!=='auto')options.language=data.language;
   const output=await transcriber(samples,options);
   for(const chunk of output.chunks||[]){const [a,b]=chunk.timestamp||[];if(typeof a!=='number'||typeof b!=='number'||!Number.isFinite(a)||!Number.isFinite(b))continue;const center=left+(a+b)/2;if(center<start||center>=end)continue;chunks.push({text:chunk.text,timestamp:[Math.max(start,left+a),Math.min(end,left+b)]})}
   send('status',{stage:'inference',message:'Đã nghe '+(part+1)+' / '+total+' đoạn',progress:(part+1)/total});
  }
  send('result',{chunks});await transcriber.dispose();
 }catch(error){send('error',{message:error?.message||String(error)})}
 finally{active=false}
};
