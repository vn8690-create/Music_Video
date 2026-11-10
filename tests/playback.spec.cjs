const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const clip=Buffer.from(fs.readFileSync(path.join(__dirname,'fixtures/clip.mp4.base64'),'utf8'),'base64');
const {song}=require('./audio-fixture.cjs');
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
test('a failed standby load does not stop the foreground video',async({page})=>{
 await page.goto('/');await page.locator('#audioFile').setInputFiles(song(12));await page.waitForFunction(()=>env&&!loading);
 await page.locator('#imageFiles').setInputFiles([{name:'A.mp4',mimeType:'video/mp4',buffer:clip},{name:'B.mp4',mimeType:'video/mp4',buffer:clip}]);await page.waitForFunction(()=>imgs.length===2&&!loading);
 await page.evaluate(()=>{
  const create=createMediaDecoder;createMediaDecoder=function(item){const v=create(item);if(item.name==='B.mp4'&&!window.injectedWarmFault){window.injectedWarmFault=true;queueMicrotask(()=>v.dispatchEvent(new Event('error')))}return v};
 });await page.locator('#play').click();
 await page.waitForFunction(()=>imgs[1].warmFailedScene===1);
 expect(await page.evaluate(()=>!!run&&!run.paused&&!imgs[0].failed)).toBe(true);
 await page.waitForFunction(()=>run&&currentTime()>2.4);
 expect(await page.evaluate(()=>!!run&&!run.paused&&!imgs[1].failed)).toBe(true);
 await page.locator('#stop').click();
});
