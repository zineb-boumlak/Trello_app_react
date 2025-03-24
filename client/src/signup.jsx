import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        axios.post('http://localhost:3001/register', { name, email, password })
            .then(result => {
                console.log("Server response:", result.data);
                navigate('/login');
            })
            .catch(err => {
                setLoading(false);
                if (err.response) {
                    setError(err.response.data.error || "Erreur inconnue.");
                } else if (err.request) {
                    setError("Le serveur ne répond pas. Vérifiez votre connexion.");
                } else {
                    setError("Une erreur est survenue.");
                }
            });
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="animated-background p-5 rounded">
                        <form className="form-container" onSubmit={handleSubmit}>
                            <h3 className="text-center mb-4">Inscription</h3>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">Nom d'utilisateur</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    placeholder="Username"
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    placeholder="Email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">Mot de passe</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="password"
                                    placeholder="Password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? "Inscription..." : "S'inscrire"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;