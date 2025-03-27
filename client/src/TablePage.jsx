import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button, Card } from 'react-bootstrap';

const API_URL = 'http://localhost:3001'; // Retirez '/api' si votre route commence déjà par /api

export default function TablePage({ setShowNavbar }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setShowNavbar(false); // Cache la navbar si nécessaire
    
    const fetchTable = async () => {
      try {
        const response = await axios.get(`${API_URL}/tables/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.data) {
          throw new Error('Tableau non trouvé');
        }
        
        setTable(response.data);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.response?.data?.error || err.message || 'Erreur de chargement');
        
        // Redirection si l'ID est invalide ou le tableau n'existe pas
        if (err.response?.status === 404) {
          navigate('/workspace');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTable();

    return () => {
      setShowNavbar(true); // Réaffiche la navbar en quittant
    };
  }, [id, navigate, setShowNavbar]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }

  if (!table) {
    return (
      <Alert variant="warning" className="m-3">
        Tableau non trouvé
      </Alert>
    );
  }

  return (
    <div className="container mt-4">
      <Card>
        <Card.Body>
          <Card.Title>{table.title || table.name}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            Créé le: {new Date(table.createdAt).toLocaleDateString()}
          </Card.Subtitle>
          
          {/* Contenu du tableau */}
          <div className="mt-3">
            {/* Ajoutez ici vos colonnes/cartes */}
            <p>Ce tableau est vide pour le moment.</p>
          </div>

          <Button 
            variant="primary" 
            onClick={() => navigate('/workspace')}
            className="mt-3"
          >
            Retour à l'espace de travail
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}