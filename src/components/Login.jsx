import { useState } from 'react';

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
    <div
      className={`
        absolute ${basePosition} w-1/2 h-full z-30 flex flex-col items-center justify-center gap-2.5 px-6
        text-white transition-all duration-650 ease-in-out ${transform}
      `}
    >
      <h2 className="m-0 font-medium text-[32px]">{title}</h2>
      <p className="text-white text-xs">{text}</p>
      <button
        onClick={onButtonClick}
        className="border-0 py-3.5 px-0 rounded-4xl text-white w-40 bg-emerald-500/80 cursor-pointer font-semibold text-sm hover:bg-emerald-700 transition-all mt-4"
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
    <div
      className={`
        absolute ${basePosition} w-1/2 h-full bg-inherit z-10 flex flex-col justify-center gap-4 px-8
        transition-all duration-650 ease-in-out ${transform}
      `}
    >
      <h3 className="text-white font-medium text-xl">{title}</h3>
      <p className="text-slate-400 text-xs mb-2">También puedes usar tu correo electrónico y contraseña</p>
      <form className="flex flex-col items-center gap-3 w-full" onSubmit={onSubmit}>
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="relative overflow-hidden w-165 h-110 rounded-2xl bg-slate-800 shadow-2xl">
        {/* Background sliding panel */}
        <div
          className="absolute inset-0 w-1/2 bg-linear-to-br from-emerald-500/ to-emerald-600 z-20 transition-transform duration-650 ease-in-out"
          style={{
            transform: isSignup ? 'translateX(0)' : 'translateX(100%)'
          }}
        />

        {/* Sign Up Hero - Left side when active */}
        <Hero
          type="signup"
          active={isSignup}
          title="¡Bienvenido!"
          text="Si ya tienes una cuenta, inicia sesión aquí."
          buttonText="Iniciar sesión"
          onButtonClick={toggleView}
        />

        {/* Sign Up Form - Left side when active */}
        <AuthForm
          type="signup"
          active={isSignup}
          title="Crear Cuenta"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            name="username"
            placeholder="Nombre de usuario"
            value={formData.username}
            onChange={handleChange}
            required
            className="rounded-xl border-0 bg-slate-700 py-3.5 px-3 w-full text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
            className="rounded-xl border-0 bg-slate-700 py-3.5 px-3 w-full text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
            className="rounded-xl border-0 bg-slate-700 py-3.5 px-3 w-full text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <button
            type="submit"
            className="border-0 py-3.5 px-0 rounded-4xl text-white w-40 bg-emerald-500/90 cursor-pointer font-semibold text-sm hover:bg-emerald-700 transition-all mt-2 shadow-lg shadow-emerald-500/20"
          >
            Registrarse
          </button>
        </AuthForm>

        {/* Sign In Hero - Right side when active */}
        <Hero
          type="signin"
          active={!isSignup}
          title="Hola, Amigo!"
          text="Si no tienes una cuenta, regístrate aquí."
          buttonText="Registrarse"
          onButtonClick={toggleView}
        />

        {/* Sign In Form - Right side when active */}
        <AuthForm
          type="signin"
          active={!isSignup}
          title="Iniciar sesión en tu cuenta"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            name="username"
            placeholder="Nombre de usuario"
            value={formData.username}
            onChange={handleChange}
            required
            className="rounded-xl border-0 bg-slate-700 py-3.5 px-3 w-full text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
            className="rounded-xl border-0 bg-slate-700 py-3.5 px-3 w-full text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <a
            href="#"
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors self-start font-medium mb-2"
            onClick={(e) => e.preventDefault()}
          >
            ¿Olvidaste tu contraseña?
          </a>
          <button
            type="submit"
            className="border-0 py-3.5 px-0 rounded-4xl text-white w-40 bg-emerald-500/90 cursor-pointer font-semibold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
          >
            Iniciar sesión
          </button>
        </AuthForm>
      </div>
    </div>
  );
};

export default Login;