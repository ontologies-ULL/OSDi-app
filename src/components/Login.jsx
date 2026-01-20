import { useState } from 'react';

const Hero =
  ({ type, active, title, text, buttonText, onButtonClick }) => (
    <div className={`hero hero--${type} ${active ? 'hero--active' : ''}`}>
      <h2>{title}</h2>
      <p>{text}</p>
      <button onClick={onButtonClick}>{buttonText}</button>
    </div>
  )

const AuthForm =
  ({ type, active, title, children }) => (
    <div className={`auth-form auth-form--${type} ${active ? 'auth-form--active' : ''}`}>
      <h3>{title}</h3>
      <p>Or use your email and password</p>
      <form>{children}</form>
    </div>
  )

export const Login = () => {
  const [view, setView] = useState('signup');
  const isSignup = view === 'signup';
  const toggleView = () => setView(isSignup ? 'signin' : 'signup');
  return (
    <div className="card">
      <div className="card-bg" style={{translate:isSignup ? 0 : "100%"}}/> 
      <Hero
        type="signup"
        active={isSignup}
        title="Welcome Back!"
        text="Sign in to continue your journey with us."
        buttonText="Sign In"
        onButtonClick={toggleView}
      />

      <AuthForm type="signup" active={isSignup}>
        <input type="text" placeholder="Username" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Sign Up</button>
      </AuthForm>

      <Hero
        type="signin"
        active={!isSignup}
        title="Hello, Friend!"
        text="Enter your details to get back into your account."
        buttonText="Sign Up"
        onButtonClick={toggleView}
      />

      <AuthForm type="signin" active={!isSignup} title="Sign In to Your Account">
        <input type="text" placeholder="Email / Username" />
        <input type="password" placeholder="Password" />
        <a>Forgot Password?</a>
        <button type="submit">Sign In</button>
      </AuthForm>
    </div>

  
  );
}