const jwt = require('jsonwebtoken');
const SECRET_KEY = 'rahasia123';  

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak, token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;  
    next();  
  } catch (error) {
    return res.status(400).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });
  }
};

module.exports = verifyToken;
