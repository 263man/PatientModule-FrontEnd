// telehealth-frontend/src/auth/AuthContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from './AuthService'; // Import the AuthService

// Create the AuthContext
const AuthContext = createContext(null);

/**
 * Custom hook to use the authentication context.
 * Provides access to login, logout, user, token, and isLoggedIn state.
 * @returns {object} Auth context values.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * AuthProvider component to wrap the application and provide authentication state.
 * @param {object} children - React children to render within the provider.
 */
export const AuthProvider = ({ children }) => {
    // Initial state set to null, will be determined after initial check
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false); // For async operations like login
    const [error, setError] = useState(null); // For login/auth errors
    const [isAuthChecking, setIsAuthChecking] = useState(true); // NEW: To indicate initial auth check is in progress

    // Effect to perform initial authentication check on mount
    useEffect(() => {
        const checkInitialAuth = () => {
            const storedToken = AuthService.getToken();
            const storedUser = AuthService.getUser();

            if (storedToken && AuthService.isTokenExpired(storedToken) === false) {
                // Token exists and is not expired, so set user and token
                setToken(storedToken);
                setUser(storedUser);
            } else {
                // Token is missing or expired, ensure logout state
                AuthService.logout(); // Clear any stale token/user in localStorage
                setToken(null);
                setUser(null);
            }
            setIsAuthChecking(false); // Auth check complete
        };

        checkInitialAuth();

        // Optional: Update state when token/user in local storage changes (e.g., from another tab)
        const handleStorageChange = () => {
            // Re-run the initial check logic to sync across tabs
            checkInitialAuth();
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // Empty dependency array means this runs once on mount

    /**
     * Handles the login process.
     * @param {string} username - User's username.
     * @param {string} password - User's password.
     * @returns {Promise<boolean>} True if login is successful, false otherwise.
     */
    const login = useCallback(async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const { token: receivedToken, user: receivedUser } = await AuthService.login(username, password);
            setToken(receivedToken);
            setUser(receivedUser);
            setLoading(false);
            return true;
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.message || 'An unexpected error occurred during login.');
            setLoading(false);
            return false;
        }
    }, []);

    /**
     * Handles the logout process.
     */
    const logout = useCallback(() => {
        AuthService.logout();
        setToken(null);
        setUser(null);
        setError(null); // Clear any errors on logout
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = React.useMemo(() => ({
        user,
        token,
        isLoggedIn: !!token, // Derived state: true if token exists and is valid
        login,
        logout,
        loading,
        error,
        isAuthChecking, // NEW: Include the initial auth check status
    }), [user, token, login, logout, loading, error, isAuthChecking]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};