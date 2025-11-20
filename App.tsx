import React, { useState, useEffect } from 'react';
import { TrendingUp, Brain, Lock, Unlock, Play, RotateCcw, Trophy, User } from 'lucide-react';
import { GamePhase, GameConfig, ClueType, GameState, AnalysisResult, LeaderboardEntry } from './types';
import { RangeVisualizer } from './components/RangeVisualizer';
import { getClueText, getClueCost, getBinarySearchPivot, calculateScore } from './services/mathUtils';
import { analyzeGameplay, getMathFunFact } from './services/geminiService';

// --- Constants ---
const PRESETS = {
  EASY: { min: 1, max: 10, tries: 3 },
  MEDIUM: { min: 1, max: 30, tries: 7 },
  HARD: { min: 1, max: 50, tries: 10 }
};

// Safe check for API key existence
const hasApiKey = () => {
  try {
    return typeof process !== 'undefined' && !!process.env?.API_KEY;
  } catch {
    return false;
  }
};

// --- Components ---

const Leaderboard: React.FC<{ entries: LeaderboardEntry[], currentDiff: string }> = ({ entries, currentDiff }) => {
  const filtered = entries.filter(e => e.difficulty === currentDiff).sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
        <Trophy size={14} className="text-yellow-500" /> Top Scores ({currentDiff})
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1 pr-2 text-sm custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-slate-600 italic text-xs">No scores yet. Be the first!</div>
        ) : (
          filtered.map((entry, i) => (
            <div key={i} className={`flex justify-between items-center p-2 rounded ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-slate-800/50'}`}>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold w-4 ${i === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>{i + 1}.</span>
                <span className="font-semibold text-slate-200 truncate max-w-[80px]">{entry.name}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-slate-400">{entry.guesses} tries</span>
                <span className="font-mono text-emerald-400 font-bold">{entry.score}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SetupScreen: React.FC<{ onStart: (config: GameConfig) => void }> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [smartMode, setSmartMode] = useState(false);

  const preset = PRESETS[difficulty];

  const handleStart = () => {
    if (!name.trim()) {
      alert("Please enter your name!");
      return;
    }
    onStart({
      min: preset.min,
      max: preset.max,
      difficulty,
      maxGuesses: preset.tries,
      smartMode,
      playerName: name.trim()
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-8 animate-in fade-in zoom-in duration-300">
      <div className="space-y-6">
        <div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">Guess That Number+</h1>
          <p className="text-slate-400 text-lg">Math strategy & probability game.</p>
        </div>

        <div className="space-y-4">
          <div>
             <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Player Name</label>
             <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={12}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Select Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
              {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`p-4 rounded-xl border text-sm flex flex-col items-center justify-center gap-1 transition-all ${
                    difficulty === d
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold">{d}</span>
                  <span className="text-[10px] opacity-70 font-mono">
                    1-{PRESETS[d].max} • {PRESETS[d].tries} Tries
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setSmartMode(!smartMode)}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${smartMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                <Brain size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">Smart Strategy Mode</h3>
                <p className="text-xs text-slate-500">Show probabilities & hints</p>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${smartMode ? 'bg-emerald-500' : 'bg-slate-600'}`}>
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${smartMode ? 'left-6' : 'left-1'}`} />
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
        >
          <Play size={24} />
          Start Challenge
        </button>
      </div>

      {/* Right side decorative / info */}
      <div className="hidden md:flex flex-col justify-center items-center bg-slate-800/30 rounded-3xl border border-slate-800 p-8">
        <div className="w-full aspect-video bg-slate-900 rounded-xl border border-slate-700 mb-6 relative overflow-hidden flex items-center justify-center">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
           <div className="text-center">
              <div className="text-6xl font-mono font-bold text-slate-700 mb-2 animate-pulse">?</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">Find the number</div>
           </div>
        </div>
        <div className="text-sm text-slate-400 text-center max-w-xs">
           <p className="mb-4">"Mathematics is the music of reason."</p>
           <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                 <span className="block text-xs text-slate-500 uppercase">Easy</span>
                 <span className="font-mono text-emerald-400">1-10 (3 tries)</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                 <span className="block text-xs text-slate-500 uppercase">Medium</span>
                 <span className="font-mono text-blue-400">1-30 (7 tries)</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 col-span-2">
                 <span className="block text-xs text-slate-500 uppercase">Hard</span>
                 <span className="font-mono text-rose-400">1-50 (10 tries)</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'neutral' | 'good' | 'bad' | 'info'>('neutral');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [funFact, setFunFact] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gtn_leaderboard');
    if (saved) {
      try {
        setLeaderboard(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse leaderboard", e);
      }
    }
  }, []);

  const saveScore = (newEntry: LeaderboardEntry) => {
    const newBoard = [...leaderboard, newEntry];
    setLeaderboard(newBoard);
    localStorage.setItem('gtn_leaderboard', JSON.stringify(newBoard));
  };

  const startGame = (newConfig: GameConfig) => {
    const secret = Math.floor(Math.random() * (newConfig.max - newConfig.min + 1)) + newConfig.min;
    setConfig(newConfig);
    setState({
      secretNumber: secret,
      guesses: [],
      rangeLow: newConfig.min,
      rangeHigh: newConfig.max,
      score: 1000,
      unlockedClues: [],
      startTime: Date.now(),
    });
    setPhase(GamePhase.PLAYING);
    setFeedback("Start Guessing!");
    setFeedbackType('neutral');
    setInputValue('');
    setAnalysis(null);
    setFunFact(null);
  };

  const handleGuess = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!state || !config) return;
    
    const guess = parseInt(inputValue, 10);
    if (isNaN(guess)) return;
    
    if (guess < config.min || guess > config.max) {
      setFeedback(`Range: ${config.min} - ${config.max}`);
      setFeedbackType('bad');
      return;
    }

    if (state.guesses.includes(guess)) {
      setFeedback("Already guessed that!");
      setFeedbackType('bad');
      return;
    }

    const newGuesses = [...state.guesses, guess];
    const triesLeft = config.maxGuesses - newGuesses.length;
    
    // Win Condition
    if (guess === state.secretNumber) {
      const finalScore = calculateScore(newGuesses.length, config.max - config.min + 1, 0, (Date.now() - state.startTime)/1000);
      setState(prev => prev ? { ...prev, guesses: newGuesses, score: finalScore } : null);
      setFeedback("Correct!");
      setFeedbackType('good');
      setPhase(GamePhase.WON);
      
      saveScore({
        name: config.playerName,
        score: finalScore,
        difficulty: config.difficulty,
        guesses: newGuesses.length,
        date: Date.now()
      });

      if (hasApiKey()) {
        getMathFunFact(state.secretNumber).then(setFunFact);
      }
      return;
    }

    // Loss Condition
    if (triesLeft <= 0) {
      setState(prev => prev ? { ...prev, guesses: newGuesses } : null);
      setFeedback(`Game Over! It was ${state.secretNumber}`);
      setFeedbackType('bad');
      setPhase(GamePhase.LOST);
      return;
    }

    // Continue Playing
    let newRangeLow = state.rangeLow;
    let newRangeHigh = state.rangeHigh;
    let msg = "";
    
    if (guess < state.secretNumber) {
      msg = "Too Low";
      newRangeLow = Math.max(state.rangeLow, guess + 1);
      setFeedbackType('info');
    } else {
      msg = "Too High";
      newRangeHigh = Math.min(state.rangeHigh, guess - 1);
      setFeedbackType('info');
    }

    setFeedback(msg);
    setState({
      ...state,
      guesses: newGuesses,
      rangeLow: newRangeLow,
      rangeHigh: newRangeHigh
    });
    setInputValue('');
  };

  const unlockClue = (type: ClueType) => {
    if (!state) return;
    const cost = getClueCost(type);
    if (state.score < cost) {
      setFeedback("Need more points!");
      setFeedbackType('bad');
      return;
    }
    setState({
      ...state,
      score: state.score - cost,
      unlockedClues: [...state.unlockedClues, type]
    });
  };

  const runAnalysis = async () => {
    if (!state || !config) return;
    setIsAnalyzing(true);
    const result = await analyzeGameplay(state.secretNumber, config.min, config.max, state.guesses);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  // --- RENDER ---

  if (phase === GamePhase.SETUP) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 overflow-hidden">
        <SetupScreen onStart={startGame} />
      </div>
    );
  }

  if (!state || !config) return null;

  const triesRemaining = config.maxGuesses - state.guesses.length;
  const remainingRange = state.rangeHigh - state.rangeLow + 1;
  const probability = remainingRange > 0 ? (1 / remainingRange * 100).toFixed(1) : 0;
  const binaryPivot = getBinarySearchPivot(state.rangeLow, state.rangeHigh);
  const apiKeyAvailable = hasApiKey();

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 font-sans overflow-hidden">
      
      {/* Compact Header */}
      <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center px-6 justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
           <div className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 text-lg">
             Guess That Number+
           </div>
           <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-700 text-xs font-mono text-slate-300 border border-slate-600 flex items-center gap-1">
                <User size={12}/> {config.playerName}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                config.difficulty === 'EASY' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' :
                config.difficulty === 'MEDIUM' ? 'bg-blue-900/30 border-blue-500/50 text-blue-400' :
                'bg-rose-900/30 border-rose-500/50 text-rose-400'
              }`}>
                {config.difficulty}
              </span>
           </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Tries Left</div>
            <div className={`font-mono font-bold text-lg leading-none ${triesRemaining <= 2 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              {triesRemaining}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Score</div>
            <div className="font-mono font-bold text-lg text-emerald-400 leading-none">{state.score}</div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout - Non Scrolling */}
      <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        
        {/* LEFT: Interaction Zone (8 cols) */}
        <div className="col-span-8 flex flex-col p-6 gap-4 relative border-r border-slate-800">
           
           {/* Range Viz */}
           <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-sm shrink-0">
             <RangeVisualizer 
               min={config.min} max={config.max} 
               currentLow={state.rangeLow} currentHigh={state.rangeHigh} 
               secret={phase !== GamePhase.PLAYING ? state.secretNumber : undefined}
               lastGuess={state.guesses[state.guesses.length - 1]}
             />
           </div>

           {/* Game Area */}
           <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
              
              {/* Big Feedback */}
              <div className="text-center mb-8 animate-in zoom-in duration-300">
                <h2 className={`text-4xl md:text-5xl font-bold transition-colors duration-300 ${
                  feedbackType === 'good' ? 'text-emerald-400' :
                  feedbackType === 'bad' ? 'text-rose-400' :
                  feedbackType === 'info' ? 'text-blue-400' :
                  'text-slate-200'
                }`}>
                  {feedback}
                </h2>
                <p className="text-slate-500 mt-2 font-mono text-sm">
                  {phase === GamePhase.PLAYING ? "Analyze range. Make a guess." : 
                   phase === GamePhase.WON ? "Excellent Work!" : "Better luck next time."}
                </p>
              </div>

              {/* Playing Input */}
              {phase === GamePhase.PLAYING && (
                <form onSubmit={handleGuess} className="w-full max-w-md relative group">
                  <input
                    type="number"
                    autoFocus
                    placeholder="?"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl px-6 py-6 text-4xl font-mono text-center text-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all shadow-2xl"
                  />
                  <button 
                    type="submit" 
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    Go
                  </button>
                </form>
              )}

              {/* End Game Screens */}
              {phase !== GamePhase.PLAYING && (
                 <div className="flex flex-col gap-4 items-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex gap-4">
                      <button onClick={() => setPhase(GamePhase.SETUP)} className="flex items-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all shadow-lg hover:shadow-slate-700/50">
                        <RotateCcw size={20} /> Play Again
                      </button>
                      
                      {apiKeyAvailable && !analysis && (
                        <button 
                          onClick={runAnalysis} 
                          disabled={isAnalyzing}
                          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white shadow-lg transition-all"
                        >
                          {isAnalyzing ? "Analyzing..." : <><Brain size={20} /> Coach Analysis</>}
                        </button>
                      )}
                    </div>

                    {funFact && (
                      <div className="mt-4 max-w-md bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg text-center">
                        <p className="text-indigo-200 text-sm italic">"{funFact}"</p>
                      </div>
                    )}

                    {analysis && (
                      <div className="mt-4 max-w-lg bg-slate-800 p-4 rounded-xl border border-slate-700 text-left w-full max-h-40 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-purple-400 font-bold text-sm">Coach Feedback</h4>
                          <div className="flex text-yellow-400 text-xs gap-0.5">
                             {[...Array(5)].map((_, i) => <span key={i}>{i < analysis.rating ? '★' : '☆'}</span>)}
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{analysis.feedback}</p>
                      </div>
                    )}
                 </div>
              )}
           </div>

           {/* Clues Grid */}
           <div className="grid grid-cols-4 gap-3 mt-auto shrink-0">
              {[ClueType.PARITY, ClueType.DIVISIBLE_3, ClueType.PRIME, ClueType.SUM_DIGITS].map((type) => {
                const isUnlocked = state.unlockedClues.includes(type);
                const cost = getClueCost(type);
                const canAfford = state.score >= cost;

                return (
                  <button
                    key={type}
                    disabled={isUnlocked || !canAfford || phase !== GamePhase.PLAYING}
                    onClick={() => unlockClue(type)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isUnlocked 
                        ? 'bg-indigo-900/30 border-indigo-500/50' 
                        : canAfford 
                          ? 'bg-slate-800 border-slate-700 hover:border-indigo-400 hover:bg-slate-750' 
                          : 'bg-slate-800/50 border-slate-800 text-slate-600 opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {type === ClueType.PARITY && "Even/Odd"}
                        {type === ClueType.DIVISIBLE_3 && "Div by 3"}
                        {type === ClueType.PRIME && "Prime?"}
                        {type === ClueType.SUM_DIGITS && "Digit Sum"}
                      </span>
                      {isUnlocked ? <Unlock size={10} className="text-emerald-400"/> : <Lock size={10} />}
                    </div>
                    <div className="text-xs font-mono font-bold text-white truncate">
                      {isUnlocked ? getClueText(type, state.secretNumber) : `${cost} pts`}
                    </div>
                  </button>
                );
              })}
           </div>
        </div>

        {/* RIGHT: Info / Stats / Leaderboard (4 cols) */}
        <div className="col-span-4 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
           
           {/* Top Section: Stats & History */}
           <div className="flex-1 flex flex-col min-h-0 border-b border-slate-800">
              <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                 <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                    <TrendingUp size={14} /> History
                 </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                 {state.guesses.slice().reverse().map((g, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                       <div className="flex items-center gap-3">
                         <span className="text-xs font-mono text-slate-500 w-4">#{state.guesses.length - i}</span>
                         <span className="font-bold font-mono text-lg">{g}</span>
                       </div>
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                         g === state.secretNumber ? 'bg-emerald-500 text-white' :
                         g < state.secretNumber ? 'bg-blue-900/40 text-blue-400' : 'bg-rose-900/40 text-rose-400'
                       }`}>
                         {g === state.secretNumber ? 'MATCH' : g < state.secretNumber ? 'TOO LOW' : 'TOO HIGH'}
                       </span>
                    </div>
                 ))}
                 {state.guesses.length === 0 && (
                   <div className="text-center py-10 text-slate-600 text-xs italic">No guesses recorded.</div>
                 )}
              </div>
           </div>

           {/* Middle Section: Smart Logic (Conditional) */}
           {config.smartMode && phase === GamePhase.PLAYING && (
             <div className="p-4 bg-indigo-900/10 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2 mb-3 text-indigo-400">
                   <Brain size={16} /> <span className="text-xs font-bold uppercase">Smart Analytics</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-slate-800 p-2 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-500">Probability</div>
                      <div className="text-lg font-mono text-emerald-400 font-bold">{probability}%</div>
                   </div>
                   <div className="bg-slate-800 p-2 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-500">Optimal Guess</div>
                      <div className="text-lg font-mono text-indigo-400 font-bold">{binaryPivot}</div>
                   </div>
                </div>
             </div>
           )}

           {/* Bottom Section: Leaderboard (Fixed Height) */}
           <div className="h-1/3 min-h-[200px] bg-slate-800/20 flex flex-col p-4">
             <Leaderboard entries={leaderboard} currentDiff={config.difficulty} />
           </div>

        </div>
      </main>
    </div>
  );
}