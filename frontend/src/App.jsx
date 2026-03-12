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

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [diseaseName, setDiseaseName] = useState('');

  // ── Disease state ──────────────────────────────────────────────────────────
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

  // ── Disease sub-page lists (persisted across navigation) ──────────────────
  const [manifestations, setManifestations] = useState([]);       // { label, description, type }
  const [combinationRules, setCombinationRules] = useState([]);   // { label, description, ruleType, affectedProgressions, ... }
  const [developments, setDevelopments] = useState([]);           // { label, description, linkedProgressions }
  const [stages, setStages] = useState([]);                        // { label, description, isOrdered, hasNext, subProgressions }

  // ── Disease snapshots list ─────────────────────────────────────────────────
  const [diseases, setDiseases] = useState([]);        // array of complete disease snapshots
  const [editingDiseaseIndex, setEditingDiseaseIndex] = useState(null);

  // ── Flat {label, type} lists used for cross-page references ───────────────
  // Derived from the full lists above — keeps everything in sync
  const progressionElements = [
    ...manifestations.map(m => ({ label: m.label, type: m.type })),
    ...combinationRules.map(r => ({ label: r.label, type: r.ruleType })),
  ];
  const developmentElements = developments.map(d => ({ label: d.label, type: 'Development' }));
  const stageElements = stages.map(s => ({ label: s.label, type: 'Stage' }));

  const allProgressionElements = [...progressionElements, ...developmentElements, ...stageElements];

  // ── Shared ontology graph (computed once, passed to all disease pages) ──────
  const { nodes: graphNodes, edges: graphEdges } = useMemo(
    () => buildFullGraph({ diseaseData, manifestations, combinationRules, developments, stages }),
    [diseaseData, manifestations, combinationRules, developments, stages]
  );

  // ── Disease handlers ───────────────────────────────────────────────────────
  const handleSelectDisease = (index) => {
    if (index === -1) {
      // Reset to empty new disease
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

  // ── Population state ───────────────────────────────────────────────────────
  const [populations, setPopulations] = useState([]);  // array of saved population snapshots
  const [populationToEdit, setPopulationToEdit] = useState(null); // index to auto-load on page mount

  // ── Interventions state ────────────────────────────────────────────────────
  const [interventions, setInterventions] = useState([]);  // array of saved intervention snapshots
  const [interventionToEdit, setInterventionToEdit] = useState(null); // index to auto-load on page mount

  // ── Reset all project state (called when returning to home) ───────────────
  const handleSelectPopulation = (index) => {
    setPopulationToEdit(index); // -1 = reset to new form, >= 0 = load existing
    setCurrentPage('population');
  };

  const handleSelectIntervention = (index) => {
    setInterventionToEdit(index); // -1 = reset to new form, >= 0 = load existing
    setCurrentPage('interventions');
  };

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

  const handleNavigate = (page) => {
    if (page === 'home') resetProjectState();
    setCurrentPage(page);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    resetProjectState();
    setCurrentPage('home');
  };

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
          />
        );

      case 'population':
        return (
          <PopulationPage
            onNavigate={handleNavigate}
            currentPage={currentPage}
            diseaseData={diseaseData}
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
