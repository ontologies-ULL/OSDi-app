/**
 * @file Login.jsx
 * @brief Authentication screen with animated sign-up / sign-in panel switching.
 *
 * Renders a full-screen login container with two overlapping panels that slide
 * in and out using a CSS transform animation. A green gradient sliding panel
 * acts as the visual divider between the active form and its hero call-to-action.
 *
 * Two private sub-components are defined within this module:
 * - `Hero`     — the branded call-to-action overlay shown on the active panel side.
 * - `AuthForm` — the form container that slides in from the opposite side.
 *
 * The main exported component `Login` manages the `view` state (`'signup'` |
 * `'signin'`), form field values, and persists the authenticated user to
 * `localStorage` on form submission.
 *
 * @module components/Login
 */

import { useState, useCallback } from 'react';
import { Activity, User, Mail, Lock, ArrowRight } from 'lucide-react';

/**
 * @brief Branded hero overlay shown on the currently active panel side.
 *
 * Positioned absolutely, this panel slides left or right depending on which
 * form is active. It contains a title, a descriptive text, and a button to
 * switch to the other view.
 *
 * @param {string}   props.type          - Panel side: `'signup'` (left) or `'signin'` (right).
 * @param {boolean}  props.active        - Whether this hero is currently visible (drives the transform).
 * @param {string}   props.title         - Heading text.
 * @param {string}   props.text          - Descriptive paragraph text.
 * @param {string}   props.buttonText    - Label for the view-switch button.
 * @param {Function} props.onButtonClick - Callback fired when the switch button is clicked.
 *
 * @returns {JSX.Element} The rendered hero overlay.
 */
const Hero = ({ type, active, title, text, buttonText, onButtonClick }) => {
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

/**
 * @brief Sliding form container for sign-up or sign-in fields.
 *
 * Positioned absolutely, slides in from the opposite side when its view
 * becomes active. Children are rendered inside a `<form>` element.
 *
 * @param {string}          props.type     - Form side: `'signup'` (right) or `'signin'` (left).
 * @param {boolean}         props.active   - Whether this form is currently visible.
 * @param {string}          props.title    - Form heading.
 * @param {React.ReactNode} props.children - Input fields and submit button.
 * @param {Function}        props.onSubmit - Form submission handler.
 *
 * @returns {JSX.Element} The rendered auth form container.
 */
const AuthForm = ({ type, active, title, children, onSubmit }) => {
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

/**
 * @brief Full-screen authentication screen with animated sign-up / sign-in switching.
 *
 * On successful form submission the user object is written to `localStorage`
 * and `onLogin` is called with the authenticated user data. No server-side
 * validation is performed — authentication is purely client-side.
 *
 * @param {Function} props.onLogin - Callback `(user: { username: string, email: string }) => void`
 *   called after a successful sign-up or sign-in submission.
 *
 * @returns {JSX.Element} The rendered login screen.
 */
export const Login = ({ onLogin }) => {
  /** 
   * @brief Active view state: `'signup'` or `'signin'`. 
   */
  const [view, setView] = useState('signup');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const isSignup = view === 'signup';

  /** 
   * @brief Switches between sign-up and sign-in views and clears the form. 
   */
  const toggleView = useCallback(() => {
    setView(prev => prev === 'signup' ? 'signin' : 'signup');
    setFormData({ username: '', email: '', password: '' });
  }, []);

  /** 
   * @brief Generic controlled-input change handler. 
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * @brief Handles form submission for both sign-up and sign-in.
   * Persists the user to `localStorage` and notifies the parent via `onLogin`.
   * @param {React.FormEvent} e - The form submit event.
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    if (isSignup) {
      localStorage.setItem('user', JSON.stringify({
        username: formData.username,
        email: formData.email
      }));
      onLogin({ username: formData.username, email: formData.email });
    } else {
      localStorage.setItem('user', JSON.stringify({
        username: formData.username || formData.email,
        email: formData.email
      }));
      onLogin({ username: formData.username || formData.email, email: formData.email });
    }
  }, [isSignup, formData, onLogin]);

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
          {/* Decorative dot pattern */}
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
