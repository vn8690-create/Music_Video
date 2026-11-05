const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../speed-curve.js');
test('constant speed and flat curves map output seconds to source seconds',()=>{
 for(const speed of [.25,.5,1,2,4]){
  assert.equal(C.elapsed({speed,sceneDuration:8},3),3*speed);
  const item={speedMode:'custom',speedPoints:Array(5).fill(speed),sceneDuration:8};
  assert.equal(C.elapsed(item,3),3*speed);assert.equal(C.at(item,3),speed);
 }
});
test('ramp integral agrees with independent numeric integration and is monotonic',()=>{
 const points=C.presets['fast-slow'].points,item={speedMode:'fast-slow',speedPoints:points,sceneDuration:4};
 let area=0,last=0;const step=.0001;
 for(let t=step;t<=4;t+=step){area+=C.at(item,t-step/2)*step;const mapped=C.elapsed(item,t);assert.ok(mapped>=last);last=mapped}
 assert.ok(Math.abs(area-C.elapsed(item,4))<.001);
 assert.equal(C.at(item,1),3);assert.equal(C.at(item,2),.35);
 assert.ok(C.at(item,1.00001)>2.999);
});
test('duration rescaling preserves source span, and seeks do not depend on prior frames',()=>{
 const item={speed:1,sceneDuration:6},old=C.mean(item);item.speedMode='fast-slow';item.speedPoints=[...C.presets['fast-slow'].points];item.sceneDuration*=old/C.mean(item);
 assert.ok(Math.abs(C.elapsed(item,item.sceneDuration)-6)<1e-10);
 const target=C.elapsed(item,1.3);C.elapsed(item,3);C.elapsed(item,.1);assert.equal(C.elapsed(item,1.3),target);
 assert.equal(C.elapsed(item,-2),0);
});
