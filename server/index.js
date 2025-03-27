require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // Ajout de l'import jwt
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Initialisation de l'application
const app = express();

// Configuration de sécurité
app.use(helmet());
app.use(mongoSanitize());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Middleware CORS configuré explicitement
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Connexion MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/employee')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Modèle Table
const Table = mongoose.model('Table', new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }));
  
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limite chaque IP à 10 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  });
// Routes API Tables
const tableRouter = express.Router();

tableRouter.route('/')
  .get(async (req, res) => {
    try {
      const tables = await Table.find().sort({ createdAt: -1 });
      res.json({ success: true, data: tables });
      console.log(res);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  })
  .post(async (req, res) => {
    try {
      if (!req.body.name?.trim()) {
        return res.status(400).json({ 
          success: false,
          error: 'Le nom est requis' 
        });
      }

      const newTable = await Table.create({ name: req.body.name,createdAt:req.body.createdAt  });
      console.log(newTable);
      res.status(201).json({ success: true, data: newTable });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  tableRouter.route('/:id')
  .get(async (req, res) => {
    try {
      const table = await Table.findById(req.params.id);
      
      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Tableau non trouvé'
        });
      }

      res.json({
        success: true,
        data: table
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

// Montage des routes
app.use('/api/tables', tableRouter); // Cette ligne est cruciale
// Fonction pour générer le token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
};

// Routes
app.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Tous les champs sont requis' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'Email déjà utilisé' 
      });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    const cookieOptions = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.status(201)
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

app.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email et mot de passe requis' 
      });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        success: false,
        error: 'Identifiants incorrects' 
      });
    }

    const token = generateToken(user._id);

    const cookieOptions = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.status(200)
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
  } catch (err) {
    console.error('ERREUR LOGIN:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token')
    .status(200)
    .json({ success: true, message: 'Déconnexion réussie' });
});

// Gestion des erreurs 404
app.all('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.originalUrl} non trouvée`
    });
  });
  
  // Gestion des erreurs globales
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  });
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  });