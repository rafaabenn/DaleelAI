import React, { useState, useEffect } from 'react';
import { X, Star, ShieldCheck, Cpu, Smartphone, Heart, MessageSquare, Plus, ExternalLink, Calendar, Globe, Award } from 'lucide-react';
import { api } from '../services/api';

export default function ToolDetailModal({ toolId, onClose, user, isFavorited, onToggleFav, onOpenTrial }) {
    const [tool, setTool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ratingInput, setRatingInput] = useState(5);
    const [commentInput, setCommentInput] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState('');

    useEffect(() => {
        if (toolId) {
            loadToolDetails();
        }
    }, [toolId]);

    const loadToolDetails = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.tools.getDetail(toolId);
            if (res.success) {
                setTool(res.tool);
            } else {
                setError("Impossible de charger les détails.");
            }
        } catch (err) {
            setError("Erreur de connexion.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddReview = async (e) => {
        e.preventDefault();
        if (!user) return;
        setSubmittingReview(true);
        setReviewSuccess('');
        try {
            const res = await api.tools.submitReview(tool.id, ratingInput, commentInput);
            if (res.success) {
                setReviewSuccess("Votre avis a été soumis avec succès et attend la validation d'un modérateur !");
                setCommentInput('');
                // Reload tool info to see if reviews update (though pending ones won't show until admin validates them)
                setTimeout(() => {
                    loadToolDetails();
                }, 2000);
            }
        } catch (err) {
            setError(err.message || "Erreur de soumission de l'avis.");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="popup-overlay">
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', width: '320px' }}>
                    <div style={{ color: 'white', marginBottom: '16px' }}>Chargement de l'outil...</div>
                    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !tool) {
        return (
            <div className="popup-overlay">
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', width: '360px' }}>
                    <h3 style={{ color: '#f43f5e', marginBottom: '12px' }}>Erreur</h3>
                    <p style={{ color: '#9ca3af', marginBottom: '20px' }}>{error || "Outil introuvable."}</p>
                    <button className="btn-secondary" onClick={onClose}>Fermer</button>
                </div>
            </div>
        );
    }

    return (
        <div className="popup-overlay" style={{ padding: '20px' }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#0d0e16',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '20px'
            }}>
                {/* Header Block */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <img 
                            src={`https://icon.horse/icon/${new URL(tool.website_url).hostname}`}
                            alt={tool.name} 
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '12px',
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '6px',
                                objectFit: 'contain'
                            }}
                            onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=150'}
                        />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h2 style={{ fontSize: '1.6rem', color: 'white', fontWeight: 800 }}>{tool.name}</h2>
                                <div style={{
                                    background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
                                    border: '1px solid var(--accent-purple)',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    color: 'var(--accent-violet)',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }} title="Score de classement pondéré Daleel AI">
                                    <Award size={14} />
                                    <span>Score {tool.global_score}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <div style={{ display: 'flex', color: '#f59e0b' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star 
                                            key={star} 
                                            size={16} 
                                            fill={star <= Math.floor(parseFloat(tool.average_rating)) ? '#f59e0b' : 'transparent'} 
                                            color={star <= Math.floor(parseFloat(tool.average_rating)) ? '#f59e0b' : '#4b5563'} 
                                        />
                                    ))}
                                </div>
                                <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600 }}>
                                    {parseFloat(tool.average_rating) > 0 ? `${parseFloat(tool.average_rating).toFixed(1)} / 5.0` : 'Pas encore noté'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user && (
                            <button 
                                onClick={() => onToggleFav(tool.id)}
                                className="btn-secondary"
                                style={{
                                    padding: '8px 12px',
                                    color: isFavorited ? '#f43f5e' : '#9ca3af',
                                    borderColor: isFavorited ? '#f43f5e' : 'rgba(255,255,255,0.08)'
                                }}
                            >
                                <Heart size={16} fill={isFavorited ? '#f43f5e' : 'transparent'} />
                                <span>{isFavorited ? 'Favori' : 'Ajouter'}</span>
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: '#9ca3af',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Content Body */}
                <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '32px' }}>
                    {/* Left Panel: Description & Reviews */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', fontWeight: 700 }}>Description de l'Outil</h3>
                            <p style={{ fontSize: '0.92rem', color: '#e5e7eb', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                                {tool.full_description || tool.short_description}
                            </p>
                        </div>

                        {/* Reviews & Comments Section */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                <MessageSquare size={18} color="#d946ef" />
                                Avis des Chercheurs ({tool.reviews ? tool.reviews.length : 0})
                            </h3>

                            {/* Reviews list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                                {tool.reviews && tool.reviews.length > 0 ? (
                                    tool.reviews.map((r, i) => (
                                        <div key={i} className="glass-card" style={{ padding: '16px', background: 'rgba(24, 25, 38, 0.3)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 'bold' }}>
                                                        {r.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{r.username}</span>
                                                </div>
                                                <div style={{ display: 'flex', color: '#f59e0b', gap: '2px' }}>
                                                    {[1, 2, 3, 4, 5].map(st => (
                                                        <Star key={st} size={12} fill={st <= r.rating ? '#f59e0b' : 'transparent'} color={st <= r.rating ? '#f59e0b' : '#4b5563'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: '#d1d5db', fontStyle: 'italic' }}>
                                                "{r.comment}"
                                            </p>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '6px', textAlign: 'right' }}>
                                                {new Date(r.created_at).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#6b7280', fontSize: '0.88rem', fontStyle: 'italic', padding: '16px', textAlign: 'center' }}>
                                        Aucun avis n'a été publié pour cet outil. Soyez le premier à partager votre expérience académique !
                                    </div>
                                )}
                            </div>

                            {/* Add Review Form */}
                            {user ? (
                                <form onSubmit={handleAddReview} style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    padding: '20px',
                                    borderRadius: '12px'
                                }}>
                                    <h4 style={{ fontSize: '0.95rem', color: 'white', marginBottom: '14px', fontWeight: 600 }}>Rédiger une évaluation</h4>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Note :</span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button 
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRatingInput(star)}
                                                    style={{ background: 'transparent', cursor: 'pointer', padding: '2px' }}
                                                >
                                                    <Star 
                                                        size={20} 
                                                        fill={star <= ratingInput ? '#f59e0b' : 'transparent'} 
                                                        color={star <= ratingInput ? '#f59e0b' : '#4b5563'} 
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                                        <textarea
                                            rows="3"
                                            value={commentInput}
                                            onChange={(e) => setCommentInput(e.target.value)}
                                            placeholder="Partagez votre avis détaillé sur l'utilité académique de cette IA pour vos travaux de recherche..."
                                            className="input-field"
                                            required
                                            style={{ resize: 'none', fontSize: '0.85rem' }}
                                        />
                                    </div>

                                    {reviewSuccess && (
                                        <div style={{ color: '#10b981', fontSize: '0.82rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldCheck size={16} />
                                            <span>{reviewSuccess}</span>
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        className="btn-primary" 
                                        disabled={submittingReview}
                                        style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}
                                    >
                                        {submittingReview ? 'Envoi...' : 'Soumettre mon avis'}
                                    </button>
                                </form>
                            ) : (
                                <div className="glass-card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(139,92,246,0.03)', border: '1px dashed rgba(139,92,246,0.2)' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                                        Veuillez vous <strong>connecter</strong> ou vous <strong>inscrire</strong> pour soumettre un avis.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Metadatas, Actions, trial redirect */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Primary Call to Action: FREE TRIAL */}
                        <div className="glass-panel" style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, rgba(20, 21, 33, 0.9) 0%, rgba(40, 20, 70, 0.9) 100%)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '16px',
                            textAlign: 'center'
                        }}>
                            <h4 style={{ fontSize: '1rem', color: 'white', fontWeight: 700, marginBottom: '8px' }}>Tester l'Outil</h4>
                            <p style={{ fontSize: '0.8rem', color: '#c084fc', marginBottom: '18px' }}>
                                Accédez immédiatement aux fonctionnalités d'évaluation.
                            </p>

                            {user ? (
                                <button 
                                    onClick={() => onOpenTrial(tool)}
                                    className="btn-success"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        padding: '12px',
                                        fontSize: '0.92rem',
                                        borderRadius: '10px'
                                    }}
                                >
                                    <span>Lancer l'Essai Gratuit</span>
                                    <ExternalLink size={16} />
                                </button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button 
                                        disabled
                                        className="btn-secondary"
                                        style={{
                                            width: '100%',
                                            justifyContent: 'center',
                                            padding: '12px',
                                            fontSize: '0.92rem',
                                            borderRadius: '10px',
                                            opacity: 0.6,
                                            cursor: 'not-allowed'
                                        }}
                                    >
                                        Essai Gratuit (Inscrit requis)
                                    </button>
                                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                        Créez un compte pour profiter de l'intégration directe.
                                    </span>
                                </div>
                            )}

                            <a 
                                href={tool.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.78rem',
                                    color: '#9ca3af',
                                    marginTop: '14px',
                                    textDecoration: 'underline'
                                }}
                            >
                                <Globe size={12} />
                                Site Officiel
                            </a>
                        </div>

                        {/* Specs Panel */}
                        <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'white', fontWeight: 700, marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                                Spécifications Techniques
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <ShieldCheck size={14} color="#10b981" />
                                        Conforme RGPD
                                    </span>
                                    <span style={{ fontWeight: 600, color: tool.gdpr_compliant === 1 ? '#10b981' : '#f43f5e' }}>
                                        {tool.gdpr_compliant === 1 ? 'Oui' : 'Non'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Cpu size={14} color="#3b82f6" />
                                        API Intégrable
                                    </span>
                                    <span style={{ fontWeight: 600, color: tool.has_api === 1 ? '#10b981' : '#f43f5e' }}>
                                        {tool.has_api === 1 ? 'Oui' : 'Non'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Smartphone size={14} color="#f59e0b" />
                                        App Mobile
                                    </span>
                                    <span style={{ fontWeight: 600, color: tool.has_mobile_app === 1 ? '#10b981' : '#f43f5e' }}>
                                        {tool.has_mobile_app === 1 ? 'Oui' : 'Non'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Tag panel */}
                        <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <span style={{ fontSize: '0.78rem', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Catégories</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {tool.categories && tool.categories.map((c, i) => (
                                            <span key={i} className="badge badge-purple">{c.name}</span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.78rem', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Modèles Économiques</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {tool.pricings && tool.pricings.map((p, i) => (
                                            <span key={i} className="badge badge-blue">{p.name}</span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.78rem', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Langues Supportées</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {tool.languages && tool.languages.map((l, i) => (
                                            <span key={i} className="badge badge-amber">{l.name}</span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#6b7280', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px' }}>
                                    <Calendar size={12} />
                                    <span>Publié : {new Date(tool.release_date || tool.created_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
