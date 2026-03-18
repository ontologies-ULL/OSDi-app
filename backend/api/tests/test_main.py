import pytest
from fastapi.testclient import TestClient
from io import BytesIO
import os
import tempfile

# Import the application from the src package
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from src.main import app

client = TestClient(app)

@pytest.fixture
def sample_owl_content():
    """
    @brief Provides a minimal valid OWL ontology as bytes for use in tests.
    @return Raw bytes of an OWL/RDF-XML document with classes, properties, and individuals.
    """
    return b'''<?xml version="1.0"?>
<rdf:RDF xmlns="http://test.org/ontology#"
     xml:base="http://test.org/ontology"
     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
     xmlns:owl="http://www.w3.org/2002/07/owl#"
     xmlns:xml="http://www.w3.org/XML/1998/namespace"
     xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
     xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
    <owl:Ontology rdf:about="http://test.org/ontology"/>

    <owl:Class rdf:about="http://test.org/ontology#Person">
        <rdfs:label>Person</rdfs:label>
        <rdfs:comment>A human being</rdfs:comment>
    </owl:Class>

    <owl:Class rdf:about="http://test.org/ontology#Student">
        <rdfs:subClassOf rdf:resource="http://test.org/ontology#Person"/>
        <rdfs:label>Student</rdfs:label>
        <rdfs:comment>A person who studies</rdfs:comment>
    </owl:Class>

    <owl:Class rdf:about="http://test.org/ontology#Teacher">
        <rdfs:subClassOf rdf:resource="http://test.org/ontology#Person"/>
        <rdfs:label>Teacher</rdfs:label>
    </owl:Class>

    <owl:DatatypeProperty rdf:about="http://test.org/ontology#hasAge">
        <rdfs:domain rdf:resource="http://test.org/ontology#Person"/>
        <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#integer"/>
        <rdfs:label>hasAge</rdfs:label>
    </owl:DatatypeProperty>

    <owl:DatatypeProperty rdf:about="http://test.org/ontology#hasName">
        <rdfs:domain rdf:resource="http://test.org/ontology#Person"/>
        <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#string"/>
        <rdfs:label>hasName</rdfs:label>
    </owl:DatatypeProperty>

    <owl:DatatypeProperty rdf:about="http://test.org/ontology#hasEmail">
        <rdfs:domain rdf:resource="http://test.org/ontology#Person"/>
        <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#string"/>
    </owl:DatatypeProperty>

    <owl:ObjectProperty rdf:about="http://test.org/ontology#knows">
        <rdfs:domain rdf:resource="http://test.org/ontology#Person"/>
        <rdfs:range rdf:resource="http://test.org/ontology#Person"/>
        <rdfs:label>knows</rdfs:label>
    </owl:ObjectProperty>

    <owl:ObjectProperty rdf:about="http://test.org/ontology#teaches">
        <rdfs:domain rdf:resource="http://test.org/ontology#Teacher"/>
        <rdfs:range rdf:resource="http://test.org/ontology#Student"/>
    </owl:ObjectProperty>

    <owl:NamedIndividual rdf:about="http://test.org/ontology#John">
        <rdf:type rdf:resource="http://test.org/ontology#Person"/>
        <hasName>John Doe</hasName>
        <hasAge rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">30</hasAge>
        <rdfs:label>John</rdfs:label>
        <rdfs:comment>A sample person</rdfs:comment>
    </owl:NamedIndividual>

    <owl:NamedIndividual rdf:about="http://test.org/ontology#Jane">
        <rdf:type rdf:resource="http://test.org/ontology#Student"/>
        <hasName>Jane Smith</hasName>
        <hasAge rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">22</hasAge>
        <rdfs:label>Jane</rdfs:label>
    </owl:NamedIndividual>
</rdf:RDF>'''

