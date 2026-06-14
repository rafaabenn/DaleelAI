import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ToolCard from '../components/ToolCard';
import { Heart, PlusCircle, ChevronDown, ChevronUp, CheckCircle, XCircle, ShieldAlert, Globe, Tag, FileText, Layers, Bell, ImagePlus, Edit3 } from 'lucide-react';

export default function UserDashboard({ user, favorites, onToggleFav, setPage, onOpenTrial }) {
    const [favTools, setFavTools] = useState([]);
    const [loadingFavs, setLoadingFavs] = useState(true);
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [submitData, setSubmitData] = useState({
        name: '',
        website_url: '',
        trial_url: '',
        logo_url: '',
        short_description: '',
        long_description: '',
        category_id: '1',
        pricing: '1',
        languages: [],
        gdpr_compliant: 0,
        has_api: 0,
        has_mobile_app: 0
    });
    const [submitting, setSubmitting] = useState(false);
    const [aiValidating, setAiValidating] = useState(false);
    const [aiValidationResult, setAiValidationResult] = useState(null);
    const [aiAttempts, setAiAttempts] = useState(0);
    const [aiBlocked, setAiBlocked] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitValidation, setSubmitValidation] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);
    const [userSubmissions, setUserSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(true);
    const [editingSubmissionId, setEditingSubmissionId] = useState(null);
    const [filterOptions, setFilterOptions] = useState({ categories: [], pricing_models: [], languages: [] });

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
                    pricing_models: res.pricing_models || [],
                    languages: res.languages || []
                });
            }
        } catch (err) {
            console.error("Erreur chargement filtres soumission", err);
        }
    };

    const loadNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const res = await api.tools.getNotifications();
            if (res.success) {
                setNotifications(res.notifications || []);
            }
        } catch (err) {
            console.error("Erreur chargement notifications", err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const loadUserSubmissions = async () => {
        setLoadingSubmissions(true);
        try {
            const res = await api.tools.getMySubmissions();
            if (res.success) {
                setUserSubmissions(res.submissions || []);
            }
        } catch (err) {
            console.error("Erreur chargement soumissions utilisateur", err);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    useEffect(() => {
        loadFavorites();
        loadFilters();
        loadNotifications();
        loadUserSubmissions();
    }, []);

    const resetSubmitForm = () => {
        setSubmitData({
            name: '',
            website_url: '',
            trial_url: '',
            logo_url: '',
            short_description: '',
            long_description: '',
            category_id: '1',
            pricing: '1',
            languages: [],
            gdpr_compliant: 0,
            has_api: 0,
            has_mobile_app: 0
        });
        setEditingSubmissionId(null);
        setAiValidationResult(null);
        setAiAttempts(0);
        setAiBlocked(false);
    };

    const handleEditSubmission = (submission) => {
        setSubmitData({
            name: submission.name || '',
            website_url: submission.website_url || '',
            trial_url: submission.trial_url || '',
            logo_url: submission.logo_url || '',
            short_description: submission.short_description || '',
            long_description: submission.long_description || '',
            category_id: String(submission.category_ids?.[0] || '1'),
            pricing: String(submission.pricing_ids?.[0] || '1'),
            languages: (submission.language_ids || []).map(String),
            gdpr_compliant: Number(submission.gdpr_compliant) ? 1 : 0,
            has_api: Number(submission.has_api) ? 1 : 0,
            has_mobile_app: Number(submission.has_mobile_app) ? 1 : 0
        });
        setEditingSubmissionId(submission.id);
        setSubmitSuccess('');
        setSubmitError('');
        setSubmitValidation(null);
        setAiValidationResult(null);
        setAiAttempts(0);
        setAiBlocked(false);
        setShowSubmitForm(true);
    };

    const buildPayload = () => ({
        ...submitData,
        tool_id: editingSubmissionId,
        long_description: submitData.long_description,
        categories: [submitData.category_id],
        pricings: submitData.pricing ? [submitData.pricing] : [],
        languages: submitData.languages
    });

    const applyImprovedValues = (improved) => {
        if (!improved) return;
        setSubmitData(p => ({
            ...p,
            short_description: improved.short_description || p.short_description,
            long_description: improved.long_description || p.long_description
        }));
    };

    const doActualSubmit = async (aiSummary) => {
        setSubmitting(true);
        try {
            const payload = { ...buildPayload(), ai_summary: aiSummary || '' };
            const res = editingSubmissionId
                ? await api.tools.resubmit(payload)
                : await api.tools.submit(payload);
            if (res.success) {
                setSubmitSuccess(res.message || "Votre soumission a été envoyée avec succès !");
                resetSubmitForm();
                setShowSubmitForm(false);
                loadNotifications();
                loadUserSubmissions();
            } else {
                setSubmitError(res.message || "Erreur lors de la soumission.");
            }
        } catch (err) {
            setSubmitError(err.message || "Erreur de connexion.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitTool = async (e) => {
        e.preventDefault();
        setSubmitSuccess('');
        setSubmitError('');
        setAiValidationResult(null);

        if (!submitData.pricing) {
            setSubmitError('Veuillez sélectionner un modèle de prix.');
            return;
        }

        if (aiBlocked) {
            setSubmitError('Vous avez atteint la limite de 3 tentatives. Veuillez corriger les champs signalés.');
            return;
        }

        setAiValidating(true);
        try {
            const res = await api.tools.aiValidate(buildPayload());
            if (res.valid) {
                setAiValidationResult({ valid: true, summary: res.summary });
                await doActualSubmit(res.summary);
            } else {
                // Use server-side attempt counter as the source of truth
                const serverAttempt = res.attempt ?? (aiAttempts + 1);
                setAiAttempts(serverAttempt);
                setAiValidationResult({ valid: false, status: res.status, summary: res.summary, corrections: res.corrections || [], improved_values: res.improved_values });
                if (serverAttempt >= 3) {
                    setAiBlocked(true);
                    setSubmitError("Limite de 3 tentatives atteinte. Corrigez les champs signalés avant de renvoyer.");
                }
            }
        } catch (err) {
            // Server provides clear French messages for 429 (rate limit) and 503 (unavailable)
            setSubmitError(err.message || "La validation IA est temporairement indisponible. Réessayez dans quelques instants.");
        } finally {
            setAiValidating(false);
        }
    };

    const toggleSubmitArrayValue = (field, value) => {
        setSubmitData(prev => {
            const current = prev[field] || [];
            const next = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: next };
        });
    };

    const handleRemoveFav = async (toolId) => {
        await onToggleFav(toolId);
        setFavTools(prev => prev.filter(t => t.id !== toolId));
    };

    const handleMarkNotificationRead = async (notificationId) => {
        try {
            await api.tools.markNotificationRead(notificationId);
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n));
        } catch (err) {
            console.error('Erreur lors du marquage en lu', err);
        }
    };

    const correctionSubmissions = userSubmissions.filter(sub => sub.status === 'processing' || sub.status === 'rejected');

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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
                    <div style={{ color: '#c7d2fe', fontSize: '0.95rem' }}>
                        Notifications de soumission
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bell size={18} color="#a78bfa" />
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                            {notifications.filter(n => n.status === 'unread').length} non lue(s)
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: '16px', padding: '18px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                    {loadingNotifications ? (
                        <p style={{ color: '#94a3b8', margin: 0 }}>Chargement des notifications...</p>
                    ) : (
                        notifications.length > 0 ? (
                            notifications.slice(0, 4).map(notification => (
                                <div key={notification.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, color: '#e2e8f0', fontWeight: notification.status === 'unread' ? 600 : 400 }}>{notification.message}</p>
                                        <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>{new Date(notification.created_at).toLocaleString()}</p>
                                    </div>
                                    {notification.status === 'unread' && (
                                        <button
                                            type="button"
                                            onClick={() => handleMarkNotificationRead(notification.id)}
                                            style={{
                                                border: '1px solid rgba(167, 139, 250, 0.35)',
                                                background: 'transparent',
                                                color: '#a78bfa',
                                                borderRadius: '999px',
                                                padding: '8px 14px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Marquer lu
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8', margin: 0 }}>Aucune notification pour le moment.</p>
                        )
                    )}
                </div>
            </div>

            {correctionSubmissions.length > 0 && (
                <div className="glass-panel" style={{
                    marginBottom: '24px',
                    padding: '20px',
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                    background: 'rgba(245, 158, 11, 0.05)',
                    borderRadius: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.05rem', fontWeight: 700 }}>
                                Soumissions a corriger
                            </h3>
                            <p style={{ margin: '6px 0 0', color: '#fbbf24', fontSize: '0.82rem' }}>
                                L administrateur demande une modification. Vous avez 3 tentatives de correction avant blocage temporaire.
                            </p>
                        </div>
                        <span className="badge badge-amber">{correctionSubmissions.length}</span>
                    </div>

                    {loadingSubmissions ? (
                        <p style={{ color: '#94a3b8', margin: 0 }}>Chargement des corrections...</p>
                    ) : (
                        correctionSubmissions.map(submission => (
                            <div key={submission.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '14px',
                                padding: '14px 0',
                                borderTop: '1px solid rgba(255,255,255,0.08)'
                            }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ color: '#f8fafc', fontWeight: 700 }}>{submission.name}</div>
                                    <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginTop: '4px' }}>
                                        {submission.short_description}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => handleEditSubmission(submission)}
                                    style={{ whiteSpace: 'nowrap', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}
                                >
                                    <Edit3 size={14} /> Corriger
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

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
                                {editingSubmissionId ? 'Corriger votre soumission' : "Soumettre un nouvel outil d'IA"}
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

                        {/* AI Validation result panel */}
                        {aiValidationResult && !aiValidationResult.valid && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.07)',
                                border: '1px solid rgba(245, 158, 11, 0.28)',
                                color: '#fde68a'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ShieldAlert size={16} color="#f59e0b" />
                                        Validation IA — Corrections requises
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', borderRadius: '999px', padding: '3px 10px' }}>
                                        Tentative {aiAttempts}/3
                                    </span>
                                </div>
                                {aiValidationResult.summary && (
                                    <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#fde68a' }}>{aiValidationResult.summary}</p>
                                )}
                                {aiValidationResult.corrections?.length > 0 && (
                                    <ul style={{ margin: '0 0 12px', paddingLeft: '18px', fontSize: '0.83rem', color: '#fcd34d' }}>
                                        {aiValidationResult.corrections.map((c, i) => (
                                            <li key={i} style={{ marginBottom: '6px' }}>
                                                <strong style={{ color: '#fde68a' }}>{c.field} :</strong> {c.reason}
                                                {c.suggestion && <span style={{ color: '#d1fae5' }}> → {c.suggestion}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {aiValidationResult.improved_values && (
                                    <button
                                        type="button"
                                        onClick={() => applyImprovedValues(aiValidationResult.improved_values)}
                                        style={{
                                            fontSize: '0.8rem',
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(16,185,129,0.4)',
                                            background: 'rgba(16,185,129,0.1)',
                                            color: '#6ee7b7',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Appliquer les suggestions de l'IA
                                    </button>
                                )}
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

                            {/* Logo URL */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ImagePlus size={12} /> URL du Logo (optionnel)
                                </label>
                                <input 
                                    type="url"
                                    value={submitData.logo_url}
                                    onChange={(e) => setSubmitData(p => ({ ...p, logo_url: e.target.value }))}
                                    className="input-field"
                                    placeholder="https://exemple.com/logo.png"
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

                            {/* Pricing — choix unique */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Tag size={12} /> Modèle de prix * <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.75rem' }}>(un seul choix)</span>
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {filterOptions.pricing_models.map(price => {
                                        const value = String(price.id);
                                        const selected = submitData.pricing === value;
                                        return (
                                            <label key={price.id} style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '9px 16px',
                                                borderRadius: '10px',
                                                border: selected ? '1px solid rgba(168,85,247,0.7)' : '1px solid rgba(255,255,255,0.10)',
                                                background: selected ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                                                color: selected ? '#f3e8ff' : '#cbd5e1',
                                                fontSize: '0.84rem',
                                                cursor: 'pointer',
                                                fontWeight: selected ? 600 : 400,
                                                transition: 'all 0.15s ease'
                                            }}>
                                                <input
                                                    type="radio"
                                                    name="pricing"
                                                    value={value}
                                                    checked={selected}
                                                    onChange={() => setSubmitData(p => ({ ...p, pricing: value }))}
                                                    style={{ accentColor: '#a855f7' }}
                                                />
                                                {price.name}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Languages */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Globe size={12} /> Langues disponibles
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {filterOptions.languages.map(lang => {
                                        const value = String(lang.id);
                                        const checked = submitData.languages.includes(value);
                                        return (
                                            <label key={lang.id} style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '9px 12px',
                                                borderRadius: '10px',
                                                border: checked ? '1px solid rgba(59,130,246,0.55)' : '1px solid rgba(255,255,255,0.10)',
                                                background: checked ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                                                color: checked ? '#dbeafe' : '#cbd5e1',
                                                fontSize: '0.84rem',
                                                cursor: 'pointer'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleSubmitArrayValue('languages', value)}
                                                    style={{ accentColor: '#3b82f6' }}
                                                />
                                                {lang.name}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* API / Mobile / GDPR */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                                        <input
                                            type="checkbox"
                                            checked={submitData.has_api === 1}
                                            onChange={(e) => setSubmitData(p => ({ ...p, has_api: e.target.checked ? 1 : 0 }))}
                                        />
                                        API disponible
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                                        <input
                                            type="checkbox"
                                            checked={submitData.has_mobile_app === 1}
                                            onChange={(e) => setSubmitData(p => ({ ...p, has_mobile_app: e.target.checked ? 1 : 0 }))}
                                        />
                                        Application mobile
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                                        <input
                                            type="checkbox"
                                            checked={submitData.gdpr_compliant === 1}
                                            onChange={(e) => setSubmitData(p => ({ ...p, gdpr_compliant: e.target.checked ? 1 : 0 }))}
                                        />
                                        Conforme RGPD
                                    </label>
                                </div>
                                <div style={{ display: 'none' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Globe size={12} /> Langue principale
                                    </label>
                                    <select
                                        value={submitData.language_id}
                                        onChange={(e) => setSubmitData(p => ({ ...p, language_id: e.target.value }))}
                                        className="input-field"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option value="">Aucune / Non spécifiée</option>
                                        {filterOptions.languages.map(lang => (
                                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
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
                                    value={submitData.long_description}
                                    onChange={(e) => setSubmitData(p => ({ ...p, long_description: e.target.value }))}
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
                                    Votre soumission est d'abord analysée par notre IA (Gemini). Si tout est correct, elle est transmise à un administrateur pour publication. En cas d'erreur, l'IA vous indique les corrections à apporter — vous disposez de 3 tentatives.
                                </span>
                            </div>

                            {/* Submit Button */}
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" className="btn-secondary" onClick={() => { resetSubmitForm(); setShowSubmitForm(false); }}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn-success" disabled={submitting || aiValidating || aiBlocked}>
                                    {aiValidating ? 'Validation IA...' : submitting ? 'Envoi en cours...' : (
                                        <>
                                            <PlusCircle size={16} />
                                            {editingSubmissionId ? 'Envoyer la Correction' : 'Soumettre'}
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
