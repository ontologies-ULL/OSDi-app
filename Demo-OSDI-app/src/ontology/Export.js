// import * as $rdf from "rdflib";

// /**
//  * Exports an ontology
//  *
//  * @async
//  * @param {import("rdflib").IndexedFormula} store 
//  * @param {string} format
//  * @returns {void} 
//  */
// export const ontologyExport = async (store, format = "application/rdf+xml") => {
//   try {
//     let serializedOntology;

//     try {
//       serializedOntology = $rdf.serialize(null, store, null, format);
//     } catch (error) {
//       console.error("Serialization failed:", error);
//       alert("Failed to serialize ontology.");
//       return;
//     }

//     if (!serializedOntology.startsWith("<?xml")) {
//       serializedOntology = `<?xml version="1.0"?>\n` + serializedOntology;
//     }

//     const fileExtension = format === "application/rdf+xml" ? ".owl" : ".ttl";
//     const suggestedName = `ontology${fileExtension}`;

//     if (window.showSaveFilePicker) {
//       try {
//         const fileHandle = await window.showSaveFilePicker({
//           suggestedName,
//           types: [{ description: "Ontology File", accept: { [format]: [fileExtension] } }],
//         });

//         const writable = await fileHandle.createWritable();
//         await writable.write(serializedOntology);
//         await writable.close();

//         alert("Ontology exported successfully!");
//         return;
//       } catch (error) {
//         console.error("File Picker Error:", error);
//       }
//     }

//     const fileName = prompt("Enter file name for export:", suggestedName);
//     if (!fileName) return;

//     const blob = new Blob([serializedOntology], { type: format });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = fileName;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);

//     alert("Ontology exported successfully!");
//   } catch (error) {
//     console.error("Export failed:", error);
//     alert("Failed to export ontology.");
//   }
// };

// export default ontologyExport;
