const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    try {
        const decoded = jwt.verify(token, 'votre_secret_key');
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ error: "Token invalide." });
    }
};

app.get('/espace', authMiddleware, (req, res) => {
    res.json({ message: "Vous avez accès à cette ressource protégée.", user: req.user });
});