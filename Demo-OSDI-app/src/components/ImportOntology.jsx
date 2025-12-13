// ImportOntology.jsx
import React from "react";
import { ontologyImport } from "../ontology/Import";
import { useOntology } from "../ontology/Provider";

const ImportOntology = () => {
  const { loadOntology, resetStore } = useOntology();

  const handleImport = () => {
    ontologyImport((content) => {
      resetStore();       // Limpiamos el store antes
      loadOntology(content); // Cargamos la ontología
    });
  };

  return (
    <div>
      <button onClick={handleImport}
      className="bg-white hover:bg-indigo-400 hover:text-white text-indigo-600 border border-indigo-600 font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
        Import Ontology
      </button>
    </div>
  );
};

export default ImportOntology;
