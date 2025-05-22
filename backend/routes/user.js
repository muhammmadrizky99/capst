// const express = require('express');
// const router = express.Router();
// const verifyToken = require('../middleware/verifyToken'); // Import middleware verifikasi JWT
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// // Endpoint yang dilindungi (untuk mengambil profil pengguna)
// router.get('/profile', verifyToken, async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
//     if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

//     res.json({ nama: user.nama, email: user.email });
//   } catch (error) {
//     res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data pengguna' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user data from token payload
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        nama: true,
        email: true,
        id: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user data' });
  }
});


// Get user profile from DB
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      select: {
        nama: true,
        email: true,
        id: true
      }
    });
    
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data pengguna' });
  }
});

module.exports = router;
