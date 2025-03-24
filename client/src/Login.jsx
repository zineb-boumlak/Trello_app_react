import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
    
        try {
            const response = await axios.post('http://localhost:3001/login', {
                email: email.trim(),
                password
            }, {
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('userData', JSON.stringify(response.data.user));
                navigate('/workspace'); 
            } else {
                throw new Error('Réponse inattendue du serveur');
            }
        } catch (err) {
            const errorDetails = {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            };
            console.error('Détails de l\'erreur:', errorDetails);
            
            setError(
                err.response?.data?.error || 
                'Échec de la connexion. Veuillez réessayer.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card p-4">
                        <h2 className="text-center mb-4">Connexion</h2>
                        
                        {error && <div className="alert alert-danger">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Mot de passe</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary w-100"
                                disabled={loading}
                            >
                                {loading ? 'Connexion en cours...' : 'Se connecter'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;