import React from "react";
import { useOntology } from "../ontology/Provider";

export default function DiseasePage() {
  const { classes } = useOntology();

  const diseaseClass = classes.find(c => c.label.toLowerCase() === "disease");

  return (
    <div>
      <h1>Disease Module</h1>
      {diseaseClass ? (
        <div>
          <p>Class IRI: {diseaseClass.iri}</p>
          <p>Label: {diseaseClass.label}</p>
          <p>Comment: {diseaseClass.comment}</p>
        </div>
      ) : (
        <p>Disease class not found in the ontology.</p>
      )}
    </div>
  );
}
