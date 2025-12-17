// src/pages/ClinicalTrialDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TrialStatusCard from '../components/clinical/TrialStatusCard';
import IRBStatusTimeline from '../components/clinical/IRBStatusTimeline';
import DocumentList from '../components/clinical/DocumentList';
import './ClinicalTrialDashboard.css';

const ClinicalTrialDashboard = () => {
    const { user } = useAuth();
    const [allTrials, setAllTrials] = useState([]);
    const [selectedTrialId, setSelectedTrialId] = useState(null);
    const [trialData, setTrialData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [irbHistory, setIrbHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

    useEffect(() => {
        fetchAllTrials();
    }, []);

    const fetchAllTrials = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('auth_token');

            // Fetch all trials
            const trialsResponse = await fetch(`${API_BASE_URL}/api/vendor/clinical/trials`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!trialsResponse.ok) {
                // Handle 404 or other errors gracefully
                if (trialsResponse.status === 404) {
                    console.log('No trials endpoint found or no trials available');
                    setAllTrials([]);
                    setError('You have not registered for any clinical trials yet. Contact support to get started.');
                    setLoading(false);
                    return;
                }
                throw new Error(`Failed to fetch trials: ${trialsResponse.status}`);
            }

            const trials = await trialsResponse.json();

            if (!trials || trials.length === 0) {
                console.log('No clinical trials found for this vendor');
                setAllTrials([]);
                setError('You have not registered for any clinical trials yet. Contact support to get started.');
                setLoading(false);
                return;
            }

            setAllTrials(trials);
            setSelectedTrialId(trials[0].trial_id);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching trials:', err);
            setAllTrials([]);
            setError(err.message || 'Failed to fetch clinical trials. Please try again.');
            setLoading(false);
        }
    };

    const fetchTrialDetails = async (trialId) => {
        try {
            setDetailLoading(true);
            const token = localStorage.getItem('auth_token');

            // Find trial from allTrials
            const trial = allTrials.find(t => t.trial_id === trialId);
            setTrialData(trial);

            // Fetch IRB history
            try {
                const irbResponse = await fetch(
                    `${API_BASE_URL}/api/vendor/clinical/trials/${trialId}/irb-history`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (irbResponse.ok) {
                    const irbData = await irbResponse.json();
                    setIrbHistory(irbData.history || []);
                }
            } catch (err) {
                console.error('Error fetching IRB history:', err);
            }

            // Fetch payments
            try {
                const paymentsResponse = await fetch(
                    `${API_BASE_URL}/api/vendor/clinical/trials/${trialId}/payments`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (paymentsResponse.ok) {
                    const paymentsData = await paymentsResponse.json();
                    setPayments(paymentsData || []);
                }
            } catch (err) {
                console.error('Error fetching payments:', err);
            }

            // Fetch documents
            try {
                const docsResponse = await fetch(
                    `${API_BASE_URL}/api/vendor/clinical/trials/${trialId}/documents`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (docsResponse.ok) {
                    const docsData = await docsResponse.json();
                    setDocuments(docsData || []);
                }
            } catch (err) {
                console.error('Error fetching documents:', err);
            }

            setDetailLoading(false);
        } catch (err) {
            console.error('Error fetching trial details:', err);
            setDetailLoading(false);
        }
    };

    const handleTrialClick = (trialId) => {
        setSelectedTrialId(trialId);
        fetchTrialDetails(trialId);
    };

    const handleBackToList = () => {
        setSelectedTrialId(null);
        setTrialData(null);
        setDocuments([]);
        setPayments([]);
        setIrbHistory([]);
    };

    const getStatusBadgeClass = (status) => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower.includes('active') || statusLower.includes('approved')) return 'status-badge-success';
        if (statusLower.includes('pending') || statusLower.includes('preparation')) return 'status-badge-warning';
        if (statusLower.includes('completed')) return 'status-badge-info';
        return 'status-badge-default';
    };

    if (loading) {
        return (
            <div className="clinical-trial-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your clinical trial information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="clinical-trial-container">
                <div className="clinical-trial-header">
                    <div className="header-content">
                        <h1 className="page-title">Clinical Trials</h1>
                        <p className="page-subtitle">
                            View and manage all your clinical trials
                        </p>
                    </div>
                </div>

                <div className="loading-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
                    <h2 style={{ marginBottom: '10px', color: '#0f172a' }}>No Clinical Trials Yet</h2>
                    <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '30px' }}>
                        {error}
                    </p>
                    <button onClick={fetchAllTrials} className="btn btn-primary" style={{ marginRight: '10px' }}>
                        🔄 Refresh
                    </button>
                    <a href="mailto:support@mannbiome.com" className="btn btn-secondary">
                        📧 Contact Support
                    </a>
                </div>
            </div>
        );
    }

    // LIST VIEW - Show all trials
    if (!selectedTrialId) {
        return (
            <div className="clinical-trial-container">
                {/* Page Header */}
                <div className="clinical-trial-header">
                    <div className="header-content">
                        <h1 className="page-title">Clinical Trials</h1>
                        <p className="page-subtitle">
                            View and manage all your clinical trials
                        </p>
                    </div>
                </div>

                {/* Trials List */}
                <div className="trials-list">
                    {allTrials.map((trial) => (
                        <div
                            key={trial.trial_id}
                            className="trial-card"
                            onClick={() => handleTrialClick(trial.trial_id)}
                        >
                            <div className="trial-card-header">
                                <h3 className="trial-card-title">{trial.trial_name}</h3>
                                <span className={`status-badge ${getStatusBadgeClass(trial.trial_status)}`}>
                                    {trial.trial_status}
                                </span>
                            </div>

                            <div className="trial-card-body">
                                <div className="trial-info-row">
                                    <span className="trial-info-label">Product:</span>
                                    <span className="trial-info-value">{trial.product_name}</span>
                                </div>

                                <div className="trial-info-row">
                                    <span className="trial-info-label">IRB Status:</span>
                                    <span className={`status-badge ${getStatusBadgeClass(trial.irb_status)}`}>
                                        {trial.irb_status}
                                    </span>
                                </div>

                                {trial.trial_description && (
                                    <div className="trial-info-row">
                                        <span className="trial-info-label">Description:</span>
                                        <span className="trial-info-value trial-description">
                                            {trial.trial_description}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="trial-card-footer">
                                <span className="trial-card-action">
                                    View Details →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // DETAIL VIEW - Show selected trial details
    if (detailLoading) {
        return (
            <div className="clinical-trial-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading trial details...</p>
                </div>
            </div>
        );
    }

    if (!trialData) {
        return (
            <div className="clinical-trial-container">
                <div className="loading-container">
                    <p>No clinical trial data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="clinical-trial-container">
            {/* Page Header with Back Button */}
            <div className="clinical-trial-header">
                <div className="header-content">
                    <button
                        className="btn btn-secondary back-button"
                        onClick={handleBackToList}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 12L6 8l4-4" />
                        </svg>
                        Back to All Trials
                    </button>
                    <h1 className="page-title">Clinical Trial Dashboard</h1>
                    <p className="page-subtitle">
                        Track your clinical trial progress, documents, and payments
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 2v12M2 8h12" />
                        </svg>
                        Contact Support
                    </button>
                </div>
            </div>

            {/* Trial Status Card */}
            <TrialStatusCard trialData={trialData} />

            {/* Main Content Grid */}
            <div className="clinical-trial-grid">
                {/* Left Column - IRB Timeline and Documents */}
                <div className="grid-left">
                    <IRBStatusTimeline
                        currentStatus={trialData.irb_status}
                        history={irbHistory}
                        submissionDate={trialData.irb_submission_date}
                        approvalDate={trialData.irb_approval_date}
                    />

                    <DocumentList documents={documents} />
                </div>
            </div>
        </div>
    );
};

export default ClinicalTrialDashboard;