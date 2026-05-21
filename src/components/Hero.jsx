import { useState } from 'react';
import { suggestionPills } from '../data/tools';
import { Sparkle, MagnifyingGlass } from '@phosphor-icons/react';
import './Hero.css';

export default function Hero() {
  const [query, setQuery] = useState('');

  return (
    <section className="hero">
      <div className="hero-inner">
        <h1 className="hero-title">Le bon outil IA pour chaque besoin</h1>
        <p className="hero-subtitle">
          Plus de <strong>50 outils</strong> classés, comparés et recommandés
        </p>

        <div className="hero-search-wrapper">
          <div className="hero-search-box">
            <span className="search-icon">
              <Sparkle size={24} weight="duotone" color="#C9A84C" />
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Que voulez-vous faire aujourd'hui ?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="search-btn">
              <MagnifyingGlass size={20} weight="bold" className="search-btn-icon" />
              <span>Rechercher</span>
            </button>
          </div>
        </div>

        <div className="hero-pills">
          {suggestionPills.map((pill) => (
            <button
              key={pill}
              className="suggestion-pill"
              onClick={() => setQuery(pill)}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
