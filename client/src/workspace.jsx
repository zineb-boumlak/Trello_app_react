import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Test.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import axios from 'axios';
import { Table, Spinner } from 'react-bootstrap';

function Workspace({ setShowNavbar, userId }) {
  const [showModal, setShowModal] = useState(false);
  const [showModal1, setShowModal1] = useState(false);
  const [tableTitle, setTableTitle] = useState('');
  const [tables, setTables] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    setShowNavbar(false);
    return () => setShowNavbar(true);
  }, [setShowNavbar]);

  useEffect(() => {
    if (userId) {
      axios.get(`http://localhost:3001/tables/${userId}`)
        .then((response) => setTables(response.data))
        .catch((err) => {
          console.error(err);
          setError('Erreur lors de la récupération des tableaux.');
        });
    }
  }, [userId]);

  useEffect(() => {
    axios.get('http://localhost:3001/members')
      .then((response) => setMembers(response.data))
      .catch((err) => {
        console.error(err);
        setError('Erreur lors de la récupération des membres.');
      });
  }, []);

  const handleSearchUsers = async () => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setError('');
    
    try {
      const response = await axios.get('http://localhost:3001/api/users/search', {
        params: { name: searchTerm },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSearchResults(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(err.response?.data?.error || 'Erreur lors de la recherche');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearchUsers();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectUser = (user) => {
    if (!selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  const handleCreateTable = async () => {
    if (!tableTitle.trim()) {
      setError('Le titre du tableau ne peut pas être vide.');
      return;
    }

    if (userId) {
      try {
        const response = await axios.post('http://localhost:3001/tables', {
          title: tableTitle,
          userId,
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setTables([...tables, response.data]);
        setTableTitle('');
        setShowModal(false);
        setSuccess('Tableau créé avec succès !');
        setError('');
      } catch (err) {
        console.error(err);
        setError('Erreur lors de la création du tableau.');
      }
    }
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      setError('Veuillez sélectionner au moins un membre');
      return;
    }

    setInviteLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:3001/invitations', {
        userIds: selectedUsers.map(user => user._id),
        inviterId: userId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setSuccess('Invitations envoyées avec succès !');
      setSelectedUsers([]);
      setShowModal1(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi des invitations');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="workspace-container">
      <div className="sidebar bg-light p-4">
        <h2 className="mb-4">Espace de travail</h2>
        <ul className="list-unstyled">
          <li className="mb-3">
            <Link to="/workspace/projets" className="text-decoration-none text-dark">
              Vos Tableaux
            </Link>
          </li>
          <li className="mb-3">
            <Link to="/workspace/equipe" className="text-decoration-none text-dark">
              Équipe
            </Link>
          </li>
        </ul>
      </div>

      <div className="main-content p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Tableau de bord</h3>
          <button className="btn btn-primary" onClick={() => setShowModal1(true)}>
            Inviter des membres dans l'espace de travail
          </button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card p-3">
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
            {tables.map((table) => (
              <div key={table._id} className="table-card p-3 bg-light rounded">
                <h5>{table.title}</h5>
                <small>{new Date(table.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                value={tableTitle}
                onChange={(e) => setTableTitle(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleCreateTable}>
            Créer
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showModal1} onHide={() => setShowModal1(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Inviter des membres</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>

          {searchLoading && <Spinner animation="border" size="sm" className="me-2" />}

          {selectedUsers.length > 0 && (
            <div className="mb-3">
              <h6>Membres sélectionnés :</h6>
              <div className="d-flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <span key={user._id} className="badge bg-primary">
                    {user.name}
                    <button 
                      className="ms-2 btn-close btn-close-white"
                      onClick={() => handleRemoveUser(user._id)}
                      style={{ fontSize: '0.5rem' }}
                    />
                  </span>
                ))}
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSelectUser(user)}
                        disabled={selectedUsers.some(u => u._id === user._id)}
                      >
                        {selectedUsers.some(u => u._id === user._id) ? 'Sélectionné' : 'Sélectionner'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {searchResults.length === 0 && !searchLoading && searchTerm.length >= 2 && (
            <div className="alert alert-info mt-3">
              Aucun utilisateur trouvé pour "{searchTerm}"
            </div>
          )}

          {members.length > 0 && (
            <div className="mt-3">
              <h6>Membres existants :</h6>
              <ul className="list-group">
                {members.map((member) => (
                  <li key={member._id} className="list-group-item">
                    {member.name} ({member.email})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal1(false)}>
            Fermer
          </Button>
          <Button 
            variant="primary" 
            onClick={handleInvite}
            disabled={selectedUsers.length === 0 || inviteLoading}
          >
            {inviteLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Envoi...
              </>
            ) : (
              `Envoyer invitations (${selectedUsers.length})`
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Workspace;