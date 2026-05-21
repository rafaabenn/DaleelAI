import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Robot,
  Brain,
  Sparkle,
  MagicWand,
  Lightbulb,
  GoogleLogo,
  GithubLogo
} from '@phosphor-icons/react';
import logo from '../assets/logo.png';
import './AuthPages.css';

const decoIcons = [
  { Icon: Robot,      className: 'deco deco-1' },
  { Icon: Brain,      className: 'deco deco-2' },
  { Icon: Sparkle,    className: 'deco deco-3' },
  { Icon: MagicWand,  className: 'deco deco-4' },
  { Icon: Lightbulb,  className: 'deco deco-5' },
];

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: logique d'authentification
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <img src={logo} alt="Daleel AI" className="auth-logo-img" />
          <span className="auth-logo-text">Daleel AI</span>
        </Link>

        <div className="auth-header">
          <h1 className="auth-title">Bon retour</h1>
          <p className="auth-subtitle">Connectez-vous à votre compte</p>
        </div>

        <div className="social-logins">
          <button type="button" className="social-btn">
            <GoogleLogo size={20} weight="bold" />
            Google
          </button>
          <button type="button" className="social-btn">
            <GithubLogo size={20} weight="fill" />
            GitHub
          </button>
        </div>

        <div className="auth-separator">
          <span>Ou connectez-vous avec un e-mail</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Mot de passe
              <a href="#" className="forgot-link">Mot de passe oublié ?</a>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-btn">
            Se connecter
          </button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="auth-switch-link">S'inscrire</Link>
        </p>
      </div>

      {/* Decorative background */}
      <div className="auth-bg-decoration">
        {decoIcons.map(({ Icon, className }, i) => (
          <span key={i} className={className}>
            <Icon size={48} weight="duotone" />
          </span>
        ))}
      </div>
    </div>
  );
}
