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

# ========== Middleware for CORS access ==========
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # React default alternativo
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permite todos los headers
)
# ========================================================

# Variable global para almacenar la ontología cargada
current_ontology = None
ontology_file_path = None

# ============ PYDANTIC MODELS ============

class ExportFormat(str, Enum):
    owl = "owl"
    ntriples = "ntriples"
    turtle = "turtle"


class DatatypeProperty(BaseModel):
    property: str  # URI or property name
    value: Any


class ObjectProperty(BaseModel):
    property: str  # URI or property name
    value: str  # URI of the related individual


class IndividualCreate(BaseModel):
    label: str
    comment: Optional[str] = None
    selectedClasses: List[str] = []
    datatypeProperties: List[DatatypeProperty] = []
    objectProperties: List[ObjectProperty] = []


class IndividualUpdate(BaseModel):
    label: Optional[str] = None
    comment: Optional[str] = None
    selectedClasses: Optional[List[str]] = None  # If provided, replaces the classes
    datatypeProperties: Optional[List[DatatypeProperty]] = None  # If provided, replaces the properties
    objectProperties: Optional[List[ObjectProperty]] = None  # If provided, replaces the properties


# Añade esto cerca del inicio del archivo, después de las importaciones
PROJECTS_DIR = "projects"

# Asegúrate de que la carpeta projects existe
os.makedirs(PROJECTS_DIR, exist_ok=True)


# ============ ENDPOINTS ============

@app.get("/")
def root():
    """Root endpoint with API information"""
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
    Load an ontology from an OWL/RDF file
    
    Args:
        file: Ontology file (.owl, .rdf, .ttl)
    
    Returns:
        Information about the loaded ontology
    """
    global current_ontology, ontology_file_path
    
    try:
        # Validar extensión del archivo
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
        
        # VALIDACIÓN ADICIONAL: Verificar que la ontología tiene contenido válido
        # Una ontología válida debe tener al menos un namespace RDF/OWL
        if not current_ontology.base_iri:
            raise ValueError("Invalid ontology: No base IRI found")
        
        # Verificar que tiene estructura básica de ontología
        # (al menos debe poder listar clases, aunque esté vacía)
        try:
            classes = list(current_ontology.classes())
            individuals = list(current_ontology.individuals())
            properties = list(current_ontology.properties())
        except Exception as e:
            raise ValueError(f"Invalid ontology structure: {str(e)}")
        
        # Gather basic information
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
        # Limpiar el archivo temporal si hubo error
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
    Export the loaded ontology as a downloadable file
    (For use from web browser - user chooses where to save)
    
    Args:
        format: Export format (owl, ntriples, turtle)
        filename: Base file name (extension is added automatically)
    
    Returns:
        Ontology file for download
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
        
        # IMPORTANT: Map the correct format for owlready2
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
    Save the current ontology to the projects folder on the server
    
    Args:
        format: Export format (owl, turtle)
        filename: Base file name (extension is added automatically). 
                  If None, generates name with timestamp
    
    Returns:
        JSON with file path and status
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
    Export the ontology to a specific server path
    (Only works if the backend has access to the file system)
    
    Args:
        output_path: Full path where to save the file
        format: Export format (owl, ntriples, turtle)
    
    Returns:
        Export confirmation with the file path
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
        
        # IMPORTANT: Map the correct format for owlready2
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
            "message": "Ontología exportada exitosamente",
            "output_path": output_path,
            "format": format.value,
            "file_size_bytes": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting ontology: {str(e)}")






""" REVISAR NAMES INDIVIDUOS """
""" REVISAR NAMES INDIVIDUOS """
""" REVISAR NAMES INDIVIDUOS """
""" REVISAR NAMES INDIVIDUOS """
""" REVISAR NAMES INDIVIDUOS """
""" REVISAR NAMES INDIVIDUOS """
""" REVISAR NAMES INDIVIDUOS """





@app.post("/ontology/individual")
def create_individual(individual_data: IndividualCreate = Body(...)):
    """
    Create a new individual in the ontology
    
    Args:
        individual_data: Data of the individual to create
            - label: Name of the individual
            - comment: Optional comment
            - selectedClasses: List of URIs of classes to which it belongs
            - datatypeProperties: Properties with literal values
            - objectProperties: Properties with relationships to other individuals
    
    Returns:
        Confirm the creation with details of the individual
    """
    global current_ontology, ontology_file_path
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No ontology loaded. Use POST /ontology/load first"
        )
    
    try:
        with current_ontology:
            # Create the individual's IRI based on the label
            # Handle if the base_iri ends with # or /
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
        
        # AUTOMATICALLY SAVE to the loaded ontology file
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
    Updates an existing individual in the ontology
    
    Args:
        individual_iri: Full IRI of the individual (may include # or /)
        update_data: Data to update (only provided fields are updated)
            - label: New name of the individual (also changes the IRI/name)
            - comment: New comment
            - selectedClasses: New classes (replaces existing ones)
            - datatypeProperties: New datatype properties (replaces existing ones)
            - objectProperties: New object properties (replaces existing ones)
    
    Returns:
        Update confirmation with individual details
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
                
                # Restore comment (use updated if provided, else old)
                if update_data.comment is not None:
                    if update_data.comment != "":
                        new_individual.comment = [update_data.comment]
                elif old_comment:
                    new_individual.comment = [old_comment]
                
                # Restore data properties (use updated if provided, else old)
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
                # Label/name is not changed, just update properties normally
                # Update label if provided (but it is the same)
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
                    # Clear current classes (except owl:NamedIndividual and owl:Thing)
                    individual.is_a = [cls for cls in individual.is_a if not isinstance(cls, ThingClass)]
                    
                    # Add new classes
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
        
        # AUTOMATICALLY SAVE to the loaded ontology file
        if ontology_file_path:
            current_ontology.save(file=ontology_file_path, format="rdfxml")
        
        return {
            "success": True,
            "message": "Individuo actualizado correctamente",
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
        raise HTTPException(status_code=500, detail=f"Error al actualizar individuo: {str(e)}")


@app.get("/ontology/classes")
def get_classes():
    """
    Obtains detailed information about all classes in the ontology
    
    Returns:
        List of classes with all their information
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
            # Get superclasses (excluding owl:Thing)
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
                "individuals": individuals[:10]  # First 10 to avoid overload
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
    Obtains detailed information about all individuals in the ontology
    
    Returns:
        List of individuals with all their information
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
        raise HTTPException(status_code=500, detail=f"Error al obtener individuos: {str(e)}")


