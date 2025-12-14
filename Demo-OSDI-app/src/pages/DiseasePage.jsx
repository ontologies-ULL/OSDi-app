import React, { useState } from "react";
import { useOntology } from "../ontology/Provider";
import ObjectPropertySelector from "../components/ObjectPropertySelector";

export default function DiseasePage() {
  const { classes, individuals } = useOntology();
  const [diagnosisCost, setDiagnosisCost] = useState("");
  const [diagnosisStrategy, setDiagnosisStrategy] = useState("");
  const [followUpCost, setFollowUpCost] = useState("");
  const [followUpStrategy, setFollowUpStrategy] = useState("");
  const [treatmentCost, setTreatmentCost] = useState("");
  const [lineOfTherapy, setLineOfTherapy] = useState("");
  const [screeningCost, setScreeningCost] = useState("");
  const [screeningStrategy, setScreeningStrategy] = useState("");
  const [cost, setCost] = useState("");
  const [diseaseProgression, setDiseaseProgression] = useState("");
  const [epidemiologicalParameter, setEpidemiologicalParameter] = useState("");
  const [increasedMortality, setIncreasedMortality] = useState("");
  const [intervention, setIntervention] = useState("");
  const [lifeExpectancyReduction, setLifeExpectancyReduction] = useState("");
  const [probabilityOfDeath, setProbabilityOfDeath] = useState("");
  const [riskCharacterization, setRiskCharacterization] = useState("");
  const [utility, setUtility] = useState("");
  const [attributeValue, setAttributeValue] = useState("");
  const costs = individuals?.filter(i => i.type === "Cost") || [];

  const diseaseClass = classes.find(
    c => c.label?.toLowerCase() === "disease"
  );

  const baseIRI = "https://w3id.org/ontologies-ULL/OSDi#";

  const [form, setForm] = useState({
    label: "",
    comment: "",
    icd: "",
    doid: "",
    snomed: "",
    omim: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    if (!diseaseClass) {
      alert("Disease class not loaded yet.");
      return;
    }

    if (!form.label) {
      alert("Label is required");
      return;
    }

    const individualIRI = baseIRI + form.label;

    const newIndividual = {
      iri: individualIRI,
      label: form.label,
      comment: form.comment,
      selectedClasses: [diseaseClass.iri],
      datatypeProperties: [
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasRefToICD", value: form.icd },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasRefToDO", value: form.doid },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasRefToSNOMED", value: form.snomed },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasRefToOMIM", value: form.omim }
      ],
      objectProperties: [
        // Agregar las propiedades de objeto seleccionadas aquí
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasDiagnosisStrategy", value: diagnosisStrategy },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasFollowUpStrategy", value: followUpStrategy },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasLineOfTherapy", value: lineOfTherapy },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasScreeningStrategy", value: screeningStrategy },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasCost", value: cost },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasDiseaseProgression", value: diseaseProgression },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasEpidemiologicalParameter", value: epidemiologicalParameter },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasIncreasedMortality", value: increasedMortality },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasIntervention", value: intervention },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasLifeExpectancyReduction", value: lifeExpectancyReduction },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasProbabilityOfDeath", value: probabilityOfDeath },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasRiskCharacterization", value: riskCharacterization },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasUtility", value: utility },
        { property: "https://w3id.org/ontologies-ULL/OSDi#hasAttributeValue", value: attributeValue }
      ]
    };

    console.log("Individual to add:", newIndividual);
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-gray-800 to-gray-900 p-6">
      <div className="p-8 w-3/4 mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-100">
          Disease Module
        </h1>

        {diseaseClass ? (
          <div className="bg-gray-100 p-4 rounded-xl mb-8">
            <p className="text-gray-900"><strong>Class IRI:</strong> {diseaseClass.iri}</p>
            <p className="text-gray-900"><strong>Label:</strong> {diseaseClass.label}</p>
            <p className="text-gray-900"><strong>Comment:</strong> {diseaseClass.comment}</p>
          </div>
        ) : (
          <p className="text-red-600">Disease class not found.</p>
        )}

        <div className="bg-gray-100 shadow-lg rounded-2xl p-6">
          <h2 className="text-xl text-gray-900 font-semibold mb-4">
            Create Disease Individual
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              name="label"
              placeholder="Label"
              value={form.label}
              onChange={handleChange}
              className="border border-gray-900 p-2 rounded text-gray-900"
            />
          </div>

          <textarea
            name="comment"
            placeholder="Comment / Description"
            value={form.comment}
            onChange={handleChange}
            className="border border-gray-900 p-2 rounded text-gray-900 w-full mb-6"
          />

          <h3 className="font-semibold mb-2">Clinical References</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input name="icd" placeholder="ICD code" onChange={handleChange} className="border border-gray-900 p-2 rounded text-gray-900" />
            <input name="doid" placeholder="DOID" onChange={handleChange} className="border border-gray-900 p-2 rounded text-gray-900" />
            <input name="snomed" placeholder="SNOMED" onChange={handleChange} className="border border-gray-900 p-2 rounded text-gray-900" />
            <input name="omim" placeholder="OMIM" onChange={handleChange} className="border border-gray-900 p-2 rounded text-gray-900" />
          </div>

          <h3 className="font-semibold mb-2">Object properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <ObjectPropertySelector
              label="Select diagnosis cost"
              value={diagnosisCost}
              onChange={setDiagnosisCost}
              options={costs}
              onCreate={() => console.log("Create diagnosis cost")}
            />

            <ObjectPropertySelector
              label="Select diagnosis strategy"
              value={diagnosisStrategy}
              onChange={setDiagnosisStrategy}
              options={costs}
              onCreate={() => console.log("Create diagnosis strategy")}
            />

            <ObjectPropertySelector
              label="Select follow up cost"
              value={followUpCost}
              onChange={setFollowUpCost}
              options={costs}
              onCreate={() => console.log("Create follow up cost")}
            />

            <ObjectPropertySelector
              label="Select follow up strategy"
              value={followUpStrategy}
              onChange={setFollowUpStrategy}
              options={costs}
              onCreate={() => console.log("Create follow up strategy")}
            />

            <ObjectPropertySelector
              label="Select treatment cost"
              value={treatmentCost}
              onChange={setTreatmentCost}
              options={costs}
              onCreate={() => console.log("Create treatment cost")}
            />

            <ObjectPropertySelector
              label="Select line of therapy"
              value={lineOfTherapy}
              onChange={setLineOfTherapy}
              options={costs}
              onCreate={() => console.log("Create line of therapy")}
            />

            <ObjectPropertySelector
              label="Select screening cost"
              value={screeningCost}
              onChange={setScreeningCost}
              options={costs}
              onCreate={() => console.log("Create screening cost")}
            />

            <ObjectPropertySelector
              label="Select screening strategy"
              value={screeningStrategy}
              onChange={setScreeningStrategy}
              options={costs}
              onCreate={() => console.log("Create screening strategy")}
            />

            <ObjectPropertySelector
              label="Select cost"
              value={cost}
              onChange={setCost}
              options={costs}
              onCreate={() => console.log("Create cost")}
            />

            <ObjectPropertySelector
              label="Select disease progression"
              value={diseaseProgression}
              onChange={setDiseaseProgression}
              options={costs}
              onCreate={() => console.log("Create disease progression")}
            />

            <ObjectPropertySelector
              label="Select epidemiological parameter"
              value={epidemiologicalParameter}
              onChange={setEpidemiologicalParameter}
              options={costs}
              onCreate={() => console.log("Create epidemiological parameter")}
            />

            <ObjectPropertySelector
              label="Select increased mortality"
              value={increasedMortality}
              onChange={setIncreasedMortality}
              options={costs}
              onCreate={() => console.log("Create increased mortality")}
            />

            <ObjectPropertySelector
              label="Select intervention"
              value={intervention}
              onChange={setIntervention}
              options={costs}
              onCreate={() => console.log("Create intervention")}
            />

            <ObjectPropertySelector
              label="Select life expectancy reduction"
              value={lifeExpectancyReduction}
              onChange={setLifeExpectancyReduction}
              options={costs}
              onCreate={() => console.log("Create life expectancy reduction")}
            />

            <ObjectPropertySelector
              label="Select probability of death"
              value={probabilityOfDeath}
              onChange={setProbabilityOfDeath}
              options={costs}
              onCreate={() => console.log("Create probability of death")}
            />

            <ObjectPropertySelector
              label="Select risk characterization"
              value={riskCharacterization}
              onChange={setRiskCharacterization}
              options={costs}
              onCreate={() => console.log("Create risk characterization")}
            />

            <ObjectPropertySelector
              label="Select utility"
              value={utility}
              onChange={setUtility}
              options={costs}
              onCreate={() => console.log("Create utility")}
            />

            <ObjectPropertySelector
              label="Select attribute value"
              value={attributeValue}
              onChange={setAttributeValue}
              options={costs}
              onCreate={() => console.log("Create attribute value")}
            />
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-center mt-5">
            <button
              onClick={handleSubmit}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-xl transition"
            >
              Create Disease Individual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
