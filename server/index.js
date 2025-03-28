require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // Ajout de l'import jwt
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const User = require('./models/User');
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
    userId: {  // Ajoutez cette référence
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {  // Optionnel: stocker aussi l'email pour faciliter les requêtes
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }));
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 10 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  });
  const authenticate = async (req, res, next) => {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false,
          error: 'Non autorisé, token manquant' 
        });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Assurez-vous que JWT_SECRET est bien défini
      const user = await User.findById(decoded.id); // Récupère l'utilisateur depuis la base de données
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Utilisateur non trouvé' 
        });
      }
  
      req.user = { // Définit req.user avec les infos nécessaires
        id: user._id,
        email: user.email,
        name: user.name
      };
  
      next();
    } catch (err) {
      return res.status(401).json({ 
        success: false,
        error: 'Non autorisé, token invalide' 
      });
    }
  };
// Routes API Tables
const tableRouter = express.Router();

// Routes API Tables (dans index.js)
tableRouter.route('/')
  .get(authenticate, async (req, res) => {
    try {
      // Ne retourne que les tableaux de l'utilisateur connecté
      const tables = await Table.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json({ success: true, data: tables });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  })
  .post(authenticate, async (req, res) => {
    try {
      if (!req.body.name?.trim()) {
        return res.status(400).json({ 
          success: false,
          error: 'Le nom est requis' 
        });
      }

      const newTable = await Table.create({ 
        name: req.body.name,
        userId: req.user.id,
        email: req.user.email
      });

      res.status(201).json({ success: true, data: newTable });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

tableRouter.route('/:id')
  .get(authenticate, async (req, res) => {
    try {
      const table = await Table.findOne({ 
        _id: req.params.id,
        userId: req.user.id 
      });
      
      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Tableau non trouvé'
        });
      }

      res.json({ success: true, data: table });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  })
  .put(authenticate, async (req, res) => {
    try {
      const table = await Table.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { name: req.body.name },
        { new: true }
      );

      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Tableau non trouvé ou non autorisé'
        });
      }

      res.json({ success: true, data: table });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  })
  .delete(authenticate, async (req, res) => {
    try {
      const table = await Table.findOneAndDelete({ 
        _id: req.params.id,
        userId: req.user.id 
      });

      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Tableau non trouvé ou non autorisé'
        });
      }

      res.json({ 
        success: true,
        message: 'Tableau supprimé avec succès' 
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
// Route optionnelle pour vérifier les permissions d'édition
tableRouter.get('/:id/check-edit', authenticate, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        canEdit: false,
        error: 'Tableau non trouvé'
      });
    }

    // Ici vous pouvez ajouter une logique de vérification des permissions
    // Par exemple, vérifier si l'utilisateur est le propriétaire
    // if (table.userId.toString() !== req.userId) { ... }

    res.json({
      canEdit: true
    });
  } catch (err) {
    res.status(500).json({
      canEdit: false,
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
      console.error('Erreur connexion:', err);
      res.status(500).json({ 
        success: false,
        error: 'Erreur serveur' 
      });
    }
  });

  app.post('/logout', (req, res) => {  // Changé de GET à POST
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })
      .status(200)
      .json({ 
        success: true, 
        message: 'Déconnexion réussie' 
      });
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la déconnexion'
      });
    }
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