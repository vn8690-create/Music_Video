const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const fixture=name=>path.join(__dirname,'fixtures',name);
const clip={name:'clip.mp4',mimeType:'video/mp4',buffer:Buffer.from(fs.readFileSync(fixture('clip.mp4.base64'),'utf8'),'base64')};
test.use({serviceWorkers:'block'});
test('mixed clips trim, loop, hold, reorder and export with muted native audio',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#audioFile').setInputFiles(fixture('tone.wav'));await page.waitForFunction(()=>env&&!loading);
 await page.locator('#imageFiles').setInputFiles(clip);await page.waitForFunction(()=>imgs.length===1&&!loading);
 await page.locator('#imageFiles').setInputFiles(fixture('cover.png'));await page.waitForFunction(()=>imgs.length===2&&!loading);
 await expect(page.locator('#thumbs .media-card')).toHaveCount(2);
 await page.locator('[data-media-field=trimStart]').fill('.3');await page.locator('[data-media-field=trimStart]').blur();
 await page.locator('[data-media-field=trimEnd]').fill('1.2');await page.locator('[data-media-field=trimEnd]').blur();
 await page.locator('[data-media-field=sceneDuration]').fill('3');await page.locator('[data-media-field=sceneDuration]').blur();
 await page.locator('[data-media-field=loop]').uncheck();
 await page.evaluate(async()=>{position=2;await prepareBackgroundMedia(position);drawFrame(position)});
 expect(await page.evaluate(()=>imgs[0].video.currentTime)).toBeCloseTo(1.165,1);
 expect(await page.evaluate(()=>imgs[0].video.muted&&imgs[0].video.volume===0)).toBe(true);
 await page.locator('[data-media-field=speed]').selectOption('0.5');
 expect(await page.evaluate(()=>imgs[0].sceneDuration)).toBe(6);
 await page.evaluate(async()=>{position=1;await prepareBackgroundMedia(position);drawFrame(position)});
 expect(await page.evaluate(()=>imgs[0].video.currentTime)).toBeCloseTo(.8,1);
 expect(await page.evaluate(()=>imgs[0].video.playbackRate)).toBe(.5);
 await page.locator('[data-media-field=speed]').selectOption('1');
 await page.locator('[data-media-field=loop]').check();
 await page.evaluate(async()=>{position=1.1;await prepareBackgroundMedia(position);drawFrame(position)});
 expect(await page.evaluate(()=>imgs[0].video.currentTime)).toBeCloseTo(.5,1);
 await page.getByRole('button',{name:'Đưa tư liệu 1 sang phải',exact:true}).click();expect(await page.evaluate(()=>imgs[1].kind)).toBe('video');
 await page.getByRole('button',{name:'Đưa tư liệu 2 sang trái',exact:true}).click();
 await page.evaluate(()=>position=0);await page.locator('#play').click();await page.waitForFunction(()=>run&&currentTime()>.3);
 await expect(page.locator('[data-media-field=trimStart]')).toBeDisabled();
 await page.locator('#play').click();expect(await page.evaluate(()=>imgs[0].video.paused)).toBe(true);
 await page.locator('#stop').click();
 if(await page.evaluate(()=>canRecord())){
  await page.locator('#record').click();await page.waitForFunction(()=>run?.mode==='record'&&currentTime()>.3);
  await page.evaluate(()=>pauseExport('manual'));expect(await page.evaluate(()=>imgs[0].video.paused)).toBe(true);
  await page.evaluate(()=>resumeExport(true));await page.waitForFunction(()=>!!document.querySelector('#out video'),null,{timeout:25000});
  expect(await page.locator('#out a').getAttribute('download')).toMatch(/video-karaoke/);
 }
 expect(errors).toEqual([]);
});
test('invalid clip preserves images and removing clip releases its decoder',async({page})=>{
 await page.goto('/');await page.locator('#imageFiles').setInputFiles(fixture('cover.png'));await page.waitForFunction(()=>imgs.length===1&&!loading);
 await page.locator('#imageFiles').setInputFiles({name:'bad.mp4',mimeType:'video/mp4',buffer:Buffer.from('bad')});await page.waitForFunction(()=>!loading);
 await expect(page.locator('#mediaStatus')).toContainText('bad.mp4');expect(await page.evaluate(()=>imgs.length)).toBe(1);
 await page.locator('#imageFiles').setInputFiles(clip);await page.waitForFunction(()=>imgs.length===2&&!loading);
 await page.getByRole('button',{name:'Xóa tư liệu 2',exact:true}).click();await expect(page.locator('#videoDecoders video')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('speed curve uses integrated time when seeking, holds trim and keeps music timing',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#audioFile').setInputFiles(fixture('tone.wav'));await page.waitForFunction(()=>env&&!loading);
 await page.locator('#imageFiles').setInputFiles(clip);await page.waitForFunction(()=>imgs.length===1&&!loading);
 const songDuration=await page.evaluate(()=>buf.duration);
 await page.locator('[data-media-field=speedMode]').selectOption('fast-slow');
 await expect(page.locator('[data-speed-point]')).toHaveCount(5);
 await expect(page.locator('.speed-curve-graph')).toBeVisible();
 const result=await page.evaluate(async()=>{
  const item=imgs[0],duration=item.sceneDuration;
  const samples=[];
  for(const fraction of [.25,.6,.1,.25]){
   position=duration*fraction;await prepareBackgroundMedia(position);drawFrame(position);
   samples.push({actual:item.video.currentTime,expected:clipTime(item,position),rate:item.video.playbackRate,targetRate:SpeedCurve.at(item,position)});
  }
  return {samples,span:SpeedCurve.elapsed(item,duration),trim:item.trimEnd-item.trimStart};
 });
 expect(result.span).toBeCloseTo(result.trim,4);
 for(const s of result.samples){expect(s.actual).toBeCloseTo(s.expected,1);expect(s.rate).toBeCloseTo(s.targetRate,2)}
 expect(result.samples[0].actual).toBeCloseTo(result.samples[3].actual,2);
 await page.locator('[data-speed-point="2"]').fill('0.5');
 await expect(page.locator('[data-media-field=speedMode]')).toHaveValue('custom');
 expect(await page.evaluate(()=>imgs[0].speedPoints[2])).toBe(.5);
 expect(await page.evaluate(()=>buf.duration)).toBe(songDuration);
 await page.locator('[data-media-field=loop]').uncheck();
 await page.locator('[data-media-field=sceneDuration]').fill('8');await page.locator('[data-media-field=sceneDuration]').blur();
 await page.evaluate(async()=>{position=7;await prepareBackgroundMedia(position);drawFrame(position)});
 expect(await page.evaluate(()=>imgs[0].video.currentTime)).toBeCloseTo(await page.evaluate(()=>imgs[0].trimEnd-.035),1);
 await page.evaluate(()=>position=0);await page.locator('#play').click();await page.waitForFunction(()=>run&&currentTime()>.2);
 await expect(page.locator('[data-speed-point="2"]')).toBeDisabled();
 await page.locator('#play').click();expect(await page.evaluate(()=>imgs[0].video.paused)).toBe(true);
 await page.locator('#play').click();await page.waitForFunction(()=>run&&!run.paused);await page.locator('#stop').click();
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),null,{timeout:25000})}
 expect(errors).toEqual([]);
});
test('two real 7–9 minute movies import without retaining both decoders and seek near their ends',async({page},testInfo)=>{
 const {spawnSync}=require('node:child_process');
 
 const files=[];
 for(const seconds of [420,540]){
  const file=testInfo.outputPath('long-'+seconds+'.mp4');
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=160x90:rate=30','-t',String(seconds),'-c:v','libx264','-preset','ultrafast','-crf','32','-g','60','-pix_fmt','yuv420p','-an','-movflags','+faststart',file],{timeout:30000});
  if(result.error)throw result.error;expect(result.status,String(result.stderr)).toBe(0);files.push(file);
 }
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#audioFile').setInputFiles(fixture('tone.wav'));await page.waitForFunction(()=>env&&!loading);
 await page.locator('#imageFiles').setInputFiles(files);await page.waitForFunction(()=>imgs.length===2&&!loading,null,{timeout:30000});
 expect(await page.evaluate(()=>imgs.map(i=>Math.round(i.duration)))).toEqual([420,540]);
 expect(await page.evaluate(()=>imgs.filter(i=>i.attached).length)).toBeLessThanOrEqual(1);
 await page.evaluate(()=>{for(const item of imgs){item.trimStart=item.trimEnd-3;item.sceneDuration=2}plan()});
 for(const time of [.5,2.5,.5]){
  const sample=await page.evaluate(async time=>{position=time;await prepareBackgroundMedia(time);drawFrame(time);const item=activeMedia(time)[0].item;return{actual:item.video.currentTime,expected:clipTime(item,activeMedia(time)[0].age),attached:imgs.filter(i=>i.attached).length}},time);
  expect(sample.actual).toBeCloseTo(sample.expected,1);expect(sample.attached).toBe(1);
 }
 await page.evaluate(()=>position=0);await page.locator('#play').click();await page.waitForFunction(()=>run&&currentTime()>2.5);await page.locator('#stop').click();
 expect(errors).toEqual([]);
});
test('metadata import can be cancelled and does not require loadeddata events',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLMediaElement.prototype.addEventListener;
  HTMLMediaElement.prototype.addEventListener=function(type,...args){if(type==='loadeddata')return;return original.call(this,type,...args)};
 });await page.goto('/');
 await page.locator('#imageFiles').setInputFiles(clip);await page.waitForFunction(()=>imgs.length===1&&!loading);
 expect(await page.evaluate(()=>imgs[0].duration)).toBeGreaterThan(1);
 await page.evaluate(()=>{Object.defineProperty(HTMLMediaElement.prototype,'src',{configurable:true,get(){return ''},set(value){}});HTMLMediaElement.prototype.load=function(){}});
 await page.locator('#imageFiles').setInputFiles({...clip,name:'cancel-long.mp4'});
 await expect(page.locator('#cancelMedia')).toBeVisible();await expect(page.locator('#cancelMedia')).toBeEnabled();
 await page.locator('#cancelMedia').click();await page.waitForFunction(()=>!loading);
 await expect(page.locator('#mediaStatus')).toContainText('Đã hủy');expect(await page.evaluate(()=>imgs.length)).toBe(1);
});
