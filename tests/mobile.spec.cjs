const {test,expect}=require('@playwright/test');const path=require('node:path');
test('mix layers, preview, karaoke and record on mobile engines',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#quality')).toHaveValue('480');
 await page.locator('#audioFile').setInputFiles(path.join(__dirname,'fixtures/tone.wav'));await page.waitForFunction(()=>!!env&&!loading);
 await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);
 await page.locator('[data-tab=effects]').click();await page.locator('#clearEffects').click();for(const fx of ['pulse','glow','rain','stars','bars','ring'])await page.locator('[data-fx="'+fx+'"]').check();
 await expect(page.locator('#effectCount')).toHaveText('6 đang bật');expect(await page.evaluate(()=>selectedFx.size)).toBe(6);
 await page.locator('[data-tab=karaoke]').click();await page.locator('#lyrics').fill('[00:00.10]<00:00.10>Xin <00:00.60>chào<00:01.40>\n[00:01.40]こんにちは thế giới');await page.locator('#applyLyrics').click();
 await page.locator('#play').click();await page.waitForTimeout(350);await page.locator('#play').click();expect(await page.evaluate(()=>run.paused)).toBe(true);await page.locator('#stop').click();
 await page.locator('[data-tab=media]').click();for(const aspect of ['9:16','1:1','16:9']){await page.locator('#aspect').selectOption(aspect);await page.evaluate(()=>{position=.8;drawFrame(position)});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)}
 await page.screenshot({path:testInfo.outputPath('mobile.png'),fullPage:true});
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),{timeout:20000});await expect(page.locator('#out a')).toBeVisible();expect(await page.evaluate(()=>document.querySelector('#out video').playsInline)).toBe(true);await expect(page.locator('#out button')).toHaveText('Chia sẻ / Lưu vào Tệp')}else await expect(page.locator('#compat')).toContainText('xem trước');
 expect(errors).toEqual([]);
});
test('fallback image loading and recording capability message',async({page})=>{await page.addInitScript(()=>{window.createImageBitmap=undefined;HTMLCanvasElement.prototype.captureStream=undefined});await page.goto('/');await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);await expect(page.locator('#compat')).toContainText('xem trước');await expect(page.locator('#record')).toBeDisabled()});


test('logo, spinning vinyl and draggable layouts export with karaoke',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#audioFile').setInputFiles(path.join(__dirname,'fixtures/tone.wav'));await page.waitForFunction(()=>!!env&&!loading);
 await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);
 await page.locator('[data-tab=layout]').click();await page.locator('#layerSelect').selectOption('logo');await page.locator('#logoFile').setInputFiles(path.join(__dirname,'fixtures/logo.png'));await page.waitForFunction(()=>!!logoAsset);
 expect(await page.evaluate(()=>availableLayer('logo'))).toBe(true);expect(await page.evaluate(()=>logoAsset.width/logoAsset.height)).toBe(2);
 await page.locator('#anchors [data-anchor=".85,.15"]').click();
 await page.locator('#addDiscQuick').click();expect(await page.evaluate(()=>enabledLayer('disc'))).toBe(true);
 await page.locator('#discFile').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>!!discAsset);
 await page.locator('#layerSelect').selectOption('bars');await page.locator('#layerEnabled').check();
 await page.locator('#layerX').fill('40');await page.locator('#layerY').fill('60');const before=await page.evaluate(()=>({...layoutState.bars}));
 await page.locator('#editLayout').check();await page.locator('#cv').scrollIntoViewIfNeeded();const rect=await page.locator('#cv').boundingBox();
 await page.mouse.move(rect.x+rect.width*before.x,rect.y+rect.height*before.y);await page.mouse.down();await page.mouse.move(rect.x+rect.width*(before.x+.08),rect.y+rect.height*(before.y-.12),{steps:5});await page.mouse.up();
 expect(await page.evaluate(()=>layoutState.bars.y)).toBeLessThan(before.y-.06);await expect(page.locator('#selectionBox')).toBeVisible();
 await page.locator('#undoLayout').click();expect(await page.evaluate(()=>Math.abs(layoutState.bars.y-.6))).toBeLessThan(.01);await page.locator('#redoLayout').click();expect(await page.evaluate(()=>layoutState.bars.y)).toBeLessThan(.54);
 const frames=await page.evaluate(()=>{const captures=[];for(const t of [0,.7]){drawFrame(t);const r=layerRect('disc');captures.push(cv.getContext('2d').getImageData(Math.round(r.x+r.w*.35),Math.round(r.y+r.h*.35),15,15).data.join(','))}return captures});expect(frames[0]).not.toBe(frames[1]);
 await page.locator('[data-tab=karaoke]').click();await page.locator('#lyrics').fill('[00:00.10]Studio của chúng mình\n[00:01.50]Logo và đĩa nhạc');await page.locator('#applyLyrics').click();
 await page.locator('[data-tab=layout]').click();await page.evaluate(()=>{position=.8;drawFrame(position)});await page.screenshot({path:testInfo.outputPath('studio-layout.png'),fullPage:true});
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await expect(page.locator('#selectionBox')).toBeHidden();await page.waitForFunction(()=>!!document.querySelector('#out video'),{timeout:20000});await expect(page.locator('#out a')).toBeVisible();const downloadPromise=page.waitForEvent('download');await page.locator('#out a').click();const download=await downloadPromise;await download.saveAs(testInfo.outputPath(download.suggestedFilename()));}
 expect(errors).toEqual([]);
});

test('layout stays inside every aspect and keeps logo transparency',async({page})=>{
 await page.goto('/');await page.locator('[data-tab=layout]').click();await page.locator('#layerSelect').selectOption('logo');await page.locator('#logoFile').setInputFiles(path.join(__dirname,'fixtures/logo.png'));await page.waitForFunction(()=>!!logoAsset);
 const transparent=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=logoAsset.width;c.height=logoAsset.height;const x=c.getContext('2d');x.drawImage(logoAsset,0,0);return x.getImageData(0,0,1,1).data[3]});expect(transparent).toBe(0);
 await page.locator('[data-tab=media]').click();for(const aspect of ['16:9','9:16','1:1']){await page.locator('#aspect').selectOption(aspect);const valid=await page.evaluate(()=>Object.keys(layoutState).every(key=>{layoutState[key].x=1;layoutState[key].y=0;constrainLayer(key);const r=layerRect(key);return r.x>=-.01&&r.y>=-.01&&r.x+r.w<=cv.width+.01&&r.y+r.h<=cv.height+.01}));expect(valid).toBe(true)}
});
