from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Body
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from owlready2 import *
import os
import tempfile
from typing import Optional, List, Any
from enum import Enum
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(
    title="Ontology Management API",
    description="API for CRUD operations on ontologies",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    # Ports available for frontend development
    allow_origins=[
        "http://localhost:5173",    # Vite default
        "http://localhost:3000",    # Create React App default
        "http://127.0.0.1:5173",    # Vite with explicit IP
        "http://127.0.0.1:3000"     # Create React App with explicit IP
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to hold the currently loaded ontology
current_ontology = None
ontology_file_path = None

class ExportFormat(str, Enum):
    """
    @brief Supported export formats for the ontology file.
    @param owl Exports in OWL/RDF/XML format (default).
    @param ntriples Exports in N-Triples format.
    @param turtle Exports in Turtle format.
    """
    owl = "owl"
    ntriples = "ntriples"
    turtle = "turtle"

class DatatypeProperty(BaseModel):
    """
    @brief Represents a datatype property assignment for an ontology individual.
    @param property URI or local name of the datatype property.
    @param value Literal value to assign (string, number, boolean, etc.).
    """
    property: str
    value: Any

class ObjectProperty(BaseModel):
    """
    @brief Represents an object property assignment linking two ontology individuals.
    @param property URI or local name of the object property.
    @param value URI or local name of the target individual.
    """
    property: str
    value: str

class IndividualCreate(BaseModel):
    """
    @brief Payload for creating a new individual in the ontology.
    @param label Local name of the individual. Used to build its IRI as {base_iri}#{label}.
    @param comment Optional human-readable description (maps to rdfs:comment).
    @param selectedClasses List of class IRIs or local names the individual belongs to.
    @param datatypeProperties Literal property-value pairs to assign to the individual.
    @param objectProperties Object property assignments linking this individual to others.
    """
    label: str
    comment: Optional[str] = None
    selectedClasses: List[str] = []
    datatypeProperties: List[DatatypeProperty] = []
    objectProperties: List[ObjectProperty] = []

class IndividualUpdate(BaseModel):
    """
    @brief Payload for partially updating an existing individual in the ontology.
    Only provided fields are updated. Collection fields (selectedClasses,
    datatypeProperties, objectProperties) fully replace existing values when provided.
    @param label New local name for the individual. Triggers an IRI rename.
    @param comment New human-readable description. Pass empty string to remove it.
    @param selectedClasses New set of classes, replacing all existing class assignments.
    @param datatypeProperties New set of datatype properties, replacing all existing ones.
    @param objectProperties New set of object properties, replacing all existing ones.
    """
    label: Optional[str] = None
    comment: Optional[str] = None
    selectedClasses: Optional[List[str]] = None
    datatypeProperties: Optional[List[DatatypeProperty]] = None
    objectProperties: Optional[List[ObjectProperty]] = None

# Resolve the projects directory relative to this file's location
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECTS_DIR = os.path.join(BASE_DIR, "..", "projects")
PROJECTS_DIR = os.path.abspath(PROJECTS_DIR)

# Ensure the projects folder exists
os.makedirs(PROJECTS_DIR, exist_ok=True)

@app.get("/")
def root():
    """@brief Returns a summary of the API and the list of available endpoints."""
    return {
        "message": "Ontology Management API",
        "version": "1.0.0",
        "endpoints": {
            "POST /ontology/load": "Load an ontology from file",
            "GET /ontology/export": "Export the loaded ontology",
            "POST /ontology/export-to-path": "Export ontology to a specific server path",
            "DELETE /ontology/clear": "Clear the loaded ontology from memory",
            "POST /ontology/individual": "Create a new individual",
            "PUT /ontology/individual/{iri}": "Update an existing individual",
            "GET /ontology/info": "General information about the loaded ontology",
            "GET /ontology/classes": "Detailed list of all classes",
            "GET /ontology/individuals": "Detailed list of all individuals",
            "GET /ontology/data-properties": "Detailed list of all data properties",
            "GET /ontology/object-properties": "Detailed list of all object properties"
        }
    }

@app.post("/ontology/load")
async def load_ontology(file: UploadFile = File(...)):
    """
    @brief Loads an ontology from an uploaded OWL/RDF file into memory.
    The file is saved to a temporary path and kept loaded until cleared or replaced.
    Validates that the file has a supported extension and a valid OWL structure.
    @param file Ontology file. Supported formats: .owl, .rdf, .ttl, .xml, .n3, .nt
    @return Base IRI of the loaded ontology and basic statistics (classes, individuals, properties).
    @throws HTTPException 400 if the file extension is not supported.
    @throws HTTPException 500 if the ontology cannot be parsed or has an invalid structure.
    """
    global current_ontology, ontology_file_path
    
    try:
        # Validate file extension
        allowed_extensions = ['.owl', '.rdf', '.ttl', '.xml', '.n3', '.nt']
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise ValueError(f"Format not supported. Use: {', '.join(allowed_extensions)}")
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            content = await file.read()
            tmp.write(content)
            ontology_file_path = tmp.name
        
        # Load ontology
        current_ontology = get_ontology(f"file://{ontology_file_path}").load()
        
        # Ensure the ontology has valid content
        if not current_ontology.base_iri:
            raise ValueError("Invalid ontology: No base IRI found")
        
        try:
            classes = list(current_ontology.classes())
            individuals = list(current_ontology.individuals())
            properties = list(current_ontology.properties())
        except Exception as e:
            raise ValueError(f"Invalid ontology structure: {str(e)}")
        
        return {
            "success": True,
            "message": "Ontology loaded successfully",
            "ontology_iri": current_ontology.base_iri,
            "statistics": {
                "classes": len(classes),
                "individuals": len(individuals),
                "properties": len(properties)
            },
            "sample_classes": [c.name for c in classes[:5]] if classes else []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up the temporary file if an error occurred
        if ontology_file_path and os.path.exists(ontology_file_path):
            try:
                os.unlink(ontology_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Error loading ontology: {str(e)}")

@app.get("/ontology/export")
def export_ontology(
    format: ExportFormat = Query(ExportFormat.owl, description="Export format"),
    filename: str = Query("ontology_export", description="File name (without extension)")
):
    """
    @brief Exports the in-memory ontology as a downloadable file.
    Intended for browser use — the user selects where to save the file.
    Writes all current in-memory changes to a temporary file before serving it.
    @param format Export format. Supported values: owl (RDF/XML), turtle.
    @param filename Base name for the downloaded file (extension is appended automatically).
    @return The ontology file as a binary download response.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 500 if the export fails or the resulting file is empty.
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        # Determine extension based on format
        format_extensions = {
            "owl": ".owl",
            "turtle": ".ttl"
        }
        
        ext = format_extensions.get(format.value, ".owl")
        output_filename = f"{filename}{ext}"
        
        # Create temporary file for export
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext, mode='w') as tmp:
            export_path = tmp.name
        
        # Map the correct format for owlready2
        owlready_format = "rdfxml" if format.value == "owl" else format.value
        
        # Export ontology with all in-memory changes
        current_ontology.save(file=export_path, format=owlready_format)
        
        # Check that the file is not empty
        if os.path.getsize(export_path) == 0:
            raise HTTPException(
                status_code=500,
                detail="The exported file is empty. The ontology may have no content."
            )
        
        # Determine media type
        media_types = {
            "owl": "application/rdf+xml",
            "turtle": "text/turtle"
        }
        media_type = media_types.get(format.value, "application/rdf+xml")
        
        # Return file for download
        return FileResponse(
            path=export_path,
            filename=output_filename,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting ontology: {str(e)}")

@app.post("/ontology/save")
def save_ontology_local(
    format: ExportFormat = Query(ExportFormat.owl, description="Export format"),
    filename: str = Query(None, description="File name (without extension). If not provided, generates timestamp-based name")
):
    """
    @brief Persists the current in-memory ontology to the server's projects folder.
    Used to save work in progress without triggering a browser download.
    If no filename is given, an automatic name is generated using the current timestamp.
    @param format Export format. Supported values: owl (RDF/XML), turtle.
    @param filename Base name for the saved file (extension appended automatically).
                   If omitted, a timestamp-based name is generated (e.g. disease_ontology_20260318_120000).
    @return JSON with the saved file path, filename, size in bytes, and format used.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 500 if saving fails or the resulting file is empty.
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        # Determine extension based on format
        format_extensions = {
            "owl": ".owl",
            "turtle": ".ttl"
        }
        ext = format_extensions.get(format.value, ".owl")
        
        # Generate filename if not provided
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"disease_ontology_{timestamp}"
        
        output_filename = f"{filename}{ext}"
        output_path = os.path.join(PROJECTS_DIR, output_filename)
        
        # Map the correct format for owlready2
        owlready_format = "rdfxml" if format.value == "owl" else format.value
        
        # Save ontology to projects folder
        current_ontology.save(file=output_path, format=owlready_format)
        
        # Check that the file is not empty
        if os.path.getsize(output_path) == 0:
            raise HTTPException(
                status_code=500,
                detail="The exported file is empty. The ontology may have no content."
            )
        
        # Get file size for confirmation
        file_size = os.path.getsize(output_path)
        
        return {
            "status": "success",
            "message": f"Ontology saved successfully to {output_path}",
            "file_path": output_path,
            "file_name": output_filename,
            "file_size_bytes": file_size,
            "format": format.value
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving ontology: {str(e)}")

@app.post("/ontology/export-to-path")
def export_ontology_to_path(
    output_path: str = Query(..., description="Full path where to save (for desktop apps only)"),
    format: ExportFormat = Query(ExportFormat.owl, description="Export format")
):
    """
    @brief Exports the ontology to a specific path on the server's file system.
    Only works when the backend has direct access to the target directory.
    If no extension is included in the path, it is appended based on the format.
    @param output_path Full absolute path where the file will be saved.
    @param format Export format. Supported values: owl (RDF/XML), turtle.
    @return JSON with the output path, format used, and file size in bytes.
    @throws HTTPException 400 if no ontology is loaded or the target directory does not exist.
    @throws HTTPException 500 if the export fails or the resulting file is empty.
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        # Validate that the directory exists
        directory = os.path.dirname(output_path)
        if directory and not os.path.exists(directory):
            raise HTTPException(
                status_code=400,
                detail=f"The directory does not exist: {directory}"
            )
        
        # If no extension is specified, add it based on format
        if not os.path.splitext(output_path)[1]:
            format_extensions = {
                "owl": ".owl",
                "turtle": ".ttl"
            }
            ext = format_extensions.get(format.value, ".owl")
            output_path = f"{output_path}{ext}"
        
        # Map the correct format for owlready2
        owlready_format = "rdfxml" if format.value == "owl" else format.value
        
        # Export ontology with all in-memory changes
        current_ontology.save(file=output_path, format=owlready_format)
        
        # Verify that the file is not empty
        file_size = os.path.getsize(output_path)
        if file_size == 0:
            raise HTTPException(
                status_code=500,
                detail="The exported file is empty. The ontology may have no content."
            )
        
        return {
            "success": True,
            "message": "Ontology exported successfully",
            "output_path": output_path,
            "format": format.value,
            "file_size_bytes": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting ontology: {str(e)}")

@app.post("/ontology/individual")
def create_individual(individual_data: IndividualCreate = Body(...)):
    """
    @brief Creates a new named individual in the loaded ontology.
    The individual's IRI is built as {base_iri}#{label}. If no classes are provided,
    the individual is created as an instance of owl:Thing.
    Changes are automatically persisted to the loaded .owl file after creation.
    @param individual_data IndividualCreate payload with label, optional comment, classes, datatype properties, and object properties.
    @return JSON with the IRI, label, classes, and count of properties assigned.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 404 if any of the specified classes is not found in the ontology.
    @throws HTTPException 500 if creation fails for any other reason.
    """
    global current_ontology, ontology_file_path
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        with current_ontology:
            # Create the individual's IRI based on the label and the ontology's base IRI
            base_iri = str(current_ontology.base_iri)
            if base_iri.endswith("#"):
                individual_iri = f"{base_iri}{individual_data.label}"
            else:
                individual_iri = f"{base_iri}#{individual_data.label}"
            
            # If no classes are selected, create as a generic Thing
            if not individual_data.selectedClasses:
                individual = Thing(individual_data.label)
            else:
                # Get the first class and create the instance
                first_class_iri = individual_data.selectedClasses[0]
                
                # Search for the class in the ontology
                owlready_class = None
                for cls in current_ontology.classes():
                    if str(cls.iri) == first_class_iri or cls.name == first_class_iri:
                        owlready_class = cls
                        break
                
                if owlready_class is None:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Class not found: {first_class_iri}"
                    )
                
                # Create instance of the class
                individual = owlready_class(individual_data.label)
                
                # Add additional classes
                for class_iri in individual_data.selectedClasses[1:]:
                    for cls in current_ontology.classes():
                        if str(cls.iri) == class_iri or cls.name == class_iri:
                            individual.is_a.append(cls)
                            break
            
            # Add label
            individual.label = [individual_data.label]
            
            # Add comment if exists
            if individual_data.comment:
                individual.comment = [individual_data.comment]
            
            # Add datatype properties
            for dp in individual_data.datatypeProperties:
                try:
                    # Search for the property in the ontology
                    prop = None
                    for p in current_ontology.data_properties():
                        if str(p.iri) == dp.property or p.name == dp.property:
                            prop = p
                            break
                    
                    if prop:
                        # Get the current value if it exists
                        current_value = getattr(individual, prop.name, None)
                        if current_value is None or current_value == []:
                            setattr(individual, prop.name, [dp.value])
                        elif isinstance(current_value, list):
                            current_value.append(dp.value)
                        else:
                            setattr(individual, prop.name, [current_value, dp.value])
                except Exception as e:
                    print(f"Warning: Could not add datatype property {dp.property}: {e}")
            
            # Add object properties
            for op in individual_data.objectProperties:
                try:
                    # Search for the property
                    prop = None
                    for p in current_ontology.object_properties():
                        if str(p.iri) == op.property or p.name == op.property:
                            prop = p
                            break
                    if prop:
                        # Search for the related individual
                        target_individual = None
                        for ind in current_ontology.individuals():
                            if str(ind.iri) == op.value or ind.name == op.value:
                                target_individual = ind
                                break
                        if target_individual:
                            current_value = getattr(individual, prop.name, None)
                            if current_value is None or current_value == []:
                                setattr(individual, prop.name, [target_individual])
                            elif isinstance(current_value, list):
                                current_value.append(target_individual)
                            else:
                                setattr(individual, prop.name, [current_value, target_individual])
                except Exception as e:
                    print(f"Warning: Could not add object property {op.property}: {e}")
        
        # Save to the loaded ontology file
        if ontology_file_path:
            current_ontology.save(file=ontology_file_path, format="rdfxml")
        
        return {
            "success": True,
            "message": "Individual created successfully",
            "individual": {
                "iri": str(individual.iri),
                "label": individual_data.label,
                "comment": individual_data.comment,
                "classes": [str(cls.iri) for cls in individual.is_a if isinstance(cls, ThingClass)],
                "properties_added": {
                    "datatype": len(individual_data.datatypeProperties),
                    "object": len(individual_data.objectProperties)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating individual: {str(e)}")

@app.put("/ontology/individual/{individual_iri:path}")
def update_individual(individual_iri: str, update_data: IndividualUpdate = Body(...)):
    """
    @brief Updates an existing individual in the loaded ontology.
    Only the fields included in the payload are modified. If label changes,
    the individual is destroyed and recreated under the new IRI, preserving all
    existing properties not explicitly overridden, and updating all references
    from other individuals automatically.
    Changes are automatically persisted to the loaded .owl file after the update.
    @param individual_iri Full IRI or local name of the individual to update.
    @param update_data IndividualUpdate payload with the fields to modify.
    @return JSON with the updated IRI, name, label, comment, and assigned classes.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 404 if the individual is not found in the ontology.
    @throws HTTPException 500 if the update fails for any other reason.
    """
    global current_ontology, ontology_file_path
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        # Search for the individual
        individual = None
        for ind in current_ontology.individuals():
            if str(ind.iri) == individual_iri or ind.name == individual_iri:
                individual = ind
                break
        
        if individual is None:
            raise HTTPException(
                status_code=404,
                detail=f"Individual not found: {individual_iri}"
            )
        
        with current_ontology:
            # If the label is changed, we need to recreate the individual with a new IRI
            if update_data.label is not None and update_data.label != individual.name:

                # Save all current individual information
                old_classes = [cls for cls in individual.is_a if isinstance(cls, ThingClass)]
                old_comment = individual.comment[0] if individual.comment else None
                
                # Save all data properties
                old_data_props = {}
                for prop in current_ontology.data_properties():
                    try:
                        value = getattr(individual, prop.name, None)
                        if value is not None and value != []:
                            old_data_props[prop] = value if isinstance(value, list) else [value]
                    except:
                        pass
                
                # Save all object properties
                old_obj_props = {}
                for prop in current_ontology.object_properties():
                    try:
                        value = getattr(individual, prop.name, None)
                        if value is not None and value != []:
                            old_obj_props[prop] = value if isinstance(value, list) else [value]
                    except:
                        pass
                
                # Search for all references to this individual in other individuals
                references = []
                for other_ind in current_ontology.individuals():
                    if other_ind != individual:
                        for prop in current_ontology.object_properties():
                            try:
                                value = getattr(other_ind, prop.name, None)
                                if value:
                                    if isinstance(value, list):
                                        if individual in value:
                                            references.append((other_ind, prop, value))
                                    elif value == individual:
                                        references.append((other_ind, prop, [value]))
                            except:
                                pass
                
                # Delete the old individual
                destroy_entity(individual)
                
                # Create new individual with the new name
                if old_classes:
                    new_individual = old_classes[0](update_data.label)
                    # Add additional classes
                    for cls in old_classes[1:]:
                        new_individual.is_a.append(cls)
                else:
                    new_individual = Thing(update_data.label)
                
                # Restore label
                new_individual.label = [update_data.label]
                
                # Restore comment
                if update_data.comment is not None:
                    if update_data.comment != "":
                        new_individual.comment = [update_data.comment]
                elif old_comment:
                    new_individual.comment = [old_comment]
                
                # Restore data properties
                if update_data.datatypeProperties is not None:
                    for dp in update_data.datatypeProperties:
                        prop = None
                        for p in current_ontology.data_properties():
                            if str(p.iri) == dp.property or p.name == dp.property:
                                prop = p
                                break
                        if prop:
                            setattr(new_individual, prop.name, [dp.value])
                else:
                    for prop, values in old_data_props.items():
                        setattr(new_individual, prop.name, values)
                
                # Restore object properties (use updated if provided, else old)
                if update_data.objectProperties is not None:
                    for op in update_data.objectProperties:
                        prop = None
                        for p in current_ontology.object_properties():
                            if str(p.iri) == op.property or p.name == op.property:
                                prop = p
                                break
                        if prop:
                            target_individual = None
                            for ind in current_ontology.individuals():
                                if str(ind.iri) == op.value or ind.name == op.value:
                                    target_individual = ind
                                    break
                            if target_individual:
                                current_value = getattr(new_individual, prop.name, [])
                                if isinstance(current_value, list):
                                    current_value.append(target_individual)
                                else:
                                    setattr(new_individual, prop.name, [target_individual])
                else:
                    for prop, values in old_obj_props.items():
                        setattr(new_individual, prop.name, values)
                
                # Update classes if provided
                if update_data.selectedClasses is not None:
                    new_individual.is_a = [cls for cls in new_individual.is_a if not isinstance(cls, ThingClass)]
                    for class_iri in update_data.selectedClasses:
                        found_class = None
                        for cls in current_ontology.classes():
                            if str(cls.iri) == class_iri or cls.name == class_iri:
                                found_class = cls
                                break
                        if found_class:
                            new_individual.is_a.append(found_class)
                
                # Update references in other individuals
                for other_ind, prop, old_values in references:
                    new_values = [new_individual if v == individual else v for v in old_values]
                    setattr(other_ind, prop.name, new_values)
                
                individual = new_individual
                
            else:
                # Update label if provided
                if update_data.label is not None:
                    individual.label = [update_data.label]
                
                # Update comment if provided
                if update_data.comment is not None:
                    if update_data.comment == "":
                        individual.comment = []  # Delete comment
                    else:
                        individual.comment = [update_data.comment]
                
                # Update classes if provided
                if update_data.selectedClasses is not None:
                    individual.is_a = [cls for cls in individual.is_a if not isinstance(cls, ThingClass)]
                    
                    for class_iri in update_data.selectedClasses:
                        found_class = None
                        for cls in current_ontology.classes():
                            if str(cls.iri) == class_iri or cls.name == class_iri:
                                found_class = cls
                                break
                        
                        if found_class:
                            individual.is_a.append(found_class)
                
                # Update datatype properties if provided
                if update_data.datatypeProperties is not None:
                    # Clear existing properties
                    for prop in current_ontology.data_properties():
                        try:
                            setattr(individual, prop.name, [])
                        except:
                            pass
                    
                    # Add new properties
                    for dp in update_data.datatypeProperties:
                        prop = None
                        for p in current_ontology.data_properties():
                            if str(p.iri) == dp.property or p.name == dp.property:
                                prop = p
                                break
                        
                        if prop:
                            current_value = getattr(individual, prop.name, [])
                            if isinstance(current_value, list):
                                current_value.append(dp.value)
                            else:
                                setattr(individual, prop.name, [dp.value])
                
                # Update object properties if provided
                if update_data.objectProperties is not None:
                    # Clear existing properties
                    for prop in current_ontology.object_properties():
                        try:
                            setattr(individual, prop.name, [])
                        except:
                            pass
                    
                    # Add new properties
                    for op in update_data.objectProperties:
                        prop = None
                        for p in current_ontology.object_properties():
                            if str(p.iri) == op.property or p.name == op.property:
                                prop = p
                                break
                        
                        if prop:
                            target_individual = None
                            for ind in current_ontology.individuals():
                                if str(ind.iri) == op.value or ind.name == op.value:
                                    target_individual = ind
                                    break
                            
                            if target_individual:
                                current_value = getattr(individual, prop.name, [])
                                if isinstance(current_value, list):
                                    current_value.append(target_individual)
                                else:
                                    setattr(individual, prop.name, [target_individual])
        
        # Save to the loaded ontology file
        if ontology_file_path:
            current_ontology.save(file=ontology_file_path, format="rdfxml")
        
        return {
            "success": True,
            "message": "Individual updated successfully",
            "individual": {
                "iri": str(individual.iri),
                "name": individual.name,
                "label": individual.label[0] if individual.label else None,
                "comment": individual.comment[0] if individual.comment else None,
                "classes": [str(cls.iri) for cls in individual.is_a if isinstance(cls, ThingClass)]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating individual: {str(e)}")

@app.get("/ontology/classes")
def get_classes():
    """
    @brief Returns detailed information about all classes defined in the loaded ontology.
    For each class, includes its IRI, label, comment, superclasses, subclasses,
    and up to 10 of its direct instances.
    @return JSON with total class count and a list of class descriptors.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 500 if the query fails.
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        classes_info = []
        
        for cls in current_ontology.classes():
            # Get superclasses
            superclasses = [str(sc.iri) for sc in cls.is_a if isinstance(sc, ThingClass) and sc.name != "Thing"]
            
            # Get subclasses
            subclasses = [str(sub.iri) for sub in cls.subclasses()]
            
            # Get individuals of this class
            individuals = [str(ind.iri) for ind in cls.instances()]
            
            classes_info.append({
                "iri": str(cls.iri),
                "name": cls.name,
                "label": cls.label[0] if cls.label else cls.name,
                "comment": cls.comment[0] if cls.comment else None,
                "superclasses": superclasses,
                "subclasses": subclasses,
                "individuals_count": len(individuals),
                "individuals": individuals[:10] # First 10 individuals for preview
            })
        
        return {
            "success": True,
            "total_classes": len(classes_info),
            "classes": classes_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting classes: {str(e)}")

@app.get("/ontology/individuals")
def get_individuals():
    """
    @brief Returns detailed information about all individuals in the loaded ontology.
    For each individual, includes its IRI, label, comment, assigned classes,
    all datatype property values, and all object property relationships.
    @return JSON with total individual count and a list of individual descriptors.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 500 if the query fails.
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        individuals_info = []
        for ind in current_ontology.individuals():
            # Get classes of the individual
            classes = [str(cls.iri) for cls in ind.is_a if isinstance(cls, ThingClass)]
            
            # Get all data properties
            data_properties = {}
            for prop in current_ontology.data_properties():
                try:
                    value = getattr(ind, prop.name, None)
                    if value is not None and value != []:
                        data_properties[str(prop.iri)] = value if isinstance(value, list) else [value]
                except:
                    pass
            
            # Get all object properties
            object_properties = {}
            for prop in current_ontology.object_properties():
                try:
                    value = getattr(ind, prop.name, None)
                    if value is not None and value != []:
                        if isinstance(value, list):
                            object_properties[str(prop.iri)] = [str(v.iri) for v in value]
                        else:
                            object_properties[str(prop.iri)] = [str(value.iri)]
                except:
                    pass
            
            individuals_info.append({
                "iri": str(ind.iri),
                "name": ind.name,
                "label": ind.label[0] if ind.label else ind.name,
                "comment": ind.comment[0] if ind.comment else None,
                "classes": classes,
                "datatype_properties": data_properties,
                "object_properties": object_properties
            })
        
        return {
            "success": True,
            "total_individuals": len(individuals_info),
            "individuals": individuals_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting individuals: {str(e)}")

@app.get("/ontology/data-properties")
def get_data_properties():
    """
    @brief Returns detailed information about all datatype properties in the loaded ontology.
    For each property, includes its IRI, label, comment, domain classes, range types,
    and whether it is declared as functional.
    @return JSON with total property count and a list of datatype property descriptors.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 500 if the query fails.
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        properties_info = []
        
        for prop in current_ontology.data_properties():
            # Get domain
            domain = []
            if hasattr(prop, 'domain'):
                domain = [str(d.iri) if hasattr(d, 'iri') else str(d) for d in prop.domain]
            
            # Get range
            range_types = []
            if hasattr(prop, 'range'):
                range_types = [str(r) for r in prop.range]
            
            properties_info.append({
                "iri": str(prop.iri),
                "name": prop.name,
                "label": prop.label[0] if prop.label else prop.name,
                "comment": prop.comment[0] if prop.comment else None,
                "domain": domain,
                "range": range_types,
                "functional": hasattr(prop, 'is_functional_for') and prop.is_functional_for
            })
        
        return {
            "success": True,
            "total_data_properties": len(properties_info),
            "data_properties": properties_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting data properties: {str(e)}")

@app.get("/ontology/object-properties")
def get_object_properties():
    """
    @brief Returns detailed information about all object properties in the loaded ontology.
    For each property, includes its IRI, label, comment, domain, range, inverse property,
    and whether it is functional, transitive, or symmetric.
    @return JSON with total property count and a list of object property descriptors.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 500 if the query fails.
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        properties_info = []
        
        for prop in current_ontology.object_properties():
            # Get domain
            domain = []
            if hasattr(prop, 'domain'):
                domain = [str(d.iri) if hasattr(d, 'iri') else str(d) for d in prop.domain]
            
            # Get range
            range_classes = []
            if hasattr(prop, 'range'):
                range_classes = [str(r.iri) if hasattr(r, 'iri') else str(r) for r in prop.range]
            
            # Get inverse property if it exists
            inverse = None
            if hasattr(prop, 'inverse_property') and prop.inverse_property:
                inverse = str(prop.inverse_property.iri)
            
            properties_info.append({
                "iri": str(prop.iri),
                "name": prop.name,
                "label": prop.label[0] if prop.label else prop.name,
                "comment": prop.comment[0] if prop.comment else None,
                "domain": domain,
                "range": range_classes,
                "inverse_property": inverse,
                "functional": hasattr(prop, 'is_functional_for') and prop.is_functional_for,
                "transitive": isinstance(prop, TransitiveProperty),
                "symmetric": isinstance(prop, SymmetricProperty)
            })
        
        return {
            "success": True,
            "total_object_properties": len(properties_info),
            "object_properties": properties_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting object properties: {str(e)}")

@app.get("/ontology/info")
def get_ontology_info():
    """
    @brief Returns a full summary of the currently loaded ontology.
    Includes the base IRI, imported ontologies, and complete lists of all
    class names, individual names, object properties, and datatype properties.
    @return JSON with the ontology IRI, imported ontologies, statistics, and name lists.
    @throws HTTPException 400 if no ontology is loaded.
    @throws HTTPException 500 if the query fails.
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        classes = list(current_ontology.classes())
        individuals = list(current_ontology.individuals())
        object_properties = list(current_ontology.object_properties())
        data_properties = list(current_ontology.data_properties())
        
        return {
            "ontology_iri": current_ontology.base_iri,
            "imported_ontologies": [str(o.base_iri) for o in current_ontology.imported_ontologies],
            "statistics": {
                "total_classes": len(classes),
                "total_individuals": len(individuals),
                "object_properties": len(object_properties),
                "data_properties": len(data_properties)
            },
            "classes": [c.name for c in classes],
            "individuals": [i.name for i in individuals],
            "object_properties": [p.name for p in object_properties],
            "data_properties": [p.name for p in data_properties]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting information: {str(e)}")

@app.get("/ontology/projects")
def list_projects():
    """
    @brief Lists all ontology project files saved in the server's projects folder.
    Scans for .owl and .ttl files, returns metadata for each, sorted by last modified date.
    @return JSON with a list of project descriptors (filename, display name, size, timestamp).
    @throws HTTPException 500 if the directory cannot be read.
    """
    try:
        if not os.path.exists(PROJECTS_DIR):
            return {"projects": []}
        
        projects = []
        for filename in os.listdir(PROJECTS_DIR):
            if filename.endswith('.owl') or filename.endswith('.ttl'):
                filepath = os.path.join(PROJECTS_DIR, filename)
                
                file_stat = os.stat(filepath)
                file_size = file_stat.st_size
                modified_time = file_stat.st_mtime
                
                # Extract name without extension
                name_without_ext = os.path.splitext(filename)[0]
                # Convert underscores to spaces and capitalize
                display_name = name_without_ext.replace('_', ' ').title()
                
                projects.append({
                    "filename": filename,
                    "display_name": display_name,
                    "size_bytes": file_size,
                    "modified_timestamp": modified_time,
                    "filepath": filepath
                })
        
        # Sort by modified time
        projects.sort(key=lambda x: x['modified_timestamp'], reverse=True)
        
        return {"projects": projects, "count": len(projects)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing projects: {str(e)}")

@app.get("/ontology/projects/{filename}")
def get_project_file(filename: str):
    """
    @brief Retrieves a specific ontology project file from the projects folder.
    Includes a path traversal security check to prevent access outside the projects directory.
    @param filename Name of the project file (e.g. my_disease.owl).
    @return The ontology file as a binary download response.
    @throws HTTPException 403 if the resolved path escapes the projects directory.
    @throws HTTPException 404 if the file does not exist.
    @throws HTTPException 500 if the file cannot be served.
    """
    try:
        filepath = os.path.join(PROJECTS_DIR, filename)
        
        # Ensure file is in projects directory
        if not os.path.abspath(filepath).startswith(os.path.abspath(PROJECTS_DIR)):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Determine media type
        media_type = "application/rdf+xml" if filename.endswith('.owl') else "text/turtle"
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type=media_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving project: {str(e)}")

@app.delete("/ontology/clear")
def clear_ontology():
    """
    @brief Clears the currently loaded ontology from memory and deletes any temporary file.
    This is useful to free up resources or to reset the state before loading a new ontology.
    @return JSON confirming the ontology has been cleared.
    @throws HTTPException 500 if an error occurs while clearing the ontology.
    """
    global current_ontology, ontology_file_path
    
    if current_ontology is None:
        return {"message": "No ontology loaded"}
    
    # Clear temporary file if it exists
    if ontology_file_path and os.path.exists(ontology_file_path):
        os.unlink(ontology_file_path)
    
    current_ontology = None
    ontology_file_path = None
    
    return {
        "success": True,
        "message": "Ontology cleared from memory"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)