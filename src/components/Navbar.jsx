import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@phosphor-icons/react';
import logo from '../assets/logo.png';
import '../styles/components/Navbar.css';

export default function Navbar({ isLoggedIn = false }) {
  const [active, setActive] = useState('accueil');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Daleel AI" className="navbar-logo-img" />
          <span className="navbar-logo-text">Daleel AI</span>
        </Link>

        {/* Links */}
        <ul className="navbar-links">
          {['Accueil', 'CatÃ©gories', 'Collections'].map((item) => (
            <li key={item}>
              <a
                href="#"
                className={`navbar-link ${active === item.toLowerCase() ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActive(item.toLowerCase()); }}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>

        {/* Auth buttons */}
        <div className="navbar-auth">
          {isLoggedIn ? (
            <>
              <div className="user-profile">
                <div className="user-avatar">
                  <User size={20} weight="bold" />
                </div>
                <span className="user-name">Mon Profil</span>
              </div>
              <Link to="/" className="btn-logout">DÃ©connexion</Link>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn-login">Se connecter</Link>
              <Link to="/inscription" className="btn-register">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
