import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { X, Send, Bot, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function ChatbotWindow({ user, onClose, onSelectTool }) {
    const [messages, setMessages] = useState([
        {
            sender: 'assistant',
            message: `Bonjour ${user ? user.username : 'collègue'} ! 🎓 Je suis l'assistant académique intelligent de Daleel AI.\n\nDécrivez-moi vos besoins de recherche ou de travail (ex: *"Je cherche un traducteur de documents en Français gratuit"* ou *"Un outil de génération d'images pour illustrer ma thèse"*), et je vais scanner nos outils indexés pour vous recommander les meilleurs !`
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [convId, setConvId] = useState(0);
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef(null);

    // Scroll chat window to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    // Retrieve active chat history or conversations on mount
    useEffect(() => {
        if (user) {
            api.chatbot.getConversations()
                .then(res => {
                    if (res.success && res.conversations.length > 0) {
                        // Load the most recent conversation session
                        const activeConv = res.conversations[0];
                        setConvId(activeConv.id);
                        
                        api.chatbot.getHistory(activeConv.id)
                            .then(historyRes => {
                                if (historyRes.success && historyRes.messages.length > 0) {
                                    setMessages(historyRes.messages);
                                }
                            })
                            .catch(err => console.error("Erreur historique messages chatbot", err));
                    }
                })
                .catch(err => console.error("Erreur conversations chatbot", err));
        }
    }, [user]);

    const handleSend = async (e) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text || sending) return;

        // Append User Message locally
        const userMsg = { sender: 'user', message: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setSending(true);

        try {
            // Call API
            const res = await api.chatbot.sendMessage(text, convId);
            
            if (res.success) {
                setConvId(res.conversation_id);
                // Append Assistant Message
                const assistantMsg = { 
                    sender: 'assistant', 
                    message: res.assistant_message,
                    matchedTools: res.matched_tools // Carry recommended tools metadata
                };
                setMessages(prev => [...prev, assistantMsg]);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                sender: 'assistant',
                message: "Désolé, je rencontre une petite difficulté technique pour analyser votre demande. Veuillez vous assurer que le serveur PHP et la base de données MySQL sont allumés.",
                isError: true
            }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="chatbot-window glass-panel" style={{
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'rgba(10, 11, 16, 0.95)',
        }}>
            {/* Header */}
            <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                    }}>
                        <Bot size={18} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Daleel Assistant
                            <Sparkles size={12} color="#d946ef" />
                        </h3>
                        <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                            Conseiller Virtuel Académique
                        </span>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Chat Messages Logs */}
            <div className="chat-body">
                {messages.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <div 
                            className={`chat-message ${m.sender}`}
                            style={{
                                display: 'flex',
                                gap: '8px',
                                ...(m.isError ? { border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' } : {})
                            }}
                        >
                            <div style={{ whiteSpace: 'pre-line' }}>{m.message}</div>
                        </div>

                        {/* Embed suggestions links if returned by assistant */}
                        {m.matchedTools && m.matchedTools.length > 0 && (
                            <div style={{
                                paddingLeft: '12px',
                                borderLeft: '2px solid var(--accent-purple)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                margin: '4px 0 12px 0'
                            }}>
                                <span style={{ fontSize: '0.75rem', color: '#d946ef', fontWeight: 600 }}>
                                    Outils recommandés à inspecter :
                                </span>
                                {m.matchedTools.map(t => (
                                    <div 
                                        key={t.id}
                                        onClick={() => onSelectTool(t.id)}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'var(--transition-smooth)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <img 
                                                src={t.logo_url} 
                                                alt={t.name}
                                                style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                                                onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=40'}
                                            />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>
                                                {t.name}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                                                ({parseFloat(t.average_rating) > 0 ? parseFloat(t.average_rating).toFixed(1) : '5.0'}★)
                                            </span>
                                        </div>
                                        <ArrowRight size={12} color="#d946ef" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading typing indicator */}
                {sending && (
                    <div className="chat-message assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Analyse sémantique Daleel AI en cours...</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', animation: 'pulse 1.4s infinite both' }}></div>
                            <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', animation: 'pulse 1.4s infinite both 0.2s' }}></div>
                            <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', animation: 'pulse 1.4s infinite both 0.4s' }}></div>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Chat Input form footer */}
            <form onSubmit={handleSend} className="chat-footer">
                <div className="chat-input-wrapper">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ex: traducteur de texte gratuit..." 
                        className="chat-input"
                        disabled={sending}
                    />
                    <button 
                        type="submit" 
                        className="chat-send-btn"
                        disabled={!inputValue.trim() || sending}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.2; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}
