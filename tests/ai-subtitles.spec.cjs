const {test,expect}=require('@playwright/test'),path=require('node:path');
test.use({serviceWorkers:'block'});
const fixture=path.join(__dirname,'fixtures/tone.wav');
test('AI drafts are reviewed before applying to one track; cancel preserves subtitles',async({page,context},info)=>{
 let calls=0;
 await context.route('**/ai-subtitles-worker.js*',route=>route.fulfill({contentType:'text/javascript',body:`self.onmessage=({data})=>{self.postMessage({id:data.id,type:'status',stage:'inference',message:'Đang nghe mẫu'});${calls++===0?"setTimeout(()=>self.postMessage({id:data.id,type:'result',chunks:[{text:' Xin',timestamp:[.1,.4]},{text:' chào',timestamp:[.4,1]}]}),1000)":""}};`}));
 await page.goto('/');await page.locator('#audioFile').setInputFiles([fixture,fixture]);await page.waitForFunction(()=>playlist.length===2&&!loading);await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length===1);
 await page.locator('[data-tab=karaoke]').click();await page.locator('#lyrics').fill('[00:00.10]Sub bài đầu\n[00:02.50]Cuối bài đầu');await page.locator('#applyLyrics').click();
 const second=await page.evaluate(()=>String(playlist[1].id));await page.locator('#aiTrack').selectOption(second);await page.locator('#aiGenerate').click();await expect(page.locator('#audioFile')).toBeDisabled();await expect(page.locator('#aiCancel')).toBeEnabled();await expect(page.locator('#aiDraft')).toBeVisible();
 expect(await page.evaluate(()=>cues[0].text)).toBe('Sub bài đầu');await page.locator('#aiReview textarea').fill('Lời mình đã sửa');await page.locator('#aiApply').click();
 expect(await page.evaluate(()=>playlist[1].cues[0].text)).toBe('Lời mình đã sửa');expect(await page.evaluate(()=>playlist[0].cues[0].text)).toBe('Sub bài đầu');expect(await page.evaluate(()=>cues.find(c=>c.text==='Lời mình đã sửa').start)).toBeCloseTo(3.1,2);
 const before=await page.evaluate(()=>JSON.stringify(cues));await page.locator('#aiGenerate').click();await expect(page.locator('#aiCancel')).toBeEnabled();await page.locator('#aiCancel').click();await expect(page.locator('#aiStatus')).toContainText('Đã hủy');expect(await page.evaluate(()=>JSON.stringify(cues))).toBe(before);await expect(page.locator('#aiGenerate')).toBeEnabled();
 await page.locator('#aiReview').screenshot({path:info.outputPath('ai-review.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'));await expect(page.locator('#out a')).toBeVisible()}
});
test('AI loading failures keep existing cues and unlock the editor',async({page,context})=>{
 await context.route('**/ai-subtitles-worker.js*',route=>route.fulfill({contentType:'text/javascript',body:"self.onmessage=({data})=>self.postMessage({id:data.id,type:'error',message:'Network unavailable'});"}));
 await page.goto('/');await page.locator('#audioFile').setInputFiles(fixture);await page.waitForFunction(()=>playlist.length===1&&!loading);await page.locator('[data-tab=karaoke]').click();await page.locator('#lyrics').fill('[00:00.20]Giữ lời này');await page.locator('#applyLyrics').click();await page.locator('#aiGenerate').click();await expect(page.locator('#aiStatus')).toContainText('Network unavailable');await expect(page.locator('#aiGenerate')).toBeEnabled();expect(await page.evaluate(()=>cues[0].text)).toBe('Giữ lời này');
});
