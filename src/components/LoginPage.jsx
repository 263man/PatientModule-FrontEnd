// telehealth-frontend/src/components/LoginPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext'; // Import useAuth hook

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error } = useAuth(); // Get login function, loading, and error from context

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Call the login function from AuthContext
        const success = await login(username, password);
        if (success) {
            // Optionally, redirect the user or show a success message
            console.log('Login successful!');
            // No explicit redirect here; App.jsx will handle rendering based on isLoggedIn state
        } else {
            // Error message is already handled and displayed by the component via `error` state
            console.error('Login failed in component.');
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen py-8 font-inter w-full px-4 sm:px-6"
            style={{
                backgroundImage: 'url("/download - Copy.jpg")', // Path to your image in the public folder
                backgroundSize: 'cover', // Ensures the image covers the entire background
                backgroundPosition: 'center', // Centers the image
                backgroundRepeat: 'no-repeat', // Prevents the image from repeating
            }}
        >
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login to Patient Portal</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">
                            Username (Email)
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                            placeholder="Enter your email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
                    )}
                    <button
                        type="submit"
                        className={`w-full py-3 rounded-md font-semibold text-white transition duration-200 ease-in-out ${
                            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;