@pytest.fixture
def sample_owl_file(sample_owl_content):
    """
    @brief Writes the sample OWL content to a temporary file on disk.
    Cleans up the file automatically after the test finishes.
    @param sample_owl_content Bytes fixture with the OWL document content.
    @return Path to the temporary .owl file.
    """
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.owl', delete=False) as f:
        f.write(sample_owl_content)
        temp_path = f.name

    yield temp_path

    # Remove the temporary file after the test
    if os.path.exists(temp_path):
        try:
            os.unlink(temp_path)
        except:
            pass

@pytest.fixture
def loaded_ontology(sample_owl_file):
    """
    @brief Loads the sample ontology into the API before each test that requires it.
    Clears any previously loaded ontology first, and clears again after the test.
    @param sample_owl_file Path fixture pointing to the temporary .owl file.
    @return JSON response body from the POST /ontology/load call.
    """
    # Clear any previously loaded ontology
    client.delete("/ontology/clear")

    # Load the test ontology
    with open(sample_owl_file, 'rb') as f:
        files = {'file': ('test_ontology.owl', f, 'application/rdf+xml')}
        response = client.post("/ontology/load", files=files)

    assert response.status_code == 200

    yield response.json()

    # Clear the ontology after the test
    client.delete("/ontology/clear")

def test_root_endpoint():
    """
    @brief Verifies that the root endpoint returns API metadata and the endpoint index.
    """
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert "message" in data
    assert data["message"] == "Ontology Management API"
    assert "version" in data
    assert data["version"] == "1.0.0"
    assert "endpoints" in data
    assert isinstance(data["endpoints"], dict)
    assert len(data["endpoints"]) > 0

# ============ TEST LOAD ONTOLOGY ============

def test_load_ontology_success(sample_owl_file):
    """
    @brief Verifies that a valid .owl file is loaded successfully with correct statistics.
    """
    # Clear any previously loaded ontology
    client.delete("/ontology/clear")

    with open(sample_owl_file, 'rb') as f:
        files = {'file': ('test.owl', f, 'application/rdf+xml')}
        response = client.post("/ontology/load", files=files)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "message" in data
    assert "Ontology loaded successfully" in data["message"]
    assert "ontology_iri" in data
    assert "statistics" in data
    assert data["statistics"]["classes"] >= 3  # Person, Student, Teacher
    assert data["statistics"]["individuals"] >= 2  # John, Jane
    assert data["statistics"]["properties"] >= 5

    # Cleanup
    client.delete("/ontology/clear")

def test_load_ontology_no_file():
    """
    @brief Verifies that a request without a file returns a 422 validation error.
    """
    response = client.post("/ontology/load")
    assert response.status_code == 422  # FastAPI validation error

def test_load_ontology_invalid_extension():
    """
    @brief Verifies that uploading a file with an unsupported extension returns an error.
    """
    content = b"invalid content"
    files = {'file': ('test.txt', BytesIO(content), 'text/plain')}
    response = client.post("/ontology/load", files=files)

    assert response.status_code == 500
    assert "not supported" in response.json()["detail"].lower()

def test_load_ontology_invalid_owl_content():
    """
    @brief Verifies behaviour when uploading a .owl file with non-OWL XML content.
    owlready2 is permissive and may load basic XML without raising an error,
    so this test accepts both 200 (empty ontology) and 500 (parse error).
    """
    # owlready2 may parse basic XML without raising an error,
    # resulting in an empty but technically loaded ontology
    invalid_content = b"<?xml version='1.0'?><invalid>This is not a valid OWL file</invalid>"
    files = {'file': ('test.owl', BytesIO(invalid_content), 'application/rdf+xml')}
    response = client.post("/ontology/load", files=files)

    assert response.status_code in [200, 500]

    if response.status_code == 200:
        data = response.json()
        assert "statistics" in data

