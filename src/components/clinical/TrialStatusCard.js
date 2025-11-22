// src/components/clinical/TrialStatusCard.js
import React from 'react';
import './TrialStatusCard.css';

const TrialStatusCard = ({ trialData }) => {
    const getStatusInfo = (status) => {
        const statusMap = {
            'registered': { label: 'Registered', color: '#3b82f6', bgColor: '#dbeafe' },
            'documents_pending': { label: 'Documents Pending', color: '#f59e0b', bgColor: '#fef3c7' },
            'payment_pending': { label: 'Payment Pending', color: '#f59e0b', bgColor: '#fef3c7' },
            'irb_preparation': { label: 'IRB Preparation', color: '#8b5cf6', bgColor: '#ede9fe' },
            'preparing': { label: 'Preparing', color: '#8b5cf6', bgColor: '#ede9fe' },
            'irb_submitted': { label: 'IRB Submitted', color: '#0ea5e9', bgColor: '#e0f2fe' },
            'irb_approved': { label: 'IRB Approved', color: '#10b981', bgColor: '#d1fae5' },
            'trial_active': { label: 'Trial Active', color: '#00BFA5', bgColor: '#ccfbf1' },
            'active': { label: 'Active', color: '#00BFA5', bgColor: '#ccfbf1' },
            'completed': { label: 'Completed', color: '#6b7280', bgColor: '#f3f4f6' }
        };
        return statusMap[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6' };
    };

    const getIRBStatusInfo = (status) => {
        const statusMap = {
            'preparation': {
                label: 'Preparation',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                ),
                color: '#8b5cf6'
            },
            'preparation_started': {
                label: 'Preparation Started',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                ),
                color: '#8b5cf6'
            },
            'submitted': {
                label: 'Submitted',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                ),
                color: '#0ea5e9'
            },
            'under_review': {
                label: 'Under Review',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                ),
                color: '#0ea5e9'
            },
            'changes_requested': {
                label: 'Changes Requested',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                ),
                color: '#f59e0b'
            },
            'resubmitted': {
                label: 'Resubmitted',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                ),
                color: '#0ea5e9'
            },
            'approved': {
                label: 'Approved',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                ),
                color: '#10b981'
            },
            'rejected': {
                label: 'Rejected',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                ),
                color: '#ef4444'
            }
        };
        return statusMap[status] || {
            label: status,
            icon: (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="10" r="8" />
                </svg>
            ),
            color: '#6b7280'
        };
    };

    const statusInfo = getStatusInfo(trialData.trial_status);
    const irbStatusInfo = getIRBStatusInfo(trialData.irb_status);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="trial-status-card">
            <div className="trial-header">
                <div className="trial-title-section">
                    <h2 className="trial-name">{trialData.trial_name}</h2>
                    <p className="trial-product">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 13A6 6 0 118 2a6 6 0 010 12zm1-9H7v5h5V9H9V5z" />
                        </svg>
                        Product: <span>{trialData.product_name}</span>
                    </p>
                </div>
                <div className="status-badges">
                    <span
                        className="status-badge"
                        style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                    >
                        {statusInfo.label}
                    </span>
                </div>
            </div>

            <div className="trial-description">
                <p>{trialData.trial_description}</p>
            </div>

            <div className="trial-info-grid">
                <div className="info-item">
                    <div className="info-label">Trial ID</div>
                    <div className="info-value">CT-{String(trialData.trial_id).padStart(4, '0')}</div>
                </div>

                <div className="info-item">
                    <div className="info-label">IRB Status</div>
                    <div className="info-value irb-status" style={{ color: irbStatusInfo.color }}>
                        <span className="irb-icon">{irbStatusInfo.icon}</span>
                        {irbStatusInfo.label}
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-label">Registration Date</div>
                    <div className="info-value">{formatDate(trialData.created_at)}</div>
                </div>

                <div className="info-item">
                    <div className="info-label">Last Updated</div>
                    <div className="info-value">{formatDate(trialData.updated_at)}</div>
                </div>
            </div>

            {trialData.trial_start_date && (
                <div className="trial-timeline">
                    <div className="timeline-item">
                        <span className="timeline-label">Start Date:</span>
                        <span className="timeline-value">{formatDate(trialData.trial_start_date)}</span>
                    </div>
                    {trialData.trial_end_date && (
                        <div className="timeline-item">
                            <span className="timeline-label">End Date:</span>
                            <span className="timeline-value">{formatDate(trialData.trial_end_date)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TrialStatusCard;