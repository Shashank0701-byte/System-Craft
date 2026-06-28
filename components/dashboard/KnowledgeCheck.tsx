'use client';

import { useState } from 'react';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface KnowledgeCheckProps {
  questions: QuizQuestion[];
  onPass: () => void;
}

export function KnowledgeCheck({ questions, onPass }: KnowledgeCheckProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  const currentQuestion = questions[currentQuestionIndex];
  const PASS_THRESHOLD = 4; // 80% of 5

  const handleSelect = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setIsSubmitted(true);
    
    if (calculatedScore >= PASS_THRESHOLD) {
      onPass();
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setScore(0);
  };

  if (isSubmitted) {
    const passed = score >= PASS_THRESHOLD;
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-white/[0.05] bg-[#0c0d16] rounded-xl relative overflow-hidden">
        {/* Glow */}
        <div className={`absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-t ${passed ? 'from-emerald-500/30' : 'from-rose-500/30'} to-transparent`} />
        
        <span className={`material-symbols-outlined text-5xl mb-4 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
          {passed ? 'verified' : 'cancel'}
        </span>
        <h3 className="text-xl font-display font-bold text-white mb-2">
          {passed ? 'Knowledge Verified' : 'Review Required'}
        </h3>
        <p className="text-white/50 font-mono text-xs mb-6 max-w-sm">
          {passed 
            ? `You scored ${score}/${questions.length}. Architecture marked as studied! Telemetry updated.` 
            : `You scored ${score}/${questions.length}. You need at least ${PASS_THRESHOLD} correct to pass. Review the analysis and try again.`}
        </p>
        
        {!passed && (
          <button
            onClick={handleRetry}
            className="px-6 py-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 hover:text-white transition-all font-mono text-xs tracking-wider uppercase cursor-pointer"
          >
            Retry Assessment
          </button>
        )}
      </div>
    );
  }

  const allAnswered = Object.keys(selectedAnswers).length === questions.length;

  return (
    <div className="flex flex-col w-full border border-white/[0.05] bg-[#0c0d16] rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-cyan-400">psychology</span>
          <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-white/90">Knowledge Check</h3>
        </div>
        <div className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>
      
      <div className="p-5 md:p-8">
        <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6 font-medium">
          {currentQuestion.question}
        </p>
        
        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all cursor-pointer font-body text-sm ${
                  isSelected 
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-50' 
                    : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.1] text-white/60 hover:text-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-cyan-400 bg-cyan-400/20' : 'border-white/20'
                  }`}>
                    {isSelected && <div className="size-2.5 rounded-full bg-cyan-400" />}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.05] bg-white/[0.01]">
        <button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 text-xs font-mono tracking-wider uppercase text-white/50 hover:text-white/80 disabled:opacity-30 transition-colors cursor-pointer"
        >
          Previous
        </button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/90 border border-white/[0.05] hover:border-white/10 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`px-6 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all ${
              allAnswered 
                ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer' 
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
