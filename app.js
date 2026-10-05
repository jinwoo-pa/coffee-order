import {initialState,aggregate,byPerson,cafeText,saveState,loadState,addChoice,clearOrders} from './core.js';
const $=id=>document.getElementById(id);
let storage;try{storage=window.localStorage;}catch{}
const loaded=loadState(storage);let state=loaded.state;let editId=null;let pendingAction=null;let toastTimer;
if(loaded.error)warn('저장된 주문을 불러오지 못했어요. 기존 저장 내용은 그대로 두었습니다. 새로 입력하면 기존 내용을 덮어쓸 수 있어요.');
function warn(message){$('storage-warning').textContent=message;$('storage-warning').hidden=false;}
function persist(){if(!saveState(storage,state))warn('주문을 저장하지 못했어요. 현재 화면에서는 계속 사용할 수 있지만, 창을 닫으면 주문이 사라질 수 있어요.');else $('storage-warning').hidden=true;}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function fillSelect(id,choices){const select=$(id);const previous=select.value;select.replaceChildren(new Option(id==='coffee'?'커피를 선택해주세요':'크기를 선택해주세요',''));for(const value of choices)select.add(new Option(value,value));if(choices.includes(previous))select.value=previous;}
function resetEdit(){editId=null;$('form-title').textContent='누구의 커피인가요?';$('add-order').textContent='＋ 주문 추가';$('cancel-edit').hidden=true;$('form-error').hidden=true;$('order-form').reset();}
function render(){
 fillSelect('coffee',state.coffees);fillSelect('size',state.sizes);
 $('entry-view').hidden=state.completed;$('result-view').hidden=!state.completed;
 $('step-entry').classList.toggle('active',!state.completed);$('step-result').classList.toggle('active',state.completed);
 $('page-title').replaceChildren(...(state.completed?[element('span','모두의 커피,'),element('br'),element('span','한눈에 확인하세요.')]:[element('span','주문은 간단하게,'),element('br'),element('span','커피는 다 함께.')]));
 $('page-description').textContent=state.completed?'주문할 때도, 커피를 나눌 때도 이 목록 하나면 돼요.':'한 사람씩 담으면, 카페 주문까지 한 번에 정리돼요.';
 $('entry-count').textContent=state.orders.length;$('complete').disabled=!state.orders.length;$('delete-orders').disabled=!state.orders.length;
 $('order-list').replaceChildren();
 if(!state.orders.length){const empty=element('div',undefined,'empty');empty.append(element('span','☕','empty-icon'),element('p','아직 담은 주문이 없어요.'),element('small','첫 번째 커피를 담아보세요.'));$('order-list').append(empty);}
 for(const order of state.orders){const row=element('div',undefined,'order-row');const info=element('div',undefined,'order-info');info.append(element('strong',order.name),element('p',`${order.coffee} · ${order.temperature} · ${order.size}`));const actions=element('div',undefined,'row-actions');for(const [action,label] of [['edit','수정'],['delete','삭제']]){const button=element('button',label,'text-button');button.type='button';button.dataset.action=action;button.dataset.id=order.id;button.setAttribute('aria-label',`${order.name} ${order.coffee} ${label}`);actions.append(button);}row.append(info,actions);$('order-list').append(row);}
 $('personal-list').replaceChildren();
 for(const person of byPerson(state.orders)){const box=element('div',undefined,'person');const heading=element('div',undefined,'person-heading');heading.append(element('strong',person.name),element('span',`${person.orders.length}잔`,'muted'));box.append(heading);for(const item of aggregate(person.orders)){const line=element('div',undefined,'drink-line');line.append(element('span',`${item.coffee} · ${item.temperature} · ${item.size}`),element('b',`${item.count}잔`));box.append(line);}$('personal-list').append(box);}
 $('cafe-list').replaceChildren();for(const item of aggregate(state.orders)){const row=element('div',undefined,'cafe-row');const info=element('div');info.append(element('strong',item.coffee),element('p',`${item.temperature} · ${item.size}`,'muted'));row.append(info,element('strong',`${item.count}잔`,'cup-count'));$('cafe-list').append(row);}
 const total=element('div',undefined,'cafe-total');total.append(element('strong','전체 주문'),element('strong',`${state.orders.length}잔`));$('cafe-list').append(total);
 $('result-total').textContent=`총 ${state.orders.length}잔 · ${byPerson(state.orders).length}명`;
 $('completed-time').textContent=state.completedAt?new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(state.completedAt))+' 완료':'';
 $('copy-text').value=cafeText(state.orders);$('copy-fallback').hidden=true;
}
$('order-form').addEventListener('submit',event=>{event.preventDefault();const name=$('name').value.trim();const temperature=document.querySelector('input[name="temperature"]:checked')?.value;if(!name||!$('coffee').value||!$('size').value||!temperature){$('form-error').textContent='이름과 모든 옵션을 입력해주세요.';$('form-error').hidden=false;return;}const order={id:editId||(globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`),name,coffee:$('coffee').value,temperature,size:$('size').value};if(editId)state.orders=state.orders.map(o=>o.id===editId?order:o);else state.orders.push(order);const wasEdit=Boolean(editId);resetEdit();$('name').value=name;persist();render();toast(wasEdit?'주문을 수정했어요.':'커피 한 잔을 담았어요.');});
$('cancel-edit').addEventListener('click',resetEdit);
$('order-list').addEventListener('click',event=>{const button=event.target.closest('button[data-action]');if(!button)return;const order=state.orders.find(o=>o.id===button.dataset.id);if(!order)return;if(button.dataset.action==='delete'){state.orders=state.orders.filter(o=>o.id!==order.id);if(editId===order.id)resetEdit();persist();render();toast('주문을 삭제했어요.');return;}editId=order.id;$('name').value=order.name;$('coffee').value=order.coffee;$('size').value=order.size;document.querySelector(`input[name="temperature"][value="${order.temperature}"]`).checked=true;$('form-title').textContent='주문을 수정해주세요';$('add-order').textContent='수정 저장';$('cancel-edit').hidden=false;$('form-error').hidden=true;$('order-form').scrollIntoView({behavior:'smooth',block:'center'});$('name').focus({preventScroll:true});});
$('choice-form').addEventListener('submit',event=>{event.preventDefault();const key=$('choice-type').value;try{const value=$('choice-name').value.trim();state[key]=addChoice(state[key],value);persist();render();$(key==='coffees'?'coffee':'size').value=value;$('choice-name').value='';$('choice-error').hidden=true;toast('새 항목을 추가했어요.');}catch(error){$('choice-error').textContent=error.message;$('choice-error').hidden=false;}});
$('complete').addEventListener('click',()=>{if(!state.orders.length)return;if(editId){toast('수정 중인 주문을 저장하거나 취소해주세요.');return;}state.completed=true;state.completedAt=new Date().toISOString();persist();render();window.scrollTo({top:0,behavior:'smooth'});});
$('modify').addEventListener('click',()=>{state.completed=false;state.completedAt=null;persist();render();window.scrollTo({top:0,behavior:'smooth'});});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(cafeText(state.orders));toast('카페 주문을 복사했어요.');}catch{$('copy-fallback').hidden=false;$('copy-text').focus();$('copy-text').select();toast('아래 주문 내용을 직접 복사해주세요.');}});
function confirmAction(title,description,action){pendingAction=action;$('dialog-title').textContent=title;$('dialog-description').textContent=description;$('confirm-dialog').showModal();$('dialog-cancel').focus();}
$('dialog-cancel').addEventListener('click',()=>{$('confirm-dialog').close();pendingAction=null;});
$('confirm-dialog').addEventListener('cancel',()=>{pendingAction=null;});
$('dialog-confirm').addEventListener('click',()=>{const action=pendingAction;pendingAction=null;$('confirm-dialog').close();action?.();});
function clear(){state=clearOrders(state);resetEdit();persist();render();window.scrollTo({top:0,behavior:'smooth'});}
$('new-order').addEventListener('click',()=>confirmAction('새 주문을 시작할까요?','이전 주문과 이름별 내역이 삭제됩니다. 추가한 메뉴와 크기는 유지됩니다.',clear));
$('delete-orders').addEventListener('click',()=>confirmAction('주문내역을 삭제할까요?','보관된 모든 주문과 이름별 내역이 삭제됩니다. 삭제한 주문은 되돌릴 수 없습니다. 메뉴 설정은 유지됩니다.',clear));
$('reset').addEventListener('click',()=>confirmAction('앱 전체를 초기화할까요?','모든 주문과 직접 추가한 메뉴·크기를 삭제하고 기본 상태로 되돌립니다.',()=>{state=initialState();resetEdit();persist();render();toast('기본 상태로 초기화했어요.');}));
render();
