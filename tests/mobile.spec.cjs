const {test,expect}=require('@playwright/test');const path=require('node:path');
test('mix layers, preview, karaoke and record on mobile engines',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#quality')).toHaveValue('480');
 await page.locator('#audioFile').setInputFiles(path.join(__dirname,'fixtures/tone.wav'));await page.waitForFunction(()=>!!env&&!loading);
 await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);
 await page.locator('#clearEffects').click();for(const fx of ['pulse','glow','rain','stars','bars','ring'])await page.locator('[data-fx="'+fx+'"]').check();
 await expect(page.locator('#effectCount')).toHaveText('6 đang bật');expect(await page.evaluate(()=>selectedFx.size)).toBe(6);
 await page.locator('#lyrics').fill('[00:00.10]<00:00.10>Xin <00:00.60>chào<00:01.40>\n[00:01.40]こんにちは thế giới');await page.locator('#applyLyrics').click();
 await page.locator('#play').click();await page.waitForTimeout(350);await page.locator('#play').click();expect(await page.evaluate(()=>run.paused)).toBe(true);await page.locator('#stop').click();
 for(const aspect of ['9:16','1:1','16:9']){await page.locator('#aspect').selectOption(aspect);await page.evaluate(()=>{position=.8;drawFrame(position)});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)}
 await page.screenshot({path:testInfo.outputPath('mobile.png'),fullPage:true});
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),{timeout:20000});await expect(page.locator('#out a')).toBeVisible();expect(await page.evaluate(()=>document.querySelector('#out video').playsInline)).toBe(true);await expect(page.locator('#out button')).toHaveText('Chia sẻ / Lưu vào Tệp')}else await expect(page.locator('#compat')).toContainText('xem trước');
 expect(errors).toEqual([]);
});
test('fallback image loading and recording capability message',async({page})=>{await page.addInitScript(()=>{window.createImageBitmap=undefined;HTMLCanvasElement.prototype.captureStream=undefined});await page.goto('/');await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);await expect(page.locator('#compat')).toContainText('xem trước');await expect(page.locator('#record')).toBeDisabled()});
