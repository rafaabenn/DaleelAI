import logo from '../assets/logo.png';
import ilisiLogo from '../assets/ilisi_logo.png';
import fstmLogo from '../assets/fstm_logo.png';
import '../styles/components/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img src={logo} alt="Daleel AI" className="footer-logo-img" />
            <span className="footer-logo-text">Daleel AI</span>
          </div>
          <p className="footer-desc">
            Daleel AI is the premier AI tools directory, exclusively featuring
            high-quality, useful, and thoroughly tested tools. Discover the
            perfect AI tool for your task using our AI-powered search engine.
          </p>
        </div>

        {/* Get to know us */}
        <div className="footer-col">
          <h4 className="footer-col-title">Get to know Us</h4>
          <ul className="footer-team">
            {['GHAMMAD AYA', 'BENNOUR RAFAA', 'RIAD MARWA', 'AMANZOU AMAL'].map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>

        {/* Trusted by */}
        <div className="footer-col footer-trusted">
          <h4 className="footer-col-title">TRUSTED BY</h4>
          <div className="footer-logos">
            <img src={ilisiLogo} alt="ILISI" className="partner-logo" />
            <img src={fstmLogo} alt="FSTM" className="partner-logo" />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span>Â© 2026 Daleel AI. All rights reserved.</span>
        <div className="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">DCMA</a>
        </div>
      </div>
    </footer>
  );
}
