import React from 'react';
import { Star, ShieldCheck, Cpu, Smartphone, Heart, ArrowRight } from 'lucide-react';

export default function ToolCard({ tool, isFavorited, onToggleFav, onSelect, user }) {
    // Helper to render rating stars
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(<Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />);
            } else if (i === fullStars + 1 && hasHalf) {
                stars.push(
                    <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                        <Star size={14} color="#f59e0b" />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        </div>
                    </div>
                );
            } else {
                stars.push(<Star key={i} size={14} color="#4b5563" />);
            }
        }
        return stars;
    };

    // Helper to get score badge colors based on weighted value
    const getScoreColor = (score) => {
        if (score >= 80) return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' }; // Excellent (Green)
        if (score >= 60) return { bg: 'rgba(168, 85, 247, 0.15)', text: '#d946ef', border: '#a855f7' }; // Highly Rated (Purple)
        if (score >= 40) return { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: '#f97316' }; // Average (Orange)
        return { bg: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e', border: '#f43f5e' }; // Low Match (Rose)
    };

    const scoreStyle = getScoreColor(tool.global_score);

    return (
        <div className="glass-card" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            minHeight: '260px',
            overflow: 'hidden'
        }}>
            {/* Top Row: Logo, Name, Score and Favorite */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Logo */}
                        <img 
                            src={tool.logo_url} 
                            alt={`${tool.name} logo`} 
                            onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=100';
                            }}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '10px',
                                objectFit: 'contain',
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '4px'
                            }}
                        />
                        {/* Name and Stars */}
                        <div>
                            <h3 style={{
                                fontSize: '1.15rem',
                                color: 'white',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                {tool.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <div style={{ display: 'flex' }}>
                                    {renderStars(parseFloat(tool.average_rating))}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>
                                    {parseFloat(tool.average_rating) > 0 ? parseFloat(tool.average_rating).toFixed(1) : 'S.N.'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right corner: Global Score Badge and Favorite Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Weighted score bubble */}
                        <div style={{
                            background: scoreStyle.bg,
                            color: scoreStyle.text,
                            border: `1px solid ${scoreStyle.border}`,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-display)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            lineHeight: 1.1
                        }} title="Score de classement pondéré Daleel AI (Pertinence + Notes + Fraîcheur + Popularité)">
                            <span style={{ fontSize: '0.5rem', textTransform: 'uppercase', opacity: 0.8 }}>SCORE</span>
                            <span style={{ fontSize: '0.9rem' }}>{tool.global_score}</span>
                        </div>

                        {/* Favorite button if user logged in */}
                        {user && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFav(tool.id);
                                }}
                                style={{
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: isFavorited ? '#f43f5e' : '#9ca3af',
                                    transition: 'var(--transition-smooth)'
                                }}
                            >
                                <Heart size={20} fill={isFavorited ? '#f43f5e' : 'transparent'} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Short Description */}
                <p style={{
                    fontSize: '0.88rem',
                    color: '#e5e7eb',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {tool.short_description}
                </p>

                {/* Categories & Price tags */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '16px'
                }}>
                    {tool.categories && tool.categories.map((c, i) => (
                        <span key={i} className="badge badge-purple">{c.name}</span>
                    ))}
                    {tool.pricings && tool.pricings.map((p, i) => (
                        <span key={i} className="badge badge-blue">{p.name}</span>
                    ))}
                </div>
            </div>

            {/* Bottom Row: Compliance badges and Action buttons */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '14px',
                marginTop: 'auto'
            }}>
                {/* Tech specifications badges */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {tool.gdpr_compliant === 1 && (
                        <span style={{ color: '#10b981' }} title="Conforme RGPD">
                            <ShieldCheck size={16} />
                        </span>
                    )}
                    {tool.has_api === 1 && (
                        <span style={{ color: '#3b82f6' }} title="API disponible">
                            <Cpu size={16} />
                        </span>
                    )}
                    {tool.has_mobile_app === 1 && (
                        <span style={{ color: '#f97316' }} title="Application mobile disponible">
                            <Smartphone size={16} />
                        </span>
                    )}
                </div>

                {/* Detail action */}
                <button 
                    onClick={() => onSelect(tool.id)}
                    style={{
                        background: 'transparent',
                        color: '#a78bfa',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                    }}
                >
                    Fiche Détails
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}
