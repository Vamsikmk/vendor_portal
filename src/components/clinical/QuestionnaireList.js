import React, { useState } from 'react';
import './QuestionnaireList.css';

const QuestionnaireList = ({ questionnaires, loading, detailsMap = {}, detailsLoadingMap = {}, onLoadDetails }) => {
    const list = Array.isArray(questionnaires) ? questionnaires : [];
    const [expanded, setExpanded] = useState({});

    const toggleExpanded = async (questionnaireId) => {
        const isCurrentlyExpanded = !!expanded[questionnaireId];
        if (!isCurrentlyExpanded && !detailsMap[questionnaireId] && onLoadDetails) {
            await onLoadDetails(questionnaireId);
        }
        setExpanded((prev) => ({ ...prev, [questionnaireId]: !isCurrentlyExpanded }));
    };

    return (
        <div className="questionnaire-list-container">
            <div className="section-header">
                <h3 className="section-title">
                    <span aria-hidden="true">🧩</span> Linked Questionnaires
                </h3>
                <span className="questionnaire-count">{list.length} linked</span>
            </div>

            <div className="questionnaire-content">
                {loading ? (
                    <div className="questionnaire-empty-state">
                        <p>Loading linked questionnaires...</p>
                    </div>
                ) : list.length === 0 ? (
                    <div className="questionnaire-empty-state">
                        <p className="empty-title">No questionnaires linked</p>
                        <p className="empty-subtitle">
                            Admin has not linked questionnaires to this trial yet.
                        </p>
                    </div>
                ) : (
                    <div className="questionnaire-items">
                        {list
                            .slice()
                            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                            .map((item) => {
                                const questionnaireId = item.questionnaire_id;
                                const isExpanded = !!expanded[questionnaireId];
                                const detail = detailsMap[questionnaireId];
                                const questions = Array.isArray(detail?.questions) ? detail.questions : [];
                                const loadingDetails = !!detailsLoadingMap[questionnaireId];

                                return (
                                <div className="questionnaire-item" key={item.id || item.questionnaire_id}>
                                    <div className="questionnaire-main">
                                        <h4>{item.questionnaire_name || `Questionnaire ${item.questionnaire_id}`}</h4>
                                        <p>{item.questionnaire_description || 'No description available.'}</p>
                                    </div>
                                    <div className="questionnaire-meta">
                                        <span className="meta-chip">#{(item.display_order ?? 0) + 1}</span>
                                        <span className="meta-chip">{item.questionnaire_type || 'custom'}</span>
                                        <span className="meta-chip">{item.question_count || 0} questions</span>
                                        <span className={`meta-chip ${item.is_required ? 'required' : 'optional'}`}>
                                            {item.is_required ? 'Required' : 'Optional'}
                                        </span>
                                    </div>
                                    <div className="questionnaire-actions">
                                        <button
                                            className="view-questions-btn"
                                            onClick={() => toggleExpanded(questionnaireId)}
                                            type="button"
                                        >
                                            {isExpanded ? 'Hide Questions' : 'View Questions'}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="questionnaire-detail">
                                            {loadingDetails ? (
                                                <p>Loading questions...</p>
                                            ) : questions.length === 0 ? (
                                                <p>No questions found.</p>
                                            ) : (
                                                <ol className="question-list-preview">
                                                    {questions
                                                        .slice()
                                                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                                        .map((q, idx) => (
                                                            <li key={q.id || idx}>
                                                                <div className="question-title">
                                                                    {q.text || 'Untitled question'}
                                                                </div>
                                                                <div className="question-sub">
                                                                    {q.type || 'text'}
                                                                    {q.isRequired ? ' • Required' : ' • Optional'}
                                                                </div>
                                                                {Array.isArray(q.options) && q.options.length > 0 && (
                                                                    <ul className="option-preview">
                                                                        {q.options.map((opt, optIdx) => (
                                                                            <li key={`${q.id || idx}-${optIdx}`}>
                                                                                {opt.label || opt.value || `Option ${optIdx + 1}`}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </li>
                                                        ))}
                                                </ol>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )})}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionnaireList;
