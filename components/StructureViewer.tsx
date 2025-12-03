
import React, { useState } from 'react';
import { Table, Network, Database, Download } from 'lucide-react';
import { FileSystemState, BTreeState, BTreeNode } from '../types';

interface StructureViewerProps {
  files: FileSystemState;
  tree: BTreeState;
}

const StructureViewer: React.FC<StructureViewerProps> = ({ files, tree }) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'index'>('tables');

  const handleDownload = (filename: string, content: string) => {
    // Simulate Flask's send_file by creating a Blob and triggering a download
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTable = (filename: string, content: string) => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => line.split(','));

    // Allow download for both perros and duenos
    const isDownloadable = filename === 'perros.csv' || filename === 'duenos.csv';
    const downloadName = filename === 'perros.csv' ? 'registros_perros.csv' : 'registros_duenos.csv';

    return (
      <div key={filename} className="mb-6 last:mb-0">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider">
                <Database size={12} />
                {filename}
            </div>
            {isDownloadable && (
                <button 
                    onClick={() => handleDownload(downloadName, content)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 transition-colors"
                >
                    <Download size={10} />
                    Descargar CSV
                </button>
            )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-700 shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-2 font-semibold border-b border-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[#161b22] divide-y divide-slate-800 text-slate-300 font-mono">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2">{cell}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={headers.length} className="px-4 py-2 text-center text-slate-500">Tabla vacía</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTreeNode = (node: BTreeNode, depth: number = 0): React.ReactNode => {
    return (
        <div className="flex flex-col items-center">
            <div className={`
                relative px-4 py-2 rounded shadow-lg mb-4 border
                ${node.isLeaf 
                    ? 'bg-emerald-900/20 border-emerald-700 text-emerald-300' 
                    : 'bg-blue-900/20 border-blue-700 text-blue-300'}
            `}>
                <div className="text-[10px] uppercase tracking-wider opacity-70 text-center mb-1">
                    {node.isLeaf ? 'Hoja (Leaf)' : 'Nodo Interno'}
                </div>
                <div className="flex gap-2">
                    {node.keys.map((k, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="font-bold px-2 py-0.5 bg-black/30 rounded">{k}</span>
                            {node.isLeaf && node.values && node.values[i] && (
                                <span className="text-[10px] mt-1 text-slate-400">ID: {node.values[i].join(',')}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            {node.children && node.children.length > 0 && (
                <div className="flex gap-4 border-t border-slate-700 pt-4 relative">
                     {/* Connector lines are hard in pure CSS/Flex, simplified here as nesting */}
                    {node.children.map((child, i) => (
                        <div key={i} className="flex flex-col items-center">
                            {renderTreeNode(child, depth + 1)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div id="data-view" className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800 ring-1 ring-white/5 flex flex-col h-full">
      <div className="bg-slate-950 flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('tables')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
            ${activeTab === 'tables' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}
          `}
        >
          <Table size={14} /> Tablas (CSV)
        </button>
        <button
          onClick={() => setActiveTab('index')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
            ${activeTab === 'index' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}
          `}
        >
          <Network size={14} /> Índice B+ Tree (Raza)
        </button>
      </div>

      <div className="flex-1 p-6 overflow-auto bg-[#0d1117]">
        {activeTab === 'tables' ? (
          <div className="space-y-8">
            {Object.entries(files).map(([filename, content]) => renderTable(filename, content))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center">
            <div className="mb-6 text-center">
                <h3 className="text-slate-300 font-bold">Estructura del Índice B+ Tree</h3>
                <p className="text-slate-500 text-xs mt-1">Indexado por: <span className="text-emerald-400">Raza</span> en Tabla Perros</p>
            </div>
            <div className="min-w-full overflow-auto flex justify-center p-4">
                {renderTreeNode(tree.root)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StructureViewer;
