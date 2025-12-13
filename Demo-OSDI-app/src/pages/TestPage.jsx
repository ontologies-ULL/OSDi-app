import React from "react";
import { useOntology } from "../ontology/Provider";

export default function TestPage() {
  const { classes } = useOntology();

  const testClass = classes.find(c => c.label.toLowerCase() === "cost");

  return (
    <div>
      <h1>Disease Module</h1>
      {testClass ? (
        <div>
          <p>Class IRI: {testClass.iri}</p>
          <p>Label: {testClass.label}</p>
          <p>Comment: {testClass.comment}</p>
        </div>
      ) : (
        <p>TestClass not found in the ontology.</p>
      )}
    </div>
  );
}
