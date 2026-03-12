# OSDi App

Editor web para construir y gestionar modelos de enfermedad basados en la **ontología OSDi** (Ontology for the Simulation of Diseases). Permite a investigadores y economistas de la salud definir enfermedades, su progresión clínica, parámetros poblacionales e intervenciones sanitarias de forma estructurada y conforme a la ontología, sin necesidad de escribir OWL directamente.

---

## Qué problema resuelve

Construir ontologías OWL manualmente requiere conocimientos técnicos profundos de sintaxis RDF/OWL y herramientas especializadas como Protégé. OSDi App elimina esa barrera ofreciendo una interfaz de formularios intuitiva que genera automáticamente individuos OSDi válidos.

El resultado es un fichero `.owl` reutilizable que puede cargarse directamente en modelos de simulación de evaluación económica sanitaria.

---

## Funcionalidades

- **Definición de la enfermedad** — nombre, tipo (crónica, aguda, rara, hereditaria) y referencias
- **Progresión clínica** — manifestaciones (agudas/crónicas), reglas de combinación (coexistente, alternativa, secuencial) y desarrollos
- **Etapas** — etapas jerárquicas de la enfermedad con sub-progresiones
- **Población** — prevalencia, incidencia, mortalidad y esperanza de vida, configurables como parámetros determinísticos o estocásticos
- **Intervenciones** — costes, utilidades, sensibilidad/especificidad (solo para cribado y diagnóstico) y efectos modificadores siguiendo el patrón `ModifierParameter` de OSDi
- **Grafo de la ontología** — visualización del modelo de enfermedad como grafo de nodos interactivo
- **Gestión de proyectos** — crear, cargar y alternar entre múltiples proyectos `.owl`

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | FastAPI + Python |
| Ontología | rdflib / owlready2 |
| Tests | pytest |

---

## Cómo ejecutarlo

### Requisitos previos

- Node.js ≥ 18
- Python ≥ 3.10

### Backend

```bash
cd backend/api
pip install -r requirements.txt
uvicorn src.main:app --reload
```

La API estará disponible en `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Documentación

La documentación completa está disponible en la [Wiki](../../wiki):

- [Visión general de la arquitectura](../../wiki/Arquitectura)
- [API del backend](../../wiki/Backend-API)
- [Modelo de la ontología OSDi](../../wiki/Modelo-Ontologico)
- [Páginas del frontend](../../wiki/Frontend)
- [Configuración del entorno de desarrollo](../../wiki/Configuracion)

---

## Licencia

Este proyecto fue desarrollado como Trabajo de Fin de Grado en la Universidad de La Laguna.
