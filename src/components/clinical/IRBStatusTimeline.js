// src/components/clinical/IRBStatusTimeline.js
import React from 'react';
import './IRBStatusTimeline.css';

const IRBStatusTimeline = ({ currentStatus, history, submissionDate, approvalDate }) => {
    // Ensure history is always an array
    const historyList = Array.isArray(history) ? history : [];

    // State to control how many items to show
    const [showAll, setShowAll] = React.useState(false);

    // Show only top 3 by default
    const displayedHistory = showAll ? historyList : historyList.slice(0, 3);
    const hasMore = historyList.length > 3;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ✅ FIXED: Use SVG icons instead of emojis
    const getStatusIcon = (status) => {
        const iconMap = {
            'preparation_started': (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
            ),
            'changes_requested': (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
            ),
            'resubmitted': (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" />
                </svg>
            ),
            'approved': (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            )
        };
        return iconMap[status] || iconMap['preparation_started'];
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'preparation_started': '#8b5cf6',
            'changes_requested': '#f59e0b',
            'resubmitted': '#0ea5e9',
            'approved': '#10b981'
        };
        return colorMap[status] || '#6b7280';
    };

    const getStatusLabel = (status) => {
        const labelMap = {
            'preparation_started': 'Preparation Started',
            'changes_requested': 'Changes Requested',
            'resubmitted': 'Resubmitted',
            'approved': 'Approved'
        };
        return labelMap[status] || status;
    };

    return (
        <div className="irb-timeline-container">
            <div className="section-header">
                <h3 className="section-title">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="title-icon-svg">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    IRB Status History
                </h3>
                <span className="current-status-badge" style={{ backgroundColor: `${getStatusColor(currentStatus)}20`, color: getStatusColor(currentStatus) }}>
                    <span className="badge-icon">{getStatusIcon(currentStatus)}</span>
                    Current: {getStatusLabel(currentStatus)}
                </span>
            </div>

            <div className="timeline-content">
                {historyList.length === 0 ? (
                    <div className="empty-state">
                        <p>No IRB status history available yet.</p>
                    </div>
                ) : (
                    <>
                        <div className="timeline">
                            {displayedHistory.map((item, index) => (
                                <div key={item.history_id} className={`timeline-item ${index === 0 ? 'latest' : ''}`}>
                                    <div className="timeline-marker" style={{ backgroundColor: getStatusColor(item.new_status) }}>
                                        <span className="marker-icon">{getStatusIcon(item.new_status)}</span>
                                    </div>
                                    <div className="timeline-content-card">
                                        <div className="timeline-header">
                                            <h4 className="timeline-status" style={{ color: getStatusColor(item.new_status) }}>
                                                {getStatusLabel(item.new_status)}
                                            </h4>
                                            <span className="timeline-date">{formatDate(item.changed_at)}</span>
                                        </div>
                                        {item.comments && (
                                            <p className="timeline-comments">{item.comments}</p>
                                        )}
                                        {item.old_status && (
                                            <div className="status-transition">
                                                <span className="from-status">{getStatusLabel(item.old_status)}</span>
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M8 4l4 4-4 4V4z" />
                                                </svg>
                                                <span className="to-status">{getStatusLabel(item.new_status)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <button
                                className="view-more-button"
                                onClick={() => setShowAll(!showAll)}
                            >
                                {showAll ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M8 12l-4-4h8l-4 4z" transform="rotate(180 8 8)" />
                                        </svg>
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M8 12l-4-4h8l-4 4z" />
                                        </svg>
                                        View All History ({historyList.length} entries)
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}

                {(submissionDate || approvalDate) && (
                    <div className="key-dates">
                        <h4 className="key-dates-title">Key Dates</h4>
                        {submissionDate && (
                            <div className="key-date-item">
                                <span className="date-label">IRB Submission:</span>
                                <span className="date-value">{formatDate(submissionDate)}</span>
                            </div>
                        )}
                        {approvalDate && (
                            <div className="key-date-item">
                                <span className="date-label">IRB Approval:</span>
                                <span className="date-value">{formatDate(approvalDate)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IRBStatusTimeline;