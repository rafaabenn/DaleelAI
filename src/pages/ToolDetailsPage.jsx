import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { recommendedTools } from '../data/tools';
import { 
  Star, 
  ArrowSquareOut, 
  BookmarkSimple, 
  ShareNetwork, 
  CheckCircle,
  ArrowLeft,
  Info
} from '@phosphor-icons/react';
import '../styles/pages/ToolDetailsPage.css';

export default function ToolDetailsPage() {
  const { id } = useParams();
  const [tool, setTool] = useState(null);

  useEffect(() => {
    // Scroll to top when loading the page
    window.scrollTo(0, 0);
    
    // Find the tool by ID
    const foundTool = recommendedTools.find(t => t.id === parseInt(id));
    setTool(foundTool);
  }, [id]);

  if (!tool) {
    return (
      <>
        <Navbar />
        <main className="tool-not-found">
          <div className="not-found-content">
            <h2>Outil introuvable</h2>
            <p>L'outil que vous recherchez n'existe pas ou a Ã©tÃ© supprimÃ©.</p>
            <Link to="/" className="btn-primary">Retour Ã  l'accueil</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Mock data for extended details
  const mockFeatures = [
    "Interface intuitive et facile Ã  utiliser",
    "GÃ©nÃ©ration ultra-rapide grÃ¢ce Ã  l'IA optimisÃ©e",
    "Support client rÃ©actif 24/7",
    "IntÃ©gration API disponible pour les dÃ©veloppeurs"
  ];

  return (
    <>
      <Navbar />
      
      <main className="tool-details-main">
        {/* Navigation Breadcrumb */}
        <div className="tool-breadcrumb">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            <span>Retour aux outils</span>
          </Link>
        </div>

        {/* Header Hero Section */}
        <section className="tool-hero-section">
          <div className="tool-hero-background" style={{ background: `linear-gradient(135deg, ${tool.avatarColor}40 0%, var(--bg-primary) 100%)` }}></div>
          
          <div className="tool-hero-content">
            <div className="tool-hero-avatar-wrapper">
              <div 
                className="tool-hero-avatar" 
                style={{ backgroundColor: tool.avatarColor }}
              >
                {tool.avatar}
              </div>
            </div>
            
            <div className="tool-hero-info">
              <div className="tool-hero-title-row">
                <h1 className="tool-hero-name">{tool.name}</h1>
                <div className="tool-hero-badges">
                  {tool.isTrending && <span className="badge-trending">ðŸ”¥ Tendance</span>}
                  {tool.isNew && <span className="badge-new">âœ¨ Nouveau</span>}
                </div>
              </div>
              
              <p className="tool-hero-desc">{tool.description}</p>
              
              <div className="tool-hero-meta">
                <div className="tool-rating-large">
                  <Star size={24} weight="fill" color="#f59e0b" />
                  <span className="rating-score">{tool.rating}</span>
                  <span className="rating-count">(+500 avis)</span>
                </div>
                
                <div className="tool-tags-list">
                  {tool.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="tool-tag" 
                      style={{ color: tag.color, backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30` }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <section className="tool-body-section">
          <div className="tool-main-column">
            
            <div className="tool-card-section about-section">
              <h2>Ã€ propos de {tool.name}</h2>
              <p>
                {tool.name} est une solution avancÃ©e conÃ§ue pour rÃ©volutionner votre maniÃ¨re de travailler. 
                GrÃ¢ce Ã  des algorithmes d'intelligence artificielle de pointe, cet outil vous permet d'automatiser 
                des tÃ¢ches complexes, de gÃ©nÃ©rer du contenu de haute qualitÃ© et de gagner un temps prÃ©cieux au quotidien.
              </p>
              <p>
                Que vous soyez un professionnel cherchant Ã  optimiser votre flux de travail ou un passionnÃ© explorant 
                les nouvelles technologies, {tool.name} offre une interface Ã©purÃ©e et des fonctionnalitÃ©s puissantes.
              </p>
            </div>

            <div className="tool-card-section features-section">
              <h2>FonctionnalitÃ©s Principales</h2>
              <ul className="features-list">
                {mockFeatures.map((feature, idx) => (
                  <li key={idx}>
                    <CheckCircle size={24} weight="fill" color="var(--primary)" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="tool-card-section visual-demo-section">
              <h2>AperÃ§u</h2>
              <div className="demo-placeholder" style={{ borderColor: tool.avatarColor }}>
                <div className="demo-placeholder-icon" style={{ color: tool.avatarColor }}>
                  {tool.avatar}
                </div>
                <p>Interface de {tool.name}</p>
              </div>
            </div>

          </div>

          <aside className="tool-sidebar-column">
            <div className="action-card">
              <a href="#" className="btn-visit-site" target="_blank" rel="noopener noreferrer">
                <span>Visiter le site officiel</span>
                <ArrowSquareOut size={20} weight="bold" />
              </a>
              
              <div className="secondary-actions">
                <button className="btn-secondary-action">
                  <BookmarkSimple size={20} />
                  Ajouter aux favoris
                </button>
                <button className="btn-secondary-action">
                  <ShareNetwork size={20} />
                  Partager l'outil
                </button>
              </div>
            </div>

            <div className="info-card">
              <h3>Informations Pratiques</h3>
              <ul className="info-list">
                <li>
                  <span className="info-label">ModÃ¨le Ã‰conomique</span>
                  <span className="info-value">{tool.tags.length > 1 ? tool.tags[1].label : 'Gratuit'}</span>
                </li>
                <li>
                  <span className="info-label">Plateformes</span>
                  <span className="info-value">Web, iOS, Android</span>
                </li>
                <li>
                  <span className="info-label">Langues</span>
                  <span className="info-value">FranÃ§ais, Anglais, +10</span>
                </li>
              </ul>
            </div>
            
            <div className="verification-card">
              <Info size={24} color="var(--text-muted)" />
              <p>Ces informations sont mises Ã  jour rÃ©guliÃ¨rement par notre communautÃ©. Si vous constatez une erreur, n'hÃ©sitez pas Ã  nous le signaler.</p>
            </div>
          </aside>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
