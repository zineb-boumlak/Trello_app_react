import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Signup from './signup';
import Login from './Login';
import Espace from './Espace';
import WorkSpace from './espace de travail';
import TablePage from './TablePage'; // Ajout de l'import manquant

import 'bootstrap/dist/css/bootstrap.min.css'; 
import './App.css'; 

function App() {
  const [showNavbar, setShowNavbar] = useState(true);

  return (
    <BrowserRouter>
      {showNavbar && (
        <nav className={`navbar navbar-expand-lg animated-background ${!showNavbar ? 'fade-out' : ''}`}>
          <div className="container-fluid">
            <Link to="/" className="navbar-brand">Mon Application</Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item"> <Link to="/register" className="nav-link">S'inscrire</Link></li>
                <li className="nav-item"><Link to="/login" className="nav-link">Connexion</Link></li>
              </ul>
            </div>
          </div>
        </nav>
      )}
      <Routes>
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Espace" element={<Espace />} />
        <Route path="/workspace" element={<WorkSpace setShowNavbar={setShowNavbar} />} />
        <Route path="/table/:id" element={<TablePage setShowNavbar={setShowNavbar} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;