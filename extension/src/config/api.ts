export const API_CONFIG = {
    baseUrl: 'http://localhost:8080/api',
    endpoints: {
        auth: {
            login: '/auth/login',
            callback: '/auth/callback',
            profile: '/auth/profile'
        },
        users: {
            profile: '/users/profile'
        },
        passwords: {
            list: '/passwords',
            create: '/passwords',
            update: (id: string) => `/passwords/${id}`,
            delete: (id: string) => `/passwords/${id}`
        },
        scanner: {
            scan: '/scanner',
            scanSavedPasswords: '/scanner/scan-saved-passwords'
        }
    }
}; 