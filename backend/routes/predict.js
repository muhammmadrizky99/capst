const verifyToken = require('../middleware/verifyToken');
const express = require('express');
const router = express.Router();
const { PythonShell } = require('python-shell');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/', (req, res) => {
  const input = req.body;

  console.log('Menerima input:', input);

  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.join(__dirname, '../script'),
    args: [JSON.stringify(input)],
  };

  PythonShell.run('predict.py', options)
  .then((results) => {
    console.log('PythonShell hasil:', results);
    if (!results || results.length === 0) {
      return res.status(500).json({ error: 'Tidak ada output dari script Python' });
    }
    try {
      const output = JSON.parse(results[results.length - 1]);
      res.json({ result: output.top3 });
    } catch (err) {
      console.error("Gagal parsing output:", err);
      res.status(500).json({ error: 'Gagal membaca output Python' });
    }
    
  })

    .catch((err) => {
      console.error('PythonShell error:', err);
      res.status(500).json({ error: 'Gagal menjalankan prediksi', details: err.toString() });
    });
});

// Simpan jawaban & rekomendasi
// router.post('/save-result', verifyToken, async (req, res) => {
//   const { userId, answers, recommendations } = req.body;

//   // Validasi input
//   if (!userId || !answers || !recommendations) {
//     return res.status(400).json({ error: 'Data tidak lengkap' });
//   }

//   try {
//     // Mulai transaksi
//     await prisma.$transaction(async (tx) => {
//       // 1. Simpan semua jawaban
//       await Promise.all(
//         answers.map((item) => 
//           tx.answer.create({
//             data: {
//               userId: Number(userId),
//               question: item.question,
//               answer: item.answer,
//             },
//           })
//         )
//       );

//       // 2. Cari majorId berdasarkan majorName
//       const majorRecords = await Promise.all(
//         recommendations.map(async (rec) => {
//           const major = await tx.major.findFirst({
//             where: { name: rec.majorName },
//             select: { id: true }
//           });
          
//           if (!major) {
//             throw new Error(`Jurusan ${rec.majorName} tidak ditemukan`);
//           }
          
//           return {
//             userId: Number(userId),
//             majorId: major.id,
//             score: rec.score
//           };
//         })
//       );

//       // 3. Simpan semua rekomendasi
//       await tx.recommendation.createMany({
//         data: majorRecords
//       });
//     });

//     res.status(200).json({ message: 'Data berhasil disimpan' });
//   } catch (error) {
//     console.error('Gagal menyimpan:', error);
//     res.status(500).json({ 
//       error: 'Gagal menyimpan data',
//       details: error.message 
//     });
//   }
// });

// Simpan jawaban & rekomendasi
router.post('/save-result', verifyToken, async (req, res) => {
  const { userId, answers, recommendations } = req.body;

  if (!userId || !answers || !recommendations) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Buat session baru
      const session = await tx.predictionSession.create({
        data: {
          userId: Number(userId),
        }
      });
      console.log(">> Session berhasil dibuat:", session);

      // 2. Simpan jawaban berdasarkan session
      await Promise.all(
        answers.map((item) =>
          tx.answer.create({
            data: {
              userId: Number(userId),
              sessionId: session.id,
              question: item.question,
              answer: item.answer,
            }
          })
        )
      );

      // 3. Simpan rekomendasi berdasarkan session
      const majorRecords = await Promise.all(
        recommendations.map(async (rec) => {
          const major = await tx.major.findFirst({
            where: { name: rec.majorName },
            select: { id: true }
          });

          if (!major) {
            throw new Error(`Jurusan ${rec.majorName} tidak ditemukan`);
          }

          return {
            userId: Number(userId),
            sessionId: session.id,
            majorId: major.id,
            score: rec.score
          };
        })
      );

      await tx.recommendation.createMany({
        data: majorRecords
      });
    });

    res.status(200).json({ message: 'Data berhasil disimpan' });

  } catch (error) {
    console.error('Gagal menyimpan:', error);
    res.status(500).json({
      error: 'Gagal menyimpan data',
      details: error.message
    });
  }
});


router.get('/major', async (req, res) => {
  try {
    const majors = await prisma.major.findMany();
    res.json(majors);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data jurusan' });
  }
});

router.get('/history/:userId', verifyToken, async (req, res) => {
  const userId = Number(req.params.userId);
  
  // Validasi userId
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'ID pengguna tidak valid' });
  }

  try {
    const sessions = await prisma.predictionSession.findMany({
      where: { userId },
      include: {
        recommendations: {
          include: { 
            major: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          },
          orderBy: { score: 'desc' } // Urutkan rekomendasi dari score tertinggi
        }
      },
      orderBy: { createdAt: 'desc' } // Urutkan session dari yang terbaru
    });

    // Format data untuk frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      recommendations: session.recommendations.map(rec => ({
        id: rec.id,
        score: rec.score,
        major: {
          name: rec.major.name,
          description: rec.major.description
        }
      }))
    }));

    res.json(formattedSessions);

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil riwayat prediksi',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});





module.exports = router;
