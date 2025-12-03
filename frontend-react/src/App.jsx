import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'https://psychic-dollop-v69qv5r75xvv26p4q-3000.app.github.dev/';

// --- COMPONENTES DE PANTALLA (DEFINIDOS FUERA DE App) ---

const WelcomeScreen = ({ setUserType, setStep }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-6">
    <div className="text-center text-white max-w-lg">
      <h1 className="text-4xl font-bold mb-2">Bienvenido a FitMarket</h1>
      <p className="mb-6">Encuentra el plan de entrenamiento perfecto para ti</p>
      <div className="space-y-3 max-w-xs mx-auto">
        <button onClick={() => { setUserType('user'); setStep(2); }} className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg">Soy un Usuario</button>
        <button onClick={() => { setUserType('coach'); setStep(2); }} className="w-full bg-blue-800 text-white font-bold py-3 rounded-lg">Soy un Entrenador</button>
        <button onClick={() => setStep(0)} className="w-full text-white underline">Iniciar sesión</button>
      </div>
    </div>
  </div>
);

const LoginForm = ({ handleLogin, setStep }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <div className="bg-white rounded-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Iniciar sesión</h2>
        <input type="email" placeholder="Correo Electrónico" className="w-full p-3 mb-3 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Contraseña" className="w-full p-3 mb-4 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={() => handleLogin(email, password)} className="flex-1 bg-blue-600 text-white py-2 rounded">Entrar</button>
          <button onClick={() => setStep(1)} className="flex-1 border py-2 rounded">Volver</button>
        </div>
      </div>
    </div>
  );
};

const RegisterForm = ({ formData, updateFormData, handleRegister }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-6">
    <div className="bg-white rounded-xl p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4 text-center">Crea tu Cuenta</h2>
      <input type="text" placeholder="Nombre Completo" className="w-full p-3 mb-3 border rounded" value={formData.name} onChange={(e) => updateFormData('name', e.target.value)} />
      <input type="email" placeholder="Correo Electrónico" className="w-full p-3 mb-3 border rounded" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} />
      <input type="password" placeholder="Contraseña" className="w-full p-3 mb-4 border rounded" value={formData.password} onChange={(e) => updateFormData('password', e.target.value)} />
      <button onClick={handleRegister} className="w-full bg-blue-600 text-white py-2 rounded">Registrarme</button>
    </div>
  </div>
);

const OnboardingForm = ({ formData, updateFormData, setStep }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-6">
    <div className="bg-white rounded-xl p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4 text-center">Personaliza tu Experiencia</h2>
      <div className="space-y-4">
        <div>
          <p className="font-semibold mb-2">¿Cuál es tu principal objetivo?</p>
          {['Perder Peso', 'Ganar Músculo', 'Mantenimiento'].map(g => (
            <button key={g} onClick={() => updateFormData('goal', g)} className={`w-full mb-2 p-3 border rounded text-left ${formData.goal === g ? 'bg-blue-100' : ''}`}>{g}</button>
          ))}
        </div>
        <div>
          <p className="font-semibold mb-2">¿Cómo describirías tu nivel?</p>
          {['Principiante', 'Intermedio', 'Avanzado'].map(l => (
            <button key={l} onClick={() => updateFormData('level', l)} className={`w-full mb-2 p-3 border rounded text-left ${formData.level === l ? 'bg-blue-100' : ''}`}>{l}</button>
          ))}
        </div>
        <div>
          <p className="font-semibold mb-2">¿Dónde entrenarás?</p>
          {['En Casa', 'En Gimnasio'].map(loc => (
            <button key={loc} onClick={() => updateFormData('location', loc)} className={`w-full mb-2 p-3 border rounded text-left ${formData.location === loc ? 'bg-blue-100' : ''}`}>{loc}</button>
          ))}
        </div>
        <button onClick={() => setStep(4)} className="w-full bg-green-600 text-white py-2 rounded">Ver Planes Recomendados</button>
      </div>
    </div>
  </div>
);

