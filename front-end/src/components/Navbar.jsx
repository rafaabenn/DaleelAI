import React from 'react';
import { Compass, User, LogOut, LayoutDashboard, Database, PlusCircle } from 'lucide-react';

export default function Navbar({ user, onLogout, setPage }) {
    return (
        <nav className="glass-panel" style={{
            position: 'fixed',
            top: '16px',
            left: '4%',
            right: '4%',
            height: '72px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100,
            borderRadius: '16px',
            background: 'rgba(16, 17, 26, 0.8)'
        }}>
            {/* Logo / Brand */}
            <div 
                onClick={() => setPage('home')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                }}
            >
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 50%, #10b981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(168, 85, 247, 0.5)'
                }}>
                    <Database size={22} color="white" />
                </div>
                <div>
                    <h1 style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: 'white',
                        lineHeight: 1
                    }}>Daleel AI</h1>
                    <span style={{
                        fontSize: '0.65rem',
                        color: '#60a5fa',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        fontWeight: 700
                    }}>Portail Académique</span>
                </div>
            </div>

            {/* Navigation links */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <button 
                    onClick={() => setPage('home')}
                    className="btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                    <Compass size={16} />
                    Explorer
                </button>

                {user ? (
                    <>
                        {/* Progressive roles rendering */}
                        {user.role_id === 1 ? (
                            /* Admin features */
                            <button 
                                onClick={() => setPage('admin')}
                                className="btn-primary" 
                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                            >
                                <LayoutDashboard size={16} />
                                Back-Office Admin
                            </button>
                        ) : (
                            /* Registered user features */
                            <>
                                <button 
                                    onClick={() => setPage('dashboard')}
                                    className="btn-secondary" 
                                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                >
                                    <LayoutDashboard size={16} />
                                    Mon Espace
                                </button>
                                <button 
                                    onClick={() => setPage('submit')}
                                    className="btn-primary" 
                                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                >
                                    <PlusCircle size={16} />
                                    Soumettre IA
                                </button>
                            </>
                        )}

                        {/* User Profile info */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            paddingLeft: '8px',
                            borderLeft: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
                                    {user.username}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                                    {user.role_name}
                                </div>
                            </div>
                            <button 
                                onClick={onLogout}
                                className="btn-danger" 
                                style={{ padding: '8px', borderRadius: '8px' }}
                                title="Se déconnecter"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    /* Guest links */
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setPage('login')}
                            className="btn-secondary" 
                            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                        >
                            Connexion
                        </button>
                        <button 
                            onClick={() => setPage('register')}
                            className="btn-primary" 
                            style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                        >
                            Inscription
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
