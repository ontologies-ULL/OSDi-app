import React from "react";
import { useNavigate } from "react-router-dom";
import ImportOntology from "../components/ImportOntology";

export default function HomePage() {
  const navigate = useNavigate();

  return (

    <div className="flex flex-col items-center justify-center gap-y-5 min-h-screen bg-linear-to-r from-blue-100 to-purple-100 p-6">
      <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-600 mb-8 text-center drop-shadow-md">
        Ontology Prototype Home
      </h1>

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg text-center">
        <p className="text-gray-700 mb-6 text-lg">
          Import your ontology and start exploring the disease module.
        </p>

        <ImportOntology onLoaded={() => alert("Ontology loaded!")} />

        <button
          onClick={() => navigate("/disease")}
          className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Go to Disease Module
        </button>
        <button
          onClick={() => navigate("/test")}
          className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Go to Disease Module
        </button>
      </div>
    </div>


  );
}