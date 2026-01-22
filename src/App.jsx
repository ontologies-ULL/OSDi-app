import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import DiseasePage from './pages/DiseasePage';
import PopulationPage from './pages/PopulationPage';
import InterventionsPage from './pages/InterventionsPage';
import Navbar from './components/Navbar';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [diseaseName, setDiseaseName] = useState('');
  
  // Estado compartido para Disease
  const [diseaseData, setDiseaseData] = useState({
    label: '',
    comment: '',
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

  // Estado compartido para Population
  const [populationData, setPopulationData] = useState({
    label: '',
    comment: '',
    selectedClasses: ['PopulationAffected'],
    datatypeProperties: [],
    objectProperties: [],
    demographics: {
      hasAgeRange: '',
      hasGender: '',
      hasEthnicity: '',
      hasGeographicLocation: ''
    },
    epidemiology: {
      hasPrevalence: '',
      hasIncidence: '',
      hasMortality: '',
      hasMorbidity: ''
    }
  });

  // Estado compartido para Interventions
  const [interventionsData, setInterventionsData] = useState({
    label: '',
    comment: '',
    selectedClasses: ['Intervention'],
    datatypeProperties: [],
    objectProperties: [],
    interventionDetails: {
      hasInterventionType: '',
      hasDosage: '',
      hasFrequency: '',
      hasDuration: ''
    },
    outcomes: {
      hasEfficacy: '',
      hasSafetyProfile: '',
      hasAdverseEvents: '',
      hasQualityOfLife: ''
    },
    economicData: {
      hasCostPerUnit: '',
      hasTotalCost: '',
      hasCostEffectiveness: '',
      hasReimbursementStatus: ''
    }
  });

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'disease':
        return (
          <DiseasePage 
            onNavigate={handleNavigate} 
            currentPage={currentPage}
            diseaseData={diseaseData}
            setDiseaseData={setDiseaseData}
            setDiseaseName={setDiseaseName}
          />
        );
      case 'population':
        return (
          <PopulationPage
            onNavigate={handleNavigate}
            currentPage={currentPage}
            diseaseData={diseaseData}
            populationData={populationData}
            setPopulationData={setPopulationData}
          />
        );
      case 'interventions':
        return (
          <InterventionsPage
            onNavigate={handleNavigate}
            currentPage={currentPage}
            diseaseData={diseaseData}
            populationData={populationData}
            interventionsData={interventionsData}
            setInterventionsData={setInterventionsData}
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
        />
      )}
      {renderPage()}
    </div>
  );
}

export default App;