// telehealth-frontend/src/auth/AuthService.js

const TOKEN_KEY = 'jwtToken';
const USER_KEY = 'currentUser';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AuthService = {
    // *** CHANGE THIS LINE ***
    login: async (email, password) => { // Changed 'username' to 'email'
        try {
            const response = await fetch(`${API_BASE_URL}/api/Account/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok === false) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed. Please check your credentials.');
            }

            const data = await response.json();
            // Store the token and user data upon successful login
            localStorage.setItem(TOKEN_KEY, data.token);
            // Assuming the API returns a 'user' object along with the token
            // Adjust this based on your actual API response structure
            localStorage.setItem(USER_KEY, JSON.stringify(data.user)); // Store user details if available

            return data;
        } catch (error) {
            console.error('AuthService login error:', error);
            throw error;
        }
    },

    /**
     * Logs out the current user by removing the token and user data from local storage.
     */
    logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    /**
     * Retrieves the stored JWT token.
     * @returns {string | null} The JWT token if found, otherwise null.
     */
    getToken: () => {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Retrieves the stored user data.
     * @returns {object | null} The user object if found, otherwise null.
     */
    getUser: () => {
        const userJson = localStorage.getItem(USER_KEY);
        if (userJson === null) {
            return null;
        }
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error('Failed to parse user data from local storage', e);
            return null;
        }
    },

    /**
     * Checks if a JWT token is expired based on its 'exp' claim.
     * Note: This is a client-side check and does not verify the token's signature or validity with the server.
     * @param {string} token - The JWT token string.
     * @returns {boolean} True if the token is expired, false otherwise.
     */
    isTokenExpired: (token) => {
        if (token === null || token.length === 0) {
            return true; // No token means it's "expired" for practical purposes
        }
        try {
            const base64Url = token.split('.')[1];
            if (base64Url === null || base64Url.length === 0) {
                return true; // Malformed token
            }
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const { exp } = JSON.parse(jsonPayload);
            if (exp === undefined) {
                return true; // Token has no expiration claim, consider it expired for safety
            }
            const expirationTime = exp * 1000; // Convert to milliseconds
            return Date.now() >= expirationTime;
        } catch (e) {
            console.error("Error decoding or checking token expiration:", e);
            return true; // Treat any error during decoding as an expired/invalid token
        }
    },
};

export default AuthService;