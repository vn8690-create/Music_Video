/* Pure timing helpers shared by the browser UI and tests. No audio leaves the device. */
(function(root){
 'use strict';
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const normalize=text=>text.normalize('NFKD').toLowerCase().replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]/gu,'');
 function tokens(text){
  if(typeof Intl.Segmenter==='function')return [...new Intl.Segmenter(undefined,{granularity:'word'}).segment(text)].filter(s=>s.isWordLike).map(s=>({text:s.segment,key:normalize(s.segment)}));
  return (text.match(/[\p{L}\p{N}]+/gu)||[]).map(text=>({text,key:normalize(text)}));
 }
 function cleanWords(chunks,offset,end){
  const words=[];
  for(const chunk of chunks||[]){const pair=chunk.timestamp||[],text=String(chunk.text||'');
   if(!text.trim()||!finite(pair[0])||!finite(pair[1]))continue;
   const start=Math.max(offset,offset+pair[0]),stop=Math.min(end,offset+pair[1]);
   if(stop<=start||start>=end)continue;
   words.push({text,start,end:stop});
  }
  words.sort((a,b)=>a.start-b.start);
  return words.filter((w,i)=>!i||w.start!==words[i-1].start||w.text!==words[i-1].text);
 }
 function groupWords(words){
  const rows=[];let group=[];
  const flush=()=>{if(!group.length)return;rows.push({text:group.map(w=>w.text).join('').trim(),start:group[0].start,end:group.at(-1).end,words:group,timing:'word'});group=[]};
  for(const word of words){if(group.length&&(word.start-group.at(-1).end>.9||word.end-group[0].start>6||group.map(w=>w.text).join('').length+word.text.length>58))flush();group.push({...word});if(/[.!?。！？]\s*$/.test(word.text))flush()}
  flush();return rows;
 }
 function alignReference(rows,reference){
  const lines=reference.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!/^\[[^\]]+\]$/.test(x));
  if(!lines.length)return rows;
  const actual=rows.flatMap(r=>r.words.flatMap(w=>tokens(w.text).map(t=>({...t,start:w.start,end:w.end})))),expected=lines.flatMap((text,line)=>tokens(text).map(t=>({...t,line})));
  if((actual.length+1)*(expected.length+1)>4000000)throw Error('Lời quá dài để đối chiếu trên điện thoại. Hãy chia bài thành các đoạn.');
  const width=actual.length+1,dp=new Uint16Array((expected.length+1)*width);
  for(let i=expected.length-1;i>=0;i--)for(let j=actual.length-1;j>=0;j--)dp[i*width+j]=expected[i].key===actual[j].key?1+dp[(i+1)*width+j+1]:Math.max(dp[(i+1)*width+j],dp[i*width+j+1]);
  const matches=lines.map(()=>[]),totals=lines.map(()=>0);for(const t of expected)totals[t.line]++;
  let i=0,j=0;while(i<expected.length&&j<actual.length){if(expected[i].key===actual[j].key){matches[expected[i].line].push(actual[j]);i++;j++}else if(dp[(i+1)*width+j]>=dp[i*width+j+1])i++;else j++}
  return lines.map((text,line)=>{const found=matches[line],enough=found.length>0&&found.length>=totals[line]*.5;return{text,start:enough?found[0].start:null,end:enough?found.at(-1).end:null,words:[],timing:'line',review:true,unmatched:!enough}});
 }
 function clipRows(rows,start,end){return rows.filter(r=>finite(r.start)&&finite(r.end)&&r.end>start&&r.start<end).map(r=>({...r,start:Math.max(start,r.start),end:Math.min(end,r.end),words:(r.words||[]).filter(w=>w.end>start&&w.start<end).map(w=>({...w,start:Math.max(start,w.start),end:Math.min(end,w.end)}))}))}
 function validateRows(rows,duration){
  if(!rows.length)return 'AI chưa tìm được lời có mốc thời gian.';
  for(let i=0;i<rows.length;i++){const r=rows[i];if(!r.text.trim())return 'Câu '+(i+1)+' chưa có lời.';if(!finite(r.start)||!finite(r.end)||r.start<0||r.end<=r.start||r.end>duration+.01)return 'Câu '+(i+1)+' cần mốc bắt đầu/kết thúc hợp lệ (giây).';if(i&&r.start<rows[i-1].end-.02)return 'Câu '+(i+1)+' chồng thời gian với câu trước. Hãy chỉnh lại mốc.'}return '';
 }
 // Area-average resampling also works when OfflineAudioContext is unavailable on a phone.
 async function resample(buffer,start,end,alive=()=>true){
  const rate=16000,step=buffer.sampleRate/rate,length=Math.floor((end-start)*rate),out=new Float32Array(length),channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),base=start*buffer.sampleRate;
  for(let n=0;n<length;n++){
   const a=base+n*step,b=Math.min(buffer.length,a+step);let sum=0;
   for(let i=Math.floor(a);i<Math.ceil(b);i++){const weight=Math.min(b,i+1)-Math.max(a,i);if(weight>0)for(const channel of channels)sum+=(channel[i]||0)*weight}
   out[n]=sum/(step*channels.length);
   if(n%160000===159999){await new Promise(r=>setTimeout(r,0));if(!alive())throw Error('Đã hủy')}
  }return out;
 }
 const api={cleanWords,groupWords,alignReference,clipRows,validateRows,resample};root.KaraokeAI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
