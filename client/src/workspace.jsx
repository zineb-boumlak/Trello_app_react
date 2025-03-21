import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Test.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import axios from 'axios'; 

function Workspace({ setShowNavbar, userId }) {
  const [showModal, setShowModal] = useState(false); 
  const [showModal1, setShowModal1] = useState(false); 
  const [tableTitle, setTableTitle] = useState(''); 
  const [tables, setTables] = useState([]); 
  const [members, setMembers] = useState([]); 
  const [error, setError] = useState(''); 
  const [success, setSuccess] = useState(''); 

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

  const handleInvite = () => {
    setSuccess('Invitation envoyée avec succès !');
    setShowModal1(false); 
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
      <Modal show={showModal1} onHide={() => setShowModal1(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Inviter un membre</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="inviteEmail">
              <Form.Control
                type="email"
                placeholder="Adresse email ou le nom"
              />
            </Form.Group>
            <div className="mt-3">
              <h6>Membres existants :</h6>
              <ul>
                {members.map((member) => (
                  <li key={member._id}>{member.name} ({member.email})</li>
                ))}
              </ul>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal1(false)}>
            Fermer
          </Button>
          <Button variant="primary" onClick={handleInvite}>
            Inviter
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Workspace;