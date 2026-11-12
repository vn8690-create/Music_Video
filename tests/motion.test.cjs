const {test}=require('node:test'),assert=require('node:assert/strict');
const {phase}=require('../motion-lite.js');
test('motion intro/outro never extends song or overlaps on short audio',()=>{
 assert.equal(phase(4,20,3,'both').alpha,0);assert.equal(phase(18,20,3,'both').alpha,1);assert.equal(phase(20,20,3,'both').alpha,0);
 assert.equal(phase(18,20,3,'intro').alpha,0);assert.equal(phase(1,20,3,'outro').alpha,0);
 assert.equal(phase(.9,2,10,'both').alpha,phase(.9,2,1,'both').alpha);
 assert.deepEqual(phase(18,20,3,'both'),phase(18,20,3,'both'));assert.equal(phase(7,20,3,'always').alpha,1);
});
