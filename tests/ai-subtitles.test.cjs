const {test}=require('node:test'),assert=require('node:assert/strict');
const AI=require('../ai-subtitles-core.js');
test('AI rejects missing timestamps instead of inventing karaoke timing',()=>{
 const words=AI.cleanWords([{text:' Xin',timestamp:[.2,.6]},{text:' chào',timestamp:[.6,1.2]},{text:'unknown',timestamp:[null,null]},{text:'bad',timestamp:[2,1]}],30,31);
 assert.equal(words.length,2);assert.equal(words[0].start,30.2);assert.equal(words[1].end,31);assert.equal(AI.groupWords(words)[0].text,'Xin chào');
});
test('reference alignment leaves unrecognized lines for manual review',()=>{
 const rows=AI.groupWords(AI.cleanWords([{text:' Xin',timestamp:[1,1.3]},{text:' chào',timestamp:[1.3,2]},{text:' bạn',timestamp:[3,4]}],0,5));
 const result=AI.alignReference(rows,'[Verse]\nXin chào\nMột câu hoàn toàn khác\nbạn');
 assert.equal(result.length,3);assert.equal(result[0].start,1);assert.equal(result[0].timing,'line');assert.equal(result[1].start,null);assert.match(AI.validateRows(result,5),/Câu 2/);
});
test('partial AI application clips old words at range boundaries',()=>{
 const rows=[{text:'old',start:1,end:5,words:[{text:'old',start:1,end:5}]}];
 assert.equal(AI.clipRows(rows,0,2)[0].words[0].end,2);assert.equal(AI.clipRows(rows,4,8)[0].start,4);assert.match(AI.validateRows([{text:'x',start:2,end:3},{text:'y',start:2.5,end:4}],5),/chồng/);
});
test('mono resampling retains chosen offset, stereo average and cancellation',async()=>{
 const a=Float32Array.from({length:48000},(_,i)=>i<24000?.2:.8),b=Float32Array.from(a,x=>x/2),buffer={sampleRate:48000,numberOfChannels:2,length:48000,getChannelData:i=>[a,b][i]};
 const result=await AI.resample(buffer,.5,1);assert.equal(result.length,8000);assert.ok(Math.abs(result[100]-.6)<1e-6);
 const long={sampleRate:16000,numberOfChannels:1,length:160001,getChannelData:()=>new Float32Array(160001)};await assert.rejects(AI.resample(long,0,10,()=>false),/Đã hủy/);
});
