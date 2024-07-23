import React from 'react';
import Header from './components/Header';
import QueryForm from './components/QueryForm';
import './styles/Dropdown.css';
import './styles/generic.css';
import 'bootstrap/dist/css/bootstrap.min.css';



function App() {
  return (
    <div className="App d-flex flex-column min-vh-100">
      {/* <Header /> */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <QueryForm />
      </div>
    </div>
  );
}

export default App;