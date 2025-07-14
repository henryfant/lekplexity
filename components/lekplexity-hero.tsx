import React from 'react';
import { Sparkles } from 'lucide-react';

export function LekplexityHero() {
  return (
    <div className="max-w-7xl mx-auto text-center relative">
      {/* Background effects */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-64 w-64 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full blur-3xl animate-pulse" />
      </div>
      
      <div className="relative">
        <div className="flex items-center justify-center gap-3 mb-4 opacity-0 animate-fade-up [animation-duration:500ms] [animation-fill-mode:forwards]">
          <Sparkles className="h-8 w-8 text-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">AI-Powered Search</span>
          <Sparkles className="h-8 w-8 text-green-500 animate-pulse" />
        </div>
        
        <h1 className="text-[2.5rem] lg:text-[3.8rem] text-[#36322F] dark:text-white font-semibold tracking-tight leading-[1.1] opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
          <span className="relative">
            <span className="relative z-10 px-3 py-2 text-transparent bg-clip-text bg-gradient-to-tr from-green-700 via-green-500 to-emerald-400 inline-flex justify-center items-center">
              LEKplexity
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-2xl" />
          </span>
        </h1>
        
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:400ms] [animation-fill-mode:forwards] max-w-2xl mx-auto">
          Experience lightning-fast web search with instant results and intelligent follow-up questions
        </p>
        
        <div className="mt-6 flex items-center justify-center gap-6 opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:600ms] [animation-fill-mode:forwards]">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Real-time search</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Curated sources</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Smart insights</span>
          </div>
        </div>
      </div>
    </div>
  );
} 