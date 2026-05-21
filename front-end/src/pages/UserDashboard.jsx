import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ToolCard from '../components/ToolCard';
import { Heart, PlusCircle, ChevronDown, ChevronUp, CheckCircle, XCircle, ShieldAlert, Globe, Tag, FileText, Layers } from 'lucide-react';

export default function UserDashboard({ user, favorites, onToggleFav, setPage, onOpenTrial }) {
    const [favTools, setFavTools] = useState([]);
    const [loadingFavs, setLoadingFavs] = useState(true);
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [submitData, setSubmitData] = useState({
        name: '',
        website_url: '',
        trial_url: '',
        short_description: '',
        full_description: '',
        category_id: '1',
        pricing_model_id: '1'
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [filterOptions, setFilterOptions] = useState({ categories: [], pricing_models: [] });

    useEffect(() => {
        loadFavorites();
        loadFilters();
    }, []);

    const loadFavorites = async () => {
        setLoadingFavs(true);
        try {
            const res = await api.tools.getFavorites();
            if (res.success) {
                setFavTools(res.tools);
            }
        } catch (err) {
            console.error("Erreur chargement favoris", err);
        } finally {
            setLoadingFavs(false);
        }
    };

    const loadFilters = async () => {
        try {
            const res = await api.tools.getFilters();
            if (res.success) {
                setFilterOptions({
                    categories: res.categories || [],
                    pricing_models: res.pricing_models || []
                });
            }
        } catch (err) {
            console.error("Erreur chargement filtres soumission", err);
        }
    };

    const handleSubmitTool = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitSuccess('');
        setSubmitError('');
        try {
            const res = await api.tools.submit(submitData);
            if (res.success) {
                setSubmitSuccess("Votre demande de soumission a été envoyée avec succès ! Un administrateur va l'examiner et vous notifier de sa décision.");
                setSubmitData({
                    name: '',
                    website_url: '',
                    trial_url: '',
                    short_description: '',
                    full_description: '',
                    category_id: '1',
                    pricing_model_id: '1'
                });
                setShowSubmitForm(false);
            } else {
                setSubmitError(res.message || "Erreur lors de la soumission de l'outil.");
            }
        } catch (err) {
            setSubmitError(err.message || "Erreur de connexion.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveFav = async (toolId) => {
        await onToggleFav(toolId);
        setFavTools(prev => prev.filter(t => t.id !== toolId));
    };

    return (
        <div style={{ position: 'relative' }}>
            <div className="gradient-bg"></div>

            {/* Welcome Header */}
            <div style={{ marginBottom: '36px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    Mon Espace Académique
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginTop: '6px' }}>
                    Bienvenue, <strong style={{ color: '#a78bfa' }}>{user.username}</strong> — gérez vos outils favoris et soumettez de nouvelles références à la communauté.
                </p>
            </div>

            {/* Submit Tool Button/Collapsible Block */}
            <div className="glass-panel" style={{
                marginBottom: '32px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                background: 'rgba(16, 185, 129, 0.03)',
                borderRadius: '16px',
                overflow: 'hidden'
            }}>
                <button
                    onClick={() => setShowSubmitForm(!showSubmitForm)}
                    style={{
                        width: '100%',
                        background: 'transparent',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        color: 'white'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <PlusCircle size={20} color="#10b981" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                                Soumettre un nouvel outil d'IA
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>
                                Référencez un outil existant non encore indexé — votre demande sera examinée par un administrateur
                            </div>
                        </div>
                    </div>
                    {showSubmitForm ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
                </button>

                {showSubmitForm && (
                    <div style={{ padding: '0 24px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '20px' }}></div>

                        {submitSuccess && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                color: '#10b981',
                                fontSize: '0.85rem',
                                marginBottom: '20px'
                            }}>
                                <CheckCircle size={18} />
                                <span>{submitSuccess}</span>
                            </div>
                        )}

                        {submitError && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(244, 63, 94, 0.1)',
                                border: '1px solid rgba(244, 63, 94, 0.2)',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                color: '#f43f5e',
                                fontSize: '0.85rem',
                                marginBottom: '20px'
                            }}>
                                <ShieldAlert size={18} />
                                <span>{submitError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmitTool} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Tool Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Tag size={12} /> Nom de l'Outil *
                                </label>
                                <input 
                                    type="text"
                                    value={submitData.name}
                                    onChange={(e) => setSubmitData(p => ({ ...p, name: e.target.value }))}
                                    className="input-field"
                                    placeholder="ex: ChatGPT, Midjourney..."
                                    required
                                />
                            </div>

                            {/* Website URL */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Globe size={12} /> URL du Site Officiel *
                                </label>
                                <input 
                                    type="url"
                                    value={submitData.website_url}
                                    onChange={(e) => setSubmitData(p => ({ ...p, website_url: e.target.value }))}
                                    className="input-field"
                                    placeholder="https://exemple.com"
                                    required
                                />
                            </div>

                            {/* Trial URL */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Globe size={12} /> URL Essai Gratuit (optionnel)
                                </label>
                                <input 
                                    type="url"
                                    value={submitData.trial_url}
                                    onChange={(e) => setSubmitData(p => ({ ...p, trial_url: e.target.value }))}
                                    className="input-field"
                                    placeholder="https://exemple.com/free-trial"
                                />
                            </div>

                            {/* Category */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Layers size={12} /> Catégorie Principale *
                                </label>
                                <select
                                    value={submitData.category_id}
                                    onChange={(e) => setSubmitData(p => ({ ...p, category_id: e.target.value }))}
                                    className="input-field"
                                    style={{ cursor: 'pointer' }}
                                    required
                                >
                                    {filterOptions.categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Short Description */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={12} /> Description Courte (max 250 caractères) *
                                </label>
                                <input 
                                    type="text"
                                    value={submitData.short_description}
                                    onChange={(e) => setSubmitData(p => ({ ...p, short_description: e.target.value }))}
                                    className="input-field"
                                    placeholder="Résumez l'outil en une phrase percutante..."
                                    maxLength={250}
                                    required
                                />
                                <span style={{ fontSize: '0.7rem', color: '#6b7280', textAlign: 'right' }}>
                                    {submitData.short_description.length}/250
                                </span>
                            </div>

                            {/* Full Description */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={12} /> Description Complète *
                                </label>
                                <textarea
                                    rows="4"
                                    value={submitData.full_description}
                                    onChange={(e) => setSubmitData(p => ({ ...p, full_description: e.target.value }))}
                                    className="input-field"
                                    placeholder="Décrivez en détail les fonctionnalités, cas d'usage académiques, points forts de l'outil..."
                                    style={{ resize: 'vertical', fontSize: '0.88rem' }}
                                    required
                                />
                            </div>

                            {/* Notice about admin validation */}
                            <div style={{
                                gridColumn: '1 / -1',
                                background: 'rgba(245, 158, 11, 0.06)',
                                border: '1px solid rgba(245, 158, 11, 0.15)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                fontSize: '0.8rem',
                                color: '#d97706',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px'
                            }}>
                                <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>
                                    Votre soumission sera envoyée à un administrateur pour validation. Assurez-vous que cet outil n'est pas déjà référencé dans notre catalogue avant de soumettre. Les doublons seront automatiquement détectés et rejetés.
                                </span>
                            </div>

                            {/* Submit Button */}
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowSubmitForm(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Envoi en cours...' : (
                                        <>
                                            <PlusCircle size={16} />
                                            Envoyer la Demande
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Favorite Tools Section */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <Heart size={22} color="#f43f5e" fill="#f43f5e" />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)' }}>
                        Mes Outils Favoris
                    </h2>
                    <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>{favTools.length} outil{favTools.length !== 1 ? 's' : ''}</span>
                </div>

                {loadingFavs ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', padding: '60px' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Chargement de vos favoris...</span>
                    </div>
                ) : favTools.length > 0 ? (
                    <div className="cards-grid">
                        {favTools.map(tool => (
                            <ToolCard
                                key={tool.id}
                                tool={tool}
                                isFavorited={true}
                                onToggleFav={handleRemoveFav}
                                onSelect={() => {}}
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
                        borderStyle: 'dashed',
                        borderRadius: '16px'
                    }}>
                        <Heart size={48} color="#4b5563" />
                        <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Aucun favori pour l'instant</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto' }}>
                            Explorez notre catalogue d'outils IA et cliquez sur le cœur pour sauvegarder vos préférés ici.
                        </p>
                        <button onClick={() => setPage('home')} className="btn-primary" style={{ marginTop: '8px' }}>
                            Explorer les Outils
                        </button>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
