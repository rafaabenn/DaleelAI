import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
    BarChart3, Users, Wrench, MessageSquare, ShieldCheck, Clock,
    CheckCircle, XCircle, Trash2, Edit3, PlusCircle, Save, X,
    Star, Eye, TrendingUp, AlertTriangle, ChevronDown, ChevronUp,
    Globe, Tag, FileText, Layers, Cpu, Smartphone
} from 'lucide-react';

// ─── Tab Constants ───
const TABS = [
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'submissions', label: 'Soumissions', icon: Clock },
    { id: 'reviews', label: 'Modération Avis', icon: MessageSquare },
    { id: 'crud', label: 'Gestion CRUD Outils', icon: Wrench }
];

export default function AdminDashboard({ user }) {
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editTool, setEditTool] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createData, setCreateData] = useState({
        name: '', website_url: '', trial_url: '', logo_url: '',
        short_description: '', full_description: '',
        gdpr_compliant: 0, has_api: 0, has_mobile_app: 0
    });
    const [actionMsg, setActionMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        loadTabData(activeTab);
    }, [activeTab]);

    const loadTabData = async (tab) => {
        setLoading(true);
        setActionMsg({ text: '', type: '' });
        try {
            switch (tab) {
                case 'stats':
                    const sRes = await api.admin.getStats();
                    if (sRes.success) setStats(sRes.stats);
                    break;
                case 'submissions':
                    const subRes = await api.admin.getSubmissions();
                    if (subRes.success) setSubmissions(subRes.submissions);
                    break;
                case 'reviews':
                    const revRes = await api.admin.getReviews();
                    if (revRes.success) setReviews(revRes.reviews);
                    break;
                case 'crud':
                    const tRes = await api.tools.getTools({});
                    if (tRes.success) setTools(tRes.tools);
                    break;
            }
        } catch (err) {
            console.error("Erreur chargement admin:", err);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type = 'success') => {
        setActionMsg({ text, type });
        setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
    };

    // ── Submissions Actions ──
    const handleValidateSubmission = async (toolId, action) => {
        try {
            const res = await api.admin.validateSubmission(toolId, action);
            if (res.success) {
                showMessage(`Soumission ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès.`);
                setSubmissions(prev => prev.filter(s => s.id !== toolId));
            }
        } catch (err) {
            showMessage(err.message || "Erreur de validation.", 'error');
        }
    };

    // ── Reviews Moderation ──
    const handleModerateReview = async (reviewId, action) => {
        try {
            const res = await api.admin.moderateReview(reviewId, action);
            if (res.success) {
                showMessage(`Avis ${action === 'approve' ? 'approuvé' : 'supprimé'} avec succès.`);
                setReviews(prev => prev.filter(r => r.id !== reviewId));
            }
        } catch (err) {
            showMessage(err.message || "Erreur de modération.", 'error');
        }
    };

    // ── CRUD: Create ──
    const handleCreateTool = async (e) => {
        e.preventDefault();
        try {
            const res = await api.admin.createTool(createData);
            if (res.success) {
                showMessage("Outil créé avec succès et ajouté au catalogue !");
                setShowCreateForm(false);
                setCreateData({
                    name: '', website_url: '', trial_url: '', logo_url: '',
                    short_description: '', full_description: '',
                    gdpr_compliant: 0, has_api: 0, has_mobile_app: 0
                });
                loadTabData('crud');
            }
        } catch (err) {
            showMessage(err.message || "Erreur de création.", 'error');
        }
    };

    // ── CRUD: Update ──
    const handleUpdateTool = async (e) => {
        e.preventDefault();
        try {
            const res = await api.admin.updateTool(editTool);
            if (res.success) {
                showMessage("Outil mis à jour avec succès !");
                setEditTool(null);
                loadTabData('crud');
            }
        } catch (err) {
            showMessage(err.message || "Erreur de mise à jour.", 'error');
        }
    };

    // ── CRUD: Delete ──
    const handleDeleteTool = async (id, name) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${name}" du catalogue ?`)) return;
        try {
            const res = await api.admin.deleteTool(id);
            if (res.success) {
                showMessage(`"${name}" supprimé du catalogue.`);
                setTools(prev => prev.filter(t => t.id !== id));
            }
        } catch (err) {
            showMessage(err.message || "Erreur de suppression.", 'error');
        }
    };

    // ─── Render Helpers ───
    const StatCard = ({ icon: Icon, label, value, color, glow }) => (
        <div className="glass-card" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(24, 25, 38, 0.3)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: glow || 'rgba(139,92,246,0.08)',
                filter: 'blur(20px)'
            }}></div>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    {value ?? '—'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>{label}</div>
            </div>
        </div>
    );

    return (
        <div style={{ position: 'relative' }}>
            <div className="gradient-bg"></div>

            {/* Admin Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <ShieldCheck size={28} color="#a855f7" />
                    Back-Office Administrateur
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '0.92rem', marginTop: '4px' }}>
                    Tableau de bord central — gérez les outils, validez les soumissions et modérez les avis de la communauté.
                </p>
            </div>

            {/* Global Action Message Toast */}
            {actionMsg.text && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: actionMsg.type === 'error' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${actionMsg.type === 'error' ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    color: actionMsg.type === 'error' ? '#f43f5e' : '#10b981',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {actionMsg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                    <span>{actionMsg.text}</span>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="glass-panel" style={{
                display: 'flex',
                gap: '4px',
                padding: '6px',
                marginBottom: '28px',
                background: 'rgba(16,17,26,0.7)',
                borderRadius: '14px',
                flexWrap: 'wrap'
            }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1,
                                minWidth: '140px',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: isActive ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)' : 'transparent',
                                color: isActive ? 'white' : '#9ca3af',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                fontFamily: 'var(--font-display)',
                                transition: 'all 0.25s ease',
                                boxShadow: isActive ? '0 4px 14px rgba(139,92,246,0.35)' : 'none',
                                border: 'none'
                            }}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ color: '#9ca3af' }}>Chargement des données...</span>
                </div>
            )}

            {/* ═══════════ TAB: STATISTICS ═══════════ */}
            {!loading && activeTab === 'stats' && stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        <StatCard icon={Wrench} label="Outils IA Indexés" value={stats.total_tools} color="#a855f7" glow="rgba(168,85,247,0.1)" />
                        <StatCard icon={Users} label="Utilisateurs Inscrits" value={stats.total_users} color="#3b82f6" glow="rgba(59,130,246,0.1)" />
                        <StatCard icon={MessageSquare} label="Avis Publiés" value={stats.total_reviews} color="#f59e0b" glow="rgba(245,158,11,0.1)" />
                        <StatCard icon={Clock} label="Soumissions en Attente" value={stats.pending_submissions} color="#10b981" glow="rgba(16,185,129,0.1)" />
                        <StatCard icon={Eye} label="Clics Totaux" value={stats.total_clicks} color="#ec4899" glow="rgba(236,72,153,0.1)" />
                        <StatCard icon={Star} label="Note Moyenne Globale" value={stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '—'} color="#f59e0b" glow="rgba(245,158,11,0.1)" />
                    </div>

                    {/* Recent tools preview */}
                    {stats.recent_tools && stats.recent_tools.length > 0 && (
                        <div className="glass-panel" style={{ padding: '24px', background: 'rgba(16,17,26,0.5)' }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'white', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={18} color="#10b981" />
                                Derniers Outils Ajoutés
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {stats.recent_tools.map((t, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.04)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#6b7280', fontSize: '0.78rem', fontWeight: 700 }}>#{idx + 1}</span>
                                            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</span>
                                        </div>
                                        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                                            {t.status || 'active'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ TAB: SUBMISSIONS ═══════════ */}
            {!loading && activeTab === 'submissions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={20} color="#f59e0b" />
                        File d'Attente des Soumissions ({submissions.length})
                    </h3>

                    {submissions.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed' }}>
                            <CheckCircle size={40} color="#10b981" />
                            <p style={{ color: '#9ca3af', marginTop: '12px' }}>Aucune soumission en attente. Tout est à jour !</p>
                        </div>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub.id} className="glass-card" style={{
                                padding: '24px',
                                background: 'rgba(24,25,38,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', color: 'white', fontWeight: 700 }}>{sub.name}</h4>
                                        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                                            Soumis par : <strong style={{ color: '#d946ef' }}>{sub.submitted_by || 'Utilisateur'}</strong>
                                            {sub.created_at && ` — ${new Date(sub.created_at).toLocaleDateString('fr-FR')}`}
                                        </span>
                                    </div>
                                    <span className="badge badge-amber">En attente</span>
                                </div>

                                <p style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: '1.5' }}>
                                    {sub.short_description || sub.full_description || 'Pas de description fournie.'}
                                </p>

                                {sub.website_url && (
                                    <a href={sub.website_url} target="_blank" rel="noopener noreferrer" style={{
                                        fontSize: '0.82rem',
                                        color: '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Globe size={12} /> {sub.website_url}
                                    </a>
                                )}

                                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                                    <button
                                        onClick={() => handleValidateSubmission(sub.id, 'approve')}
                                        className="btn-success"
                                        style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                                    >
                                        <CheckCircle size={14} /> Approuver
                                    </button>
                                    <button
                                        onClick={() => handleValidateSubmission(sub.id, 'reject')}
                                        className="btn-danger"
                                        style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                                    >
                                        <XCircle size={14} /> Rejeter
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ═══════════ TAB: REVIEWS MODERATION ═══════════ */}
            {!loading && activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquare size={20} color="#d946ef" />
                        Modération des Avis ({reviews.length})
                    </h3>

                    {reviews.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed' }}>
                            <CheckCircle size={40} color="#10b981" />
                            <p style={{ color: '#9ca3af', marginTop: '12px' }}>Aucun avis en attente de modération.</p>
                        </div>
                    ) : (
                        reviews.map(rev => (
                            <div key={rev.id} className="glass-card" style={{
                                padding: '20px',
                                background: 'rgba(24,25,38,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: '#3b82f6', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 'bold'
                                        }}>
                                            {(rev.username || 'U').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>
                                                {rev.username || 'Utilisateur'}
                                            </span>
                                            <span style={{ color: '#6b7280', fontSize: '0.78rem', marginLeft: '8px' }}>
                                                sur <strong style={{ color: '#d946ef' }}>{rev.tool_name || 'Outil'}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={12}
                                                fill={s <= (rev.rating || 0) ? '#f59e0b' : 'transparent'}
                                                color={s <= (rev.rating || 0) ? '#f59e0b' : '#4b5563'}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.88rem', color: '#d1d5db', fontStyle: 'italic', padding: '10px 14px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    "{rev.comment}"
                                </p>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => handleModerateReview(rev.id, 'approve')}
                                        className="btn-success"
                                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                                    >
                                        <CheckCircle size={12} /> Approuver
                                    </button>
                                    <button
                                        onClick={() => handleModerateReview(rev.id, 'reject')}
                                        className="btn-danger"
                                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                                    >
                                        <Trash2 size={12} /> Supprimer
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ═══════════ TAB: CRUD TOOLS MANAGEMENT ═══════════ */}
            {!loading && activeTab === 'crud' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Wrench size={20} color="#a855f7" />
                            Catalogue d'Outils IA ({tools.length})
                        </h3>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="btn-primary"
                            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                        >
                            <PlusCircle size={16} />
                            {showCreateForm ? 'Annuler' : 'Ajouter un Outil'}
                        </button>
                    </div>

                    {/* Create Form */}
                    {showCreateForm && (
                        <form onSubmit={handleCreateTool} className="glass-panel" style={{
                            padding: '24px',
                            background: 'rgba(16,185,129,0.03)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px'
                        }}>
                            <h4 style={{ gridColumn: '1 / -1', color: 'white', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PlusCircle size={18} color="#10b981" /> Créer un Nouvel Outil
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>Nom *</label>
                                <input type="text" className="input-field" value={createData.name}
                                    onChange={(e) => setCreateData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Nom de l'outil" required />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>URL du Site *</label>
                                <input type="url" className="input-field" value={createData.website_url}
                                    onChange={(e) => setCreateData(p => ({ ...p, website_url: e.target.value }))}
                                    placeholder="https://..." required />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>URL Essai Gratuit</label>
                                <input type="url" className="input-field" value={createData.trial_url}
                                    onChange={(e) => setCreateData(p => ({ ...p, trial_url: e.target.value }))}
                                    placeholder="https://..." />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>URL Logo</label>
                                <input type="url" className="input-field" value={createData.logo_url}
                                    onChange={(e) => setCreateData(p => ({ ...p, logo_url: e.target.value }))}
                                    placeholder="https://..." />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>Description Courte *</label>
                                <input type="text" className="input-field" value={createData.short_description}
                                    onChange={(e) => setCreateData(p => ({ ...p, short_description: e.target.value }))}
                                    placeholder="Une phrase résumant l'outil" required />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>Description Complète</label>
                                <textarea rows="3" className="input-field" value={createData.full_description}
                                    onChange={(e) => setCreateData(p => ({ ...p, full_description: e.target.value }))}
                                    placeholder="Description détaillée..."
                                    style={{ resize: 'vertical' }} />
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e5e7eb', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={createData.gdpr_compliant === 1}
                                        onChange={(e) => setCreateData(p => ({ ...p, gdpr_compliant: e.target.checked ? 1 : 0 }))}
                                        style={{ accentColor: '#a855f7', width: '16px', height: '16px' }} />
                                    <ShieldCheck size={14} color="#10b981" /> RGPD
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e5e7eb', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={createData.has_api === 1}
                                        onChange={(e) => setCreateData(p => ({ ...p, has_api: e.target.checked ? 1 : 0 }))}
                                        style={{ accentColor: '#a855f7', width: '16px', height: '16px' }} />
                                    <Cpu size={14} color="#3b82f6" /> API
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e5e7eb', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={createData.has_mobile_app === 1}
                                        onChange={(e) => setCreateData(p => ({ ...p, has_mobile_app: e.target.checked ? 1 : 0 }))}
                                        style={{ accentColor: '#8b5cf6', width: '16px', height: '16px' }} />
                                    <Smartphone size={14} color="#f59e0b" /> Mobile
                                </label>
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>Annuler</button>
                                <button type="submit" className="btn-success">
                                    <Save size={14} /> Créer l'Outil
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Edit Modal Form */}
                    {editTool && (
                        <div className="popup-overlay" style={{ padding: '20px', zIndex: 1001 }}>
                            <form onSubmit={handleUpdateTool} className="glass-panel" style={{
                                width: '100%',
                                maxWidth: '650px',
                                maxHeight: '85vh',
                                overflowY: 'auto',
                                padding: '32px',
                                background: '#0d0e16',
                                border: '1px solid rgba(139,92,246,0.25)',
                                borderRadius: '20px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px'
                            }}>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Edit3 size={18} color="#f59e0b" /> Modifier : {editTool.name}
                                    </h3>
                                    <button type="button" onClick={() => setEditTool(null)} style={{ background: 'transparent', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>Nom *</label>
                                    <input type="text" className="input-field" value={editTool.name || ''}
                                        onChange={(e) => setEditTool(p => ({ ...p, name: e.target.value }))} required />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>URL du Site</label>
                                    <input type="url" className="input-field" value={editTool.website_url || ''}
                                        onChange={(e) => setEditTool(p => ({ ...p, website_url: e.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>URL Essai Gratuit</label>
                                    <input type="url" className="input-field" value={editTool.trial_url || ''}
                                        onChange={(e) => setEditTool(p => ({ ...p, trial_url: e.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>URL Logo</label>
                                    <input type="url" className="input-field" value={editTool.logo_url || ''}
                                        onChange={(e) => setEditTool(p => ({ ...p, logo_url: e.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>Description Courte</label>
                                    <input type="text" className="input-field" value={editTool.short_description || ''}
                                        onChange={(e) => setEditTool(p => ({ ...p, short_description: e.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d946ef' }}>Description Complète</label>
                                    <textarea rows="3" className="input-field" value={editTool.full_description || ''}
                                        onChange={(e) => setEditTool(p => ({ ...p, full_description: e.target.value }))}
                                        style={{ resize: 'vertical' }} />
                                </div>

                                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e5e7eb', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={(editTool.gdpr_compliant || 0) === 1}
                                            onChange={(e) => setEditTool(p => ({ ...p, gdpr_compliant: e.target.checked ? 1 : 0 }))}
                                            style={{ accentColor: '#a855f7', width: '16px', height: '16px' }} />
                                        <ShieldCheck size={14} color="#10b981" /> RGPD
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e5e7eb', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={(editTool.has_api || 0) === 1}
                                            onChange={(e) => setEditTool(p => ({ ...p, has_api: e.target.checked ? 1 : 0 }))}
                                            style={{ accentColor: '#a855f7', width: '16px', height: '16px' }} />
                                        <Cpu size={14} color="#3b82f6" /> API
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e5e7eb', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={(editTool.has_mobile_app || 0) === 1}
                                            onChange={(e) => setEditTool(p => ({ ...p, has_mobile_app: e.target.checked ? 1 : 0 }))}
                                            style={{ accentColor: '#a855f7', width: '16px', height: '16px' }} />
                                        <Smartphone size={14} color="#f59e0b" /> Mobile
                                    </label>
                                </div>

                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setEditTool(null)}>Annuler</button>
                                    <button type="submit" className="btn-primary">
                                        <Save size={14} /> Sauvegarder les Modifications
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Tools Table List */}
                    <div className="glass-panel" style={{ overflow: 'hidden', background: 'rgba(16,17,26,0.5)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    {['#', 'Outil', 'Description', 'Score', 'Statut', 'Actions'].map(h => (
                                        <th key={h} style={{
                                            padding: '14px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            color: '#a78bfa',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tools.map((t, idx) => (
                                    <tr key={t.id} style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        transition: 'background 0.2s'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.04)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#6b7280', fontWeight: 700 }}>
                                            {idx + 1}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img
                                                    src={t.logo_url}
                                                    alt={t.name}
                                                    style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e293b', objectFit: 'contain' }}
                                                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=60'}
                                                />
                                                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>{t.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#9ca3af', maxWidth: '250px' }}>
                                            <div style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {t.short_description}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span className="score-badge" style={{ fontSize: '0.78rem', padding: '3px 8px' }}>
                                                {t.global_score}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                                                {t.status || 'active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={() => setEditTool({ ...t })}
                                                    style={{
                                                        background: 'rgba(245,158,11,0.1)',
                                                        border: '1px solid rgba(245,158,11,0.2)',
                                                        color: '#f59e0b',
                                                        cursor: 'pointer',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <Edit3 size={12} /> Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTool(t.id, t.name)}
                                                    style={{
                                                        background: 'rgba(244,63,94,0.1)',
                                                        border: '1px solid rgba(244,63,94,0.2)',
                                                        color: '#f43f5e',
                                                        cursor: 'pointer',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <Trash2 size={12} /> Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
