const {test}=require('node:test'),assert=require('node:assert/strict');
const {wait}=require('../video-loader.js');
test('first frame can become ready through seeked without a loadeddata event',async()=>{
 const video=new EventTarget();video.readyState=1;video.seeking=true;
 await wait(video,()=>video.readyState>=2&&!video.seeking,['loadeddata','seeked','canplay'],()=>{video.readyState=2;video.seeking=false;video.dispatchEvent(new Event('seeked'))},{timeout:100});
});
test('an already-ready no-op seek resolves without waiting for another event',async()=>{
 await wait(new EventTarget(),()=>true,['seeked'],()=>{},{timeout:100});
});
test('loading can be cancelled and unresponsive video fails with a useful timeout',async()=>{
 const video=new EventTarget(),controller=new AbortController();
 const pending=wait(video,()=>false,['loadedmetadata'],()=>{},{signal:controller.signal,timeout:100});controller.abort();
 await assert.rejects(pending,{name:'AbortError'});
 await assert.rejects(wait(video,()=>false,['loadedmetadata'],()=>{},{timeout:5}),/Đọc video quá lâu/);
});
