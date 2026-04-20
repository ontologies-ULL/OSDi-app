# OSDi App

**OSDi App** es un editor web diseñado para construir y gestionar modelos de enfermedad basados en la ontología **[OSDi (Ontology for the Simulation of Diseases)](https://github.com/ontologies-ULL/OSDi)**.

La aplicación permite a **investigadores y economistas de la salud** definir enfermedades, su progresión clínica, parámetros poblacionales e intervenciones sanitarias mediante una interfaz estructurada, **sin necesidad de escribir código OWL o RDF manualmente**.

El resultado es un archivo `.owl` compatible con la ontología OSDi que puede integrarse directamente en modelos de simulación para **evaluaciones económicas en salud**.

---

# Propósito de la aplicación

La manipulación de ontologías OWL requiere conocimientos avanzados de **RDF, OWL y modelado semántico**, además de herramientas especializadas como **Protégé**.

Este proceso puede resultar complejo y poco accesible para investigadores que no trabajan habitualmente con tecnologías semánticas.

**OSDi App reduce esta barrera** proporcionando:

- Una interfaz basada en **formularios guiados**
- Generación automática de **individuos OWL válidos**
- Validación estructural según la ontología OSDi

De esta forma, los usuarios pueden centrarse en **definir el modelo de enfermedad**, mientras la aplicación gestiona la representación ontológica.

---

# Funcionalidades principales

### Definición de enfermedad
- Nombre de la enfermedad
- Clasificación (crónica, aguda, rara, hereditaria)
- Referencias bibliográficas

### Progresión clínica
- Definición de **manifestaciones clínicas** (agudas o crónicas)
- Reglas de combinación entre manifestaciones:
  - coexistentes
  - alternativas
  - secuenciales
- Modelado de **desarrollos clínicos**

### Etapas de la enfermedad
- Definición de **etapas jerárquicas**
- Subprogresiones dentro de cada etapa

### Población
Configuración de parámetros epidemiológicos:

- prevalencia
- incidencia
- mortalidad
- esperanza de vida

Los parámetros pueden definirse como:

- valores **determinísticos**
- distribuciones **estocásticas**

### Intervenciones sanitarias
Modelado de intervenciones incluyendo:

- costes
- utilidades
- sensibilidad y especificidad (para intervenciones de cribado o diagnóstico)
- efectos modificadores siguiendo el patrón **`ModifierParameter`** de OSDi

### Visualización del modelo
- Representación de la ontología como **grafo interactivo**
- Navegación entre entidades del modelo

---

# Stack tecnológico

| Capa | Tecnología |
|-----|------------|
| Frontend | React 18 |
| Bundler | Vite |
| Estilos | TailwindCSS |
| Backend | FastAPI |
| Lenguaje | Python |
| Ontologías | rdflib / owlready2 |
| Testing | pytest |

---

# Cómo ejecutar el proyecto

## Requisitos previos

- **Node.js ≥ 18** — [Descargar](https://nodejs.org/)
- **Python ≥ 3.10** — [Descargar](https://www.python.org/downloads/)
- **pip** (incluido con Python)

---

## Instalación de dependencias

### Backend

Las dependencias del backend son:

| Paquete | Versión mínima | Descripción |
|---------|---------------|-------------|
| `fastapi` | ≥ 0.104.0 | Framework web para la API |
| `uvicorn` | — | Servidor ASGI para ejecutar FastAPI |
| `owlready2` | ≥ 0.45 | Manipulación de ontologías OWL |
| `rdflib` | ≥ 6.0 | Serialización y parsing de grafos RDF/OWL |
| `pydantic` | — | Validación de datos (instalado junto con FastAPI) |

Para instalarlas:

```bash
pip install fastapi uvicorn owlready2
```

> **Opcional — dependencias de testing:**
> ```bash
> pip install pytest pytest-cov httpx
> ```

### Frontend

```bash
cd frontend
npm install
```

Esto instalará automáticamente todas las dependencias definidas en `package.json`, incluyendo React, Vite, TailwindCSS y React Router.

---

## Ejecución del proyecto

### Backend

```bash
cd backend/api/src
python ./main.py
```

El servidor arrancará en **http://localhost:8000**.
La documentación interactiva de la API estará disponible en **http://localhost:8000/docs**.

### Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en **http://localhost:5173**.

> Asegúrate de tener el backend corriendo antes de usar el frontend, ya que la aplicación se conecta a `http://localhost:8000`.

---

## Tests

```bash
cd backend
python -m pytest test_main.py -v
```