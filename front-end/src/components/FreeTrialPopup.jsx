import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldAlert, BookOpen, Key, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function FreeTrialPopup({ tool, onClose, user }) {
    
    useEffect(() => {
        // Log a popularity click for trial usage when this popup loads
        if (tool && tool.id) {
            const token = localStorage.getItem('daleel_ai_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            // Log click specifically as "trial_click" on database
            fetch(`http://localhost:8000/api/tools/detail?id=${tool.id}`, {
                method: 'GET',
                headers
            }).catch(err => console.error("Erreur log trial clic popularity", err));
        }
    }, [tool]);

    // Simple list of academic prompts based on tool name or category
    const getAcademicGuide = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('chatgpt') || lower.includes('claude')) {
            return [
                { title: "Rédiger une problématique", prompt: "Agis en tant que chercheur académique. Rédige 3 problématiques de recherche innovantes sur le sujet suivant : [Votre sujet]." },
                { title: "Synthétiser un document", prompt: "Résume les points clés théoriques du texte suivant sous forme de puces claires et objectives : [Coller le texte]." },
                { title: "Relecture et style", prompt: "Revisite ce paragraphe académique pour en améliorer la clarté et utiliser un vocabulaire scientifique soutenu : [Votre paragraphe]." }
            ];
        }
        if (lower.includes('deepl')) {
            return [
                { title: "Traduction technique", prompt: "Traduire en conservant les termes scientifiques et le jargon de recherche exacte." },
                { title: "Traduction de résumé (Abstract)", prompt: "Traduire un résumé de mémoire en anglais académique fluide pour publication." }
            ];
        }
        if (lower.includes('midjourney') || lower.includes('suno')) {
            return [
                { title: "Illustration conceptuelle", prompt: "Générer un schéma conceptuel abstrait illustrant le concept de : [Concept]." },
                { title: "Musique de concentration", prompt: "Générer une piste audio Lo-Fi instrumentale à tempo lent pour des séances d'étude universitaire intenses." }
            ];
        }
        // Default
        return [
            { title: "Découverte de l'outil", prompt: "Comment puis-je utiliser au mieux cet outil d'IA dans le cadre d'un travail académique étudiant ?" },
            { title: "Recherche de cas d'usage", prompt: "Fournis-moi 3 exemples pratiques d'utilisation de ton outil pour la recherche scientifique." }
        ];
    };

    const guides = getAcademicGuide(tool.name);

    const handleRedirect = () => {
        window.open(tool.trial_url || tool.website_url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="popup-overlay">
            <div className="trial-popup-container glass-panel" style={{
                border: '1px solid rgba(139, 92, 246, 0.25)',
                background: '#0d0e16'
            }}>
                {/* Header */}
                <div className="trial-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Key size={16} color="#10b981" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', color: 'white', fontWeight: 700 }}>
                                Essai Gratuit : {tool.name}
                            </h2>
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                                ACCÈS PORTAIL ACADÉMIQUE
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '50%'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main Body Splits in Two Panels (Academic guide and Redirect link) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    height: '100%',
                    overflow: 'hidden'
                }}>
                    {/* Left: Redirect Info Panel */}
                    <div className="sandbox-redirect-panel" style={{
                        borderRight: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <ShieldAlert size={60} color="#a855f7" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }} />
                        <div>
                            <h3 style={{ fontSize: '1.4rem', color: 'white', fontWeight: 700, marginBottom: '8px' }}>
                                Accès Direct Sécurisé
                            </h3>
                            <p style={{ fontSize: '0.88rem', color: '#9ca3af', maxWidth: '380px', margin: '0 auto', lineHeight: '1.6' }}>
                                Par mesure de sécurité et conformément aux politiques d'accès direct de l'outil, le site officiel de <strong>{tool.name}</strong> s'ouvrira directement dans un nouvel onglet autonome.
                            </p>
                        </div>

                        {/* Direct URL launcher */}
                        <button 
                            onClick={handleRedirect}
                            className="btn-success"
                            style={{
                                padding: '14px 28px',
                                fontSize: '1rem',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '16px'
                            }}
                        >
                            <span>Lancer l'Essai Gratuit</span>
                            <ExternalLink size={18} />
                        </button>

                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '12px' }}>
                            * Votre clic a été enregistré pour améliorer le score de popularité de l'outil.
                        </div>
                    </div>

                    {/* Right: Academic Study Guide */}
                    <div style={{
                        padding: '32px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        background: 'rgba(16, 17, 26, 0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={20} color="#d946ef" />
                            <h4 style={{ fontSize: '1.05rem', color: 'white', fontWeight: 700 }}>
                                Guide de Recherche Universitaire
                            </h4>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                            Optimisez votre utilisation académique de <strong>{tool.name}</strong> en exploitant ces modèles de prompts et scénarios d'études validés :
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {guides.map((g, idx) => (
                                <div key={idx} className="glass-card" style={{
                                    padding: '16px',
                                    background: 'rgba(24, 25, 38, 0.4)',
                                    border: '1px solid rgba(255,255,255,0.04)'
                                }}>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: '#a78bfa',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {g.title}
                                    </div>
                                    <p style={{
                                        fontSize: '0.82rem',
                                        color: '#e5e7eb',
                                        fontFamily: 'monospace',
                                        background: '#0a0a0f',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        userSelect: 'all',
                                        border: '1px solid rgba(255,255,255,0.03)'
                                    }}>
                                        {g.prompt}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
