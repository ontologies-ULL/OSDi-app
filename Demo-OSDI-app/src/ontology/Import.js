// import.js
/**
 * Opens a file dialog to import an ontology and passes the content to a callback
 * @param {function(string): void} onImportComplete - function to call with file content
 */
export const ontologyImport = (onImportComplete) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".ttl,.rdf,.xml,.nt,.n3,.owl"; // formatos soportados

  input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      onImportComplete(fileContent);
      alert("Ontology imported successfully!");
    };
    reader.readAsText(file);
  });

  input.click();
};
