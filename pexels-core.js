(function(root){
 const api={
  safeURL(value,media=false){try{const u=new URL(value);const host=u.hostname.toLowerCase();return u.protocol==='https:'&&!u.username&&!u.password&&(media?(host==='videos.pexels.com'||host==='images.pexels.com'||host==='player.vimeo.com'||host==='vod-progressive.akamaized.net'):(host==='www.pexels.com'||host==='pexels.com'))?u.href:null}catch{return null}},
  file(video,height=720){return(video.video_files||[]).filter(f=>f.file_type==='video/mp4'&&api.safeURL(f.link,true)&&f.width>0&&f.height>0).sort((a,b)=>Math.abs(Math.min(a.width,a.height)-height)-Math.abs(Math.min(b.width,b.height)-height))[0]||null},
  normalize(video,height){const file=api.file(video,height);if(!file||!Number.isSafeInteger(video.id)||video.duration<=0)return null;return{id:video.id,url:api.safeURL(video.url),author:String(video.user?.name||'Pexels'),authorUrl:api.safeURL(video.user?.url),poster:api.safeURL(video.image,true),duration:video.duration,width:file.width,height:file.height,link:file.link}},
  choose(videos,count,existing=[]){const used=new Set(existing);return videos.filter(v=>!used.has(v.id)&&used.add(v.id)).slice(0,Math.max(0,Math.min(12,count)))},
  credits(items){return 'Tư liệu video: Pexels — https://www.pexels.com\n'+[...new Map(items.filter(i=>i.pexels).map(i=>[i.pexels.id,i.pexels])).values()].map(v=>v.author+' — '+(v.url||'https://www.pexels.com')).join('\n')}
 };if(typeof module==='object')module.exports=api;else root.PexelsCore=api;
})(globalThis);
