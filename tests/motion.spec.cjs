const {test,expect}=require('@playwright/test'),path=require('node:path');
const {song}=require('./audio-fixture.cjs');
test.use({serviceWorkers:'block'});
test('motion styles seek deterministically, preserve lyric timing and export on mobile',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#audioFile').setInputFiles(song(3));await page.waitForFunction(()=>env&&!loading);await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length===1&&!loading);
 await page.locator('[data-tab=effects]').click();await page.locator('#motionTitle').fill('NVS · ĐÊM MƯA');await page.locator('#motionMode').selectOption('always');
 const hashes=[];
 for(const style of ['off','neon','gold','minimal','retro']){await page.locator('#motionStyle').selectOption(style);hashes.push(await page.evaluate(()=>{drawFrame(1);return cv.toDataURL()}))}
 expect(new Set(hashes).size).toBe(5);
 const deterministic=await page.evaluate(()=>{drawFrame(1);const first=cv.toDataURL();drawFrame(2);drawFrame(1);return first===cv.toDataURL()});expect(deterministic).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>{cues=[{start:.5,end:2,text:'Lời đúng nhịp',words:[]}];window.oldCues=JSON.stringify(cues);drawFrame(1)});expect(await page.evaluate(()=>JSON.stringify(cues)===window.oldCues)).toBe(true);
 await page.screenshot({path:'test-results/motion-mobile.png',fullPage:true});
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),null,{timeout:25000});expect(await page.evaluate(async()=>{const r=await fetch(document.querySelector('#out video').src);return (await r.blob()).size})).toBeGreaterThan(1000)}
 expect(errors).toEqual([]);
});
