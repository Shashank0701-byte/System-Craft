'use client';

import { IInterviewQuestion } from '@/src/lib/db/models/InterviewSession';

interface QuestionPanelProps {
    question: IInterviewQuestion;
    difficulty: 'easy' | 'medium' | 'hard';
    /** Whether to reveal hints */
    showHints?: boolean;
    onToggleHints?: () => void;
}

const DIFFICULTY_COLORS = {
    easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' },
    hard: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' },
};

export function QuestionPanel({ question, difficulty, showHints = false, onToggleHints }: QuestionPanelProps) {
    const colors = DIFFICULTY_COLORS[difficulty];

    return (
        <div className="flex flex-col h-full overflow-hidden bg-sidebar-bg-dark border-r border-border-dark">
            {/* Header */}
            <div className="p-4 border-b border-border-dark">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">quiz</span>
                        Question
                    </h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} ${colors.border} border capitalize`}>
                        {difficulty}
                    </span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Prompt */}
                <div>
                    <p className="text-white font-medium text-sm leading-relaxed">
                        {question.prompt}
                    </p>
                </div>

                {/* Requirements */}
                {question.requirements.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">checklist</span>
                            Functional Requirements
                        </h3>
                        <ul className="space-y-1.5">
                            {question.requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Constraints */}
                {question.constraints.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">speed</span>
                            Scale Constraints
                        </h3>
                        <ul className="space-y-1.5">
                            {question.constraints.map((c, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Traffic Profile */}
                {(question.trafficProfile?.users || question.trafficProfile?.rps || question.trafficProfile?.storage) && (
                    <div>
                        <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">monitoring</span>
                            Traffic Profile
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {question.trafficProfile.users && (
                                <div className="flex items-center gap-2 bg-dashboard-card rounded-lg px-3 py-2">
                                    <span className="material-symbols-outlined text-primary text-[16px]">group</span>
                                    <div>
                                        <p className="text-xs text-text-muted-dark">Users</p>
                                        <p className="text-sm text-white font-medium">{question.trafficProfile.users}</p>
                                    </div>
                                </div>
                            )}
                            {question.trafficProfile.rps && (
                                <div className="flex items-center gap-2 bg-dashboard-card rounded-lg px-3 py-2">
                                    <span className="material-symbols-outlined text-amber-400 text-[16px]">bolt</span>
                                    <div>
                                        <p className="text-xs text-text-muted-dark">Throughput</p>
                                        <p className="text-sm text-white font-medium">{question.trafficProfile.rps}</p>
                                    </div>
                                </div>
                            )}
                            {question.trafficProfile.storage && (
                                <div className="flex items-center gap-2 bg-dashboard-card rounded-lg px-3 py-2">
                                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">database</span>
                                    <div>
                                        <p className="text-xs text-text-muted-dark">Storage</p>
                                        <p className="text-sm text-white font-medium">{question.trafficProfile.storage}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Hints */}
                {question.hints.length > 0 && (
                    <div>
                        <button
                            onClick={onToggleHints}
                            className="w-full flex items-center justify-between text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2 hover:text-white transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                                Hints ({question.hints.length})
                            </span>
                            <span className="material-symbols-outlined text-[16px]">
                                {showHints ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>
                        {showHints && (
                            <ul className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                {question.hints.map((hint, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-amber-300/80 bg-amber-500/5 rounded-lg px-3 py-2 border border-amber-500/10">
                                        <span className="material-symbols-outlined text-[14px] mt-0.5 text-amber-500">tips_and_updates</span>
                                        {hint}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
