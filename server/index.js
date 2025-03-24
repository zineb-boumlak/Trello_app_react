require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Modèles Mongoose
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const InvitationSchema = new mongoose.Schema({
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const TableSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Invitation = mongoose.model('Invitation', InvitationSchema);
const Table = mongoose.model('Table', TableSchema);

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Middleware d'authentification
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Accès non autorisé' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Routes
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('ERREUR LOGIN:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Recherche d'utilisateurs
app.get('/api/users/search', authenticate, async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Le terme de recherche doit contenir au moins 2 caractères' });
    }

    const users = await User.find({
      name: { $regex: name, $options: 'i' },
      _id: { $ne: req.userId }
    }).select('name email _id');

    res.json(users);
  } catch (err) {
    console.error('Erreur recherche:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des invitations
app.post('/invitations', authenticate, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Liste d\'utilisateurs invalide' });
    }

    const invitations = await Promise.all(
      userIds.map(userId => 
        Invitation.create({
          inviter: req.userId,
          invitee: userId,
          status: 'pending'
        })
      )
    );

    res.status(201).json({ message: 'Invitations envoyées', invitations });
  } catch (err) {
    console.error('Erreur envoi invitations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des tableaux
app.get('/tables/:userId', authenticate, async (req, res) => {
  try {
    const tables = await Table.find({ createdBy: req.params.userId });
    res.json(tables);
  } catch (err) {
    console.error('Erreur récupération tableaux:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/tables', authenticate, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    const table = await Table.create({
      title,
      createdBy: req.userId
    });

    res.status(201).json(table);
  } catch (err) {
    console.error('Erreur création tableau:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Route pour rechercher des utilisateurs
app.get('/api/users/search', authenticate, async (req, res) => {
    try {
      const { name } = req.query;
  
      // Validation
      if (!name || name.length < 2) {
        return res.status(400).json({ error: 'Le terme de recherche doit contenir au moins 2 caractères' });
      }
  
      // Recherche insensible à la casse, excluant l'utilisateur courant
      const users = await User.find({
        name: { $regex: name, $options: 'i' },
        _id: { $ne: req.userId }
      }).select('name email _id'); // Ne retourne que ces champs
  
      res.json(users);
    } catch (err) {
      console.error('Erreur recherche:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  
  // Route pour ajouter des membres
  app.post('/api/members', authenticate, async (req, res) => {
    try {
      const { userId, workspaceId } = req.body;
  
      // Vérifier si l'utilisateur existe déjà comme membre
      const existingMember = await Member.findOne({ 
        userId, 
        workspaceId 
      });
  
      if (existingMember) {
        return res.status(400).json({ error: 'Cet utilisateur est déjà membre de ce workspace' });
      }
  
      // Créer le nouveau membre
      const member = await Member.create({ 
        userId,
        workspaceId,
        addedBy: req.userId, // Celui qui a invité
        role: 'member', // Par défaut
        joinedAt: new Date()
      });
  
      res.status(201).json(member);
    } catch (err) {
      console.error('Erreur ajout membre:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

// Liste des membres
app.get('/members', authenticate, async (req, res) => {
  try {
    const members = await User.find({}).select('name email _id').limit(50);
    res.json(members);
  } catch (err) {
    console.error('Erreur récupération membres:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});