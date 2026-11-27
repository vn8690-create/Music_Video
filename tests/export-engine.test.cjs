const {test}=require('node:test');
const assert=require('node:assert/strict');
const ExportEngine=require('../export-engine.js');

test('prefers MP4/H.264 before WebM when supported',()=>{
  class Recorder{}
  Recorder.isTypeSupported=type=>type.startsWith('video/mp4')||type==='video/webm';
  const types=ExportEngine.supportedMimes(Recorder);
  assert.equal(types[0],'video/mp4;codecs=avc1.42E01E,mp4a.40.2');
  assert.ok(types.includes('video/webm'));
});
test('returns no recorder MIME types when support cannot be queried',()=>{
  assert.deepEqual(ExportEngine.supportedMimes(null),[]);
  assert.deepEqual(ExportEngine.supportedMimes(class Recorder{}),[]);
});
test('keeps resolution bitrate tiers and explicit AAC bitrate',()=>{
  assert.deepEqual(ExportEngine.bitrates(480,854),{videoBitsPerSecond:2500000,audioBitsPerSecond:192000});
  assert.deepEqual(ExportEngine.bitrates(1280,720),{videoBitsPerSecond:5000000,audioBitsPerSecond:192000});
  assert.deepEqual(ExportEngine.bitrates(1920,1080),{videoBitsPerSecond:8000000,audioBitsPerSecond:192000});
});
test('uses manual canvas frame requests when requestFrame is available',()=>{
  const calls=[],track={requestFrame(){calls.push('frame')},stop(){calls.push('stop')}};
  const stream={getVideoTracks:()=>[track],getTracks:()=>[track]};
  const canvas={captureStream(fps){calls.push(fps);return stream}};
  const capture=ExportEngine.createCanvasCapture(canvas,30);
  assert.equal(capture.manual,true);assert.equal(capture.track,track);
  capture.requestFrame();assert.deepEqual(calls,[0,'frame']);
});
test('falls back to browser-paced captureStream(fps) without requestFrame',()=>{
  const calls=[],track={stop(){calls.push('stop')}};
  const manual={getVideoTracks:()=>[track],getTracks:()=>[track]};
  const automatic={getVideoTracks:()=>[{id:'automatic'}],getTracks:()=>[]};
  const canvas={captureStream(fps){calls.push(fps);return calls.length===1?manual:automatic}};
  const capture=ExportEngine.createCanvasCapture(canvas,30);
  assert.equal(capture.manual,false);assert.deepEqual(calls,[0,30]);
});
test('paces export rendering at target cadence',()=>{
  assert.equal(ExportEngine.shouldRender(1000,null,30),true);
  assert.equal(ExportEngine.shouldRender(1016,1000,30),false);
  assert.equal(ExportEngine.shouldRender(1034,1000,30),true);
  assert.equal(ExportEngine.shouldRender(1050,1034,30),false);
  assert.equal(ExportEngine.shouldRender(1068,1034,30),true);
});
