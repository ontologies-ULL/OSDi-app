import { RDF, RDFS, OWL } from "./NameSpaces";
import * as $rdf from "rdflib";

/** Devuelve el base IRI de la ontología */
export const getBaseIRI = (store) => {
  const owlOntologyTriple = store.match(null, RDF("type"), OWL("Ontology"));
  return owlOntologyTriple.length > 0 ? owlOntologyTriple[0].subject.value : null;
};

/** Normaliza una clase a objeto consistente */
export const normalizeClass = (subject, store) => {
  const iri = subject.value;
  const label = store.any(subject, RDFS("label"), null)?.value || iri.split("#").pop() || "";
  const comment = store.any(subject, RDFS("comment"), null)?.value || "";
  return { iri, label, comment };
};

/** Carga datos de ontología en un store */
export const loadOntologyData = async (ontologyContent, existingStore = null, format = "text/turtle", extractOnly = false) => {
  const store = existingStore || $rdf.graph();

  if (!extractOnly && ontologyContent) {
    $rdf.parse(ontologyContent, store, "http://example.com/temp#", format);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const classData = [];
  const objectProperties = [];
  const dataProperties = [];
  const individuals = [];

  store.statements.forEach(({ subject }) => {
    if (subject.termType !== "NamedNode" && subject.termType !== "BlankNode") return;
    const typeTriple = store.any(subject, RDF("type"), null);
    const label = store.any(subject, RDFS("label"), null)?.value || subject.value.split("#").pop();
    const comment = store.any(subject, RDFS("comment"), null)?.value || "";

    const data = { iri: subject.value, label, comment };

    const isClass =
      typeTriple?.equals(OWL("Class")) ||
      store.any(subject, RDFS("subClassOf"), null) !== null ||
      store.any(subject, OWL("disjointWith"), null) !== null;

    if (isClass && !classData.some(d => d.iri === data.iri)) classData.push(data);
    if (typeTriple?.equals(OWL("ObjectProperty")) && !objectProperties.some(d => d.iri === data.iri)) objectProperties.push(data);
    if (typeTriple?.equals(OWL("DatatypeProperty")) && !dataProperties.some(d => d.iri === data.iri)) dataProperties.push(data);
    if (typeTriple?.equals(OWL("NamedIndividual")) && !individuals.some(d => d.iri === data.iri)) individuals.push(data);
  });

  return [store, classData, objectProperties, dataProperties, individuals];
};
