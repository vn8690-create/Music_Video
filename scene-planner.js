let sceneDraft=null,sceneReading=false;
function sceneBusy(){return !!run||loading||starting||aiBusy()||pexelsState.busy||sceneReading}
function invalidateSceneDraft(){sceneDraft=null;$('#sceneSuggestions').replaceChildren();$('#sceneSummary').textContent='Nội dung đã đổi. Bấm gợi ý hoặc tìm cảnh để phân tích lại.'}
function suggestScenes(){
 if(sceneBusy())return null;
 try{
  const result=SceneKeywords.analyze($('#sceneText').value,$('#sceneStyle').value);sceneDraft=result;const box=$('#sceneSuggestions');box.replaceChildren();
  result.queries.forEach((query,index)=>{const row=document.createElement('label');row.className='scene-query';const check=document.createElement('input');check.type='checkbox';check.checked=true;check.dataset.pexelsControl='';check.setAttribute('aria-label','Dùng từ khóa '+(index+1));const input=document.createElement('input');input.type='text';input.value=query;input.maxLength=100;input.dataset.pexelsControl='';input.setAttribute('aria-label','Từ khóa cảnh '+(index+1));row.append(check,input);box.append(row)});
  $('#sceneSummary').textContent=(result.matched?'Nhận ra: '+result.themes.join(' · ')+'. ':'Chưa nhận ra chủ đề rõ ràng. ')+(result.queries.length?'Đề xuất '+result.queries.length+' từ khóa; bro có thể sửa hoặc bỏ chọn.':'Chọn phong cách bên trên hoặc dùng ô Chủ đề / từ khóa bên dưới để tìm thủ công.');syncPexelsControls();return result;
 }catch(error){sceneDraft=null;$('#sceneSuggestions').replaceChildren();$('#sceneSummary').textContent=error.message;return null}
}
async function searchScenes(){if(sceneBusy())return;if(!sceneDraft&&!suggestScenes())return;const queries=[...document.querySelectorAll('.scene-query')].filter(row=>row.querySelector('input[type=checkbox]').checked).map(row=>row.querySelector('input[type=text]').value.trim()).filter(Boolean);if(!queries.length){$('#sceneSummary').textContent='Chọn ít nhất một từ khóa, hoặc chọn phong cách rồi gợi ý lại.';return}if(!$('#pexelsKey').value.trim())$('#sceneSummary').textContent='Dán API key của Pexels vào ô phía trên để bắt đầu tìm cảnh.';await searchPexelsQueries(queries)}
function initScenePlanner(){
 const style=$('#sceneStyle');for(const[value,entry]of Object.entries(SceneKeywords.styles)){const option=document.createElement('option');option.value=value;option.textContent=entry.label;style.append(option)}
 $('#sceneSuggest').onclick=suggestScenes;$('#sceneSearch').onclick=searchScenes;$('#sceneText').oninput=invalidateSceneDraft;style.onchange=invalidateSceneDraft;
 $('#sceneFile').onchange=async event=>{const file=event.target.files?.[0];if(!file||sceneBusy())return;sceneReading=true;pexelsState.busy=true;syncPexelsControls();try{const text=await SceneKeywords.readFile(file);$('#sceneText').value=text;invalidateSceneDraft();$('#sceneSummary').textContent='Đã đọc '+file.name+'. Bấm gợi ý từ khóa hoặc tìm cảnh.'}catch(error){$('#sceneSummary').textContent=error.message}finally{sceneReading=false;pexelsState.busy=false;event.target.value='';syncPexelsControls()}};
 $('#sceneClear').onclick=()=>{if(sceneBusy())return;$('#sceneText').value='';invalidateSceneDraft();$('#sceneSummary').textContent='Đã xóa lời và gợi ý khỏi phiên này.'};
}
