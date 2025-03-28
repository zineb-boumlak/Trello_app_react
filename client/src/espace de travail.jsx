import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form, Spinner, Alert, Navbar, Nav, Dropdown } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export default function WorkSpace({ setShowNavbar }) {
  const [tableName, setTableName] = useState('');
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tableToEdit, setTableToEdit] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Configuration Axios
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
      return;
    }
    setUserData(user);
    setShowNavbar(false);
    fetchTables();
    
    return () => setShowNavbar(true);
  }, [navigate, setShowNavbar]);

  // Dans fetchTables() (frontend)
const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tables`, {
        credentials: 'include' // Indispensable pour les cookies
      });
      
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      setTables(data.data || []);
    } catch (err) {
      setError(err.message);
      // Rediriger vers /login si non authentifié
      if (err.message.includes('401')) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateTable = async () => {
    if (!tableName.trim()) {
      setError('Veuillez entrer un nom valide');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (tableToEdit) {
        // Mode édition
        response = await axios.put(`${API_URL}/tables/${tableToEdit}`, { 
          name: tableName
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setTables(tables.map(t => t._id === tableToEdit ? response.data : t));
        setSuccess('Tableau modifié avec succès !');
      } else {
        // Mode création
        response = await axios.post(`${API_URL}/tables`, { 
          name: tableName,
          userId: userData.id,
          email: userData.email
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setTables([response.data, ...tables]);
        setSuccess('Tableau créé avec succès !');
      }
      
      setTableName('');
      setShowModal(false);
      setTableToEdit(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId, e) => {
    e.stopPropagation();
    
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce tableau ?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/tables/${tableId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setTables(tables.filter(table => table._id !== tableId));
      setSuccess('Tableau supprimé avec succès');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleEditTable = (tableId, e) => {
    e.stopPropagation();
    const tableToEdit = tables.find(t => t._id === tableId);
    
    if (!tableToEdit) {
      setError('Tableau introuvable');
      return;
    }

    setTableToEdit(tableId);
    setTableName(tableToEdit.name || '');
    setShowModal(true);
  };

  const handleLogout = () => {
    axios.post(`${API_URL}/logout`, {}, {
      withCredentials: true,
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    })
    .catch(err => {
      console.error('Erreur déconnexion:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    });
  };

  const handleTableClick = (tableId) => {
    navigate(`/table/${tableId}`);
  };

  if (!userData) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="workspace-container">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Navbar.Brand as={Link} to="/workspace">Mon Espace de Travail</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/workspace">Tableau de bord</Nav.Link>
            <Nav.Link as={Link} to="/workspace/projets">Projets</Nav.Link>
            <Nav.Link as={Link} to="/workspace/equipe">Équipe</Nav.Link>
          </Nav>
          <Nav>
            <Navbar.Text className="me-3">
              Connecté en tant que: {userData.email}
            </Navbar.Text>
            <Dropdown>
              <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
                Mon Compte
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleLogout}>Déconnexion</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <div className="main-content p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Tableau de bord</h3>
        </div>

        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

        <div className="card p-3 mb-4">
          <h4>Bienvenue dans votre espace de travail personnel</h4>
          <p>
            Gérez vos tableaux personnels et organisez vos projets.
          </p>
        </div>

        <div className="mt-4">
          <Button variant="primary" onClick={() => {
            setTableToEdit(null);
            setTableName('');
            setShowModal(true);
          }}>
            + Créer un tableau
          </Button>

          <div className="tables-container d-flex flex-wrap gap-3 mt-3">
            {loading && tables.length === 0 ? (
              <div className="text-center w-100">
                <Spinner animation="border" />
              </div>
            ) : tables.length === 0 ? (
              <p className="text-muted">Aucun tableau disponible. Créez votre premier tableau !</p>
            ) : (
              tables.map(table => (
                <div key={table._id} className="position-relative" style={{ width: '250px' }}>
                  <div 
                    className="table-card p-3 bg-light rounded h-100"
                    onClick={() => handleTableClick(table._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h5 className="text-truncate">{table.name}</h5>
                    <small className="text-muted">
                      Créé le: {table.createdAt ? new Date(table.createdAt).toLocaleDateString() : 'Date inconnue'}
                    </small>
                  </div>
                  <div className="position-absolute top-0 end-0 p-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={(e) => handleEditTable(table._id, e)}
                      className="me-1"
                      title="Modifier"
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={(e) => handleDeleteTable(table._id, e)}
                      title="Supprimer"
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setTableToEdit(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{tableToEdit ? 'Modifier le tableau' : 'Créer un nouveau tableau'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nom du tableau</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: Projet Marketing"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleCreateOrUpdateTable} disabled={loading || !tableName.trim()}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {tableToEdit ? 'Enregistrement...' : 'Création...'}
              </>
            ) : tableToEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}