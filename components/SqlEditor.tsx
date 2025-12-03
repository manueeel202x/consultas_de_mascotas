
import React, { useState } from 'react';
import { Play, RotateCcw, Database } from 'lucide-react';

interface SqlEditorProps {
  onExecute: (sql: string) => void;
  isProcessing: boolean;
  onReset: () => void;
}

const SqlEditor: React.FC<SqlEditorProps> = ({ onExecute, isProcessing, onReset }) => {
  // Updated default to show bulk insertion
  const [sqlInput, setSqlInput] = useState<string>("INSERT INTO Perros VALUES \n  ('Chihuahua', 'Paco', 1),\n  ('Doberman', 'Bruno', 2),\n  ('Husky', 'Max', 1);");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqlInput.trim()) return;
    onExecute(sqlInput);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800 ring-1 ring-white/5">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Database className="text-emerald-500" size={18} />
            <h2 className="text-slate-100 font-bold text-sm uppercase tracking-widest">Editor SQL</h2>
        </div>
        <button 
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
          title="Restaurar base de datos original"
        >
          <RotateCcw size={12} /> Reset DB
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-5 bg-gradient-to-b from-slate-900 to-slate-950">
        <label htmlFor="sql-input" className="sr-only">Comando SQL</label>
        <div className="flex-1 relative group">
            <textarea
            id="sql-input"
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            className="w-full h-full bg-[#0d1117] text-emerald-300 font-mono text-base p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none leading-relaxed shadow-inner placeholder-slate-700 transition-all"
            placeholder="INSERT INTO Perros VALUES ('Raza', 'Nombre', IdDueño), (...);"
            spellCheck={false}
            />
        </div>
        
        <div className="mt-5 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-mono">ID Auto-Increment | Bulk Insert (Val, Val),...</span>
          <button
            id="execute-btn"
            type="submit"
            disabled={isProcessing || !sqlInput.trim()}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all transform active:scale-95
              ${isProcessing || !sqlInput.trim() 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-transparent' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 border border-emerald-500/50'}
            `}
          >
            <Play size={16} fill="currentColor" />
            {isProcessing ? 'Procesando...' : 'Ejecutar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SqlEditor;
