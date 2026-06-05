import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import SidebarFilters from '../components/SidebarFilters';
import ToolCard from '../components/ToolCard';
import ToolDetailModal from '../components/ToolDetailModal';
import { Search, Sparkles, Star, Award, Compass, RefreshCw, Zap } from 'lucide-react';

export default function Home({ user, onOpenTrial, favorites, onToggleFav }) {
    const [tools, setTools] = useState([]);
    const [filters, setFilters] = useState({
        q: '',
        category: '',
        pricing: '',
        language: '',
        gdpr: '0',
        api: '0',
        mobile: '0'
    });
    const [loading, setLoading] = useState(true);
    const [selectedToolId, setSelectedToolId] = useState(null);
    const [stats, setStats] = useState({ total_tools: 0, avg_rating: 0 });

    useEffect(() => {
        // Retrieve some basic quick statistics for the header
        fetch('http://localhost:8000/api/tools')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    const total = res.tools.length;
                    const ratings = res.tools.map(t => parseFloat(t.average_rating)).filter(r => r > 0);
                    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '4.5';
                    setStats({ total_tools: total, avg_rating: avg });
                }
            })
            .catch(err => console.error("Erreur stats rapides", err));
    }, []);

    const loadTools = async () => {
        setLoading(true);
        try {
            const res = await api.tools.getTools(filters);
            if (res.success) {
                setTools(res.tools);
            }
        } catch (err) {
            console.error("Erreur de chargement des outils", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTools();
    }, [filters]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        loadTools();
    };

    return (
        <div style={{ position: 'relative' }}>
            <div className="gradient-bg"></div>
            
            {/* Academic Hero Header Block */}
            <div style={{
                textAlign: 'center',
                padding: '40px 20px 20px 20px',
                maxWidth: '800px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div className="badge badge-purple" style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    gap: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 700
                }}>
                    <Sparkles size={14} />
                    Moteur de Recherche Académique Intelligent
                </div>
                
                <h1 style={{
                    fontSize: '2.8rem',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    background: 'linear-gradient(135deg, #ffffff 0%, #d946ef 50%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'var(--font-display)'
                }}>
                    Trouvez le bon outil d'IA pour vos travaux scientifiques
                </h1>
                
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    maxWidth: '600px',
                    lineHeight: '1.6'
                }}>
                    Centralisation, filtrage multi-critères strict (RGPD, API, Mobile) et classement pondéré objectif selon des critères académiques.
                </p>

                {/* Micro KPIs Info */}
                <div style={{
                    display: 'flex',
                    gap: '24px',
                    marginTop: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '8px 24px',
                    borderRadius: '30px',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                        📚 <strong>{stats.total_tools || 12}</strong> Outils IA Indexés
                    </span>
                    <span style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></span>
                    <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                        ⭐ Note Moyenne : <strong>{stats.avg_rating || '4.6'}/5</strong>
                    </span>
                </div>
            </div>

            {/* Weighted Sorting Math Informative Block */}
            <div className="glass-panel" style={{
                maxWidth: '1000px',
                margin: '24px auto',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                background: 'rgba(168, 85, 247, 0.04)',
                border: '1px dashed rgba(168, 85, 247, 0.25)',
                borderRadius: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Award size={18} color="#d946ef" />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'white', fontWeight: 700 }}>
                            Algorithme de Recherche et Classement Pondéré
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#d946ef' }}>
                            Score calculé dynamiquement par Daleel AI pour assurer l'objectivité
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d946ef' }}>35%</span>
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Pertinence</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>+</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f97316' }}>25%</span>
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Notes Avis</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>+</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>20%</span>
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Fraîcheur</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>+</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6' }}>20%</span>
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Popularité</span>
                    </div>
                </div>
            </div>

            {/* Central Portal Layout */}
            <div className="portal-layout">
                {/* 1. Sidebar Filters on left */}
                <SidebarFilters filters={filters} setFilters={setFilters} />

                {/* 2. Search & Tool Grid lists on right */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Integrated Search Input Form */}
                    <form onSubmit={handleSearchSubmit} className="glass-panel" style={{
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '14px',
                        background: 'rgba(24, 25, 38, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                        <div style={{ paddingLeft: '16px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                            <Search size={18} />
                        </div>
                        <input 
                            type="text" 
                            value={filters.q}
                            onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                            placeholder="Rechercher par nom d'outil ou mot-clé académique (ex: traduction, illustration, code...)"
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                padding: '12px 8px',
                                fontSize: '0.95rem'
                            }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '10px' }}>
                            Rechercher
                        </button>
                    </form>

                    {/* Results Count Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                            Outils trouvés : <strong style={{ color: 'white' }}>{tools.length}</strong>
                        </span>
                        
                        {filters.q || filters.category || filters.pricing !== '' || filters.language !== '' || filters.gdpr === '1' || filters.api === '1' || filters.mobile === '1' ? (
                            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                Filtres actifs
                            </span>
                        ) : null}
                    </div>

                    {/* Cards Loading & Render Grid */}
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Filtres & Classement pondéré en cours...</span>
                        </div>
                    ) : tools.length > 0 ? (
                        <div className="cards-grid">
                            {tools.map(tool => (
                                <ToolCard 
                                    key={tool.id} 
                                    tool={tool} 
                                    isFavorited={favorites.includes(tool.id)}
                                    onToggleFav={onToggleFav}
                                    onSelect={(id) => setSelectedToolId(id)}
                                    user={user}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel" style={{
                            padding: '60px 40px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'rgba(255,255,255,0.01)',
                            borderStyle: 'dashed'
                        }}>
                            <Compass size={48} color="#6b7280" />
                            <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Aucun outil ne correspond à vos critères</h3>
                            <p style={{ color: '#6b7280', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto' }}>
                                Essayez d'élargir vos termes de recherche ou de désactiver certains critères de conformité (RGPD, API, Mobile).
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Float Tool Detail Modal Overlay */}
            {selectedToolId && (
                <ToolDetailModal 
                    toolId={selectedToolId}
                    onClose={() => setSelectedToolId(null)}
                    user={user}
                    isFavorited={favorites.includes(selectedToolId)}
                    onToggleFav={onToggleFav}
                    onOpenTrial={(t) => {
                        setSelectedToolId(null);
                        onOpenTrial(t);
                    }}
                />
            )}
        </div>
    );
}
