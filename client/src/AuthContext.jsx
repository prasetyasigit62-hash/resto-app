import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // --- GLOBAL FETCH INTERCEPTOR: AUTO REFRESH TOKEN (TAHAP 4) ---
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            let [resource, config] = args;
            
            // 1. Tambahkan Authorization header otomatis ke setiap request backend
            if (typeof resource === 'string' && resource.includes('/api/')) {
                const token = localStorage.getItem('resto_accessToken') || localStorage.getItem('resto_token');
                if (token) {
                    config = config || {};
                    config.headers = { ...config.headers, 'Authorization': `Bearer ${token}` };
                }
            }

            let response = await originalFetch(resource, config);

            // 2. Jika Token Expired (401/403), lakukan Auto-Refresh Token
            if ((response.status === 401 || response.status === 403) && typeof resource === 'string' && !resource.includes('/auth/refresh') && !resource.includes('/login')) {
                const refreshToken = localStorage.getItem('resto_refreshToken');
                if (refreshToken) {
                    try {
                        const apiHost = resource.split('/api/')[0]; // Ekstrak host dinamis
                        const refreshRes = await originalFetch(`${apiHost}/api/v2/auth/refresh`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken })
                        });
                        
                        if (refreshRes.ok) {
                            const { accessToken } = await refreshRes.json();
                            localStorage.setItem('resto_accessToken', accessToken);
                            
                            // 3. Ulangi request asli yang gagal dengan accessToken baru
                            config.headers['Authorization'] = `Bearer ${accessToken}`;
                            response = await originalFetch(resource, config);
                        } else {
                            // Jika refresh token juga expired, paksa logout
                            localStorage.removeItem('resto_token');
                            localStorage.removeItem('resto_accessToken');
                            localStorage.removeItem('resto_refreshToken');
                            window.location.href = '/';
                        }
                    } catch (err) {
                        console.error('Refresh token error:', err);
                    }
                }
            }
            return response;
        };

        const initializeAuth = async () => {
            const token = localStorage.getItem('resto_accessToken') || localStorage.getItem('resto_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // First, decode token to get basic user info quickly
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload);

                // Then, fetch full user data to keep it updated
                const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
                const res = await fetch(`${apiUrl}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const fullData = await res.json();
                    // Combine payload with fresh data, giving precedence to fresh data
                    setUser(prev => ({ ...prev, ...fullData }));
                } else if (res.status === 401 || res.status === 403) {
                    // Peringatan 401/403 saat inisialisasi kini akan ditangani secara otomatis
                    // oleh Interceptor (window.fetch) di atas.
                }
            } catch (e) {
                console.error("Error initializing auth", e);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (loginData) => {
        localStorage.setItem('resto_token', loginData.token);
        if (loginData.accessToken) localStorage.setItem('resto_accessToken', loginData.accessToken);
        if (loginData.refreshToken) localStorage.setItem('resto_refreshToken', loginData.refreshToken);
        let currentUser = loginData.user;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
            const res = await fetch(`${apiUrl}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${loginData.accessToken || loginData.token}` }
            });
            if (res.ok) {
                const fullData = await res.json();
                currentUser = { ...currentUser, ...fullData };
            }
        } catch (err) {
            console.error("Gagal menarik data full setelah login:", err);
        }
        
        setUser(currentUser);
    };

    const logout = () => {
        localStorage.removeItem('resto_token');
        localStorage.removeItem('resto_accessToken');
        localStorage.removeItem('resto_refreshToken');
        setUser(null);
        window.location.href = '/'; // Redirect to login
    };
    
    const updateUser = (updatedData) => {
        setUser(prev => ({...prev, ...updatedData}));
    };

    const value = { user, loading, login, logout, updateUser };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};