/* src/pages/Billing.js */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Billing.css';

const Billing = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allPayments, setAllPayments] = useState([]);
    const [trials, setTrials] = useState([]);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            const trialsResponse = await fetch(`${API_BASE_URL}/api/vendor/clinical/trials`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!trialsResponse.ok) throw new Error('Failed to fetch trials');
            const trialsData = await trialsResponse.json();
            setTrials(trialsData);

            const allPaymentsData = [];
            for (const trial of trialsData) {
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
                        const payments = await paymentsResponse.json();
                        payments.forEach(payment => {
                            allPaymentsData.push({
                                ...payment,
                                trial_name: trial.trial_name,
                                trial_id: trial.trial_id
                            });
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching payments for trial ${trial.trial_id}:`, err);
                }
            }

            allPaymentsData.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
            setAllPayments(allPaymentsData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching billing data:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            'pending': { label: 'Pending', color: '#f59e0b', bgColor: '#fef3c7' },
            'paid': { label: 'Paid', color: '#10b981', bgColor: '#d1fae5' },
            'completed': { label: 'Paid', color: '#10b981', bgColor: '#d1fae5' },
            'partially_paid': { label: 'Partially Paid', color: '#0ea5e9', bgColor: '#e0f2fe' },
            'overdue': { label: 'Overdue', color: '#ef4444', bgColor: '#fee2e2' }
        };
        return statusMap[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6' };
    };

    const totalAmount = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const paidAmount = allPayments
        .filter(p => p.payment_status === 'paid' || p.payment_status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const pendingAmount = totalAmount - paidAmount;

    const groupedPayments = allPayments.reduce((acc, payment) => {
        if (!acc[payment.trial_id]) {
            acc[payment.trial_id] = {
                trial_name: payment.trial_name,
                payments: []
            };
        }
        acc[payment.trial_id].payments.push(payment);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="billing-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading billing information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="billing-page">
                <div className="error-container">
                    <p className="error-message">Error: {error}</p>
                    <button onClick={fetchBillingData} className="retry-button">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="billing-page">
            <div className="billing-header">
                <h1 className="billing-title">Billing & Payments</h1>
                <p className="billing-subtitle">View all payments and billing information for your clinical trials</p>
            </div>

            <div className="billing-summary-cards">
                <div className="summary-card total">
                    <div className="summary-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">Total Contract Value</div>
                        <div className="summary-value">{formatCurrency(totalAmount)}</div>
                    </div>
                </div>

                <div className="summary-card paid">
                    <div className="summary-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">Total Paid</div>
                        <div className="summary-value">{formatCurrency(paidAmount)}</div>
                    </div>
                </div>

                <div className="summary-card pending">
                    <div className="summary-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">Outstanding</div>
                        <div className="summary-value">{formatCurrency(pendingAmount)}</div>
                    </div>
                </div>
            </div>

            <div className="billing-content">
                {Object.keys(groupedPayments).length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="8" y="8" width="48" height="48" rx="4" />
                            <path d="M8 20h48M20 8v8M44 8v8" />
                        </svg>
                        <h3>No Payment Records</h3>
                        <p>You don't have any payment records yet</p>
                    </div>
                ) : (
                    Object.entries(groupedPayments).map(([trialId, trialData]) => (
                        <div key={trialId} className="trial-billing-section">
                            <div className="trial-billing-header">
                                <h2 className="trial-billing-title">{trialData.trial_name}</h2>
                                <span className="trial-id-badge">Trial ID: CT-{String(trialId).padStart(4, '0')}</span>
                            </div>

                            <div className="payments-table">
                                <div className="table-header">
                                    <div className="col-installment">Installment</div>
                                    <div className="col-amount">Amount</div>
                                    <div className="col-status">Status</div>
                                    <div className="col-due-date">Due Date</div>
                                    <div className="col-paid-date">Paid Date</div>
                                    <div className="col-method">Payment Method</div>
                                </div>

                                {trialData.payments.map((payment) => {
                                    const statusInfo = getStatusInfo(payment.payment_status);
                                    return (
                                        <div key={payment.payment_id} className="table-row">
                                            <div className="col-installment">
                                                <span className="installment-badge">#{payment.installment_number}</span>
                                                <span className="installment-label">Installment</span>
                                            </div>
                                            <div className="col-amount">
                                                <span className="amount-value">{formatCurrency(payment.amount)}</span>
                                            </div>
                                            <div className="col-status">
                                                <span
                                                    className="status-badge"
                                                    style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <div className="col-due-date">{formatDate(payment.due_date)}</div>
                                            <div className="col-paid-date">
                                                {payment.paid_date ? (
                                                    <span className="paid-date">{formatDate(payment.paid_date)}</span>
                                                ) : (
                                                    <span className="not-paid">—</span>
                                                )}
                                            </div>
                                            <div className="col-method">
                                                {payment.payment_method ? (
                                                    <span className="payment-method">
                                                        {payment.payment_method.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <span className="not-set">—</span>
                                                )}
                                            </div>
                                            {payment.notes && (
                                                <div className="payment-notes">
                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                                        <path d="M7 0a7 7 0 100 14A7 7 0 007 0zm0 12A5 5 0 117 2a5 5 0 010 10zm.5-7h-1v4h1V5zm0 5h-1v1h1v-1z" />
                                                    </svg>
                                                    {payment.notes}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="billing-footer">
                <div className="help-box">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <strong>Need Help?</strong>
                        <p>Payment status is updated by our admin team. For payment inquiries or concerns, please contact support at billing@mannbiome.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing;