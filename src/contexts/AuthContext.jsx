import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Load tokens from localStorage on mount
    useEffect(() => {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken && storedRefreshToken && storedUser) {
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (tokens, userData) => {
        setAccessToken(tokens.access_token);
        setRefreshToken(tokens.refresh_token);
        setUser(userData);

        localStorage.setItem('accessToken', tokens.access_token);
        localStorage.setItem('refreshToken', tokens.refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));

        navigate('/');
    };

    const logout = async () => {
        try {
            // Call logout endpoint to invalidate refresh token
            if (refreshToken) {
                await fetch('http://localhost:8000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear state and storage
            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);

            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            navigate('/login');
        }
    };

    const refreshAccessToken = async () => {
        try {
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch('http://localhost:8000/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            setAccessToken(data.access_token);
            localStorage.setItem('accessToken', data.access_token);

            return data.access_token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
            return null;
        }
    };

    const value = {
        user,
        accessToken,
        refreshToken,
        loading,
        login,
        logout,
        refreshAccessToken,
        isAuthenticated: !!accessToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
