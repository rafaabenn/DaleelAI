import React, { useState } from 'react';
import { api } from '../services/api';
import { LogIn, Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react';

export default function Login({ onAuthSuccess, setPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.auth.login(email, password);
            if (res.success) {
                // Save tokens
                localStorage.setItem('daleel_ai_token', res.token);
                localStorage.setItem('daleel_ai_user', JSON.stringify(res.user));
                onAuthSuccess(res.user);
                setPage('home');
            } else {
                setError(res.message || "Identifiants incorrects.");
            }
        } catch (err) {
            setError(err.message || "Impossible de se connecter. Assurez-vous que le serveur PHP est allumé.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '75vh',
            position: 'relative'
        }}>
            <div className="gradient-bg"></div>

            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '450px',
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
                        <LogIn size={24} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)' }}>
                        Connexion
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#9ca3af', marginTop: '6px' }}>
                        Accédez à votre espace Daleel AI
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

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef' }}>
                            Adresse Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', display: 'flex' }}>
                                <Mail size={16} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre.email@universite.fr"
                                className="input-field"
                                style={{ paddingLeft: '44px' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d946ef' }}>
                                Mot de Passe
                            </label>
                        </div>
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
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
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
                    <span style={{ color: '#9ca3af' }}>Vous n'avez pas encore de compte universitaire ?</span>
                    <button
                        onClick={() => setPage('register')}
                        style={{
                            background: 'transparent',
                            color: '#d946ef',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Créer un compte
                    </button>
                </div>
            </div>
        </div>
    );
}
