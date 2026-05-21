import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { recommendedTools } from '../data/tools';
import { 
  SquaresFour, 
  Wrench, 
  Users, 
  Gear, 
  SignOut, 
  MagnifyingGlass, 
  Plus, 
  PencilSimple, 
  Trash,
  Funnel,
  Star
} from '@phosphor-icons/react';
import '../styles/pages/AdminPage.css';

export default function AdminPage() {
  const [tools, setTools] = useState(recommendedTools);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    setTools(tools.filter(tool => tool.id !== id));
  };

  return (
    <>
      <Navbar isLoggedIn={true} isAdmin={true} />
      
      <main className="admin-main">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <Wrench size={28} weight="fill" color="var(--primary)" />
            <h2>Admin Panel</h2>
          </div>

          <nav className="admin-nav">
            <a href="#" className="admin-nav-item">
              <SquaresFour size={20} />
              <span>Tableau de bord</span>
            </a>
            <a href="#" className="admin-nav-item active">
              <Wrench size={20} />
              <span>Gestion des Outils</span>
            </a>
            <a href="#" className="admin-nav-item">
              <Users size={20} />
              <span>Utilisateurs</span>
            </a>
            <a href="#" className="admin-nav-item">
              <Gear size={20} />
              <span>ParamÃ¨tres</span>
            </a>
            <div className="admin-nav-divider"></div>
            <a href="/" className="admin-nav-item text-danger">
              <SignOut size={20} />
              <span>Retour au site</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="admin-content">
          <header className="admin-header">
            <div>
              <h1 className="admin-title">Gestion des Outils</h1>
              <p className="admin-subtitle">GÃ©rez la bibliothÃ¨que d'outils IA du rÃ©pertoire.</p>
            </div>
            <div className="admin-header-actions">
              <button className="btn-primary">
                <Plus size={20} />
                Ajouter un outil
              </button>
            </div>
          </header>

          {/* Table Controls */}
          <div className="admin-table-controls">
            <div className="admin-search-box">
              <MagnifyingGlass size={20} />
              <input 
                type="text" 
                placeholder="Rechercher un outil..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-outline">
              <Funnel size={20} />
              Filtrer
            </button>
          </div>

          {/* Table Container */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Outil</th>
                  <th>CatÃ©gorie</th>
                  <th>Prix</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.map((tool) => (
                  <tr key={tool.id}>
                    <td>
                      <div className="tool-cell-info">
                        <div 
                          className="tool-cell-avatar" 
                          style={{ backgroundColor: tool.avatarColor }}
                        >
                          {tool.avatar}
                        </div>
                        <div>
                          <div className="tool-cell-name">{tool.name}</div>
                          <div className="tool-cell-desc">{tool.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tag-pill" style={{ color: tool.tags[0].color, borderColor: tool.tags[0].color }}>
                        {tool.tags[0].label}
                      </span>
                    </td>
                    <td>
                      <span className="tag-pill tag-price">
                        {tool.tags[1]?.label || 'Gratuit'}
                      </span>
                    </td>
                    <td>
                      <div className="tool-rating-cell">
                        <Star size={16} weight="fill" color="#f59e0b" />
                        <span>{tool.rating}</span>
                      </div>
                    </td>
                    <td>
                      <div className="tool-cell-actions">
                        <button className="btn-action edit" title="Modifier">
                          <PencilSimple size={18} />
                        </button>
                        <button 
                          className="btn-action delete" 
                          title="Supprimer"
                          onClick={() => handleDelete(tool.id)}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredTools.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Aucun outil trouvÃ©.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
