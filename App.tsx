
import React, { useState, useEffect } from 'react';
import { Database, Activity } from 'lucide-react';
import SqlEditor from './components/SqlEditor';
import ConsoleOutput from './components/ConsoleOutput';
import StructureViewer from './components/StructureViewer';
import SearchInterface from './components/SearchInterface';
import { parseAndExecute, INITIAL_FILES, initializeTree } from './services/dbEngine';
import { FileSystemState, QueryResult, BTreeState } from './types';

const App: React.FC = () => {
  // State for the "File System" (CSVs)
  const [files, setFiles] = useState<FileSystemState>(INITIAL_FILES);
  const [treeState, setTreeState] = useState<BTreeState>(initializeTree(INITIAL_FILES));
  
  // State for operation result
  const [lastResult, setLastResult] = useState<QueryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load from localStorage on mount (Simulate persistence)
  useEffect(() => {
    const savedFiles = localStorage.getItem('db_files');
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        setFiles(parsedFiles);
        // Re-initialize tree from saved files
        setTreeState(initializeTree(parsedFiles));
      } catch (e) {
        console.error("Failed to load saved DB", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('db_files', JSON.stringify(files));
  }, [files]);

  const handleExecuteSql = (sqlCommand: string) => {
    setIsProcessing(true);
    setLastResult(null);

    // Simulate network latency for realism
    setTimeout(() => {
      const result = parseAndExecute(sqlCommand, files, treeState);
      
      setLastResult(result);
      
      // Update state if any changes occurred (result contains final state of files/tree)
      if (result.updatedFiles) {
        setFiles(result.updatedFiles);
      }
      if (result.updatedTree) {
        setTreeState(result.updatedTree);
      }
      
      setIsProcessing(false);
    }, 600);
  };

  const handleReset = () => {
    if (confirm("¿Estás seguro de que quieres reiniciar la base de datos a su estado original?")) {
      setFiles(INITIAL_FILES);
      setTreeState(initializeTree(INITIAL_FILES));
      setLastResult(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header */}
      <header className="bg-slate-950/80 border-b border-slate-800 p-4 shrink-0 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg shadow-lg shadow-emerald-900/20">
              <Database className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Consulta De Mascotas
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">v3.0</span>
              </h1>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
                <Activity size={12} className="text-emerald-500" />
                Indexación B+ Tree & Persistencia CSV
              </p>
            </div>
          </div>
          <div className="hidden md:block text-right">
             <div className="text-xs text-slate-500 font-mono">Estado del Sistema</div>
             <div className="flex items-center gap-2 justify-end mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-500">EN LÍNEA</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 md:p-6 bg-gradient-to-br from-black to-slate-950">
        <div className="container mx-auto max-w-7xl h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Input and Console */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-[500px]">
            <div className="flex-[0_0_auto]">
              <SqlEditor 
                onExecute={handleExecuteSql} 
                isProcessing={isProcessing} 
                onReset={handleReset}
              />
            </div>
            <div className="flex-1 min-h-0">
              <ConsoleOutput lastResult={lastResult} />
            </div>
          </div>

          {/* Right Column: Structure Visualization AND Search */}
          <div className="lg:col-span-8 h-full flex flex-col gap-6 min-h-[500px]">
             {/* Top Half: Search */}
            <div className="flex-[0.45] min-h-0">
               <SearchInterface files={files} tree={treeState} />
            </div>
            
            {/* Bottom Half: Tables/Tree Viewer */}
            <div className="flex-[0.55] min-h-0">
               <StructureViewer files={files} tree={treeState} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
