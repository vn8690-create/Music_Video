const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../playback-clock.js');
test('end-of-file holds until a real loop boundary instead of restarting playback',()=>{
 for(const elapsed of [1.94,1.96,1.99]){
  const phase=C.phase(0,2,elapsed,true);
  const action=C.correction({phase,time:2,rate:1,playing:true,ended:true,jump:false,now:1000});
  assert.equal(action.hold,true);assert.equal(action.seek,null);
 }
 const phase=C.phase(0,2,2.01,true);
 assert.equal(phase.cycle,1);
 const action=C.correction({phase,time:1.965,rate:1,playing:true,ended:true,jump:true});
 assert.equal(action.hold,false);assert.ok(action.seek<.02);
});
test('ordinary drift changes rate gently and does not seek every rendered frame',()=>{
 const phase=C.phase(0,20,5,true);
 const action=C.correction({phase,time:4.5,rate:1,playing:true,ended:false,jump:false,now:10000});
 assert.equal(action.seek,null);assert.equal(action.rate,1.06);
 const reverse=C.correction({phase,time:5.5,rate:1,playing:true,ended:false,jump:false,now:10000});
 assert.equal(reverse.seek,null);assert.equal(reverse.rate,.94);
 const first=C.correction({phase,time:2,rate:1,playing:true,jump:false,now:10000});assert.equal(first.seek,5);
 const retry=C.correction({phase,time:2,rate:1,playing:true,jump:false,lastSeek:10000,now:10016});assert.equal(retry.seek,null);
});
test('explicit seeks stay accurate; no-loop tails stay held',()=>{
 const phase=C.phase(3,7,2,false);
 assert.equal(C.correction({phase,time:3.5,rate:1,playing:true,jump:true}).seek,5);
 const tail=C.phase(3,7,20,false);assert.equal(tail.target,6.965);assert.equal(tail.hold,true);
});
test('standby loading is bounded by source pixels, including on mobile',()=>{
 const video=(w,h)=>({kind:'video',sourceWidth:w,sourceHeight:h});
 assert.equal(C.canWarm(video(1280,720),video(1280,720),true),true);
 assert.equal(C.canWarm(video(3840,2160),video(3840,2160),true),false);
 assert.equal(C.canWarm(video(1920,1080),video(1920,1080),false),true);
 const v=video(1280,720);assert.equal(C.canWarm(v,v,false),false);
});