const HomeScreen = ({ currentUser, formData, plans, fetchPlans, logout, registerTraining }) => (
  <div className="min-h-screen bg-gray-100 p-6">
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">FitMarket</h1>
        <p className="text-sm text-gray-600">Hola, {currentUser?.nombre || formData.name || 'invitado'}!</p>
      </div>
      <div className="flex items-center gap-2">
        {currentUser ? (
          <>
            <button onClick={() => { fetchPlans(); }} className="px-3 py-2 border rounded">Actualizar</button>
            <button onClick={logout} className="px-3 py-2 bg-red-500 text-white rounded">Cerrar sesión</button>
          </>
        ) : (
          <button onClick={() => setStep(0)} className="px-3 py-2 border rounded">Iniciar sesión</button>
        )}
      </div>
    </header>
    <main>
      <h2 className="text-xl font-semibold mb-4">Planes Recomendados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.length === 0 && (
          <div className="p-4 bg-white rounded">No hay planes disponibles. Pulsa "Actualizar".</div>
        )}
        {plans.map(plan => (
          <div key={plan.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{plan.titulo || plan.nombre || 'Plan'}</h3>
            <p className="text-sm text-gray-600">{plan.descripcion || plan.resumen || ''}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-lg font-bold text-green-600">{plan.precio ? `$${plan.precio}` : ''}</div>
              <button onClick={() => registerTraining(plan.id)} className="px-3 py-2 bg-blue-600 text-white rounded">Marcar completado</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);


// --- COMPONENTE PRINCIPAL ---
function App() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', goal: '', level: '', location: '' });
  const [token, setToken] = useState(() => { try { return localStorage.getItem('fm_token'); } catch (e) { return null; } });
  const [currentUser, setCurrentUser] = useState(() => { try { const u = localStorage.getItem('fm_user'); return u ? JSON.parse(u) : null; } catch (e) { return null; } });
  const [plans, setPlans] = useState([]);
  const [alert, setAlert] = useState(null);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showAlert = (msg, type = 'info') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const saveToken = (tok) => { try { localStorage.setItem('fm_token', tok); setToken(tok); } catch (e) { } };
  const saveUser = (user) => { try { localStorage.setItem('fm_user', JSON.stringify(user)); } catch (e) { } setCurrentUser(user); if (user && user.nombre) setFormData(prev => ({ ...prev, name: user.nombre })); };

  const handleRegister = async () => {
    try {
      const res = await fetch(`${API_BASE}/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: formData.name, email: formData.email, password: formData.password }) });
      if (res.status === 409) { showAlert('El email ya está registrado', 'warning'); return; }
      if (!res.ok) { const err = await res.json().catch(() => ({})); showAlert(err.error || 'Error al registrar', 'danger'); return; }
      const data = await res.json(); if (data.token) saveToken(data.token); if (data.usuario) saveUser(data.usuario); showAlert('Registro exitoso', 'success'); setStep(3);
    } catch (e) { showAlert('Error de red', 'danger'); }
  };

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/usuarios/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); showAlert(err.error || 'Login falló', 'danger'); return false; }
      const data = await res.json(); if (data.token) saveToken(data.token); if (data.usuario) saveUser(data.usuario); showAlert('Login correcto', 'success'); setStep(4); return true;
    } catch (e) { showAlert('Error de red', 'danger'); return false; }
  };

  const fetchPlans = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/planes`, { headers }); if (!res.ok) throw new Error('No se pudieron obtener planes');
      const data = await res.json(); setPlans(data || []);
    } catch (e) { /* silently ignore for now */ }
  };

  const registerTraining = async (planId) => {
    if (!currentUser || !currentUser.id) { showAlert('Usuario no autenticado', 'warning'); return; }
    try {
      const headers = { 'Content-Type': 'application/json' }; if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/usuarios/${currentUser.id}/entrenamientos`, { method: 'POST', headers, body: JSON.stringify({ id_plan: planId }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); showAlert(err.error || 'No se pudo registrar entrenamiento', 'danger'); return; }
      showAlert('Entrenamiento registrado', 'success');
    } catch (e) { showAlert('Error de red', 'danger'); }
  };

  const logout = () => { try { localStorage.removeItem('fm_token'); localStorage.removeItem('fm_user'); } catch (e) { } setToken(null); setCurrentUser(null); setStep(1); setPlans([]); showAlert('Sesión cerrada', 'info'); };

  useEffect(() => { if (token && step === 4) fetchPlans(); }, [token, step]);

  const renderScreen = () => {
    switch (step) {
      case 0: return <LoginForm handleLogin={handleLogin} setStep={setStep} />;
      case 1: return <WelcomeScreen setUserType={setUserType} setStep={setStep} />;
      case 2: return <RegisterForm formData={formData} updateFormData={updateFormData} handleRegister={handleRegister} />;
      case 3: return <OnboardingForm formData={formData} updateFormData={updateFormData} setStep={setStep} />;
      case 4: return <HomeScreen currentUser={currentUser} formData={formData} plans={plans} fetchPlans={fetchPlans} logout={logout} registerTraining={registerTraining} />;
      default: return <WelcomeScreen setUserType={setUserType} setStep={setStep} />;
    }
  };

  return (
    <>
      {alert && (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
          <div className={`p-3 rounded shadow ${alert.type === 'danger' ? 'bg-red-200' : alert.type === 'success' ? 'bg-green-200' : 'bg-blue-200'}`}>
            {alert.msg}
          </div>
        </div>
      )}
      {renderScreen()}
    </>
  );
}

export default App;