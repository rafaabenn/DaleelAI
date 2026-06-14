// =====================================================================
// Daleel AI - Central REST API Client Service (with JWT Bearer Injection)
// =====================================================================

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Generic request handler that injects JWT authentication token automatically.
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Auto-inject JWT token if it exists in localStorage
    const token = localStorage.getItem('daleel_ai_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        const contentType = response.headers.get('content-type') || '';
        const rawBody = await response.text();
        let data = {};

        if (rawBody) {
            if (contentType.includes('application/json')) {
                try {
                    data = JSON.parse(rawBody);
                } catch {
                    const cleaned = rawBody
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    throw new Error(cleaned || `Réponse JSON invalide (${response.status})`);
                }
            } else {
                const cleaned = rawBody
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                throw new Error(cleaned || `Réponse serveur invalide (${response.status})`);
            }
        }

        if (!response.ok) {
            // Handle automatic token expiration or session cancellation
            if (response.status === 401 && token) {
                localStorage.removeItem('daleel_ai_token');
                localStorage.removeItem('daleel_ai_user');
                window.location.reload();
            }
            throw new Error(data.message || `Erreur API (${response.status})`);
        }

        return data;
    } catch (error) {
        console.error(`Request to ${endpoint} failed:`, error);
        throw error;
    }
}

export const api = {
    // -----------------------------------------------------------------
    // AUTHENTICATION API CALLS
    // -----------------------------------------------------------------
    auth: {
        register: (username, email, password) => 
            request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            }),
            
        login: (email, password) => 
            request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            }),
            
        getProfile: () => 
            request('/auth/profile', { method: 'GET' })
    },

    // -----------------------------------------------------------------
    // AI TOOLS CLIENT API CALLS
    // -----------------------------------------------------------------
    tools: {
        // Fetch all tools based on filters and search queries
        getTools: (filters = {}) => {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    queryParams.append(key, val);
                }
            });
            const queryString = queryParams.toString();
            return request(`/tools${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
        },

        // Fetch categories and sidebar filters
        getFilters: () => 
            request('/tools/filters', { method: 'GET' }),

        // Fetch specific AI tool detail
        getDetail: (id) => 
            request(`/tools/detail?id=${id}`, { method: 'GET' }),

        // Validate tool data via Gemini AI before actual submission
        aiValidate: (toolData) =>
            request('/tools/ai-validation', {
                method: 'POST',
                body: JSON.stringify(toolData)
            }),

        // Submit new AI tool (checks duplicate before pending insertion)
        submit: (toolData) =>
            request('/tools/submit', {
                method: 'POST',
                body: JSON.stringify(toolData)
            }),

        getMySubmissions: () =>
            request('/tools/my-submissions', { method: 'GET' }),

        resubmit: (toolData) =>
            request('/tools/resubmit', {
                method: 'POST',
                body: JSON.stringify(toolData)
            }),

        // Favorite/Unfavorite toggling
        toggleFavorite: (toolId) => 
            request('/tools/favorite', {
                method: 'POST',
                body: JSON.stringify({ tool_id: toolId })
            }),

        // Retrieve user favorite list
        getFavorites: () => 
            request('/tools/favorites', { method: 'GET' }),

        // Retrieve current user's notifications
        getNotifications: () => 
            request('/notifications', { method: 'GET' }),

        // Mark a notification as read
        markNotificationRead: (notificationId) => 
            request('/notifications/read', {
                method: 'POST',
                body: JSON.stringify({ notification_id: notificationId })
            }),

        // Submit user review ratings
        submitReview: (toolId, rating, comment) =>
            request('/tools/review', {
                method: 'POST',
                body: JSON.stringify({ tool_id: toolId, rating, comment })
            }),

        // Log a tool view (used for personalisation)
        logClick: (toolId) =>
            request('/tools/click', {
                method: 'POST',
                body: JSON.stringify({ tool_id: toolId })
            }),

        // Fetch personalised recommendations for the logged-in user
        getRecommended: () =>
            request('/tools/recommended', { method: 'GET' })
    },

    // -----------------------------------------------------------------
    // FLOATING CHATBOT API CALLS
    // -----------------------------------------------------------------
    chatbot: {
        getConversations: () => 
            request('/chatbot', { method: 'GET' }),
            
        getHistory: (conversationId) => 
            request(`/chatbot/history?conversation_id=${conversationId}`, { method: 'GET' }),
            
        sendMessage: (message, conversationId = 0) => 
            request('/chatbot', {
                method: 'POST',
                body: JSON.stringify({ message, conversation_id: conversationId })
            })
    },

    // -----------------------------------------------------------------
    // ADMINISTRATIVE BACK-OFFICE API CALLS
    // -----------------------------------------------------------------
    admin: {
        getStats: () => 
            request('/admin/stats', { method: 'GET' }),
            
        getSubmissions: () => 
            request('/admin/submissions', { method: 'GET' }),
            
        validateSubmission: (toolId, action, comment = '') => 
            request('/admin/submissions/validate', {
                method: 'POST',
                body: JSON.stringify({ tool_id: toolId, action, comment })
            }),
            
        getReviews: () => 
            request('/admin/reviews', { method: 'GET' }),
            
        moderateReview: (reviewId, action, comment = '') => 
            request('/admin/reviews/moderate', {
                method: 'POST',
                body: JSON.stringify({ review_id: reviewId, action, comment })
            }),
            
        // CRUD operations
        createTool: (toolData) => 
            request('/admin/tools/create', {
                method: 'POST',
                body: JSON.stringify(toolData)
            }),
            
        updateTool: (toolData) => 
            request('/admin/tools/update', {
                method: 'POST',
                body: JSON.stringify(toolData)
            }),
            
        deleteTool: (id) => 
            request('/admin/tools/delete', {
                method: 'POST',
                body: JSON.stringify({ id })
            })
    }
};