def test_load_ontology_replaces_previous(sample_owl_file):
    """
    @brief Verifies that loading a new ontology replaces the previously loaded one.
    """
    # Load first ontology
    with open(sample_owl_file, 'rb') as f:
        files = {'file': ('test1.owl', f, 'application/rdf+xml')}
        response1 = client.post("/ontology/load", files=files)

    assert response1.status_code == 200

    # Load second ontology
    with open(sample_owl_file, 'rb') as f:
        files = {'file': ('test2.owl', f, 'application/rdf+xml')}
        response2 = client.post("/ontology/load", files=files)

    assert response2.status_code == 200

    # Cleanup
    client.delete("/ontology/clear")

# ============ TEST EXPORT ONTOLOGY ============

def test_export_ontology_no_ontology_loaded():
    """
    @brief Verifies that exporting without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")
    response = client.get("/ontology/export")

    assert response.status_code == 400
    assert "no ontology loaded" in response.json()["detail"].lower()

def test_export_ontology_owl_format(loaded_ontology):
    """
    @brief Verifies that the ontology is exported correctly in OWL/RDF-XML format.
    """
    response = client.get("/ontology/export?format=owl&filename=test_export")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/rdf+xml"
    assert "test_export.owl" in response.headers["content-disposition"]
    assert len(response.content) > 0

    # Verify the response contains valid XML
    assert b'<?xml' in response.content or b'<rdf:RDF' in response.content

def test_export_ontology_default_filename(loaded_ontology):
    """
    @brief Verifies that the default filename is used when none is specified.
    """
    response = client.get("/ontology/export")

    assert response.status_code == 200
    assert "ontology_export.owl" in response.headers["content-disposition"]

def test_export_ontology_custom_filename(loaded_ontology):
    """
    @brief Verifies that a custom filename is correctly applied to the exported file.
    """
    response = client.get("/ontology/export?filename=my_custom_name")

    assert response.status_code == 200
    assert "my_custom_name.owl" in response.headers["content-disposition"]

def test_export_to_path_success(loaded_ontology, tmp_path):
    """
    @brief Verifies that the ontology is saved to a specific server path successfully.
    """
    output_path = str(tmp_path / "export_test.owl")
    response = client.post(f"/ontology/export-to-path?output_path={output_path}&format=owl")

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["output_path"] == output_path
    assert data["format"] == "owl"
    assert "file_size_bytes" in data
    assert data["file_size_bytes"] > 0

    # Verify the file was actually written to disk
    assert os.path.exists(output_path)
    assert os.path.getsize(output_path) > 0

def test_export_to_path_no_ontology():
    """
    @brief Verifies that exporting to a path without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")
    response = client.post("/ontology/export-to-path?output_path=/tmp/test.owl")

    assert response.status_code == 400
    assert "no ontology loaded" in response.json()["detail"].lower()

def test_export_to_path_invalid_directory(loaded_ontology):
    """
    @brief Verifies that exporting to a non-existent directory returns 400.
    """
    response = client.post("/ontology/export-to-path?output_path=/nonexistent/directory/test.owl")

    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"].lower()

# ============ TEST GET ONTOLOGY INFO ============

def test_get_ontology_info_no_ontology():
    """
    @brief Verifies that requesting ontology info without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")
    response = client.get("/ontology/info")

    assert response.status_code == 400
    assert "no ontology loaded" in response.json()["detail"].lower()

def test_get_ontology_info_success(loaded_ontology):
    """
    @brief Verifies that the ontology info endpoint returns all expected fields and statistics.
    """
    response = client.get("/ontology/info")

    assert response.status_code == 200
    data = response.json()

    assert "ontology_iri" in data
    assert "statistics" in data
    assert "classes" in data
    assert "individuals" in data
    assert "object_properties" in data
    assert "data_properties" in data

    # Verify statistics match expected minimum counts
    stats = data["statistics"]
    assert stats["total_classes"] >= 3
    assert stats["total_individuals"] >= 2
    assert stats["object_properties"] >= 2
    assert stats["data_properties"] >= 3

    # Verify list fields are properly typed and non-empty
    assert isinstance(data["classes"], list)
    assert isinstance(data["individuals"], list)
    assert len(data["classes"]) > 0
    assert len(data["individuals"]) > 0

def test_get_classes_no_ontology():
    """
    @brief Verifies that requesting classes without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")
    response = client.get("/ontology/classes")

    assert response.status_code == 400