@app.get("/ontology/data-properties")
def get_data_properties():
    """
    Obtains detailed information about all data properties in the ontology
    
    Returns:
        List of data properties with all their information
    """
    global current_ontology
    
    if current_ontology is None:
        raise HTTPException(
            status_code=400, 
            detail="No hay ontología cargada. Usa POST /ontology/load primero"
        )
    
    try:
        properties_info = []
        
        for prop in current_ontology.data_properties():
            # Get domain (classes that can have this property)
            domain = []
            if hasattr(prop, 'domain'):
                domain = [str(d.iri) if hasattr(d, 'iri') else str(d) for d in prop.domain]
            
            # Get range (data type)
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
    Obtains detailed information about all object properties in the ontology
    
    Returns:
        List of object properties with all their information
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
            # Get domain (classes that can have this property)
            domain = []
            if hasattr(prop, 'domain'):
                domain = [str(d.iri) if hasattr(d, 'iri') else str(d) for d in prop.domain]
            
            # Get range (classes that can be the value)
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
    Obtains detailed information about the loaded ontology
    
    Returns:
        Complete information about the ontology
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
    List all saved ontology projects in the projects folder
    
    Returns:
        List of project files with metadata
    """
    try:
        if not os.path.exists(PROJECTS_DIR):
            return {"projects": []}
        
        projects = []
        for filename in os.listdir(PROJECTS_DIR):
            if filename.endswith('.owl') or filename.endswith('.ttl'):
                filepath = os.path.join(PROJECTS_DIR, filename)
                
                # Get file metadata
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
        
        # Sort by modified time (newest first)
        projects.sort(key=lambda x: x['modified_timestamp'], reverse=True)
        
        return {"projects": projects, "count": len(projects)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing projects: {str(e)}")

@app.get("/ontology/projects/{filename}")
def get_project_file(filename: str):
    """
    Retrieve a specific project file
    
    Args:
        filename: Name of the project file
    
    Returns:
        The ontology file
    """
    try:
        filepath = os.path.join(PROJECTS_DIR, filename)
        
        # Security check: ensure file is in projects directory
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
    Clears the loaded ontology from memory
    
    Returns:
        Confirmation of clearing
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