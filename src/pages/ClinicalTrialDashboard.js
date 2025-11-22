// src/pages/ClinicalTrialDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TrialStatusCard from '../components/clinical/TrialStatusCard';
import IRBStatusTimeline from '../components/clinical/IRBStatusTimeline';
import DocumentList from '../components/clinical/DocumentList';
import './ClinicalTrialDashboard.css';

const ClinicalTrialDashboard = () => {
    const { user } = useAuth();
    const [trialData, setTrialData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [irbHistory, setIrbHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

    useEffect(() => {
        fetchClinicalTrialData();
    }, []);

    const fetchClinicalTrialData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            // Fetch all trials
            const trialsResponse = await fetch(`${API_BASE_URL}/api/vendor/clinical/trials`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!trialsResponse.ok) throw new Error('Failed to fetch trials');
            const trials = await trialsResponse.json();

            if (trials.length === 0) {
                setError('No clinical trial found. Please register for a trial first.');
                setLoading(false);
                return;
            }

            // Get the first trial (assuming one trial per vendor for now)
            const trial = trials[0];
            setTrialData(trial);

            // Fetch IRB history
            try {
                const irbResponse = await fetch(
                    `${API_BASE_URL}/api/vendor/clinical/trials/${trial.trial_id}/irb-history`,
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
                    `${API_BASE_URL}/api/vendor/clinical/trials/${trial.trial_id}/payments`,
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
                    `${API_BASE_URL}/api/vendor/clinical/trials/${trial.trial_id}/documents`,
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

            setLoading(false);
        } catch (err) {
            console.error('Error fetching clinical trial data:', err);
            setError(err.message);
            setLoading(false);
        }
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
                <div className="loading-container">
                    <p style={{ color: '#ef4444' }}>{error}</p>
                    <button onClick={fetchClinicalTrialData} className="btn btn-primary" style={{ marginTop: '16px' }}>
                        Retry
                    </button>
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
            {/* Page Header */}
            <div className="clinical-trial-header">
                <div className="header-content">
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