def test_get_classes_success(loaded_ontology):
    """
    @brief Verifies that all classes are returned with the correct structure.
    """
    response = client.get("/ontology/classes")

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "total_classes" in data
    assert "classes" in data
    assert data["total_classes"] >= 3
    assert len(data["classes"]) >= 3

    # Verify the structure of each class descriptor
    for cls in data["classes"]:
        assert "iri" in cls
        assert "name" in cls
        assert "label" in cls
        assert "comment" in cls or cls["comment"] is None
        assert "superclasses" in cls
        assert "subclasses" in cls
        assert "individuals_count" in cls
        assert "individuals" in cls

        assert isinstance(cls["superclasses"], list)
        assert isinstance(cls["subclasses"], list)
        assert isinstance(cls["individuals"], list)

    # Verify the expected classes are present
    class_names = [cls["name"] for cls in data["classes"]]
    assert "Person" in class_names
    assert "Student" in class_names
    assert "Teacher" in class_names

def test_get_classes_hierarchy(loaded_ontology):
    """
    @brief Verifies that the class hierarchy is correctly reflected in the response.
    Student must declare Person as a superclass.
    """
    response = client.get("/ontology/classes")
    data = response.json()

    # Find the Student class
    student_class = next((cls for cls in data["classes"] if cls["name"] == "Student"), None)
    assert student_class is not None

    # Student must have Person as a superclass
    assert len(student_class["superclasses"]) > 0
    assert any("Person" in sc for sc in student_class["superclasses"])

def test_get_individuals_no_ontology():
    """
    @brief Verifies that requesting individuals without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")
    response = client.get("/ontology/individuals")

    assert response.status_code == 400

def test_get_individuals_success(loaded_ontology):
    """
    @brief Verifies that all individuals are returned with the correct structure.
    """
    response = client.get("/ontology/individuals")

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "total_individuals" in data
    assert "individuals" in data
    assert data["total_individuals"] >= 2

    # Verify the structure of each individual descriptor
    for ind in data["individuals"]:
        assert "iri" in ind
        assert "name" in ind
        assert "label" in ind
        assert "classes" in ind
        assert "datatype_properties" in ind
        assert "object_properties" in ind

        assert isinstance(ind["classes"], list)
        assert isinstance(ind["datatype_properties"], dict)
        assert isinstance(ind["object_properties"], dict)

    # Verify the expected individuals are present
    individual_names = [ind["name"] for ind in data["individuals"]]
    assert "John" in individual_names
    assert "Jane" in individual_names

def test_get_individuals_properties(loaded_ontology):
    """
    @brief Verifies that the individual John has the expected datatype properties.
    """
    response = client.get("/ontology/individuals")
    data = response.json()

    # Find John
    john = next((ind for ind in data["individuals"] if ind["name"] == "John"), None)
    assert john is not None

    # John must have at least one datatype property
    assert len(john["datatype_properties"]) > 0

    # Verify that hasName or hasAge is present
    has_name = any("hasName" in prop for prop in john["datatype_properties"].keys())
    has_age = any("hasAge" in prop for prop in john["datatype_properties"].keys())
    assert has_name or has_age

def test_get_data_properties_no_ontology():
    """
    @brief Verifies that requesting data properties without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")
    response = client.get("/ontology/data-properties")

    assert response.status_code == 400

