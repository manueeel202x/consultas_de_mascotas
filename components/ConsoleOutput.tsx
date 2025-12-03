
import React from 'react';
import { CheckCircle2, XCircle, Terminal, Hash } from 'lucide-react';
import { QueryResult } from '../types';

interface ConsoleOutputProps {
  lastResult: QueryResult | null;
}

const ConsoleOutput: React.FC<ConsoleOutputProps> = ({ lastResult }) => {
  return (
    <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800 ring-1 ring-white/5 flex flex-col h-full">
      <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center gap-2">
        <Terminal size={16} className="text-slate-500" />
        <h2 className="text-slate-300 font-bold text-xs uppercase tracking-widest">Salida del Sistema</h2>
      </div>
      
      <div id="result-output" className="p-4 font-mono text-sm h-full overflow-y-auto bg-[#0d1117] space-y-3">
        {!lastResult ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700">
             <div className="w-2 h-2 bg-slate-700 rounded-full animate-pulse mb-2"></div>
             <p className="text-xs">Esperando ejecución...</p>
          </div>
        ) : (
          lastResult.results.map((res, idx) => (
            <div key={idx} className={`p-3 rounded-lg border-l-4 flex items-start gap-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                res.success 
                ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-200' 
                : 'bg-red-950/20 border-red-500/50 text-red-200'
            }`}>
                {res.success ? (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" />
                ) : (
                <XCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs opacity-70 truncate max-w-[200px] block" title={res.command}>
                            CMD: {res.command}
                        </span>
                        {res.id_asignado && (
                             <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                <Hash size={10} /> ID: {res.id_asignado}
                             </span>
                        )}
                    </div>
                    <p className="leading-snug text-slate-300 text-xs">{res.message}</p>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsoleOutput;
