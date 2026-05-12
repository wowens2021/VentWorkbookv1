import React from 'react';

interface Alert {
  id: number;
  message: string;
  type: 'positive' | 'negative';
}

interface AlertContainerProps {
  alerts: Alert[];
}

const AlertContainer: React.FC<AlertContainerProps> = ({ alerts }) => {
  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 w-80">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-3 rounded-lg text-[11px] font-bold shadow-lg border ${
            alert.type === 'positive'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
              : 'bg-rose-900/90 text-rose-100 border-rose-700'
          }`}
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
};

export default AlertContainer;