def test_get_data_properties_success(loaded_ontology):
    """
    @brief Verifies that all datatype properties are returned with the correct structure.
    """
    response = client.get("/ontology/data-properties")

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "total_data_properties" in data
    assert "data_properties" in data
    assert data["total_data_properties"] >= 3

    # Verify the structure of each property descriptor
    for prop in data["data_properties"]:
        assert "iri" in prop
        assert "name" in prop
        assert "label" in prop
        assert "domain" in prop
        assert "range" in prop
        assert "functional" in prop

        assert isinstance(prop["domain"], list)
        assert isinstance(prop["range"], list)

    # Verify the expected properties are present
    prop_names = [prop["name"] for prop in data["data_properties"]]
    assert "hasAge" in prop_names
    assert "hasName" in prop_names
    assert "hasEmail" in prop_names

def test_get_object_properties_no_ontology():
    """
    @brief Verifies that requesting object properties without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")
    response = client.get("/ontology/object-properties")

    assert response.status_code == 400


def test_get_object_properties_success(loaded_ontology):
    """
    @brief Verifies that all object properties are returned with the correct structure.
    """
    response = client.get("/ontology/object-properties")

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "total_object_properties" in data
    assert "object_properties" in data
    assert data["total_object_properties"] >= 2

    # Verify the structure of each property descriptor
    for prop in data["object_properties"]:
        assert "iri" in prop
        assert "name" in prop
        assert "label" in prop
        assert "domain" in prop
        assert "range" in prop
        assert "inverse_property" in prop or prop["inverse_property"] is None
        assert "functional" in prop
        assert "transitive" in prop
        assert "symmetric" in prop

    # Verify the expected properties are present
    prop_names = [prop["name"] for prop in data["object_properties"]]
    assert "knows" in prop_names
    assert "teaches" in prop_names

# ============ TEST CREATE INDIVIDUAL ============

def test_create_individual_no_ontology():
    """
    @brief Verifies that creating an individual without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")

    individual_data = {
        "label": "TestPerson",
        "comment": "A test person",
        "selectedClasses": [],
        "datatypeProperties": [],
        "objectProperties": []
    }

    response = client.post("/ontology/individual", json=individual_data)
    assert response.status_code == 400

def test_create_individual_minimal(loaded_ontology):
    """
    @brief Verifies that an individual can be created with only a label (no classes or properties).
    """
    individual_data = {
        "label": "MinimalPerson",
        "selectedClasses": []
    }

    response = client.post("/ontology/individual", json=individual_data)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["individual"]["label"] == "MinimalPerson"
    assert "iri" in data["individual"]

def test_create_individual_with_class(loaded_ontology):
    """
    @brief Verifies that an individual is correctly assigned to a given class.
    """
    individual_data = {
        "label": "Alice",
        "comment": "A student",
        "selectedClasses": ["http://test.org/ontology#Student"],
        "datatypeProperties": [],
        "objectProperties": []
    }

    response = client.post("/ontology/individual", json=individual_data)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["individual"]["label"] == "Alice"
    assert len(data["individual"]["classes"]) > 0
    assert any("Student" in cls for cls in data["individual"]["classes"])

def test_create_individual_with_datatype_properties(loaded_ontology):
    """
    @brief Verifies that datatype properties are correctly assigned when creating an individual.
    """
    individual_data = {
        "label": "Bob",
        "comment": "Another person",
        "selectedClasses": ["http://test.org/ontology#Person"],
        "datatypeProperties": [
            {"property": "http://test.org/ontology#hasName", "value": "Bob Smith"},
            {"property": "http://test.org/ontology#hasAge", "value": 25}
        ],
        "objectProperties": []
    }

    response = client.post("/ontology/individual", json=individual_data)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["individual"]["properties_added"]["datatype"] == 2

def test_create_individual_with_object_properties(loaded_ontology):
    """
    @brief Verifies that object properties correctly link two individuals.
    Creates two individuals and links them via the 'knows' property.
    """
    # Create the first individual
    individual1 = {
        "label": "Person1",
        "selectedClasses": ["http://test.org/ontology#Person"]
    }
    response1 = client.post("/ontology/individual", json=individual1)
    assert response1.status_code == 200

    # Create the second individual with a relationship to the first
    individual2 = {
        "label": "Person2",
        "selectedClasses": ["http://test.org/ontology#Person"],
        "objectProperties": [
            {"property": "http://test.org/ontology#knows", "value": "Person1"}
        ]
    }
    response2 = client.post("/ontology/individual", json=individual2)

    assert response2.status_code == 200
    data = response2.json()
    assert data["individual"]["properties_added"]["object"] == 1

