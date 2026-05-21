import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Filter, RotateCcw, ShieldCheck, Cpu, Smartphone } from 'lucide-react';

export default function SidebarFilters({ filters, setFilters }) {
    const [options, setOptions] = useState({
        categories: [],
        pricing_models: [],
        languages: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch list options from API
        api.tools.getFilters()
            .then(res => {
                if (res.success) {
                    setOptions({
                        categories: res.categories,
                        pricing_models: res.pricing_models,
                        languages: res.languages
                    });
                }
            })
            .catch(err => console.error("Erreur de chargement des filtres sidebar", err))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleReset = () => {
        setFilters({
            q: '',
            category: '',
            pricing: '',
            language: '',
            gdpr: '0',
            api: '0',
            mobile: '0'
        });
    };

    if (loading) {
        return (
            <aside className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
                <div style={{ color: '#9ca3af', textAlign: 'center', fontSize: '0.9rem' }}>
                    Chargement des filtres...
                </div>
            </aside>
        );
    }

    return (
        <aside className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            height: 'fit-content',
            position: 'sticky',
            top: '104px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={18} color="#d946ef" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white' }}>Filtres Avancés</h3>
                </div>
                <button 
                    onClick={handleReset}
                    style={{
                        background: 'transparent',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}
                    title="Réinitialiser tous les filtres"
                >
                    <RotateCcw size={12} />
                    Reset
                </button>
            </div>

            {/* 1. Category filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef' }}>Catégorie d'Outil</label>
                <select 
                    value={filters.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                >
                    <option value="">Toutes les catégories</option>
                    {options.categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* 2. Pricing Model filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef' }}>Modèle Économique</label>
                <select 
                    value={filters.pricing}
                    onChange={(e) => handleChange('pricing', e.target.value)}
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                >
                    <option value="">Tous les modèles</option>
                    {options.pricing_models.map(prc => (
                        <option key={prc.id} value={prc.id}>{prc.name}</option>
                    ))}
                </select>
            </div>

            {/* 3. Language filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef' }}>Langue Supportée</label>
                <select 
                    value={filters.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                >
                    <option value="">Toutes les langues</option>
                    {options.languages.map(lng => (
                        <option key={lng.id} value={lng.id}>{lng.name}</option>
                    ))}
                </select>
            </div>

            {/* 4. Binary Compliance Checkboxes */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '16px'
            }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef', marginBottom: '4px' }}>
                    Critères de Conformité & Accès
                </label>

                {/* GDPR Checkbox */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.85rem',
                    color: '#e5e7eb',
                    cursor: 'pointer'
                }}>
                    <input 
                        type="checkbox" 
                        checked={filters.gdpr === '1'}
                        onChange={(e) => handleChange('gdpr', e.target.checked ? '1' : '0')}
                        style={{
                            accentColor: '#a855f7',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="#10b981" />
                        <span>Conforme RGPD</span>
                    </div>
                </label>

                {/* API Checkbox */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.85rem',
                    color: '#e5e7eb',
                    cursor: 'pointer'
                }}>
                    <input 
                        type="checkbox" 
                        checked={filters.api === '1'}
                        onChange={(e) => handleChange('api', e.target.checked ? '1' : '0')}
                        style={{
                            accentColor: '#a855f7',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={16} color="#3b82f6" />
                        <span>API Intégrée</span>
                    </div>
                </label>

                {/* Mobile App Checkbox */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.85rem',
                    color: '#e5e7eb',
                    cursor: 'pointer'
                }}>
                    <input 
                        type="checkbox" 
                        checked={filters.mobile === '1'}
                        onChange={(e) => handleChange('mobile', e.target.checked ? '1' : '0')}
                        style={{
                            accentColor: '#a855f7',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Smartphone size={16} color="#f59e0b" />
                        <span>App Mobile</span>
                    </div>
                </label>
            </div>
        </aside>
    );
}
