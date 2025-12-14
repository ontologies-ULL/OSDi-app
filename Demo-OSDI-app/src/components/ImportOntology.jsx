// ImportOntology.jsx
import React from "react";
import { ontologyImport } from "../ontology/Import";
import { useOntology } from "../ontology/Provider";

const ImportOntology = () => {
  const { loadOntology, resetStore } = useOntology();

  const handleImport = () => {
    ontologyImport((content) => {
      resetStore();
      loadOntology(content);
    });
  };

};

export default ImportOntology;
