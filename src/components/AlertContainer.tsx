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
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-rose-100 text-rose-700 border-rose-300'
          }`}
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
};

export default AlertContainer;
