// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../config';
import './Login.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: verify identity, 2: reset password
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Step 1: Verify username and email
    const handleVerifyIdentity = async (e) => {
        e.preventDefault();

        if (!username.trim() || !email.trim()) {
            setErrorMessage('Username and email are required');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage('Please enter a valid email address');
            return;
        }

        try {
            setIsLoading(true);
            setErrorMessage('');

            // Call backend to verify username and email match
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/verify-identity`,
                { username, email }
            );

            if (response.data.verified) {
                // Move to step 2
                setStep(2);
            }
        } catch (error) {
            console.error('Identity verification error:', error);
            setErrorMessage(
                error.response?.data?.detail || 'Username and email do not match. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validate passwords
        if (!newPassword.trim()) {
            setErrorMessage('New password is required');
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage('Password must be at least 8 characters');
            return;
        }

        // Add this check for bcrypt limit
        if (newPassword.length > 72) {
            setErrorMessage('Password cannot be longer than 72 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }

        try {
            setIsLoading(true);
            setErrorMessage('');

            // Call backend to reset password
            await axios.post(
                `${API_CONFIG.BASE_URL}/reset-password`,
                {
                    username,
                    email,
                    new_password: newPassword
                }
            );

            // Redirect to login with success message
            navigate('/login', {
                state: {
                    resetSuccess: true,
                    message: 'Password reset successful! Please login with your new password.'
                }
            });
        } catch (error) {
            console.error('Password reset error:', error);
            setErrorMessage(
                error.response?.data?.detail || 'Failed to reset password. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            {/* Top Bar */}
            <div className="top-bar">
                <div className="top-bar-content">
                    <div>Call us at: 1-800-MICROBE | Contact Your Health Advisor</div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="main-nav">
                <div className="nav-content">
                    <Link to="/" className="logo">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00BFA5" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                        MannBiome
                    </Link>
                </div>
            </nav>

            {/* Forgot Password Container */}
            <div className="login-wrapper">
                <div className="login-container">
                    <h1 className="login-title">
                        {step === 1 ? 'Reset Password' : 'Set New Password'}
                    </h1>

                    <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px' }}>
                        {step === 1
                            ? 'Enter your username and email to verify your identity'
                            : 'Enter your new password'
                        }
                    </p>

                    {/* Step 1: Verify Identity */}
                    {step === 1 && (
                        <form onSubmit={handleVerifyIdentity}>
                            {errorMessage && (
                                <div className="error-message">{errorMessage}</div>
                            )}

                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    className="form-input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifying...' : 'Verify Identity'}
                            </button>

                            <div className="login-footer">
                                <Link to="/login" className="forgot-password-link">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Reset Password */}
                    {step === 2 && (
                        <form onSubmit={handleResetPassword}>
                            {errorMessage && (
                                <div className="error-message">{errorMessage}</div>
                            )}

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={8}
                                />
                                <small style={{ color: '#666', fontSize: '12px' }}>
                                    Must be at least 8 characters
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="login-page-footer">
                <div className="footer-content">
                    <div className="copyright">
                        © {new Date().getFullYear()} MannBiome. All rights reserved.
                    </div>
                    <div className="footer-links">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/support">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ForgotPassword;