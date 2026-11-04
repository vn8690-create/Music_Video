// Compose complete image scenes, then paint lyrics/logo/disc on the main canvas.
const sceneTextures=[document.createElement('canvas'),document.createElement('canvas')];
const softTexture=document.createElement('canvas');
function snapshotScene(slot,image,index,age,amp,time){
 const texture=sceneTextures[slot];if(texture.width!==cv.width||texture.height!==cv.height){texture.width=cv.width;texture.height=cv.height}
 cx.save();cx.globalAlpha=1;cx.globalCompositeOperation='source-over';cx.filter='none';cx.fillStyle='#10101a';cx.fillRect(0,0,cv.width,cv.height);drawScene(image,index,age,amp,time);cx.restore();
 const context=texture.getContext('2d');context.globalCompositeOperation='copy';context.drawImage(cv,0,0);return texture;
}
function transitionLayer(texture,{alpha=1,x=0,y=0,sx=1,sy=sx,angle=0,blur=0,blend='source-over'}={}){
 cx.save();cx.globalAlpha=clamp(alpha);cx.globalCompositeOperation=blend;cx.translate(cv.width/2+x,cv.height/2+y);cx.rotate(angle);cx.scale(sx,sy);
 let source=texture;
 if(blur>.1){
  if('filter' in Object.getPrototypeOf(cx))cx.filter='blur('+blur.toFixed(2)+'px)';
  else{const width=Math.max(12,Math.round(texture.width/(1+blur))),height=Math.max(12,Math.round(texture.height/(1+blur)));softTexture.width=width;softTexture.height=height;const soft=softTexture.getContext('2d');soft.imageSmoothingEnabled=true;soft.drawImage(texture,0,0,width,height);source=softTexture}
 }
 cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';cx.drawImage(source,-cv.width/2,-cv.height/2,cv.width,cv.height);cx.restore();
}
function paintImageTransition(index,frame,start,rawProgress,amp,time,type){
 if(index===0||rawProgress>=1||type==='cut'){drawScene(imgs[index%imgs.length].image,index,(frame-start)/FPS,amp,time);return}
 const old=snapshotScene(0,imgs[(index-1)%imgs.length].image,index-1,(frame-switches[index-1])/FPS,amp,time);
 const next=snapshotScene(1,imgs[index%imgs.length].image,index,(frame-start)/FPS,amp,time);
 const p=$('#transitionEase').value==='linear'?rawProgress:rawProgress*rawProgress*(3-2*rawProgress),q=1-p,peak=Math.sin(p*Math.PI),power=number('#transitionPower',70,20,100)/100,W=cv.width,H=cv.height,blur=Math.min(W,H)*.025*power*peak;
 cx.save();cx.globalAlpha=1;cx.globalCompositeOperation='source-over';cx.filter='none';cx.fillStyle='#10101a';cx.fillRect(0,0,W,H);
 if(type==='fade'){transitionLayer(old);transitionLayer(next,{alpha:p})}
 else if(type==='wipe'){transitionLayer(old);cx.save();cx.beginPath();cx.rect(0,0,W*p,H);cx.clip();transitionLayer(next);cx.restore()}
 else if(type==='slide'){transitionLayer(old);transitionLayer(next,{x:W*q})}
 else if(type==='iris'){transitionLayer(old);cx.save();cx.beginPath();cx.arc(W/2,H/2,Math.hypot(W,H)*p/2,0,Math.PI*2);cx.clip();transitionLayer(next);cx.restore()}
 else if(type==='slide-up'){transitionLayer(old,{y:-H*p});transitionLayer(next,{y:H*q})}
 else if(type==='blur'){transitionLayer(old,{blur,sx:1+.12*peak});transitionLayer(next,{alpha:p,blur,sx:1+.12*peak})}
 else if(type==='zoom'||type==='zoom-blur'){transitionLayer(old,{sx:1+.22*power*p,blur:type==='zoom-blur'?blur:0});transitionLayer(next,{alpha:p,sx:1+.3*power*q,blur:type==='zoom-blur'?blur:0})}
 else if(type==='flip-x'||type==='flip-y'){
  transitionLayer(old);transitionLayer(next,{alpha:p});cx.fillStyle='rgba(0,0,0,'+(.45*peak)+')';cx.fillRect(0,0,W,H);
  const front=p<.5?old:next,s=Math.max(.002,Math.abs(Math.cos(p*Math.PI)));
  transitionLayer(front,{sx:type==='flip-x'?s:1,sy:type==='flip-y'?s:1});
 }
 else if(type==='rotate'||type==='spin'){
  transitionLayer(old);const angle=type==='spin'?Math.PI*2:Math.PI*.24*power;
  transitionLayer(old,{alpha:q,angle:-angle*p,sx:1+.14*power*p});transitionLayer(next,{alpha:p,angle:angle*q,sx:1+.25*power*q});
 }
 else if(type==='blend-light'||type==='blend-dark'){
  transitionLayer(old);transitionLayer(next,{alpha:p});transitionLayer(next,{alpha:peak*power*.65,blend:type==='blend-light'?'screen':'multiply'});
 }
 else{transitionLayer(old);transitionLayer(next,{alpha:p})}
 cx.restore();
}
