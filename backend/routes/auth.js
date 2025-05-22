const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;

// Register
router.post('/register', async (req, res) => {
  const { nama, email, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email sudah digunakan' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { nama, email, password: hashedPassword },
    });
    res.json({ message: 'Registrasi berhasil' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal register' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email tidak ditemukan' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Password salah' });

    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: '2h' });

    res.json({ message: 'Login berhasil', nama: user.nama, userId: user.id, token });
  } catch (error) {
    res.status(500).json({ error: 'Gagal login' });
  }
});

module.exports = router;
