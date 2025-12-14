import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOntology } from "../ontology/Provider";

export default function HomePage() {
  const navigate = useNavigate();
  const { loadOntology, resetStore } = useOntology();

  const loadedRef = useRef(false); // 👈 evita el bucle
  const ontologySelected = '/ontology.owl'; // Ruta de la ontología predeterminada

  useEffect(() => {
    if (loadedRef.current) return;

    const loadDefaultOntology = async () => {
      try {
        resetStore();
        const response = await fetch(ontologySelected);
        if (!response.ok) {
          throw new Error("Failed to load ontology");
        }

        const content = await response.text();
        loadOntology(content);

        loadedRef.current = true;
        console.log("Ontology loaded automatically");
      } catch (error) {
        console.error("Error loading ontology:", error);
      }
    };

    loadDefaultOntology();
  }, []); // 🔥 SIN dependencias

  return (
    <div className="flex flex-col items-center justify-center gap-y-5 min-h-screen bg-linear-to-r from-gray-800 to-gray-900 p-6">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-100 mb-8 text-center drop-shadow-md">
        Ontology Prototype Home
      </h1>

      <div className="bg-gray-100 shadow-xl rounded-2xl p-8 w-full max-w-lg text-center">
        <p className="text-gray-900 mb-6 text-lg">
          Default ontology loaded automatically ("{ontologySelected}").
        </p>

        <button
          onClick={() => navigate("/disease")}
          className="mt-6 w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Go to Disease Module
        </button>
      </div>
    </div>
  );
}
