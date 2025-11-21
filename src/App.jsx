import React, { useState } from 'react';
import Header from './components/Header';
import QueryForm from './components/QueryForm';
import WaterQualityForm from './components/WaterQualityForm';
import './styles/Dropdown.css';
import './styles/generic.css';
import 'bootstrap/dist/css/bootstrap.min.css';



function App() {
  const [currentView, setCurrentView] = useState('main');

  const handleNavigateToWaterQuality = () => {
    setCurrentView('waterQuality');
  };

  const handleNavigateToMain = () => {
    setCurrentView('main');
  };

  return (
    <div className="App d-flex flex-column min-vh-100">
      {/* <Header /> */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        {currentView === 'main' ? (
          <QueryForm onNavigateToWaterQuality={handleNavigateToWaterQuality} />
        ) : (
          <WaterQualityForm onBack={handleNavigateToMain} />
        )}
      </div>
    </div>
  );
}

export default App;