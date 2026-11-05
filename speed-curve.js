// The integral maps output time to source time, including after a seek/resume.
(function(root){
 'use strict';
 const presets={
  'fast-slow':{label:'Tăng nhanh → Slow',points:[1,3,.35,.35,1]},
  'slow-fast':{label:'Slow → Tăng nhanh',points:[.35,.35,1,3,1]},
  'pulse':{label:'Nhanh → Slow → Nhanh',points:[2.5,.4,.4,2.5,1]},
  'custom':{label:'Tự chỉnh',points:[1,2,.5,.5,1]}
 };
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function pointsFor(item){return item.speedMode&&item.speedMode!=='constant'&&Array.isArray(item.speedPoints)&&item.speedPoints.length===5?item.speedPoints.map(v=>clamp(Number(v)||1,.25,4)):null}
 function rate(points,progress){const x=clamp(progress,0,1)*4,i=Math.min(3,Math.floor(x)),u=x-i;return points[i]+(points[i+1]-points[i])*u*u*(3-2*u)}
 function integral(points,progress){let sum=0;const x=clamp(progress,0,1)*4;for(let i=0;i<4;i++){const u=clamp(x-i,0,1);sum+=(points[i]*u+(points[i+1]-points[i])*(u**3-.5*u**4))/4}return sum}
 function mean(item){const points=pointsFor(item);return points?integral(points,1):(item.speed||1)}
 function elapsed(item,age){age=Math.max(0,age);const points=pointsFor(item),duration=Math.max(.1,item.sceneDuration);return points?duration*integral(points,age/duration)+Math.max(0,age-duration)*points[4]:age*(item.speed||1)}
 function at(item,age){const points=pointsFor(item);return points?rate(points,Math.max(0,age)/Math.max(.1,item.sceneDuration)):(item.speed||1)}
 const api={presets,pointsFor,rate,integral,mean,elapsed,at};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.SpeedCurve=api;
})(globalThis);
