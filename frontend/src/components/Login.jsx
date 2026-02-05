import { useState } from 'react';
import { Activity, User, Mail, Lock, ArrowRight } from 'lucide-react';

const Hero = ({ type, active, title, text, buttonText, onButtonClick }) => {
  // Hero signup: left side (default position)
  // Hero signin: right side (left: 50%)
  const basePosition = type === 'signin' ? 'left-1/2' : 'left-0';

  let transform;
  if (type === 'signup') {
    transform = active ? 'translate-x-0' : '-translate-x-full';
  } else {
    transform = active ? 'translate-x-0' : 'translate-x-full';
  }

  return (
    <div className={`absolute ${basePosition} w-1/2 h-full z-30 flex flex-col items-center justify-center gap-4 px-10 text-center text-white transition-all duration-700 ease-in-out ${transform}`}>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-emerald-100 text-sm leading-relaxed opacity-90">{text}</p>
      <button
        onClick={onButtonClick}
        className="mt-4 px-8 py-3 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-bold text-sm hover:bg-white hover:text-emerald-600 transition-all duration-300"
      >
        {buttonText}
      </button>
    </div>
  );
};

const AuthForm = ({ type, active, title, children, onSubmit }) => {
  // Form signup: right side (left: 50%)
  // Form signin: left side (default position)
  const basePosition = type === 'signup' ? 'left-1/2' : 'left-0';

  let transform;
  if (type === 'signup') {
    transform = active ? 'translate-x-0' : 'translate-x-full';
  } else {
    transform = active ? 'translate-x-0' : '-translate-x-full';
  }

  return (
    <div className={`absolute ${basePosition} w-1/2 h-full z-10 flex flex-col justify-center gap-6 px-12 transition-all duration-700 ease-in-out ${transform}`}>
      <div>
        <h3 className="text-white font-bold text-2xl mb-1">{title}</h3>
        <p className="text-slate-400 text-xs">Rellena los campos para continuar</p>
      </div>
      <form className="flex flex-col gap-4 w-full" onSubmit={onSubmit}>
        {children}
      </form>
    </div>
  );
};

export const Login = ({ onLogin }) => {
  const [view, setView] = useState('signup');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const isSignup = view === 'signup';
  const toggleView = () => {
    setView(isSignup ? 'signin' : 'signup');
    setFormData({ username: '', email: '', password: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSignup) {
      console.log('Registrando:', formData);
      localStorage.setItem('user', JSON.stringify({
        username: formData.username,
        email: formData.email
      }));
      onLogin({ username: formData.username, email: formData.email });
    } else {
      console.log('Iniciando sesión:', formData);
      localStorage.setItem('user', JSON.stringify({
        username: formData.username || formData.email,
        email: formData.email
      }));
      onLogin({ username: formData.username || formData.email, email: formData.email });
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      {/* Brand Header */}
      <div className="flex items-center space-x-4 mb-10">
        <div className="bg-slate-900 p-3 rounded-2xl shadow-xl">
          <Activity className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter text-center">
            OSDI <span className="text-emerald-500 text-3xl">app</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Ontology for the Simulation of Diseases</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative overflow-hidden w-212.5 h-137.5 rounded-3xl bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        
        {/* Sliding Background Panel */}
        <div
          className="absolute inset-0 w-1/2 bg-linear-to-br from-emerald-500 to-emerald-700 z-20 transition-transform duration-700 ease-in-out shadow-2xl"
          style={{ transform: isSignup ? 'translateX(0)' : 'translateX(100%)' }}
        >
          {/* Decorative Pattern similar to Graph bg */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>

        {/* Signup Content */}
        <Hero
          type="signup" active={isSignup}
          title="¡Hola de nuevo!"
          text="Para mantenerte conectado, por favor inicia sesión con tu información personal."
          buttonText="INICIAR SESIÓN"
          onButtonClick={toggleView}
        />

        <AuthForm type="signup" active={isSignup} title="Crear Cuenta" onSubmit={handleSubmit}>
          <div className="relative">
            <User className="absolute left-3 top-4 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              name="username" 
              placeholder="Usuario" 
              value={formData.username}
              onChange={handleChange} 
              autoComplete="username"
              required
              className="pl-10 pr-4 py-3.5 w-full bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-4 w-4 h-4 text-slate-500" />
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={formData.email}
              onChange={handleChange} 
              autoComplete="email"
              required
              className="pl-10 pr-4 py-3.5 w-full bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-4 w-4 h-4 text-slate-500" />
            <input 
              type="password" 
              name="password" 
              placeholder="Contraseña" 
              value={formData.password}
              onChange={handleChange} 
              autoComplete="new-password"
              required
              className="pl-10 pr-4 py-3.5 w-full bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
            />
          </div>
          <button type="submit" className="mt-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2">
            <span>REGISTRARSE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </AuthForm>

        {/* Signin Content */}
        <Hero
          type="signin" active={!isSignup}
          title="¿Eres nuevo?"
          text="Regístrate y comienza a crear tus propios modelos de enfermedad hoy mismo."
          buttonText="CREAR CUENTA"
          onButtonClick={toggleView}
        />

        <AuthForm type="signin" active={!isSignup} title="Iniciar Sesión" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute left-3 top-4 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              name="username" 
              placeholder="Email o Usuario" 
              value={formData.username}
              onChange={handleChange} 
              autoComplete="username"
              required
              className="pl-10 pr-4 py-3.5 w-full bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-4 w-4 h-4 text-slate-500" />
            <input 
              type="password" 
              name="password" 
              placeholder="Contraseña" 
              value={formData.password}
              onChange={handleChange} 
              autoComplete="current-password"
              required
              className="text-white pl-10 pr-4 py-3.5 w-full bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
            />
          </div>
          <button 
            type="button"
            className="text-xs text-slate-500 hover:text-emerald-400 transition-colors w-fit font-medium"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <button type="submit" className="mt-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2">
            <span>ENTRAR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </AuthForm>

      </div>

      {/* Footer Info */}
      <p className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
        Creación de modelos de enfermedades v1.0
      </p>
    </div>
  );
};

export default Login;