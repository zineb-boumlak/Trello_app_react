// middleware/checkOwnership.js
const Table = require('../models/Table');

const checkTableOwnership = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Tableau non trouvé'
      });
    }

    if (table.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Action non autorisée'
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = checkOwnership;