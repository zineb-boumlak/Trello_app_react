import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form, Spinner, Alert, Navbar, Nav, Dropdown, Table } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export default function WorkSpace({ setShowNavbar, userId }) {
  const [tableName, setTableName] = useState('');
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Configuration Axios
  axios.defaults.withCredentials = true;

  useEffect(() => {
    setShowNavbar(false);
    return () => setShowNavbar(true);
  }, [setShowNavbar]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tables/my-tables`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTables(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur de chargement des tableaux');
      console.error('Erreur:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!tableName.trim()) {
      setError('Veuillez entrer un nom valide');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/tables`, { 
        name: tableName,
        userId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setTables([response.data, ...tables]);
      setTableName('');
      setShowModal(false);
      setSuccess('Tableau créé avec succès !');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    axios.post(`${API_URL}/logout`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    })
    .catch(err => {
      console.error(err);
      setError('Erreur lors de la déconnexion');
    });
  };

  const handleTableClick = (tableId) => {
    navigate(`/table/${tableId}`);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  return (
    <div className="workspace-container">
      {/* Navbar identique au premier code */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Navbar.Brand as={Link} to="/workspace">Mon Espace de Travail</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link as={Link} to="/workspace">Tableau de bord</Nav.Link>
            <Nav.Link as={Link} to="/workspace/projets">Projets</Nav.Link>
            <Nav.Link as={Link} to="/workspace/equipe">Équipe</Nav.Link>
          </Nav>
          <Dropdown alignRight>
            <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
              Mon Compte
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleLogout}>Déconnexion</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Collapse>
      </Navbar>

      <div className="main-content p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Tableau de bord</h3>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="card p-3 mb-4">
          <h4>Bienvenue dans votre espace de travail</h4>
          <p>
            Gérez vos projets, collaborez avec votre équipe et suivez l'avancement de vos tâches.
          </p>
        </div>

        <div className="mt-4">
          <div className="create-table-button" onClick={() => setShowModal(true)}>
            <p>+ Créer un tableau</p>
          </div>

          <div className="tables-container d-flex flex-wrap gap-3 mt-3">
            {loading && tables.length === 0 ? (
              <Spinner animation="border" />
            ) : tables.length === 0 ? (
              <p>Aucun tableau disponible</p>
            ) : (
              tables.map(table => (
                <div 
                  key={table._id} 
                  className="table-card p-3 bg-light rounded"
                  onClick={() => handleTableClick(table._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5>{ table.name}</h5>
                  <h5>Created at : { table.createdAt}</h5>
                  <small>
  {table.createdAt ? new Date(table.createdAt).toLocaleDateString() : 'Date inconnue'}
</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de création de tableau */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Créer un tableau</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="tableTitle">
              <Form.Label>Titre du tableau</Form.Label>
              <Form.Control
                type="text"
                placeholder="Entrez le titre du tableau"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleCreateTable} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Création...
              </>
            ) : 'Créer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}