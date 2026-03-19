/**
 * @file App.jsx
 * @brief Root component of the OSDi application.
 *
 * Manages global shared state for the active disease project
 * and handles client-side page routing through a `currentPage`
 * state variable. 
 *
 * @module App
 */

import React, { useState, useMemo } from 'react';
import { buildFullGraph } from './utils/ontologyGraph';
import HomePage from './pages/HomePage';
import DiseasePage from './pages/DiseasePage';
import PopulationPage from './pages/PopulationPage';
import InterventionsPage from './pages/InterventionsPage';
import ProgressionPage from './pages/ProgressionPage';
import DevelopmentPage from './pages/DevelopmentPage';
import StagePage from './pages/StagePage';
import Navbar from './components/Navbar';

/**
 * @component App
 * @description Root application component. Owns all shared state and renders
 * the active page together with the navigation bar.
 * @returns {JSX.Element}
 */
function App() {
  /** @type {[string, Function]} 
   * Currently active page key. 
   */
  const [currentPage, setCurrentPage] = useState('home');

  /** @type {[Object|null, Function]} 
   * Authenticated user object (null when logged out). 
   */
  const [user, setUser] = useState(null);

  /** @type {[string, Function]} 
   * Display name of the disease currently being edited. 
   */
  const [diseaseName, setDiseaseName] = useState('');

  /**
   * @type {[DiseaseData, Function]}
   * Identity and ontology properties of the disease currently being edited.
   */
  const [diseaseData, setDiseaseData] = useState({
    label: '',
    comment: '',
    selectedSubtypes: [],
    selectedClasses: ['Disease'],
    datatypeProperties: [],
    objectProperties: [],
    references: {
      hasRefToDO: '',
      hasRefToICD: '',
      hasRefToOMIM: '',
      hasRefToSNOMED: ''
    }
  });

  /** @type {[Manifestation[], Function]} 
   * Manifestations for the current disease. */
  const [manifestations, setManifestations] = useState([]);

  /** @type {[CombinationRule[], Function]} 
   * Combination rules for the current disease. 
   */
  const [combinationRules, setCombinationRules] = useState([]);

  /** @type {[Development[], Function]} 
   * Developments for the current disease. 
   */
  const [developments, setDevelopments] = useState([]);

  /** @type {[Stage[], Function]} 
   * Stages for the current disease. 
   */
  const [stages, setStages] = useState([]);

  /** @type {[DiseaseSnapshot[], Function]} 
   * List of all saved disease snapshots shown in the navbar dropdown. 
   */
  const [diseases, setDiseases] = useState([]);

  /** @type {[number|null, Function]} 
   * Index into `diseases` of the snapshot currently being edited, or null for a new disease. 
   */
  const [editingDiseaseIndex, setEditingDiseaseIndex] = useState(null);

  /**
   * @type {ProgressionElement[]}
   * Flat list of manifestations and combination rules for the current disease.
   */
  const progressionElements = [
    ...manifestations.map(m => ({ label: m.label, type: m.type })),
    ...combinationRules.map(r => ({ label: r.label, type: r.ruleType })),
  ];

  /** @type {ProgressionElement[]} 
   * Development elements derived from the `developments` state. 
   */
  const developmentElements = developments.map(d => ({ label: d.label, type: 'Development' }));

  /** @type {ProgressionElement[]} 
   * Stage elements derived from the `stages` state. 
   */
  const stageElements = stages.map(s => ({ label: s.label, type: 'Stage' }));

  /**
   * @type {ProgressionElement[]}
   * Combined list of all progression elements.
   */
  const allProgressionElements = [...progressionElements, ...developmentElements, ...stageElements];

  /**
   * React Flow nodes and edges for the full ontology graph of the current disease.
   * Computed with `useMemo` so it is only recalculated when the underlying state changes.
   */
  const { nodes: graphNodes, edges: graphEdges } = useMemo(
    () => buildFullGraph({ diseaseData, manifestations, combinationRules, developments, stages }),
    [diseaseData, manifestations, combinationRules, developments, stages]
  );

  /**
   * Loads a saved disease snapshot into the editor state, or resets to a blank
   * new disease when `index === -1`.
   * @param {number} index - Index of the snapshot to load, or -1 to create a new disease.
   */
  const handleSelectDisease = (index) => {
    if (index === -1) {
      setDiseaseData({ label: '', comment: '', selectedSubtypes: [], selectedClasses: ['Disease'], datatypeProperties: [], objectProperties: [], references: { hasRefToDO: '', hasRefToICD: '', hasRefToOMIM: '', hasRefToSNOMED: '' } });
      setManifestations([]);
      setCombinationRules([]);
      setDevelopments([]);
      setStages([]);
      setDiseaseName('');
      setEditingDiseaseIndex(null);
    } else {
      const snap = diseases[index];
      setDiseaseData({ ...snap.diseaseData });
      setManifestations(snap.manifestations.map(m => ({ ...m })));
      setCombinationRules(snap.combinationRules.map(r => ({ ...r })));
      setDevelopments(snap.developments.map(d => ({ ...d })));
      setStages(snap.stages.map(s => ({ ...s })));
      setDiseaseName(snap.diseaseData.label || '');
      setEditingDiseaseIndex(index);
    }
    setCurrentPage('disease');
  };

  /**
   * Persists the current editor state as a disease snapshot.
   * Updates the existing snapshot if one is being edited, otherwise appends a new one.
   * @param {DiseaseData} freshDiseaseData - Latest disease identity data at the time of saving.
   */
  const handleSaveDiseaseSnapshot = (freshDiseaseData) => {
    const snapshot = {
      diseaseData: freshDiseaseData,
      manifestations: manifestations.map(m => ({ ...m })),
      combinationRules: combinationRules.map(r => ({ ...r })),
      developments: developments.map(d => ({ ...d })),
      stages: stages.map(s => ({ ...s })),
    };
    if (editingDiseaseIndex !== null) {
      setDiseases(prev => prev.map((item, i) => i === editingDiseaseIndex ? snapshot : item));
    } else {
      setDiseases(prev => {
        setEditingDiseaseIndex(prev.length);
        return [...prev, snapshot];
      });
    }
  };

  /** @type {[Object[], Function]} 
   * List of all saved population individuals. 
   */
  const [populations, setPopulations] = useState([]);

  /** @type {[number|null, Function]} 
   * Index of the population currently being edited, or null. 
   */
  const [populationToEdit, setPopulationToEdit] = useState(null);

  /** @type {[Object[], Function]} 
   * List of all saved intervention individuals. 
   */
  const [interventions, setInterventions] = useState([]);

  /** @type {[number|null, Function]} 
   * Index of the intervention currently being edited, or null. 
   */
  const [interventionToEdit, setInterventionToEdit] = useState(null);

  /**
   * Navigates to a population entry in edit mode.
   * @param {number} index - Index into the `populations` array.
   */
  const handleSelectPopulation = (index) => {
    setPopulationToEdit(index);
    setCurrentPage('population');
  };

  /**
   * Navigates to an intervention entry in edit mode.
   * @param {number} index - Index into the `interventions` array.
   */
  const handleSelectIntervention = (index) => {
    setInterventionToEdit(index);
    setCurrentPage('interventions');
  };

  /**
   * Resets all disease-related state to initial empty values.
   * Called when navigating back to the home page or on logout.
   */
  const resetProjectState = () => {
    setDiseaseName('');
    setDiseaseData({
      label: '', comment: '', selectedSubtypes: [], selectedClasses: ['Disease'],
      datatypeProperties: [], objectProperties: [],
      references: { hasRefToDO: '', hasRefToICD: '', hasRefToOMIM: '', hasRefToSNOMED: '' }
    });
    setManifestations([]);
    setCombinationRules([]);
    setDevelopments([]);
    setStages([]);
    setDiseases([]);
    setEditingDiseaseIndex(null);
    setPopulations([]);
    setInterventions([]);
  };

  /**
   * Top-level navigation handler. Resets project state when navigating to home.
   * @param {string} page - Target page key.
   */
  const handleNavigate = (page) => {
    if (page === 'home') resetProjectState();
    setCurrentPage(page);
  };

  /**
   * Clears the authenticated user, resets project state and navigates home.
   */
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    resetProjectState();
    setCurrentPage('home');
  };

  /**
   * Selects and returns the JSX tree for the currently active page.
   * Each page receives only the slice of state it needs.
   * @returns {JSX.Element}
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;

      case 'disease':
        return (
          <DiseasePage
            key={`disease-${editingDiseaseIndex ?? 'new'}`}
            onNavigate={handleNavigate}
            currentPage={currentPage}
            diseaseData={diseaseData}
            setDiseaseData={setDiseaseData}
            setDiseaseName={setDiseaseName}
            progressionElements={allProgressionElements}
            graphNodes={graphNodes}
            graphEdges={graphEdges}
            diseases={diseases}
            editingDiseaseIndex={editingDiseaseIndex}
            onSaveDiseaseSnapshot={handleSaveDiseaseSnapshot}
          />
        );

      case 'progression':
        return (
          <ProgressionPage
            onNavigate={handleNavigate}
            currentPage="progression"
            manifestations={manifestations}
            setManifestations={setManifestations}
            combinationRules={combinationRules}
            setCombinationRules={setCombinationRules}
            progressionElements={progressionElements}
            graphNodes={graphNodes}
            graphEdges={graphEdges}
          />
        );

      case 'development':
        return (
          <DevelopmentPage
            onNavigate={handleNavigate}
            currentPage="development"
            progressionElements={progressionElements}
            developments={developments}
            setDevelopments={setDevelopments}
            graphNodes={graphNodes}
            graphEdges={graphEdges}
          />
        );

      case 'stage':
        return (
          <StagePage
            onNavigate={handleNavigate}
            currentPage="stage"
            diseaseData={diseaseData}
            progressionElements={allProgressionElements}
            stages={stages}
            setStages={setStages}
            graphNodes={graphNodes}
            graphEdges={graphEdges}
            onSaveDiseaseSnapshot={handleSaveDiseaseSnapshot}
          />
        );

      case 'population':
        return (
          <PopulationPage
            onNavigate={handleNavigate}
            currentPage={currentPage}
            diseaseData={diseaseData}
            diseases={diseases}
            populations={populations}
            setPopulations={setPopulations}
            populationToEdit={populationToEdit}
            onPopulationToEditHandled={() => setPopulationToEdit(null)}
          />
        );

      case 'interventions':
        return (
          <InterventionsPage
            onNavigate={handleNavigate}
            currentPage={currentPage}
            diseaseData={diseaseData}
            diseases={diseases}
            progressionElements={allProgressionElements}
            interventions={interventions}
            setInterventions={setInterventions}
            interventionToEdit={interventionToEdit}
            onInterventionToEditHandled={() => setInterventionToEdit(null)}
          />
        );

      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="App">
      {currentPage !== 'home' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          diseaseName={diseaseName}
          onLogout={handleLogout}
          diseases={diseases}
          onSelectDisease={handleSelectDisease}
          populations={populations}
          onSelectPopulation={handleSelectPopulation}
          interventions={interventions}
          onSelectIntervention={handleSelectIntervention}
        />
      )}
      {renderPage()}
    </div>
  );
}

export default App;
