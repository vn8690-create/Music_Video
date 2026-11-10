const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const clip=Buffer.from(fs.readFileSync(path.join(__dirname,'fixtures/clip.mp4.base64'),'utf8'),'base64');
function song(seconds){const rate=16000,n=Math.round(seconds*rate),data=Buffer.alloc(44+n*2);data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)data.writeInt16LE(Math.sin(i/rate*440*Math.PI*2)*6000,44+i*2);return{name:'seam.wav',mimeType:'audio/wav',buffer:data}}
test.use({serviceWorkers:'block'});
test('standby frame is decoded before the seam without seek/play churn near EOF',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#audioFile').setInputFiles(song(4.7));await page.waitForFunction(()=>env&&!loading);
 await page.locator('#imageFiles').setInputFiles([{name:'A.mp4',mimeType:'video/mp4',buffer:clip},{name:'B.mp4',mimeType:'video/mp4',buffer:clip}]);await page.waitForFunction(()=>imgs.length===2&&!loading);
 const boundary=await page.evaluate(()=>switches[1]/FPS);
 await page.evaluate(()=>{
  window.seamEvents=[];const create=createMediaDecoder;
  createMediaDecoder=function(item){const v=create(item);for(const type of ['play','pause','seeking','ended'])v.addEventListener(type,()=>{if(run)window.seamEvents.push({name:item.name,type,time:currentTime()})});return v};
 });await page.locator('#play').click();
 await page.waitForFunction(b=>run&&currentTime()>b-.45,boundary);
 expect(await page.evaluate(()=>imgs[1].attached&&imgs[1].video.readyState>=2)).toBe(true);
 await page.evaluate(()=>window.preparedVideo=imgs[1].video);
 await page.waitForFunction(b=>run&&currentTime()>b+.4,boundary);
 expect(await page.evaluate(()=>imgs[1].video===window.preparedVideo)).toBe(true);
 const events=await page.evaluate(()=>window.seamEvents);
 const tail=events.filter(e=>e.name==='A.mp4'&&e.time>boundary-.5&&e.time<boundary-.02);
 expect(tail.filter(e=>e.type==='play').length).toBeLessThanOrEqual(1);
 expect(tail.filter(e=>e.type==='seeking').length).toBeLessThanOrEqual(1);
 await page.locator('#play').click();
 expect(await page.evaluate(()=>imgs.filter(i=>i.attached).length)).toBeLessThanOrEqual(1);
 await page.locator('#stop').click();
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),null,{timeout:20000});await expect(page.locator('#out a')).toBeVisible()}
 expect(errors).toEqual([]);
});
