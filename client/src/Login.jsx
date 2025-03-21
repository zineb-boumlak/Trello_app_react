import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/login', { email, password });
            if (response.data.message === "Success") {
                localStorage.setItem('token', response.data.token); // Stocker le token
                navigate('/workspace'); // Rediriger vers l'espace de travail
            } else {
                setError("Email ou mot de passe incorrect.");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Une erreur s'est produite lors de la connexion.");
        }
    };
    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="animated-background p-5 rounded">
                        <form className="form-container" onSubmit={handleSubmit}>
                            <h3 className="text-center mb-4">Connexion</h3>
                            {error && <div className="alert alert-danger">{error}</div>} {/* Afficher l'erreur */}
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
                            <button type="submit" className="btn btn-primary w-100">
                                Se connecter
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;