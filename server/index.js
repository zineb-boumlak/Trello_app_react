const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserModel = require('./models/User'); 
const app = express();
const SECRET_KEY = 'votre_secret_key'; 
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5174', 
    credentials: true,
}));

mongoose.connect("mongodb://127.0.0.1:27017/employee")
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Failed to connect to MongoDB:", err));

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Email ou mot de passe incorrect." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: "Email ou mot de passe incorrect." });
        }

        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: "Success", token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/espace', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token manquant.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.json({ message: 'Accès autorisé', data: { userId: decoded.id, email: decoded.email } });
    } catch (err) {
        res.status(401).json({ error: 'Token invalide ou expiré.' });
    }
});

app.post('/register', async (req, res) => {
    const { email } = req.body;

    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Un compte avec cet email existe déjà." });
        }

        const user = await UserModel.create(req.body);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});