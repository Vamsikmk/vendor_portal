// src/components/clinical/PaymentTracker.js
import React from 'react';
import './PaymentTracker.css';

const PaymentTracker = ({ payments, trialData }) => {
    // Ensure payments is always an array
    const paymentList = Array.isArray(payments) ? payments : [];

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

    // ✅ FIXED: Use SVG icons instead of emojis
    const getStatusInfo = (status) => {
        const statusMap = {
            'pending': {
                label: 'Pending',
                color: '#f59e0b',
                bgColor: '#fef3c7',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-2A5 5 0 108 3a5 5 0 000 10z" />
                        <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3.5a.5.5 0 01-.5-.5v-4a.5.5 0 01.5-.5z" />
                    </svg>
                )
            },
            'paid': {
                label: 'Paid',
                color: '#10b981',
                bgColor: '#d1fae5',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.354-9.354a.5.5 0 00-.708-.708L7 8.793 5.354 7.146a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l4-4z" />
                    </svg>
                )
            },
            'partially_paid': {
                label: 'Partially Paid',
                color: '#0ea5e9',
                bgColor: '#e0f2fe',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3.5a.5.5 0 01-.5-.5v-4a.5.5 0 01.5-.5z" />
                    </svg>
                )
            },
            'overdue': {
                label: 'Overdue',
                color: '#ef4444',
                bgColor: '#fee2e2',
                icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zM8 4a.5.5 0 01.5.5v3.5a.5.5 0 01-1 0V4.5A.5.5 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                )
            }
        };
        return statusMap[status] || { label: status, color: '#6b7280', bgColor: '#f3f4f6', icon: null };
    };

    // Calculate totals
    const totalAmount = paymentList.reduce((sum, payment) => sum + payment.amount, 0);
    const paidAmount = paymentList
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return (
        <div className="payment-tracker-container">
            <div className="section-header">
                <h3 className="section-title">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="title-icon-svg">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    Payment Tracker
                </h3>
            </div>

            {/* Payment Summary */}
            <div className="payment-summary">
                <div className="summary-card total">
                    <div className="summary-label">Total Contract Value</div>
                    <div className="summary-value">{formatCurrency(totalAmount)}</div>
                </div>
                <div className="summary-grid">
                    <div className="summary-card paid">
                        <div className="summary-label">Paid</div>
                        <div className="summary-value">{formatCurrency(paidAmount)}</div>
                    </div>
                    <div className="summary-card pending">
                        <div className="summary-label">Pending</div>
                        <div className="summary-value">{formatCurrency(pendingAmount)}</div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
                <div className="progress-header">
                    <span className="progress-label">Payment Progress</span>
                    <span className="progress-percentage">{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Payment Schedule */}
            <div className="payment-schedule">
                <h4 className="schedule-title">Installment Schedule</h4>
                {paymentList.length === 0 ? (
                    <div className="empty-state">
                        <p>No payment schedule available</p>
                    </div>
                ) : (
                    <div className="installments-list">
                        {paymentList.map((payment) => {
                            const statusInfo = getStatusInfo(payment.payment_status);
                            return (
                                <div key={payment.payment_id} className={`installment-card ${payment.payment_status}`}>
                                    <div className="installment-header">
                                        <div className="installment-number">
                                            <span className="number-badge">#{payment.installment_number}</span>
                                            <span className="installment-label">Installment</span>
                                        </div>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                                        >
                                            <span className="status-icon">{statusInfo.icon}</span>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    <div className="installment-amount">
                                        {formatCurrency(payment.amount)}
                                    </div>

                                    <div className="installment-dates">
                                        <div className="date-item">
                                            <span className="date-label">Due Date:</span>
                                            <span className="date-value">{formatDate(payment.due_date)}</span>
                                        </div>
                                        {payment.paid_date && (
                                            <div className="date-item">
                                                <span className="date-label">Paid Date:</span>
                                                <span className="date-value paid">{formatDate(payment.paid_date)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {payment.notes && (
                                        <div className="installment-notes">
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
                )}
            </div>

            {/* Help Text */}
            <div className="help-text">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 13A6 6 0 118 2a6 6 0 010 12zm.5-9h-1v4h1V5zm0 5h-1v1h1v-1z" />
                </svg>
                <span>Payment status is updated by the admin team. Contact support for any payment inquiries.</span>
            </div>
        </div>
    );
};

export default PaymentTracker;