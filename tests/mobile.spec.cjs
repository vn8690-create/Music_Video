const {test,expect}=require('@playwright/test');const path=require('node:path');
test('advanced blur, flip, rotate and blend transitions paint distinct frames and export',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#audioFile').setInputFiles(path.join(__dirname,'fixtures/tone.wav'));await page.waitForFunction(()=>!!env&&!loading);
 await page.locator('#imageFiles').setInputFiles([path.join(__dirname,'fixtures/cover.png'),path.join(__dirname,'fixtures/logo.png')]);await page.waitForFunction(()=>imgs.length===2);
 await page.locator('[data-tab=effects]').click();await page.locator('#clearEffects').click();await page.locator('#gap').fill('2');await page.locator('#beatCuts').uncheck();await page.locator('#transitionDuration').fill('1.0');
 const checks=await page.evaluate(()=>{
  const captures={};for(const input of document.querySelectorAll('[data-transition]')){
   const key=input.dataset.transition;document.querySelectorAll('[data-transition]').forEach(item=>item.checked=item.dataset.transition===key);drawFrame(2.35);captures[key]=cv.toDataURL();
  }
  transitionUI();return{count:Object.keys(captures).length,blur:captures.blur!==captures.fade,flip:captures['flip-x']!==captures['flip-y'],rotate:captures.rotate!==captures.cut,blend:captures['blend-light']!==captures['blend-dark']};
 });expect(checks).toEqual({count:15,blur:true,flip:true,rotate:true,blend:true});
 await page.locator('#gentleTransitions').click();expect(await page.locator('[data-transition]:checked').count()).toBe(4);
 await page.locator('#dynamicTransitions').click();expect(await page.locator('[data-transition]:checked').count()).toBe(6);
 await page.evaluate(()=>{document.querySelectorAll('[data-transition]').forEach(item=>item.checked=item.dataset.transition==='zoom-blur');transitionUI()});
 await page.locator('#transitionPower').fill('85');await page.locator('#transitionEase').selectOption('smooth');
 await page.locator('[data-tab=media]').click();for(const aspect of ['9:16','1:1','16:9']){await page.locator('#aspect').selectOption(aspect);await page.evaluate(()=>drawFrame(2.35));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)}
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),{timeout:20000});await expect(page.locator('#out a')).toBeVisible()}
 expect(errors).toEqual([]);
});
test('multiple transitions cycle, stay stable when seeking and export',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('[data-tab=effects]').click();await expect(page.locator('[data-transition=fade]')).toBeDisabled();
 await page.locator('[data-transition=wipe]').check();await page.locator('[data-transition=iris]').check();
 const cycle=await page.evaluate(()=>{switches=Array.from({length:13},(_,i)=>i*120);return Array.from({length:6},(_,i)=>transitionAt(i+1))});expect(cycle).toEqual(['fade','wipe','iris','fade','wipe','iris']);
 await page.locator('#transition').selectOption('random');
 const sequence=await page.evaluate(()=>Array.from({length:12},(_,i)=>transitionAt(i+1)));
 expect(sequence.every(x=>['fade','wipe','iris'].includes(x))).toBe(true);expect(sequence.every((x,i)=>!i||x!==sequence[i-1])).toBe(true);
 expect(await page.evaluate(()=>[transitionAt(9),transitionAt(2),transitionAt(9)])).toEqual([sequence[8],sequence[1],sequence[8]]);
 await expect(page.locator('#shuffleTransitions')).toBeEnabled();await page.locator('#allTransitions').click();expect(await page.locator('[data-transition]:checked').count()).toBe(15);
 await page.locator('[data-tab=media]').click();await page.locator('#audioFile').setInputFiles(path.join(__dirname,'fixtures/tone.wav'));await page.waitForFunction(()=>!!env&&!loading);
 await page.locator('#imageFiles').setInputFiles([path.join(__dirname,'fixtures/cover.png'),path.join(__dirname,'fixtures/logo.png')]);await page.waitForFunction(()=>imgs.length===2);
 await page.locator('[data-tab=effects]').click();await page.locator('#gap').fill('2');await page.locator('#beatCuts').uncheck();expect(await page.evaluate(()=>switches.length)).toBeGreaterThan(1);
 await page.evaluate(()=>{for(const t of [2.1,.2,2.4])drawFrame(t)});
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),{timeout:20000});await expect(page.locator('#out a')).toBeVisible()}
 expect(errors).toEqual([]);
});
function toneFile(name,seconds,hz,rate=22050){const samples=Math.round(seconds*rate),data=Buffer.alloc(44+samples*2);data.write('RIFF',0);data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)data.writeInt16LE(Math.round(Math.sin(i/rate*hz*Math.PI*2)*10000),44+i*2);return{name,mimeType:'audio/wav',buffer:data}}
test('playlist appends songs, reorders local subtitles and records consecutive audio',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#audioFile').setInputFiles([toneFile('Bài A.wav',1.3,440),toneFile('Bài B.wav',1.1,880,44100)]);
 await page.waitForFunction(()=>playlist.length===2&&!loading);expect(await page.evaluate(()=>buf.duration)).toBeCloseTo(2.4,2);
 await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);
 await page.locator('#playlist input[type=file]').nth(1).setInputFiles({name:'bai-b.lrc',mimeType:'text/plain',buffer:Buffer.from('[00:00.10]<00:00.10>Bài <00:00.50>B<00:00.90>')});
 await page.waitForFunction(()=>cues.length===1);expect(await page.evaluate(()=>cues[0].start)).toBeCloseTo(1.4,2);
 await page.getByRole('button',{name:'Đưa bài 2 lên',exact:true}).click();expect(await page.evaluate(()=>playlist[0].title)).toBe('Bài B');expect(await page.evaluate(()=>cues[0].start)).toBeCloseTo(.1,2);
 await page.locator('#audioFile').setInputFiles(toneFile('Bài C.wav',.7,1320));await page.waitForFunction(()=>playlist.length===3&&!loading);expect(await page.evaluate(()=>buf.duration)).toBeCloseTo(3.1,2);
 await page.getByRole('button',{name:'Xóa bài 3',exact:true}).click();await page.waitForFunction(()=>playlist.length===2);expect(await page.evaluate(()=>cues[0].start)).toBeCloseTo(.1,2);
 await page.locator('#audioFile').setInputFiles({name:'broken.wav',mimeType:'audio/wav',buffer:Buffer.from('not audio')});await page.waitForFunction(()=>!loading);expect(await page.evaluate(()=>playlist.length)).toBe(2);await expect(page.locator('#msg')).toContainText('broken.wav');
 await page.locator('#play').click();await page.waitForFunction(()=>!!run&&currentTime()>.1);expect(await page.evaluate(()=>run.src.nodes.length)).toBe(2);expect(await page.evaluate(()=>trackAt(currentTime()).title)).toBe('Bài B');
 await page.waitForFunction(()=>currentTime()>1.2);expect(await page.evaluate(()=>trackAt(currentTime()).title)).toBe('Bài A');await expect(page.locator('#playlistNow')).toContainText('2 / 2');await page.locator('#stop').click();
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>currentTime()>.15);await page.locator('#record').click();await page.waitForFunction(()=>run?.paused);const held=await page.evaluate(()=>currentTime());await page.waitForTimeout(100);expect(await page.evaluate(()=>currentTime())).toBeCloseTo(held,2);await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),{timeout:20000});const pending=page.waitForEvent('download');await page.locator('#out a').click();const download=await pending;await download.saveAs(testInfo.outputPath('playlist-'+download.suggestedFilename()))}
 await page.locator('#clearPlaylist').click();expect(await page.evaluate(()=>playlist.length)).toBe(0);await expect(page.locator('#play')).toBeDisabled();expect(errors).toEqual([]);
});
test('album template keeps studio layers and reserves space for karaoke',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#audioFile').setInputFiles(path.join(__dirname,'fixtures/tone.wav'));await page.waitForFunction(()=>!!env&&!loading);
 await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);
 await page.locator('#title').fill('Giận thì giận, thương thì thương');await page.locator('#albumQuick').click();
 await expect(page.locator('#layoutMode')).toHaveValue('album');await expect(page.locator('#albumOptions')).toBeVisible();
 await page.locator('#albumArtist').fill('NAM MUSIC');expect(await page.evaluate(()=>enabledLayer('disc')&&enabledLayer('wave'))).toBe(true);
 const original=await page.evaluate(()=>({...layoutState.disc}));
 await page.locator('[data-tab=karaoke]').click();await page.locator('#lyrics').fill('[00:00.10]<00:00.10>Xin <00:00.60>chào<00:01.40>\n[00:01.40]Một bản tình ca');await page.locator('#applyLyrics').click();
 expect(await page.evaluate(()=>albumGeometry().A<cv.height)).toBe(true);expect(await page.evaluate(()=>layoutState.disc.y)).toBeLessThan(original.y);
 await page.locator('[data-tab=layout]').click();
 for(const theme of ['pearl','ink','rose']){await page.locator('#albumTheme').selectOption(theme);await page.evaluate(()=>drawFrame(.8));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)}
 await page.locator('[data-tab=media]').click();for(const aspect of ['9:16','1:1','16:9']){await page.locator('#aspect').selectOption(aspect);expect(await page.evaluate(()=>{const r=layerRect('disc');return r.x>=0&&r.y>=0&&r.x+r.w<=cv.width+.01&&r.y+r.h<=cv.height+.01})).toBe(true)}
 await page.locator('[data-tab=layout]').click();await page.locator('#layerSelect').selectOption('disc');await page.locator('#layerX').fill('35');expect(await page.evaluate(()=>layoutState.disc.x)).toBeCloseTo(.35);
 await page.locator('#albumReset').click();expect(await page.evaluate(()=>layoutState.disc.x)).toBeCloseTo(.245);
 await page.evaluate(()=>drawFrame(.8));await page.screenshot({path:testInfo.outputPath('album-studio.png'),fullPage:true});
 if(await page.evaluate(()=>canRecord())){await page.locator('#record').click();await page.waitForFunction(()=>!!document.querySelector('#out video'),{timeout:20000});await expect(page.locator('#out a')).toBeVisible()}
 await page.locator('#layoutMode').selectOption('classic');await expect(page.locator('#albumOptions')).toBeHidden();expect(await page.evaluate(()=>enabledLayer('disc'))).toBe(false);
 expect(errors).toEqual([]);
});
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


test('hidden export keeps its native recorder and continues the same song clock',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.simulatedHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.simulatedHidden})});
 await page.goto('/');await page.locator('#audioFile').setInputFiles(path.join(__dirname,'fixtures/tone.wav'));await page.waitForFunction(()=>!!env&&!loading);await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);
 test.skip(!await page.evaluate(()=>canRecord()),'Recording unavailable in this engine');
 await page.locator('#record').click();await page.waitForFunction(()=>currentTime()>.3);
 await page.evaluate(()=>{window.exportSession=run;window.simulatedHidden=true;document.dispatchEvent(new Event('visibilitychange'))});
 await page.waitForFunction(()=>run?.paused&&run.rec.state==='paused');const paused=await page.evaluate(()=>currentTime());await page.waitForTimeout(450);expect(await page.evaluate(()=>currentTime())).toBeCloseTo(paused,2);
 await expect(page.locator('#record')).toHaveText('Tiếp tục xuất');expect(await page.evaluate(()=>run===window.exportSession)).toBe(true);await expect(page.locator('#out video')).toHaveCount(0);
 await page.evaluate(()=>{window.simulatedHidden=false;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>run&&!run.paused&&!run.resuming);expect(await page.evaluate(()=>run===window.exportSession)).toBe(true);
 // A manual pause remains paused after another hide/show; only the user resumes it.
 await page.locator('#record').click();await page.waitForFunction(()=>run?.paused&&run.rec.state==='paused');await page.evaluate(()=>{window.simulatedHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.simulatedHidden=false;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(200);expect(await page.evaluate(()=>run.paused&&!run.autoPaused)).toBe(true);await page.locator('#record').click();
 await page.waitForFunction(()=>!!document.querySelector('#out video'),{timeout:15000});const downloadPromise=page.waitForEvent('download');await page.locator('#out a').click();const download=await downloadPromise;await download.saveAs(testInfo.outputPath('resumed-'+download.suggestedFilename()));expect(await page.evaluate(()=>run===null)).toBe(true);expect(errors).toEqual([]);
});

test('audio suspension holds export and failed autoplay offers a manual resume',async({page})=>{
 await page.goto('/');await page.locator('#audioFile').setInputFiles(path.join(__dirname,'fixtures/tone.wav'));await page.waitForFunction(()=>!!env&&!loading);await page.locator('#imageFiles').setInputFiles(path.join(__dirname,'fixtures/cover.png'));await page.waitForFunction(()=>imgs.length>0);test.skip(!await page.evaluate(()=>canRecord()),'Recording unavailable');
 await page.locator('#record').click();await page.waitForFunction(()=>currentTime()>.2);await page.evaluate(()=>AC.suspend());await page.waitForFunction(()=>run?.paused&&run.rec.state==='paused');
 await page.evaluate(()=>{window.realResume=AC.resume.bind(AC);AC.resume=()=>Promise.reject(new Error('autoplay blocked'));resumeExport(false)});await page.waitForFunction(()=>run?.paused&&!run.resuming);await expect(page.locator('#msg')).toContainText('Tiếp tục xuất');await expect(page.locator('#out video')).toHaveCount(0);
 await page.evaluate(()=>{AC.resume=window.realResume});await page.locator('#record').click();await page.waitForFunction(()=>run&&!run.paused);await page.locator('#stop').click();await page.waitForFunction(()=>run===null);
});

