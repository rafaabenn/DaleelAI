import React, { useState } from 'react';
import { api } from '../services/api';
import { UserPlus, User, Mail, Lock, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Register({ onAuthSuccess, setPage }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.auth.register(username, email, password);
            if (res.success) {
                setSuccess("Votre compte universitaire a été créé avec succès ! Authentification en cours...");
                
                // Immediately auto-login for perfect UX
                setTimeout(async () => {
                    try {
                        const loginRes = await api.auth.login(email, password);
                        if (loginRes.success) {
                            localStorage.setItem('daleel_ai_token', loginRes.token);
                            localStorage.setItem('daleel_ai_user', JSON.stringify(loginRes.user));
                            onAuthSuccess(loginRes.user);
                            setPage('home');
                        }
                    } catch (err) {
                        setPage('login');
                    }
                }, 1500);
            } else {
                setError(res.message || "Erreur lors de la création du compte.");
            }
        } catch (err) {
            setError(err.message || "Impossible de s'inscrire. Assurez-vous que le serveur PHP et MySQL sont allumés.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            position: 'relative'
        }}>
            <div className="gradient-bg"></div>

            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '480px',
                padding: '40px',
                background: 'rgba(16, 17, 26, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '20px',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                        boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)'
                    }}>
                        <UserPlus size={24} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)' }}>
                        Inscription
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#9ca3af', marginTop: '6px' }}>
                        Rejoignez le portail Daleel AI pour soumettre et tester des outils
                    </p>
                </div>

                {error && (
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
                        <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
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
                        <CheckCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{success}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef' }}>
                            Nom d'Utilisateur Académique
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', display: 'flex' }}>
                                <User size={16} />
                            </div>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ex: Prof.Jean ou Dr.Amine" 
                                className="input-field"
                                style={{ paddingLeft: '44px' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef' }}>
                            Adresse Email Universitaire
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', display: 'flex' }}>
                                <Mail size={16} />
                            </div>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre.nom@univ-paris.fr" 
                                className="input-field"
                                style={{ paddingLeft: '44px' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef' }}>
                            Mot de Passe
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', display: 'flex' }}>
                                <Lock size={16} />
                            </div>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••" 
                                className="input-field"
                                style={{ paddingLeft: '44px' }}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={loading}
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            padding: '12px',
                            fontSize: '1rem',
                            marginTop: '10px'
                        }}
                    >
                        {loading ? 'Inscription en cours...' : "S'inscrire"}
                    </button>
                </form>

                {/* Redirect links */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '28px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '20px',
                    fontSize: '0.88rem'
                }}>
                    <span style={{ color: '#9ca3af' }}>Vous possédez déjà un compte ?</span>
                    <button 
                        onClick={() => setPage('login')}
                        style={{
                            background: 'transparent',
                            color: '#d946ef',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        </div>
    );
}
