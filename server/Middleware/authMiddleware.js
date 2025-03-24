const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token du header
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
      throw new Error('Authorization denied. No token provided.');
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trouver l'utilisateur associé au token
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found.');
    }

    // Attacher l'utilisateur à l'objet `req`
    req.user = user;
    next(); // Passer au prochain middleware ou à la route
  } catch (err) {
    res.status(401).json({ error: 'Authorization denied. Invalid token.' });
  }
};

module.exports = authMiddleware; // Exporter la fonction middleware