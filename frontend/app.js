const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api';

const $ = id => document.getElementById(id);

function showAlert(msg, type='info'){
  const el = $('alert');
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove('d-none');
  setTimeout(()=> el.classList.add('d-none'), 4000);
}

function saveToken(t){ localStorage.setItem('fm_token', t); $('btn-logout').classList.remove('d-none'); }
function getToken(){ return localStorage.getItem('fm_token'); }
function logout(){ localStorage.removeItem('fm_token'); $('btn-logout').classList.add('d-none'); showLogin(); }

async function login(){
  const email = $('email').value;
  const password = $('password').value;
  try{
    const res = await fetch(`${API_BASE}/usuarios/login`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email,password})
    });
    if(!res.ok) throw new Error('Login falló');
    const data = await res.json();
    saveToken(data.token);
    showAlert('Login correcto','success');
    showApp();
    loadPlans();
  }catch(e){ showAlert(e.message,'danger'); }
}

async function loadPlans(){
  try{
    const res = await fetch(`${API_BASE}/planes`);
    const list = await res.json();
    const container = $('plans-list');
    container.innerHTML = '';
    list.forEach(p=>{
      const btn = document.createElement('button');
      btn.className = 'list-group-item list-group-item-action';
      btn.textContent = `${p.titulo} — ${p.coach_nombre} — $${p.precio}`;
      btn.onclick = () => loadPlanDetail(p.id);
      container.appendChild(btn);
    });
  }catch(e){ showAlert('No se pudieron cargar planes','danger'); }
}

async function loadPlanDetail(id){
  try{
    const res = await fetch(`${API_BASE}/planes/${id}`);
    if(!res.ok) throw new Error('Plan no encontrado');
    const p = await res.json();
    $('plan-detail').innerHTML = `<h6>${p.titulo}</h6><p>${p.descripcion}</p><p><strong>Coach:</strong> ${p.coach_nombre}</p><p><strong>Precio:</strong> $${p.precio}</p><p><a href='${p.url_vista_previa}' target='_blank'>Ver vista previa</a></p>`;
    $('train-plan-id').value = p.id;
  }catch(e){ showAlert(e.message,'danger'); }
}

async function registerTraining(){
  const fecha = $('train-date').value;
  const id_plan = Number($('train-plan-id').value);
  const token = getToken();
  if(!token){ showAlert('No autenticado','warning'); return; }
  // obtener usuario id desde token (simple parse)
  try{
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id || payload.sub || payload.userId;
    const res = await fetch(`${API_BASE}/usuarios/${userId}/entrenamientos`, {
      method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': 'Bearer '+token},
      body: JSON.stringify({fecha,id_plan})
    });
    if(!res.ok) throw new Error('Registro falló');
    const data = await res.json();
    showAlert(data.mensaje || 'Registrado','success');
  }catch(e){ showAlert(e.message,'danger'); }
}

function showLogin(){ $('login-section').classList.remove('d-none'); $('app-section').classList.add('d-none'); }
function showApp(){ $('login-section').classList.add('d-none'); $('app-section').classList.remove('d-none'); }

document.addEventListener('DOMContentLoaded', ()=>{
  $('btn-login').addEventListener('click', login);
  $('btn-register-train').addEventListener('click', registerTraining);
  $('btn-logout').addEventListener('click', logout);
  if(getToken()){ showApp(); loadPlans(); $('btn-logout').classList.remove('d-none'); } else showLogin();
});
