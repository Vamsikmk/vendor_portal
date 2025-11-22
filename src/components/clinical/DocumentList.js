// src/components/clinical/DocumentList.js
import React from 'react';
import './DocumentList.css';

const DocumentList = ({ documents }) => {
    // Ensure documents is always an array
    const documentList = Array.isArray(documents) ? documents : [];

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // ✅ FIXED: Use SVG icons instead of emojis
    const getDocumentTypeInfo = (type) => {
        const typeMap = {
            'swo': {
                label: 'Statement of Work',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 2a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H8z" />
                        <path d="M9 4h6v2H9V4zm0 4h6v2H9V8zm0 4h6v2H9v-2z" fill="white" />
                    </svg>
                ),
                color: '#3b82f6'
            },
            'agreement_initial': {
                label: 'Initial Agreement',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
                    </svg>
                ),
                color: '#8b5cf6'
            },
            'agreement_signed': {
                label: 'Signed Agreement',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" transform="translate(2 2) scale(1.2)" />
                    </svg>
                ),
                color: '#10b981'
            },
            'irb_submission': {
                label: 'IRB Submission',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm2 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1z" />
                    </svg>
                ),
                color: '#f59e0b'
            },
            'other': {
                label: 'Other Document',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                ),
                color: '#6b7280'
            }
        };
        return typeMap[type] || typeMap['other'];
    };

    const handleDownload = (doc) => {
        // In production, this would trigger actual download
        console.log('Downloading document:', doc.document_name);
        alert(`Download functionality will be implemented with backend integration.\nDocument: ${doc.document_name}`);
    };

    return (
        <div className="document-list-container">
            <div className="section-header">
                <h3 className="section-title">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="title-icon-svg">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                    Trial Documents
                </h3>
                <span className="document-count">{documentList.length} document{documentList.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="documents-content">
                {documentList.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 8h32v48H16z" />
                                <path d="M20 16h24M20 24h24M20 32h16" />
                            </svg>
                        </div>
                        <p className="empty-title">No documents available</p>
                        <p className="empty-subtitle">Documents will appear here once uploaded by the admin team</p>
                    </div>
                ) : (
                    <div className="documents-list">
                        {documentList.map((doc) => {
                            const typeInfo = getDocumentTypeInfo(doc.document_type);
                            return (
                                <div key={doc.document_id} className="document-card">
                                    <div className="document-icon" style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}>
                                        {typeInfo.icon}
                                    </div>
                                    <div className="document-info">
                                        <h4 className="document-name">{doc.document_name}</h4>
                                        <div className="document-meta">
                                            <span className="document-type" style={{ color: typeInfo.color }}>
                                                {typeInfo.label}
                                            </span>
                                            <span className="meta-separator">•</span>
                                            <span className="document-size">{formatFileSize(doc.file_size)}</span>
                                            <span className="meta-separator">•</span>
                                            <span className="document-date">Uploaded {formatDate(doc.uploaded_at)}</span>
                                        </div>
                                        {doc.notes && (
                                            <p className="document-notes">{doc.notes}</p>
                                        )}
                                    </div>
                                    <button
                                        className="download-button"
                                        onClick={() => handleDownload(doc)}
                                        aria-label={`Download ${doc.document_name}`}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10 3v10m0 0l-4-4m4 4l4-4M3 17h14" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Download
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentList;