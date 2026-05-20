import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Called when the learner clicks "Reset module" — typically wired to
   *  ModuleShell's handleRestart so the persisted state is wiped and the
   *  module restarts from the briefing. */
  onResetModule?: () => void;
  /** Called when the learner clicks "Back to simulations" — fall-back
   *  escape hatch. */
  onBack?: () => void;
}

interface State {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Catches any render or lifecycle error inside the workbook column and
 * shows a recovery panel instead of letting React unmount the subtree
 * and leave the surface blank.
 *
 * Why this exists: the user reported the workbook going blank on M2's
 * Your Task — a class of bug where a deep render path throws silently
 * (e.g., a stale prompt with a malformed shape, a tracker callback that
 * accesses undefined state on remount, a race between useEffect order
 * and persisted state). Rather than chase every individual cause one at
 * a time, this boundary ensures the surface is NEVER fully blank: the
 * learner sees a clear "something went wrong" panel with two recovery
 * actions, and the error is logged to the dev console for debugging.
 */
class WorkbookErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Surface in the dev console so the team can find and fix the
    // underlying cause; in production this just lets the recovery
    // panel render.
    // eslint-disable-next-line no-console
    console.error('[WorkbookErrorBoundary] caught render error', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.props.onResetModule?.();
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3 shadow-sm">
          <AlertTriangle size={22} className="text-amber-700" strokeWidth={2.5} />
        </div>
        <h3 className="text-[15px] font-bold text-stone-900 mb-1">
          Something went wrong with this view.
        </h3>
        <p className="text-[13px] text-stone-600 max-w-md leading-snug mb-5">
          The simulator hit an unexpected state and couldn't render the workbook.
          Resetting the module clears any stuck progress and starts you over from
          the briefing — your overall score history is preserved.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {this.props.onResetModule && (
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-lg text-[13px] font-bold shadow-sm transition"
            >
              <RotateCcw size={14} strokeWidth={2.5} /> Reset module
            </button>
          )}
          {this.props.onBack && (
            <button
              onClick={this.props.onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg text-[13px] font-bold transition"
            >
              <Home size={14} strokeWidth={2.5} /> Back to simulations
            </button>
          )}
        </div>
        {/* Tech detail — only useful for developers, but the user can
            paste this if filing a bug. */}
        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-6 max-w-xl text-left text-[10px] font-mono text-rose-700 bg-rose-50 border border-rose-200 rounded p-3 overflow-auto">
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack?.split('\n').slice(0, 6).join('\n')}
          </pre>
        )}
      </div>
    );
  }
}

export default WorkbookErrorBoundary;
