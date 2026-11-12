/* Canvas-only motion: uses the audio timeline for both preview and export. */
(function(root){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-Math.pow(1-clamp(x),3);
function phase(time,total,duration,mode){
 const d=Math.min(Math.min(10,Math.max(.5,Number.isFinite(duration)?duration:3)),total>0?total/2:3);
 if(mode==='always')return {alpha:1,progress:1};
 let t=-1;
 if((mode==='intro'||mode==='both')&&time<d)t=time;
 if((mode==='outro'||mode==='both')&&total>0&&time>=total-d)t=time-(total-d);
 if(t<0||t>=d)return {alpha:0,progress:0};
 return {alpha:clamp(t/Math.min(.4,d/3))*clamp((d-t)/Math.min(.5,d/3)),progress:ease(t/.7)};
}
function draw(ctx,w,h,time,total,o){
 if(!o||o.style==='off')return;
 const p=phase(time,total,o.duration,o.mode);if(!p.alpha)return;
 const unit=Math.min(w,h),power=clamp(o.strength==null?.6:o.strength),gold=o.style==='gold',retro=o.style==='retro',minimal=o.style==='minimal';
 const color=gold?'#ffd88a':retro?'#f68cff':'#79eaff',y=h*(o.position==='top'?.22:o.position==='bottom'?.68:.44);
 ctx.save();ctx.globalAlpha=p.alpha;ctx.lineWidth=Math.max(1,unit/500);
 if(!minimal){
  const g=ctx.createLinearGradient(0,y-unit*.18,0,y+unit*.22);g.addColorStop(0,'transparent');g.addColorStop(.5,'rgba(4,7,22,.65)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,y-unit*.18,w,unit*.4);
  ctx.strokeStyle=color;ctx.globalAlpha=p.alpha*power*.5;
  if(retro){const horizon=h*.7;ctx.beginPath();for(let i=-6;i<=6;i++){ctx.moveTo(w/2+i*w*.035,horizon);ctx.lineTo(w/2+i*w*.24,h)}for(let i=0;i<8;i++){const z=((i+time*.45)%8)/8,gy=horizon+z*z*(h-horizon);ctx.moveTo(0,gy);ctx.lineTo(w,gy)}ctx.stroke()}
  else{const count=o.lite?12:24;ctx.fillStyle=color;for(let i=0;i<count;i++){const x=((i*.6180339+time*.012)%1)*w,py=y+Math.sin(i*2.4+time*.65)*unit*.19;ctx.beginPath();ctx.arc(x,py,unit*(.0015+(i%3)*.0007),0,Math.PI*2);ctx.fill()}ctx.beginPath();ctx.moveTo(w*.12,y+unit*.1);ctx.lineTo(w*(.12+.76*p.progress),y+unit*.1);ctx.stroke()}
 }
 ctx.globalAlpha=p.alpha;ctx.translate(w/2,y+(1-p.progress)*unit*.04);ctx.scale(.96+.04*p.progress,.96+.04*p.progress);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=gold?'#fff2cf':'#fff';
 let size=unit*.068;ctx.font=`700 ${size}px "Segoe UI",sans-serif`;
 const title=String(o.title||'NVS STUDIO').slice(0,120),limit=w*.84;
 if(ctx.measureText(title).width>limit){size*=limit/ctx.measureText(title).width;ctx.font=`700 ${size}px "Segoe UI",sans-serif`}
 // No canvas blur on phones; crisp offset accents keep this layer inexpensive.
 if(!minimal){ctx.fillStyle=color;ctx.globalAlpha=p.alpha*power*.55;ctx.fillText(title,unit*.002,unit*.002);ctx.globalAlpha=p.alpha;ctx.fillStyle=gold?'#fff2cf':'#fff'}
 ctx.fillText(title,0,0);ctx.font=`500 ${unit*.019}px "Segoe UI",sans-serif`;ctx.fillStyle=color;ctx.fillText(String(o.subtitle||'').slice(0,90),0,unit*.062);ctx.restore();
}
root.MotionLite={phase,draw};if(typeof module==='object')module.exports=root.MotionLite;
})(typeof window==='object'?window:globalThis);
function motionOptions(){return {style:document.querySelector('#motionStyle').value,mode:document.querySelector('#motionMode').value,duration:Number(document.querySelector('#motionDuration').value),strength:Number(document.querySelector('#motionStrength').value)/100,position:document.querySelector('#motionPosition').value,title:document.querySelector('#motionTitle').value.trim(),subtitle:document.querySelector('#motionSubtitle').value,lite:document.querySelector('#motionLite').checked}}
function paintMotion(time){const o=motionOptions();if(!o.title)o.title=displayTitle(time);MotionLite.draw(cx,cv.width,cv.height,time,buf?.duration||0,o)}
