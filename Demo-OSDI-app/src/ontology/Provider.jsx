// Provider.jsx
import React, { createContext, useContext, useState } from "react";
import { RDF, RDFS, OWL } from "./NameSpaces";
import { loadOntologyData, getBaseIRI } from "./Loader";
import * as $rdf from "rdflib";

const OntologyContext = createContext();

export const OntologyProvider = ({ children }) => {
  const [store, setStore] = useState(new $rdf.IndexedFormula());
  const [classes, setClasses] = useState([]);
  const [objectProperties, setObjectProperties] = useState([]);
  const [datatypeProperties, setDatatypeProperties] = useState([]);
  const [individuals, setIndividuals] = useState([]);
  const [baseIRI, setBaseIRI] = useState(null);
  const [loading, setLoading] = useState(false);

  const detectOntologyFormat = (content) => {
    if (!content) return "application/rdf+xml";
    if (content.includes("@keywords") || content.includes("log:implies")) return "text/n3";
    if (content.includes("@prefix") || content.includes("PREFIX")) return "text/turtle";
    return "application/rdf+xml";
  };

  const resetStore = () => {
    setStore(new $rdf.IndexedFormula());
    setClasses([]);
    setObjectProperties([]);
    setDatatypeProperties([]);
    setIndividuals([]);
    setBaseIRI(null);
  };

  const loadOntology = async (content, format = null) => {
    if (!content) return;
    setLoading(true);
    try {
      const storeInstance = $rdf.graph();
      const usedFormat = format || detectOntologyFormat(content);

      const [
        updatedStore,
        newClasses,
        newObjectProperties,
        newDataProperties,
        newIndividuals
      ] = await loadOntologyData(content, storeInstance, usedFormat);

      setStore(updatedStore);
      setClasses(newClasses);
      setObjectProperties(newObjectProperties);
      setDatatypeProperties(newDataProperties);
      setIndividuals(newIndividuals);
      setBaseIRI(getBaseIRI(updatedStore));
    } catch (error) {
      console.error("Failed to load ontology:", error);
    }
    setLoading(false);
  };

  return (
    <OntologyContext.Provider value={{
      RDF, RDFS, OWL,
      store, classes, objectProperties, datatypeProperties, individuals,
      baseIRI, loading,
      loadOntology,
      resetStore
    }}>
      {children}
    </OntologyContext.Provider>
  );
};

export const useOntology = () => useContext(OntologyContext);
