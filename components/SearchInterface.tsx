
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowDown, ScanEye, X, Maximize2, Database } from 'lucide-react';
import { BTreeState, FileSystemState, SearchStep } from '../types';
import { searchDogsByBreed } from '../services/dbEngine';

interface SearchInterfaceProps {
  files: FileSystemState;
  tree: BTreeState;
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ files, tree }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState<SearchStep[]>([]);
  const [results, setResults] = useState<Record<string, string>[] | null>(null);
  
  // Ref for auto-scrolling the logs container
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Effect to lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Effect to auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Open Modal immediately
    setShowModal(true);
    setIsSearching(true);
    setLogs([]);
    setResults(null);

    // Get trace and results immediately from engine
    const { results: foundRecords, trace } = searchDogsByBreed(searchTerm.trim(), tree, files);

    // Animate the logs step-by-step
    for (let i = 0; i < trace.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay for clear visualization
        setLogs(prev => [...prev, trace[i]]);
    }

    // Final pause before showing results
    await new Promise(resolve => setTimeout(resolve, 500));
    setResults(foundRecords);
    setIsSearching(false);
  };

  const handleClose = () => {
    setShowModal(false);
    // Optional: Reset state if desired, or keep it to show previous search when reopening
    // setIsSearching(false); 
  };

  return (
    <>
      {/* --- Main Dashboard Input Card --- */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 ring-1 ring-white/5 p-5 flex flex-col justify-center h-full">
         <div className="flex items-center gap-2 mb-3">
            <Search size={18} className="text-blue-500" />
            <h2 className="text-slate-100 font-bold text-sm uppercase tracking-widest">Búsqueda Indexada</h2>
         </div>
         <p className="text-slate-500 text-xs mb-4">
            Utilice el índice B+ Tree para buscar registros de perros por raza de manera eficiente.
         </p>
         
         <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ingrese raza (ej: Labrador)..."
              className="flex-1 bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600 transition-all"
            />
            <button
              type="submit"
              disabled={!searchTerm.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Search size={18} />
              Buscar
            </button>
         </form>
      </div>

      {/* --- Full Screen Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="relative bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/10">
            
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-900/20 rounded-lg">
                        <Maximize2 size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-slate-100 font-bold text-lg">Visualización de Búsqueda B+ Tree</h2>
                        <p className="text-slate-400 text-xs font-mono flex items-center gap-2">
                             KEY: <span className="text-emerald-400 font-bold">'{searchTerm}'</span>
                             {isSearching && <span className="flex items-center gap-1 text-blue-400 ml-2"><Loader2 size={10} className="animate-spin"/> PROCESANDO</span>}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0d1117]">
                
                {/* Left Side: Execution Log / Animation */}
                <div className="flex-[0.6] flex flex-col border-r border-slate-800 min-h-0">
                    <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        <span>Traza de Ejecución</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{logs.length} Pasos</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm relative">
                        {logs.length === 0 && isSearching && (
                            <div className="absolute inset-0 flex items-center justify-center text-blue-500/50">
                                <Loader2 size={40} className="animate-spin" />
                            </div>
                        )}
                        
                        {logs.map((step, idx) => (
                            <div key={idx} className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className={`flex items-start gap-4 p-4 rounded-xl border relative overflow-hidden group
                                    ${step.nodeType === 'root' ? 'bg-blue-950/20 border-blue-900/50 text-blue-200' : 
                                      step.nodeType === 'internal' ? 'bg-purple-950/20 border-purple-900/50 text-purple-200' : 
                                      'bg-emerald-950/20 border-emerald-900/50 text-emerald-200'}`}>
                                    
                                    {/* Visual Connection Line */}
                                    {idx < logs.length - 1 && (
                                        <div className="absolute left-[29px] top-[50px] bottom-[-20px] w-0.5 bg-slate-800 -z-10 group-hover:bg-slate-700 transition-colors"></div>
                                    )}

                                    <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-lg
                                        ${step.nodeType === 'root' ? 'bg-blue-900 border-blue-500 text-blue-100' : 
                                          step.nodeType === 'internal' ? 'bg-purple-900 border-purple-500 text-purple-100' : 
                                          'bg-emerald-900 border-emerald-500 text-emerald-100'}`}>
                                        {step.nodeType === 'root' && <Database size={14} />}
                                        {step.nodeType === 'internal' && <ArrowDown size={14} />}
                                        {step.nodeType === 'leaf' && <ScanEye size={14} />}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border mb-1 inline-block
                                                ${step.nodeType === 'root' ? 'bg-blue-900/50 border-blue-800 text-blue-300' : 
                                                step.nodeType === 'internal' ? 'bg-purple-900/50 border-purple-800 text-purple-300' : 
                                                'bg-emerald-900/50 border-emerald-800 text-emerald-300'}`}>
                                                {step.nodeType.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-mono">STEP {idx + 1}</span>
                                        </div>
                                        <p className="font-semibold leading-relaxed">{step.message}</p>
                                        {step.details && (
                                            <div className="mt-2 bg-black/30 p-2 rounded text-xs text-slate-400 border border-black/10">
                                                {step.details}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {idx < logs.length - 1 && (
                                    <div className="flex justify-start pl-[23px] py-1">
                                        <ArrowDown size={14} className="text-slate-700" />
                                    </div>
                                )}
                            </div>
                        ))}
                         {/* Invisible element to scroll to */}
                         <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Right Side: Results */}
                <div className="flex-[0.4] flex flex-col bg-slate-900 min-h-[250px] md:min-h-0 border-t md:border-t-0 md:border-l border-slate-800">
                    <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        <span>Resultados de Búsqueda</span>
                        {results && <span className={`text-[10px] px-2 py-0.5 rounded ${results.length > 0 ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'}`}>{results.length} REGISTROS</span>}
                    </div>

                    <div className="flex-1 overflow-auto p-4 flex flex-col">
                        {!results ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Database size={24} />
                                </div>
                                <p className="text-sm font-medium text-center max-w-[200px]">
                                    {isSearching ? 'Analizando estructura del árbol...' : 'Los resultados aparecerán aquí tras finalizar la búsqueda.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                                {results.length === 0 ? (
                                    <div className="p-6 text-center border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                                        <p className="text-slate-400 text-sm">No se encontraron registros para la raza <br/> <span className="text-white font-bold">"{searchTerm}"</span></p>
                                    </div>
                                ) : (
                                    results.map((row, i) => (
                                        <div key={i} className="bg-[#161b22] border border-slate-700 rounded-lg p-4 shadow-sm hover:border-emerald-500/50 transition-colors group">
                                            <div className="flex items-center gap-3 mb-2 pb-2 border-b border-slate-800/50">
                                                <div className="w-8 h-8 rounded bg-emerald-900/30 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-900/50">
                                                    {row['id_perro'] || '#'}
                                                </div>
                                                <span className="font-bold text-slate-200">{row['nombre_perro']}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {Object.entries(row).map(([key, val]) => {
                                                    if (key === 'id_perro' || key === 'nombre_perro') return null;
                                                    return (
                                                        <div key={key} className="flex justify-between text-xs">
                                                            <span className="text-slate-500 uppercase">{key}:</span>
                                                            <span className="text-slate-300 font-mono">{val}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Results Footer Status */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
                        {results ? 'BÚSQUEDA COMPLETADA EN MEMORIA' : 'ESPERANDO FINALIZACIÓN DE TRAZA...'}
                    </div>
                </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchInterface;
