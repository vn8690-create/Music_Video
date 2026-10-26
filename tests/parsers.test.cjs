const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function stamp('),html.indexOf('function estimatedWords('));const sandbox={};vm.createContext(sandbox);vm.runInContext(source,sandbox);const parse=(s,d=12)=>JSON.parse(JSON.stringify(sandbox.parseLyrics(s,d)));
test('ASS word timestamps survive',()=>{const a=parse('Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,{\\k50}Xin {\\kf150}chào');assert.equal(a[0].words[0].end,1.5);assert.equal(a[0].words[1].end,3)});
test('LRC line end and enhanced word timings',()=>{assert.equal(parse('[00:01]Hello\n[00:03]World')[0].end,3);assert.equal(parse('[00:01]<00:01>Xin <00:01.50><00:01.50>chào<00:03>')[0].words[1].end,3)});
test('SRT and VTT Unicode',()=>{assert.equal(parse('1\n00:00:01,250 --> 00:00:03,500\nこんにちは')[0].start,1.25);assert.equal(parse('WEBVTT\n\n00:01.000 --> 00:02.500\nChào')[0].text,'Chào')});
test('plain text is not treated as timed lyrics',()=>assert.deepEqual(parse('Xin chào\nThế giới'),[]));
