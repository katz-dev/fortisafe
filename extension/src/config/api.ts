export const API_CONFIG = {
    baseUrl: 'http://localhost:8080', // Update with your backend URL
    endpoints: {
        auth: {
            login: '/api/auth/login',
            callback: '/api/auth/callback',
            profile: '/api/auth/profile',
            logout: '/api/auth/logout'
        }
    }
};