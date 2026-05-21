import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ToolCard } from '../components/RecommendedTools';
import { recommendedTools } from '../data/tools';
import { BookmarkSimple, ClockCounterClockwise, User, Gear, SignOut, CaretRight, Star } from '@phosphor-icons/react';
import './DashboardPage.css';

export default function DashboardPage() {
  return (
    <>
      <Navbar isLoggedIn={true} />
      
      <main className="dashboard-main">
        {/* Welcome Section */}
        <section className="dashboard-hero">
          <div className="dashboard-hero-inner">
            <h1 className="dashboard-title">Tableau de bord</h1>
            <p className="dashboard-subtitle">
              Bienvenue dans votre espace personnel, <strong>Aya</strong> 👋
            </p>
          </div>
        </section>

        <div className="dashboard-content">
          {/* Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="dashboard-profile-card">
              <div className="profile-card-header">
                <div className="profile-avatar-large">
                  A
                </div>
                <div className="profile-info">
                  <h3>Aya Ghammad</h3>
                  <p>aya@exemple.com</p>
                </div>
              </div>
              <div className="profile-badge">
                <Star size={14} weight="fill" />
                Plan Pro
              </div>
            </div>

            <nav className="dashboard-nav">
              <a href="#" className="dash-nav-item active">
                <BookmarkSimple size={20} />
                <span>Mes Favoris</span>
                <span className="dash-badge">12</span>
              </a>
              <a href="#" className="dash-nav-item">
                <ClockCounterClockwise size={20} />
                <span>Historique</span>
                <span className="dash-badge">5</span>
              </a>
              <a href="#" className="dash-nav-item">
                <User size={20} />
                <span>Mon Profil</span>
              </a>
              <a href="#" className="dash-nav-item">
                <Gear size={20} />
                <span>Paramètres</span>
              </a>
              <div className="dash-nav-divider"></div>
              <a href="/" className="dash-nav-item text-danger">
                <SignOut size={20} />
                <span>Déconnexion</span>
              </a>
            </nav>
          </aside>

          {/* Main Dashboard Area */}
          <div className="dashboard-tools">
            <div className="dashboard-section-header">
              <h2>Mes outils favoris</h2>
              <button className="btn-manage">Gérer</button>
            </div>
            
            <div className="tools-grid">
              {/* Reuse the tool data to simulate saved tools */}
              {recommendedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
