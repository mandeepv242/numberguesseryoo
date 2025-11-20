import React from 'react';

interface RangeVisualizerProps {
  min: number;
  max: number;
  currentLow: number;
  currentHigh: number;
  secret?: number; // Only passed if game over
  lastGuess?: number;
}

export const RangeVisualizer: React.FC<RangeVisualizerProps> = ({
  min,
  max,
  currentLow,
  currentHigh,
  secret,
  lastGuess
}) => {
  const totalRange = max - min + 1;
  
  // Calculate percentages for CSS width/position
  const leftGrayPct = ((currentLow - min) / totalRange) * 100;
  const activePct = ((currentHigh - currentLow + 1) / totalRange) * 100;
  
  // Secret position (only visible if won/lost)
  const secretPct = secret ? ((secret - min) / totalRange) * 100 : 0;
  
  // Last guess position
  const guessPct = lastGuess ? ((lastGuess - min) / totalRange) * 100 : 0;

  return (
    <div className="w-full py-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      
      <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-700">
        {/* The Active Search Space */}
        <div 
          className="absolute top-0 h-full bg-indigo-600 transition-all duration-500 ease-out opacity-80"
          style={{
            left: `${leftGrayPct}%`,
            width: `${activePct}%`
          }}
        />
        
        {/* Optional: Pattern overlay to make it look 'techy' */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>

        {/* Last Guess Marker */}
        {lastGuess && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10 shadow-[0_0_10px_rgba(250,204,21,0.8)] transition-all duration-300"
            style={{ left: `${guessPct}%` }}
          />
        )}

        {/* Secret Marker (Reveal) */}
        {secret && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-emerald-400 z-20 shadow-[0_0_15px_rgba(52,211,153,1)]"
            style={{ left: `${secretPct}%` }}
          />
        )}
      </div>
      
      <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
        <div className="text-left">
          <div className="text-gray-300">Lower Bound: {currentLow}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-300">Upper Bound: {currentHigh}</div>
        </div>
      </div>
    </div>
  );
};
