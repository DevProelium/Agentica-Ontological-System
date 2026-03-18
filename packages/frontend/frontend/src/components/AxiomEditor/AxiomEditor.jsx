import React from 'react';

const AxiomEditor = ({ documentoInicial }) => {
  return (
    <div className="text-aegis-100 p-4">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">Editor de Axiomas</h2>
      <textarea
        className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
        defaultValue={documentoInicial}
        placeholder="Escribe tus axiomas ontológicos aquí..."
      />
    </div>
  );
};

export default AxiomEditor;
