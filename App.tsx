/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  RotateCcw, 
  Play, 
  Info, 
  FlaskConical, 
  Droplet, 
  Pause,
  Beaker,
  Thermometer,
  Microscope,
  Pipette
} from 'lucide-react';
import { Step, TitrationState } from './types';

// Constants
const HCL_MOLARITY = 0.1;
const HCL_VOLUME = 20; // 20 mL
const NAOH_MOLARITY = 0.1;
const EQ_VOLUME = (HCL_MOLARITY * HCL_VOLUME) / NAOH_MOLARITY;

export default function App() {
  const [state, setState] = useState<TitrationState>({
    step: 'initial',
    volumeHCl: 0,
    molarityHCl: HCL_MOLARITY,
    volumeNaOH: 0,
    molarityNaOH: NAOH_MOLARITY,
    ppAdded: false,
    isStirring: false,
    isTitrating: false,
    history: [],
  });

  const titrationInterval = useRef<NodeJS.Timeout | null>(null);

  // Calculate current pH based on titration progress
  const ph = useMemo(() => {
    if (state.volumeNaOH === 0) return 1; // 0.1M HCl -> pH 1
    
    // Total volume in flask
    const vTotal = HCL_VOLUME + state.volumeNaOH;
    
    // Moles
    const nInitialH = (HCL_VOLUME / 1000) * HCL_MOLARITY;
    const nAddedOH = (state.volumeNaOH / 1000) * NAOH_MOLARITY;
    
    if (nAddedOH < nInitialH) {
      // Acidic
      const nRemainingH = nInitialH - nAddedOH;
      const concentrationH = (nRemainingH / (vTotal / 1000));
      return -Math.log10(concentrationH);
    } else if (Math.abs(nAddedOH - nInitialH) < 0.000000001) {
      // Equivalence point
      return 7;
    } else {
      // Basic
      const nExcessOH = nAddedOH - nInitialH;
      const concentrationOH = (nExcessOH / (vTotal / 1000));
      const poh = -Math.log10(concentrationOH);
      return 14 - poh;
    }
  }, [state.volumeNaOH]);

  // Determine color of liquid
  const liquidColor = useMemo(() => {
    if (!state.ppAdded) return 'rgba(255, 255, 255, 0.4)'; // Clear colorless
    
    if (ph < 8.2) return 'rgba(255, 255, 255, 0.4)'; // Still clear
    if (ph >= 8.2 && ph < 9.0) {
      // Faint pink transition
      const opacity = (ph - 8.2) / 0.8;
      return `rgba(255, 105, 180, ${0.1 + opacity * 0.3})`;
    }
    // Permanent pink/magenta
    const intensity = Math.min(0.4 + (ph - 9) * 0.1, 0.8);
    return `rgba(255, 20, 147, ${intensity})`;
  }, [ph, state.ppAdded]);

  // Titration logic
  useEffect(() => {
    if (state.isTitrating) {
      titrationInterval.current = setInterval(() => {
        setState(prev => {
          const nextVol = Math.round((prev.volumeNaOH + 0.1) * 10) / 10;
          
          let nextStep = prev.step;
          if (nextVol >= EQ_VOLUME && nextVol < EQ_VOLUME + 0.5) {
            nextStep = 'equivalence';
          } else if (nextVol >= EQ_VOLUME + 0.5) {
            nextStep = 'over_titrated';
          } else {
            nextStep = 'titrating';
          }

          return {
            ...prev,
            volumeNaOH: nextVol,
            step: nextStep,
            isStirring: true,
          };
        });
      }, 100);
    } else {
      if (titrationInterval.current) clearInterval(titrationInterval.current);
    }
    return () => {
      if (titrationInterval.current) clearInterval(titrationInterval.current);
    };
  }, [state.isTitrating]);

  const handleNext = () => {
    switch (state.step) {
      case 'initial':
        setState(s => ({ ...s, step: 'setup_apparatus' }));
        break;
      case 'setup_apparatus':
        setState(s => ({ ...s, step: 'add_hcl', volumeHCl: HCL_VOLUME }));
        break;
      case 'add_hcl':
        setState(s => ({ ...s, step: 'add_pp', ppAdded: true }));
        break;
      case 'add_pp':
        setState(s => ({ ...s, step: 'fill_buret' }));
        break;
      case 'fill_buret':
        setState(s => ({ ...s, step: 'titrating' }));
        break;
    }
  };

  const reset = () => {
    setState({
      step: 'initial',
      volumeHCl: 0,
      molarityHCl: HCL_MOLARITY,
      volumeNaOH: 0,
      molarityNaOH: NAOH_MOLARITY,
      ppAdded: false,
      isStirring: false,
      isTitrating: false,
      history: [],
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col font-sans selection:bg-amber-200">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Beaker className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-slate-800">TitratePro</h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Simulasi Titrasi Asam Basa</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Status Eksperimen</span>
            <span className={`text-xs font-semibold uppercase tracking-wider ${state.isTitrating ? 'text-amber-500' : 'text-slate-600'}`}>
              {state.step.replace('_', ' ')}
            </span>
          </div>
          <button 
            onClick={reset}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600 active:rotate-180 duration-500"
            title="Reset Simulasi"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 lg:flex overflow-hidden">
        {/* Workspace: Left Side */}
        <section className="flex-1 relative bg-white flex items-center justify-center p-4 sm:p-8 overflow-hidden min-h-[500px]">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
          
          <div className="relative w-full max-w-2xl aspect-[4/3] flex items-center justify-center">
            {/* Simulation Stage */}
            <div className="relative w-[300px] h-[480px]">
              
              {/* Stand (Statif) */}
              <div className="absolute left-[45%] bottom-0 w-4 h-[460px] bg-slate-300 rounded-t-full shadow-inner" />
              <div className="absolute left-[20%] bottom-0 w-[180px] h-3 bg-slate-400 rounded-full shadow-md" />
              
              {/* Apparatus Rendering */}
              <AnimatePresence mode="wait">
                {/* Buret */}
                {state.step !== 'initial' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-[40%] top-6 z-20"
                  >
                    <Buret volume={state.volumeNaOH} isTitrating={state.isTitrating} />
                  </motion.div>
                )}

                {/* Erlenmeyer */}
                {(state.step !== 'initial' && state.step !== 'setup_apparatus') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute left-[34%] bottom-6 z-10"
                    style={{
                      transformOrigin: 'bottom center',
                    }}
                  >
                    <motion.div
                      animate={state.isStirring ? {
                        x: [0, -2, 2, -2, 0],
                        rotate: [0, -0.5, 0.5, -0.5, 0]
                      } : {}}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Erlenmeyer 
                        color={liquidColor} 
                        level={state.volumeHCl > 0 ? (state.volumeHCl + state.volumeNaOH) : 0} 
                        isStirring={state.isStirring}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Clamp (Klem) */}
              {state.step !== 'initial' && (
                <div className="absolute left-[45%] top-28 w-14 h-2.5 bg-slate-400 rounded-r-md shadow-sm border-t border-white/20" />
              )}
            </div>

            {/* Floating Labels */}
            <AnimatePresence>
              {state.step !== 'initial' && (
                <>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-[65%] top-[20%] bg-white/90 border border-slate-200 p-3 rounded-lg shadow-sm backdrop-blur-md"
                  >
                    <p className="text-[9px] uppercase font-mono text-slate-400 mb-1">Titran (Buret)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">NaOH</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{NAOH_MOLARITY}M</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-[65%] bottom-[20%] bg-white/90 border border-slate-200 p-3 rounded-lg shadow-sm backdrop-blur-md"
                  >
                    <p className="text-[9px] uppercase font-mono text-slate-400 mb-1">Titrat (Erlenmeyer)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">HCl</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{HCL_MOLARITY}M</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{HCL_VOLUME} mL</p>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Microscopic Ion View */}
          <div className="absolute bottom-6 right-6 w-40 h-40 sm:w-56 sm:h-56 bg-slate-900/5 backdrop-blur-xl border border-slate-200 rounded-full overflow-hidden flex items-center justify-center group shadow-inner">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Microscope className="w-32 h-32 text-slate-400" />
            </div>
            <IonVisualization 
              ph={ph} 
              volNaOH={state.volumeNaOH} 
              isTitrating={state.isTitrating} 
              step={state.step}
            />
            <div className="absolute bottom-3 inset-x-0 text-center">
              <span className="text-[8px] font-mono uppercase text-slate-500 tracking-widest bg-white/50 px-2 py-0.5 rounded-full border border-slate-200">View Ion</span>
            </div>
          </div>
        </section>

        {/* Info & Controls: Right Side */}
        <aside className="w-full lg:w-[400px] border-l border-slate-200 bg-[#F8F9FA]/50 backdrop-blur-lg flex flex-col">
          <div className="p-6 md:p-8 flex-1 overflow-y-auto">
            <h2 className="font-display font-bold text-lg text-slate-800 mb-8 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Prosedur & Analisa
            </h2>

            <div className="space-y-6">
              <StepIndicator currentStep={state.step} />
              
              <div className="mt-10 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-mono uppercase text-slate-400 tracking-[0.2em]">Instrumentasi</h3>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    <div className="w-1 h-1 rounded-full bg-emerald-400/30" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">V NaOH Terpakai</p>
                    <p className="text-2xl font-mono font-bold text-slate-800 tracking-tight">
                      {state.volumeNaOH.toFixed(1)} 
                      <span className="text-xs font-normal ml-1">mL</span>
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Tingkat Keasaman</p>
                    <p className="text-2xl font-mono font-bold text-amber-600 tracking-tight">
                      {ph.toFixed(2)}
                      <span className="text-xs font-normal ml-1">pH</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-2">
                    <span>Sifat Larutan</span>
                    <span className="text-slate-600">{ph < 7 ? 'ASAM' : ph > 7 ? 'BASA' : 'NETRAL'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <motion.div 
                      className="h-full bg-amber-500" 
                      animate={{ width: `${(ph / 14) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Analysis Text */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={state.step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6"
                >
                  <div className="text-sm text-slate-600 leading-relaxed bg-amber-50/50 border border-amber-100 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                    <p className="font-medium text-slate-800 mb-1 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-amber-500" />
                      Keterangan
                    </p>
                    {getStepDescription(state.step, ph)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 md:p-8 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] selection:bg-none">
            {['titrating', 'equivalence', 'over_titrated'].includes(state.step) ? (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setState(s => ({ ...s, isTitrating: !s.isTitrating }))}
                  className={`group relative overflow-hidden py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                    state.isTitrating ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {state.isTitrating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  {state.isTitrating ? 'HENTIKAN TETESAN' : 'MULAI TETESAN'}
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-amber-500 animate-ping" />
                  Live Titration Active
                </div>
              </div>
            ) : (
              <button 
                onClick={handleNext}
                className="group w-full py-4 bg-amber-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
              >
                {state.step === 'initial' ? 'MULAI EKSPERIMEN' : 'LANGKAH BERIKUTNYA'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

// Visual Sub-components

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'setup_apparatus', label: 'Persiapan Rangkaian Alat' },
    { key: 'add_hcl', label: 'Memasukkan Larutan HCl' },
    { key: 'add_pp', label: 'Indikator Fenolftalein (PP)' },
    { key: 'fill_buret', label: 'Pengisian Buret (NaOH)' },
    { key: 'titrating', label: 'Titrasi & Penetesan' },
  ];

  return (
    <div className="space-y-4">
      {steps.map((s, idx) => {
        const isCompleted = isBefore(s.key, currentStep);
        const isActive = currentStep === s.key || (s.key === 'titrating' && (currentStep === 'equivalence' || currentStep === 'over_titrated'));
        
        return (
          <div key={idx} className="flex items-center gap-4 group">
            <div className={`relative w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
              isActive ? 'bg-amber-500 border-amber-500 text-white scale-110 shadow-lg shadow-amber-500/30' : 
              isCompleted ? 'bg-slate-100 border-slate-100 text-slate-400' : 
              'bg-transparent border-slate-200 text-slate-300'
            }`}>
              <span className="text-[10px] font-bold">{idx + 1}</span>
              {isCompleted && <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isActive ? 'text-slate-900' : isCompleted ? 'text-slate-400' : 'text-slate-300'
            }`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Buret({ volume, isTitrating }: { volume: number; isTitrating: boolean }) {
  const fillPct = Math.max(0, (50 - volume) / 50 * 100);
  
  return (
    <svg width="40" height="340" viewBox="0 0 40 340">
      <defs>
        <linearGradient id="buret-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="50%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      
      {/* Liquid in Buret */}
      <rect x="14" y="20" width="12" height="260" fill="#E2E8F0" rx="1" />
      <motion.rect 
        x="14" 
        y={20 + (260 - 2.6 * fillPct)} 
        width="12" 
        height={2.6 * fillPct} 
        fill="rgba(255, 255, 255, 0.9)" 
        rx="1"
      />
      
      {/* Buret Tube */}
      <rect x="14" y="10" width="12" height="280" fill="none" stroke="#64748B" strokeWidth="1.5" rx="1.5" />
      <rect x="14" y="10" width="12" height="280" fill="url(#buret-grad)" opacity="0.1" rx="1.5" />
      
      {/* Scale Lines */}
      {Array.from({ length: 26 }).map((_, i) => (
        <line key={i} x1="14" y1={20 + i * 10} x2={i % 5 === 0 ? "26" : "18"} y2={20 + i * 10} stroke="#94A3B8" strokeWidth="0.5" />
      ))}

      {/* Stopcock */}
      <circle cx="20" cy="295" r="5" fill="#475569" stroke="#1E293B" strokeWidth="1" />
      <motion.rect 
        x="12" y="293" width="16" height="4" fill="#1E293B" rx="1" 
        animate={{ rotate: isTitrating ? 90 : 0 }}
        style={{ transformOrigin: 'center' }}
      />

      {/* Tip */}
      <path d="M17 300 Q20 330 20 335 Q20 330 23 300 Z" fill="#64748B" opacity="0.6" />

      {/* Drip Animation */}
      {isTitrating && (
        <motion.circle 
          cx="20" cy="340" r="1.5" fill="rgba(255, 255, 255, 0.9)"
          animate={{ y: [0, 90], opacity: [1, 0], scale: [0.8, 1.2, 0.5] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeIn" }}
        />
      )}
    </svg>
  );
}

function Erlenmeyer({ color, level, isStirring }: { color: string; level: number; isStirring: boolean }) {
  const fillHeight = Math.min(65, level * 0.82);
  
  return (
    <svg width="120" height="140" viewBox="0 0 100 120">
      <defs>
        <clipPath id="flask-clip">
          <path d="M38 10 L62 10 L62 45 L92 110 L8 110 L38 45 Z" />
        </clipPath>
        <radialGradient id="liquid-shine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Flask Body Shade */}
      <path d="M38 10 L62 10 L62 45 L92 110 L8 110 L38 45 Z" fill="#F1F5F9" opacity="0.6" />
      
      {/* Liquid Body */}
      <motion.path 
        d={`M 0 ${110 - fillHeight} L 100 ${110 - fillHeight} L 100 125 L 0 125 Z`}
        fill={color}
        clipPath="url(#flask-clip)"
        animate={isStirring ? {
          d: [
            `M 0 ${110 - fillHeight} Q 50 ${112 - fillHeight} 100 ${110 - fillHeight} L 100 125 L 0 125 Z`,
            `M 0 ${110 - fillHeight} Q 50 ${108 - fillHeight} 100 ${110 - fillHeight} L 100 125 L 0 125 Z`,
            `M 0 ${110 - fillHeight} Q 50 ${112 - fillHeight} 100 ${110 - fillHeight} L 100 125 L 0 125 Z`,
          ]
        } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      
      {/* Shine on liquid */}
      <ellipse cx="50" cy={110 - fillHeight/2} rx="20" ry={fillHeight/3} fill="url(#liquid-shine)" clipPath="url(#flask-clip)" />

      {/* Outer Flask Contour */}
      <path d="M38 10 L62 10 L62 45 L92 110 L8 110 L38 45 Z" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="38" y="10" width="24" height="4" fill="#64748B" rx="1" />
      
      {/* Flask Scaling Labels */}
      <g stroke="#94A3B8" strokeWidth="0.8">
        <line x1="62" y1="95" x2="68" y2="95" />
        <line x1="62" y1="80" x2="65" y2="80" />
        <line x1="62" y1="65" x2="68" y2="65" />
        <line x1="62" y1="50" x2="65" y2="50" />
      </g>
    </svg>
  );
}

function IonVisualization({ ph, volNaOH, isTitrating, step }: { ph: number; volNaOH: number; isTitrating: boolean; step: Step }) {
  const [ions, setIons] = useState<{ id: number; type: string; x: number; y: number; vx: number; vy: number }[]>([]);
  
  useEffect(() => {
    if (step === 'initial' || step === 'setup_apparatus') return;

    // Real stoichiometry logic for visualization
    const hMolesRel = Math.max(0, 1 - (volNaOH / EQ_VOLUME));
    const ohMolesRel = Math.max(0, (volNaOH / EQ_VOLUME) - 1);
    
    const countH = Math.min(10, Math.round(hMolesRel * 12));
    const countOH = Math.min(12, Math.round(ohMolesRel * 12));
    const countCl = 10;
    const countNa = Math.min(10, Math.round((volNaOH / EQ_VOLUME) * 10));
    const countH2O = Math.min(15, Math.round(Math.min(volNaOH, EQ_VOLUME) / EQ_VOLUME * 15));

    const newIons: any[] = [];
    let id = 0;
    
    const add = (type: string, count: number) => {
      for (let i = 0; i < count; i++) {
        newIons.push({
          id: id++,
          type,
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
        });
      }
    };

    add('H', countH);
    add('Cl', countCl);
    add('Na', countNa);
    add('OH', countOH);
    if (step !== 'add_hcl' && step !== 'add_pp') add('H2O', countH2O);

    setIons(newIons);
  }, [ph, volNaOH, step]);

  const requestRef = useRef<number>();
  const animate = () => {
    setIons(prev => prev.map(ion => {
      let nx = ion.x + ion.vx;
      let ny = ion.y + ion.vy;
      let nvx = ion.vx;
      let nvy = ion.vy;

      if (nx <= 5 || nx >= 95) nvx *= -1;
      if (ny <= 5 || ny >= 95) nvy *= -1;

      return {
        ...ion,
        x: Math.max(5, Math.min(95, nx)),
        y: Math.max(5, Math.min(95, ny)),
        vx: nvx,
        vy: nvy
      };
    }));
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  return (
    <div className="w-full h-full relative">
      {ions.map(ion => (
        <div
          key={ion.id}
          className={`absolute w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black transition-colors duration-500 shadow-sm border border-white/20 ${
            ion.type === 'H' ? 'bg-orange-500 text-white' :
            ion.type === 'OH' ? 'bg-blue-500 text-white' :
            ion.type === 'H2O' ? 'bg-indigo-300 text-slate-800' :
            ion.type === 'Na' ? 'bg-teal-400 text-white' :
            'bg-slate-300 text-slate-700'
          }`}
          style={{ left: `${ion.x}%`, top: `${ion.y}%` }}
        >
          {ion.type === 'H' ? 'H⁺' : ion.type === 'OH' ? 'OH⁻' : ion.type === 'H2O' ? 'H₂O' : ion.type === 'Na' ? 'Na⁺' : 'Cl⁻'}
        </div>
      ))}
    </div>
  );
}

function isBefore(s1: Step, s2: Step): boolean {
  const order: Step[] = ['initial', 'setup_apparatus', 'add_hcl', 'add_pp', 'fill_buret', 'titrating', 'equivalence', 'over_titrated'];
  return order.indexOf(s1) < order.indexOf(s2);
}

function getStepDescription(step: Step, ph: number) {
  switch (step) {
    case 'initial': return "Selamat datang di simulasi TitratePro. Kita akan melakukan pengujian konsentrasi larutan asam melalui metode titrasi alkalimetri.";
    case 'setup_apparatus': return "Langkah 1: Rangkai statif dan klem. Pasang buret di bagian atas dengan posisi tegak lurus sempurna agar akurasi volume terjaga.";
    case 'add_hcl': return "Langkah 2: Ambil 20 mL HCl (asam kuat) menggunakan pipet volume dan masukkan ke dalam Erlenmeyer di bawah buret.";
    case 'add_pp': return "Langkah 3: Tambahkan beberapa tetes indikator fenolftalein. Larutan tetap bening karena indikator PP tidak berwarna dalam medium asam (pH < 8.2).";
    case 'fill_buret': return "Langkah 4: Isi buret dengan NaOH (basa kuat) 0.1 M. Pastikan tidak ada gelembung udara di ujung buret agar pengukuran volume titran presisi.";
    case 'titrating': 
      if (ph < 7) return "Titrasi Berjalan: Ion OH⁻ mulai masuk dan bereaksi dengan H⁺ membentuk H₂O. pH naik perlahan seiring berkurangnya H⁺ bebas.";
      if (ph >= 7 && ph < 8.2) return "Mendekati Titik Akhir: Jumlah H⁺ sudah hampir habis. Mulai muncul warna merah muda samar saat tetesan jatuh, namun akan hilang saat Erlenmeyer diaduk.";
      return "Titrasi Berjalan: Perhatikan perubahan warna yang muncul.";
    case 'equivalence': return "Titik Ekuivalen Tercapai: Mol asam telah dinetralkan tepat oleh mol basa. Indikator berubah menjadi merah muda pucat permanen. pH berada di angka 7 (netral) hingga ~8.3.";
    case 'over_titrated': return "Kelebihan Titrasi: Larutan kini mengandung kelebihan ion OH⁻. Warna merah muda menjadi lebih gelap/pekat, menandakan larutan telah melewati titik ekuivalen.";
    default: return "Eksperimen sedang dalam progress.";
  }
}
