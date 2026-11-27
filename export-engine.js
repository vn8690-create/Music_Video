(function(root){
  'use strict';
  function supportedMimes(MediaRecorderCtor){
    if(!MediaRecorderCtor||typeof MediaRecorderCtor.isTypeSupported!=='function')return [];
    const candidates=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
    return candidates.filter(type=>{try{return MediaRecorderCtor.isTypeSupported(type)}catch{return false}});
  }
  function bitrates(width,height){
    const pixels=Math.max(0,Number(width)||0)*Math.max(0,Number(height)||0);
    return {videoBitsPerSecond:pixels<500000?2500000:pixels<1100000?5000000:8000000,audioBitsPerSecond:192000};
  }
  function createCanvasCapture(canvas,fps=30){
    if(!canvas||typeof canvas.captureStream!=='function')throw new Error('Canvas captureStream không được hỗ trợ.');
    try{
      const stream=canvas.captureStream(0),track=stream.getVideoTracks?.()[0];
      if(track&&typeof track.requestFrame==='function')return {stream,track,manual:true,requestFrame(){try{track.requestFrame()}catch{}}};
      stream.getTracks?.().forEach(track=>track.stop());
    }catch{}
    const stream=canvas.captureStream(fps),track=stream.getVideoTracks?.()[0]||null;
    return {stream,track,manual:false,requestFrame(){}};
  }
  function shouldRender(now,lastRenderAt,fps=30){
    if(!Number.isFinite(lastRenderAt))return true;
    return Number(now)-lastRenderAt>=1000/Math.max(1,Number(fps)||30)-0.5;
  }
  const api={supportedMimes,bitrates,createCanvasCapture,shouldRender};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ExportEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
