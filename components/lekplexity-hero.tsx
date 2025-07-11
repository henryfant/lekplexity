import React from 'react';

export function LekplexityHero() {
  return (
    <div className="max-w-7xl mx-auto text-center">
      <h1 className="text-[2.5rem] lg:text-[3.8rem] text-[#36322F] dark:text-white font-semibold tracking-tight leading-[1.1] opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
        <span className="relative px-1 pb-1 text-transparent bg-clip-text bg-gradient-to-tr from-green-700 to-green-400 inline-flex justify-center items-center">
          LEKplexity
        </span>
      </h1>
      <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400 opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:600ms] [animation-fill-mode:forwards]">
        AI-powered web search with instant results and follow-up questions
      </p>
    </div>
  );
} 