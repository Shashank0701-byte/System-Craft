'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AIMessage } from '@/src/hooks/useInterviewAI';

interface InterviewerPanelProps {
    messages: AIMessage[];
    isThinking: boolean;
    onSendReply: (text: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function InterviewerPanel({ messages, isThinking, onSendReply, isOpen, setIsOpen }: InterviewerPanelProps) {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isThinking]);

    // Toast notification for unread messages when closed
    const [unreadCount, setUnreadCount] = useState(0);
    const prevMessagesLength = useRef(messages.length);

    useEffect(() => {
        if (!isOpen && messages.length > prevMessagesLength.current) {
            setUnreadCount(prev => prev + (messages.length - prevMessagesLength.current));
        } else if (isOpen) {
            setUnreadCount(0);
        }
        prevMessagesLength.current = messages.length;
    }, [messages.length, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || isThinking) return;

        onSendReply(inputText.trim());
        setInputText('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                aria-label={`Open AI Interviewer${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                className="absolute bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 transition-all font-medium border border-indigo-400/30 group"
            >
                <div className="relative">
                    <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">robot_2</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-[10px] flex items-center justify-center rounded-full font-bold border border-indigo-600">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <span>AI Interviewer</span>
            </button>
        );
    }

    return (
        <div className="absolute right-0 top-14 bottom-0 w-[350px] bg-dashboard-card z-40 border-l border-border-dark flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark bg-sidebar-bg-dark">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <span className="material-symbols-outlined text-[18px]">robot_2</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white leading-tight">AI Interviewer</h3>
                        <p className="text-[11px] text-emerald-400 font-medium">● Online</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 rounded-full border border-dashed border-slate-600 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-slate-500">forum</span>
                        </div>
                        <p className="text-sm tracking-wide text-slate-400 font-medium mb-1">No messages yet</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Start designing your system. I'll check in periodically with hints, questions, and feedback.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isAI = msg.role === 'interviewer';
                        return (
                            <div key={i} className={`flex gap-3 max-w-[90%] ${isAI ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}>
                                {isAI && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                                        <span className="material-symbols-outlined text-[12px] text-indigo-400">robot_2</span>
                                    </div>
                                )}

                                <div className={`p-3 rounded-2xl text-[13px] leading-relaxed relative group shadow-sm ${isAI
                                    ? 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-sm'
                                    : 'bg-indigo-600 text-white rounded-tr-sm'
                                    }`}>
                                    {msg.content}
                                    <span className={`absolute -bottom-5 text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isAI ? 'left-1' : 'right-1'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}

                {isThinking && (
                    <div className="flex gap-3 max-w-[85%] self-start">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                            <span className="material-symbols-outlined text-[12px] text-indigo-400">robot_2</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-sm flex items-center gap-1.5 h-10 w-16">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border-dark bg-[#1a1b23]">
                <form onSubmit={handleSubmit} className="relative flex items-center border border-border-dark bg-[#14151a] rounded-xl focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isThinking}
                        placeholder={isThinking ? "AI is thinking..." : "Explain your design or ask a question..."}
                        className="w-full bg-transparent text-sm text-white placeholder-slate-500 px-3 py-2.5 outline-none rounded-xl"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isThinking}
                        className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[16px] -rotate-45 ml-1 mb-1">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