def test_create_individual_with_multiple_classes(loaded_ontology):
    """
    @brief Verifies that an individual can be assigned to multiple classes simultaneously.
    """
    individual_data = {
        "label": "MultiClassPerson",
        "selectedClasses": [
            "http://test.org/ontology#Person",
            "http://test.org/ontology#Student"
        ]
    }

    response = client.post("/ontology/individual", json=individual_data)

    assert response.status_code == 200
    data = response.json()
    assert len(data["individual"]["classes"]) >= 2

def test_create_individual_class_not_found(loaded_ontology):
    """
    @brief Verifies that referencing a non-existent class returns 404.
    """
    individual_data = {
        "label": "TestPerson",
        "selectedClasses": ["http://test.org/ontology#NonExistentClass"]
    }

    response = client.post("/ontology/individual", json=individual_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_create_individual_persists(loaded_ontology):
    """
    @brief Verifies that a created individual is retrievable via GET /ontology/individuals.
    """
    individual_data = {
        "label": "PersistentPerson",
        "selectedClasses": ["http://test.org/ontology#Person"]
    }

    # Create the individual
    response = client.post("/ontology/individual", json=individual_data)
    assert response.status_code == 200

    # Verify it appears in the individuals list
    response = client.get("/ontology/individuals")
    data = response.json()

    individual_names = [ind["name"] for ind in data["individuals"]]
    assert "PersistentPerson" in individual_names

# ============ TEST UPDATE INDIVIDUAL ============

def test_update_individual_no_ontology():
    """
    @brief Verifies that updating an individual without a loaded ontology returns 400.
    """
    client.delete("/ontology/clear")

    update_data = {"label": "NewLabel"}
    response = client.put("/ontology/individual/John", json=update_data)

    assert response.status_code == 400

def test_update_individual_not_found(loaded_ontology):
    """
    @brief Verifies that updating a non-existent individual returns 404.
    """
    update_data = {"label": "NewLabel"}
    response = client.put("/ontology/individual/NonExistentPerson", json=update_data)

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_update_individual_comment(loaded_ontology):
    """
    @brief Verifies that the comment of an existing individual can be updated.
    """
    update_data = {
        "comment": "Updated comment for John"
    }

    response = client.put("/ontology/individual/John", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["individual"]["comment"] == "Updated comment for John"

def test_update_individual_label_same(loaded_ontology):
    """
    @brief Verifies that updating an individual with the same label only changes other fields.
    """
    update_data = {
        "label": "John",
        "comment": "Same name, new comment"
    }

    response = client.put("/ontology/individual/John", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["individual"]["name"] == "John"
    assert data["individual"]["comment"] == "Same name, new comment"

def test_update_individual_label_change(loaded_ontology):
    """
    @brief Verifies that changing the label renames the individual and invalidates the old IRI.
    """
    update_data = {
        "label": "JohnRenamed"
    }

    response = client.put("/ontology/individual/John", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["individual"]["name"] == "JohnRenamed"

    # Verify that the old name no longer exists
    response2 = client.put("/ontology/individual/John", json={"comment": "test"})
    assert response2.status_code == 404

def test_update_individual_classes(loaded_ontology):
    """
    @brief Verifies that the class assignments of an individual can be replaced.
    """
    update_data = {
        "selectedClasses": ["http://test.org/ontology#Student"]
    }

    response = client.put("/ontology/individual/John", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert any("Student" in cls for cls in data["individual"]["classes"])

def test_update_individual_datatype_properties(loaded_ontology):
    """
    @brief Verifies that datatype properties of an individual can be replaced.
    """
    update_data = {
        "datatypeProperties": [
            {"property": "http://test.org/ontology#hasName", "value": "John Updated"},
            {"property": "http://test.org/ontology#hasAge", "value": 31}
        ]
    }

    response = client.put("/ontology/individual/John", json=update_data)

    assert response.status_code == 200

    # Verify the properties were updated
    response = client.get("/ontology/individuals")
    data = response.json()
    john = next((ind for ind in data["individuals"] if ind["name"] == "John"), None)
    assert john is not None
    assert len(john["datatype_properties"]) >= 2

def test_update_individual_clear_comment(loaded_ontology):
    """
    @brief Verifies that passing an empty string as comment removes the existing comment.
    """
    update_data = {"comment": ""}
    response = client.put("/ontology/individual/John", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["individual"]["comment"] is None or data["individual"]["comment"] == ""

def test_update_individual_with_object_properties(loaded_ontology):
    """
    @brief Verifies that object properties of an individual can be replaced with new relations.
    """
    # Create a second individual to relate to
    client.post("/ontology/individual", json={
        "label": "RelatedPerson",
        "selectedClasses": ["http://test.org/ontology#Person"]
    })

    # Update John to know RelatedPerson
    update_data = {
        "objectProperties": [
            {"property": "http://test.org/ontology#knows", "value": "RelatedPerson"}
        ]
    }

    response = client.put("/ontology/individual/John", json=update_data)
    assert response.status_code == 200

def test_update_individual_partial_update(loaded_ontology):
    """
    @brief Verifies that a partial update only modifies the provided fields.
    The individual's name must remain unchanged when only the comment is updated.
    """
    # Update only the comment without touching other properties
    update_data = {"comment": "Only comment updated"}
    response = client.put("/ontology/individual/John", json=update_data)

    assert response.status_code == 200
    data = response.json()

    # Name must remain unchanged
    assert data["individual"]["name"] == "John"
    assert data["individual"]["comment"] == "Only comment updated"

# ============ TEST CLEAR ONTOLOGY ============

def test_clear_ontology_when_loaded(loaded_ontology):
    """
    @brief Verifies that clearing a loaded ontology succeeds and makes it unavailable.
    """
    response = client.delete("/ontology/clear")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "cleared" in data["message"].lower()

    # Verify that the ontology is no longer accessible
    response = client.get("/ontology/info")
    assert response.status_code == 400

def test_clear_ontology_when_none():
    """
    @brief Verifies that clearing when no ontology is loaded returns a 200 with an informative message.
    """
    client.delete("/ontology/clear")  # Ensure no ontology is loaded
    response = client.delete("/ontology/clear")

    assert response.status_code == 200
    data = response.json()
    assert "no ontology" in data["message"].lower()

def test_clear_ontology_allows_reload(sample_owl_file):
    """
    @brief Verifies that a new ontology can be loaded after clearing.
    """
    # Load
    with open(sample_owl_file, 'rb') as f:
        files = {'file': ('test1.owl', f, 'application/rdf+xml')}
        client.post("/ontology/load", files=files)

    # Clear
    response = client.delete("/ontology/clear")
    assert response.status_code == 200

    # Reload
    with open(sample_owl_file, 'rb') as f:
        files = {'file': ('test2.owl', f, 'application/rdf+xml')}
        response = client.post("/ontology/load", files=files)

    assert response.status_code == 200

    # Final cleanup
    client.delete("/ontology/clear")

# ============ TEST INTEGRATION WORKFLOWS ============

def test_full_crud_workflow(sample_owl_file, tmp_path):
    """
    @brief End-to-end test covering the full CRUD lifecycle:
    load → inspect → create → verify → update → export to path → export as download → clear.
    """
    # 1. Clear
    client.delete("/ontology/clear")

    # 2. Load ontology
    with open(sample_owl_file, 'rb') as f:
        files = {'file': ('test.owl', f, 'application/rdf+xml')}
        response = client.post("/ontology/load", files=files)
    assert response.status_code == 200

    # 3. Get current statistics
    response = client.get("/ontology/info")
    assert response.status_code == 200
    initial_count = response.json()["statistics"]["total_individuals"]

    # 4. Create a new individual
    individual_data = {
        "label": "WorkflowPerson",
        "comment": "Created during workflow test",
        "selectedClasses": ["http://test.org/ontology#Person"],
        "datatypeProperties": [
            {"property": "http://test.org/ontology#hasName", "value": "Workflow Test"},
            {"property": "http://test.org/ontology#hasAge", "value": 35}
        ]
    }
    response = client.post("/ontology/individual", json=individual_data)
    assert response.status_code == 200

    # 5. Verify it was created
    response = client.get("/ontology/individuals")
    data = response.json()
    assert data["total_individuals"] == initial_count + 1
    assert any(ind["name"] == "WorkflowPerson" for ind in data["individuals"])

    # 6. Update the individual
    update_data = {
        "comment": "Updated during workflow test",
        "datatypeProperties": [
            {"property": "http://test.org/ontology#hasAge", "value": 36}
        ]
    }
    response = client.put("/ontology/individual/WorkflowPerson", json=update_data)
    assert response.status_code == 200

    # 7. Export to a file path
    output_path = str(tmp_path / "workflow_export.owl")
    response = client.post(f"/ontology/export-to-path?output_path={output_path}")
    assert response.status_code == 200
    assert os.path.exists(output_path)

    # 8. Export as a browser download
    response = client.get("/ontology/export?format=owl&filename=workflow")
    assert response.status_code == 200
    assert len(response.content) > 0

    # 9. Clear
    response = client.delete("/ontology/clear")
    assert response.status_code == 200

def test_multiple_individuals_creation(loaded_ontology):
    """
    @brief Verifies that multiple individuals can be created in sequence and all persist.
    """
    individuals = [
        {"label": "Person_A", "selectedClasses": ["http://test.org/ontology#Person"]},
        {"label": "Person_B", "selectedClasses": ["http://test.org/ontology#Student"]},
        {"label": "Person_C", "selectedClasses": ["http://test.org/ontology#Teacher"]},
    ]

    for ind_data in individuals:
        response = client.post("/ontology/individual", json=ind_data)
        assert response.status_code == 200

    # Verify all were created
    response = client.get("/ontology/individuals")
    data = response.json()

    created_names = [ind["name"] for ind in data["individuals"]]
    assert "Person_A" in created_names
    assert "Person_B" in created_names
    assert "Person_C" in created_names

def test_relationship_between_individuals(loaded_ontology):
    """
    @brief Verifies that an object property relationship between two individuals is correctly stored.
    Creates a Teacher and a Student, then links them via the 'knows' property.
    """
    # Create the Teacher individual
    teacher_data = {
        "label": "MrSmith",
        "selectedClasses": ["http://test.org/ontology#Teacher"]
    }
    client.post("/ontology/individual", json=teacher_data)

    # Create the Student individual with a relationship to the Teacher
    student_data = {
        "label": "StudentAlice",
        "selectedClasses": ["http://test.org/ontology#Student"],
        "objectProperties": [
            {"property": "http://test.org/ontology#knows", "value": "MrSmith"}
        ]
    }
    response = client.post("/ontology/individual", json=student_data)
    assert response.status_code == 200

    # Verify the relationship is stored
    response = client.get("/ontology/individuals")
    data = response.json()

    alice = next((ind for ind in data["individuals"] if ind["name"] == "StudentAlice"), None)
    assert alice is not None
    assert len(alice["object_properties"]) > 0

@pytest.fixture(autouse=True)
def cleanup_after_each_test():
    """
    @brief Auto-use fixture that clears the loaded ontology after every test.
    Prevents state leakage between tests.
    """
    yield
    # Clear the ontology after the test completes
    try:
        client.delete("/ontology/clear")
    except:
        pass

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
