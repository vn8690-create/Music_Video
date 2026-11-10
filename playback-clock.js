// Keep native video moving; reserve seeks for explicit jumps and loop boundaries.
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function phase(start,end,elapsed,loop){
  const span=Math.max(.001,end-start),cycle=loop?Math.floor(Math.max(0,elapsed)/span):0,offset=loop?Math.max(0,elapsed)-cycle*span:Math.max(0,elapsed),guard=Math.min(.035,span*.04);
  return{cycle,target:Math.min(Math.max(start,end-.035),start+offset),hold:offset>=span-guard,tail:offset>=span-.25};
 }
 function correction({phase:p,time,rate,playing,ended,jump,lastSeek=-Infinity,now=0}){
  const error=p.target-time,hold=p.hold||(!jump&&ended&&p.tail);
  if(hold)return{hold:true,seek:jump||Math.abs(error)>.12?p.target:null,rate};
  if(!playing)return{hold:false,seek:jump||Math.abs(error)>.035?p.target:null,rate};
  if(jump)return{hold:false,seek:Math.abs(error)>.025?p.target:null,rate};
  // Small drift is caught up gradually instead of repeatedly pausing the decoder.
  const seek=Math.abs(error)>1.25&&now-lastSeek>1800?p.target:null;
  const adjusted=clamp(rate*(1+clamp(error*.12,-.06,.06)),.25,4);
  return{hold:false,seek,rate:adjusted};
 }
 function canWarm(current,next,mobile){
  const pixels=item=>(item?.sourceWidth||0)*(item?.sourceHeight||0);
  return next?.kind==='video'&&current!==next&&pixels(current)+pixels(next)<=(mobile?2100000:8400000);
 }
 const api={phase,correction,canWarm};if(typeof module==='object'&&module.exports)module.exports=api;else root.PlaybackClock=api;
})(globalThis);
