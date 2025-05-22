const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/major/:name
router.get('/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const major = await prisma.major.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
    if (!major) return res.status(404).json({ error: 'Jurusan tidak ditemukan' });
    res.json(major);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail jurusan' });
  }
});

module.exports = router;
