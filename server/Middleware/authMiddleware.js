const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = async (req, res, next) => {
    let token;
    
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }
  
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
  
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
  
      // Ajoutez toutes les infos utilisateur à req
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name
      };
      
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Session invalide'
      });
    }
  };

module.exports = authMiddleware;