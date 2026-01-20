import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import DiseasePage from './pages/DiseasePage';
import DevelopmentPage from './pages/DevelopmentPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  
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

  // Estado compartido para Development
  const [developmentData, setDevelopmentData] = useState({
    label: '',
    comment: '',
    selectedClasses: ['Development'],
    datatypeProperties: [],
    objectProperties: [],
    developmentProperties: {
      hasAge: '',
      hasOnset: '',
      hasStage: '',
      hasSeverity: '',
      hasProgression: '',
      hasRiskFactor: ''
    }
  });

  const handleNavigate = (page) => {
    setCurrentPage(page);
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
            developmentData={developmentData}
          />
        );
      case 'development':
        return (
          <DevelopmentPage 
            onNavigate={handleNavigate} 
            currentPage={currentPage}
            diseaseData={diseaseData}
            developmentData={developmentData}
            setDevelopmentData={setDevelopmentData}
          />
        );
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;