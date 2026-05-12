import React from 'react';
import { Brain, Construction, ArrowRight } from 'lucide-react';

interface Props {
  onBrowseModules: () => void;
}

const KnowledgeCheckPage: React.FC<Props> = ({ onBrowseModules }) => {
  return (
    <div className="min-h-full bg-brand-cream">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 rounded-full text-[11px] font-bold uppercase tracking-widest text-brand-olive mb-4">
            <Brain size={12} /> Knowledge check
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-900 mb-3">
            Cross-module knowledge check
          </h1>
          <p className="text-[15px] text-stone-600 max-w-2xl leading-relaxed">
            A timed assessment that draws from every completed module's summative quiz.
            Useful for self-evaluation before moving to capstone scenarios.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm flex items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Construction size={20} className="text-amber-700" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-stone-900 mb-2">
              Coming next
            </h2>
            <p className="text-[14px] text-stone-600 leading-relaxed mb-4">
              Each module already has its own 5-question debrief that fires after the task is complete.
              The cross-module Knowledge Check pulls from those banks and adds clinical scenario items.
              While it's being authored, work through the simulations — your per-module results will feed
              this assessment when it ships.
            </p>
            <button
              onClick={onBrowseModules}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-full text-[13px] font-bold transition"
            >
              Browse simulations <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCheckPage;
