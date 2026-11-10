// Small, deterministic multilingual keyword rules. All lyric processing stays on device.
(function(root){
 const styles={auto:{label:'Theo lời bài hát',extra:[]},cinematic:{label:'Điện ảnh',extra:['cinematic landscape','city aerial sunset']},romantic:{label:'Lãng mạn',extra:['couple sunset','flowers soft light']},sad:{label:'Buồn / cô đơn',extra:['lonely person','rain window night']},neon:{label:'Vinahouse / neon',extra:['neon lights','nightclub laser lights','abstract colorful lights']},nature:{label:'Thiên nhiên',extra:['forest sunlight','ocean waves','mountain landscape']}};
 const rules=[
  ['rain','Mưa',['mưa','rain','rainy','雨'],['rain window','rain city street']],
  ['night','Đêm',['đêm','night','midnight','夜'],['city night','moon night sky']],
  ['alone','Cô đơn',['cô đơn','một mình','lẻ loi','lonely','alone','ひとり','一人','孤独'],['lonely person','empty street']],
  ['sad','Nhớ / chia xa',['nhớ em','nhớ anh','nỗi nhớ','chia tay','chia xa','buồn','nước mắt','khóc','heartbreak','tears','goodbye','sad','涙','悲しい','さよなら'],['sad person window','person walking away']],
  ['love','Tình yêu',['yêu','tình yêu','thương em','thương anh','bên nhau','love','romance','couple','恋','愛'],['couple sunset','couple walking']],
  ['sea','Biển',['biển','đại dương','bờ cát','sóng biển','ocean','sea','beach','海'],['ocean waves','beach sunset']],
  ['forest','Rừng',['rừng','cây xanh','lá xanh','forest','woods','森'],['forest sunlight','forest aerial']],
  ['mountain','Núi',['núi','đồi','mountain','hills','山'],['mountain landscape','mountain clouds']],
  ['flower','Hoa',['hoa đào','hoa anh đào','sakura','cherry blossom','桜'],['cherry blossom','spring flowers']],
  ['flowers','Vườn hoa',['hoa','flower','flowers','花'],['flowers garden','flowers close up']],
  ['snow','Tuyết / mùa đông',['tuyết','mùa đông','snow','winter','雪','冬'],['snow falling','winter forest']],
  ['autumn','Mùa thu',['mùa thu','lá vàng','autumn','fall leaves','紅葉','秋'],['autumn leaves','autumn park']],
  ['sunset','Hoàng hôn',['hoàng hôn','chiều tà','sunset','dusk','夕焼け','夕暮れ'],['sunset sky','sunset landscape']],
  ['dawn','Bình minh',['bình minh','ban mai','sunrise','dawn','朝日'],['sunrise landscape','morning sunlight']],
  ['stars','Trăng / sao',['ánh trăng','mặt trăng','vầng trăng','bầu trời sao','ngôi sao','moon','stars','星空','月明かり'],['moon night sky','stars sky']],
  ['city','Phố / thành phố',['thành phố','con phố','phố','city','street','都会','街'],['city street','city aerial']],
  ['road','Hành trình',['con đường','đường về','hành trình','chuyến đi','road','journey','travel','旅'],['open road','road landscape']],
  ['home','Gia đình / quê nhà',['mẹ','cha','gia đình','quê hương','quê nhà','mái nhà','family','mother','father','hometown','家族','母','故郷'],['family home','countryside sunset']],
  ['dance','Nhảy / ánh đèn',['nhảy','sàn','vinahouse','nonstop','remix','dance','party','neon','disco','踊','ダンス'],['neon lights','nightclub laser lights']],
  ['hope','Hy vọng',['hy vọng','ước mơ','ngày mai','tương lai','hope','dream','tomorrow','未来','希望','夢'],['sunrise horizon','person mountain summit']],
  ['river','Sông / dòng nước',['sông','dòng nước','river','stream','川'],['river landscape','river aerial']],
  ['fire','Lửa',['ngọn lửa','lửa','fire','flames','炎'],['fire flames','sparks dark']]
 ];
 function fold(text){return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()}
 function clean(text){return String(text).replace(/^\uFEFF/,'').replace(/\[[^\]\n]{1,60}\]/g,' ').replace(/<\d{1,2}:\d{2}(?:\.\d+)?>/g,' ').trim()}
 function matches(text,phrase,original){if(['mẹ','sàn'].includes(phrase))return new RegExp('(?:^|[^\\p{L}])'+phrase+'(?=$|[^\\p{L}])','u').test(original.normalize('NFC').toLowerCase());const p=fold(phrase);if(/[\u3040-\u30ff\u3400-\u9fff]/u.test(p))return text.includes(p);const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?:^|[^a-z0-9])'+escaped+'(?=$|[^a-z0-9])','u').test(text)}
 function analyze(text,style='auto'){
  text=clean(text);if(!text)throw Error('Thêm lời bài hát hoặc mô tả MV trước nhé.');if(text.length>20000)throw Error('Nội dung quá dài. Dùng tối đa 20.000 ký tự cho mỗi lượt.');
  style=styles[style]?style:'auto';const normalized=fold(text);
  const ranked=rules.map(([id,label,terms,queries],index)=>({id,label,queries,index,score:terms.reduce((n,p)=>n+(matches(normalized,p,text)?1:0),0)})).filter(r=>r.score).sort((a,b)=>b.score-a.score||a.index-b.index);
  // Specific blossoms override the generic flowers theme; repeated choruses don't inflate scores.
  const found=ranked.filter(r=>r.id!=='flowers'||!ranked.some(x=>x.id==='flower'));let queries=found.slice(0,3).map(r=>r.queries[0]);
  if(found.some(r=>r.id==='rain')&&found.some(r=>r.id==='night'))queries=queries.map(q=>q==='rain window'?'rain window night':q);
  if(style!=='auto')queries=[...styles[style].extra.slice(0,style==='neon'?2:1),...queries];
  for(const r of found)if(queries.length<3)queries.push(r.queries[1]);
  queries=[...new Set(queries)].slice(0,3);
  return{themes:found.slice(0,5).map(r=>r.label),queries,style:styles[style].label,matched:!!found.length};
 }
 async function readFile(file){if(!/\.txt$/i.test(file.name))throw Error('Chọn file .txt chứa lời bài hát hoặc mô tả MV.');if(file.size>200*1024)throw Error('File quá lớn. Chọn TXT tối đa 200 KB.');const bytes=new Uint8Array(await file.arrayBuffer());let encoding='utf-8';if(bytes[0]===255&&bytes[1]===254)encoding='utf-16le';else if(bytes[0]===254&&bytes[1]===255)encoding='utf-16be';let text;try{text=new TextDecoder(encoding,{fatal:true}).decode(bytes)}catch{throw Error('Không đọc được mã chữ. Lưu lại file TXT dạng UTF-8 rồi thử lại.')}if(text.includes('\0'))throw Error('File không phải văn bản hợp lệ.');if(text.length>20000)throw Error('Nội dung quá dài. Dùng tối đa 20.000 ký tự.');if(!clean(text))throw Error('File TXT chưa có nội dung.');return text}
 const api={styles,analyze,readFile};if(typeof module==='object')module.exports=api;else root.SceneKeywords=api;
})(globalThis);
