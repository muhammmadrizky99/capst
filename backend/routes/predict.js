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

  // Validasi input sesuai dengan yang dibutuhkan predict.py
  if (!input || Object.keys(input).length === 0) {
    return res.status(400).json({ error: 'Input tidak valid atau kosong' });
  }

  // Validasi field yang diperlukan sesuai predict.py
  const requiredFields = [
    'Gender', 
    'Minat_Teknologi', 
    'Minat_Seni', 
    'Minat_Bisnis', 
    'Minat_Hukum', 
    'Minat_Kesehatan', 
    'Minat_Sains',
    'Problem_Solving', 
    'Kreativitas', 
    'Kepemimpinan', 
    'Kerja_Tim',
    'nilai akhir SMA/SMK'
  ];

  const missingFields = requiredFields.filter(field => !(field in input));
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Field yang diperlukan tidak lengkap', 
      missingFields: missingFields 
    });
  }

  // Validasi nilai Gender
  if (!['Laki-laki', 'Perempuan'].includes(input.Gender)) {
    return res.status(400).json({ error: 'Gender harus "Laki-laki" atau "Perempuan"' });
  }

  // Validasi minat (Ya/Tidak)
  const minatFields = ['Minat_Teknologi', 'Minat_Seni', 'Minat_Bisnis', 'Minat_Hukum', 'Minat_Kesehatan', 'Minat_Sains'];
  for (const field of minatFields) {
    if (!['Ya', 'Tidak'].includes(input[field])) {
      return res.status(400).json({ error: `${field} harus "Ya" atau "Tidak"` });
    }
  }

  // Validasi level skills
  const skillFields = ['Problem_Solving', 'Kreativitas', 'Kepemimpinan', 'Kerja_Tim'];
  const validLevels = ['Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'];
  for (const field of skillFields) {
    if (!validLevels.includes(input[field])) {
      return res.status(400).json({ error: `${field} harus salah satu dari: ${validLevels.join(', ')}` });
    }
  }

  // Validasi nilai akhir
  const nilaiAkhir = parseFloat(input['nilai akhir SMA/SMK']);
  if (isNaN(nilaiAkhir) || nilaiAkhir < 0 || nilaiAkhir > 100) {
    return res.status(400).json({ error: 'Nilai akhir SMA/SMK harus berupa angka antara 0-100' });
  }

  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.join(__dirname, '../script'),
    args: [JSON.stringify(input)],
  };

  console.log('Menjalankan Python script dengan input:', input);

  PythonShell.run('predict.py', options)
    .then((results) => {
      console.log('PythonShell hasil:', results);
      
      if (!results || results.length === 0) {
        return res.status(500).json({ error: 'Tidak ada output dari script Python' });
      }

      // FIXED: Parsing yang lebih robust untuk output Python
      let finalResult = null;

      // Cari baris yang mengandung "Final result:"
      for (let i = results.length - 1; i >= 0; i--) {
        const line = results[i].trim();
        console.log(`Memeriksa baris ${i}:`, line);
        
        if (line.startsWith('>>> Final result:')) {
          try {
            // Ambil JSON string setelah ">>> Final result:"
            const jsonString = line.replace('>>> Final result:', '').trim();
            console.log('JSON string yang diparsing:', jsonString);
            
            const parsed = JSON.parse(jsonString);
            console.log('Hasil parsing JSON:', parsed);
            
            if (parsed && parsed.top3 && Array.isArray(parsed.top3)) {
              finalResult = parsed;
              break;
            }
          } catch (parseError) {
            console.error('Error parsing JSON dari line:', line, parseError);
          }
        }
      }

      if (finalResult && finalResult.top3) {
        // FIXED: Format hasil sesuai ekspektasi frontend
        const formattedResults = finalResult.top3.map(([majorName, score]) => ({
          majorName: majorName,
          score: parseFloat(score) // Pastikan score adalah number
        }));

        console.log('Hasil prediksi top3 yang diformat:', formattedResults);

        // FIXED: Response format yang konsisten dengan frontend
        res.json({ 
          success: true,
          message: 'Prediksi berhasil',
          prediction: finalResult.prediction || null,
          result: formattedResults,  // Format array object untuk frontend
          top3: finalResult.top3     // Format array tuple untuk compatibility
        });
      } else {
        console.log('No valid Final result found. Raw results:', results);
        return res.status(500).json({ 
          error: 'Format output Python tidak valid',
          details: 'Tidak ditemukan hasil prediksi yang valid',
          rawOutput: results
        });
      }
    })
    .catch((err) => {
      console.error('PythonShell error:', err);
      res.status(500).json({ 
        error: 'Gagal menjalankan prediksi', 
        details: err.toString(),
        success: false
      });
    });
});

// Simpan jawaban & rekomendasi
router.post('/save-result', verifyToken, async (req, res) => {
  const { userId, answers, recommendations } = req.body;

  console.log('💾 Save result request received:', { 
    userId, 
    answersCount: answers?.length, 
    recommendationsCount: recommendations?.length 
  });
  
  console.log('📝 Answers data:', answers);
  console.log('🎯 Recommendations data:', recommendations);

  if (!userId || !answers || !recommendations) {
    console.log('❌ Missing required data:', { userId: !!userId, answers: !!answers, recommendations: !!recommendations });
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  // Validasi tambahan
  if (!Array.isArray(answers) || !Array.isArray(recommendations)) {
    console.log('❌ Invalid data format:', { answersIsArray: Array.isArray(answers), recommendationsIsArray: Array.isArray(recommendations) });
    return res.status(400).json({ error: 'Format data answers atau recommendations tidak valid' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat session baru
      const session = await tx.predictionSession.create({
        data: {
          userId: Number(userId),
        }
      });
      console.log("✅ Session berhasil dibuat:", session);

      // 2. Simpan jawaban berdasarkan session
      if (answers.length > 0) {
        console.log(`📝 Menyimpan ${answers.length} jawaban...`);
        
        const answerResults = await Promise.all(
          answers.map(async (item, index) => {
            if (!item.question || item.answer === undefined) {
              console.log(`❌ Answer ${index} tidak lengkap:`, item);
              throw new Error(`Data jawaban ke-${index + 1} tidak lengkap`);
            }
            
            console.log(`💾 Saving answer ${index + 1}:`, { question: item.question, answer: item.answer });
            
            const savedAnswer = await tx.answer.create({
              data: {
                userId: Number(userId),
                sessionId: session.id,
                question: item.question,
                answer: item.answer,
              }
            });
            
            console.log(`✅ Answer ${index + 1} saved with ID:`, savedAnswer.id);
            return savedAnswer;
          })
        );
        
        console.log(`✅ Semua ${answerResults.length} jawaban berhasil disimpan`);
      } else {
        console.log('⚠️ Tidak ada jawaban untuk disimpan');
      }

      // 3. Simpan rekomendasi berdasarkan session
      if (recommendations.length > 0) {
        console.log(`🎯 Menyimpan ${recommendations.length} rekomendasi...`);
        
        const majorRecords = await Promise.all(
          recommendations.map(async (rec, index) => {
            if (!rec.majorName || rec.score === undefined) {
              console.log(`❌ Recommendation ${index} tidak lengkap:`, rec);
              throw new Error(`Data rekomendasi ke-${index + 1} tidak lengkap`);
            }

            const major = await tx.major.findFirst({
              where: { name: rec.majorName },
              select: { id: true }
            });

            if (!major) {
              console.log(`❌ Jurusan tidak ditemukan:`, rec.majorName);
              throw new Error(`Jurusan ${rec.majorName} tidak ditemukan`);
            }

            console.log(`💾 Mapping recommendation ${index + 1}:`, { majorName: rec.majorName, majorId: major.id, score: rec.score });

            return {
              userId: Number(userId),
              sessionId: session.id,
              majorId: major.id,
              score: Number(rec.score)
            };
          })
        );

        const savedRecommendations = await tx.recommendation.createMany({
          data: majorRecords
        });
        
        console.log(`✅ ${savedRecommendations.count} rekomendasi berhasil disimpan`);
      } else {
        console.log('⚠️ Tidak ada rekomendasi untuk disimpan');
      }

      return session;
    });

    console.log('🎉 Transaction completed successfully for session:', result.id);

    res.status(200).json({ 
      message: 'Data berhasil disimpan',
      success: true,
      sessionId: result.id
    });

  } catch (error) {
    console.error('❌ Gagal menyimpan:', error);
    res.status(500).json({
      error: 'Gagal menyimpan data',
      details: error.message,
      success: false
    });
  }
});

// Endpoint untuk mendapatkan detail major berdasarkan nama
router.get('/major/:majorName', async (req, res) => {
  const { majorName } = req.params;
  
  try {
    const major = await prisma.major.findFirst({
      where: { 
        name: {
          equals: majorName,
          mode: 'insensitive' // Case insensitive search
        }
      }
    });
    
    if (!major) {
      return res.status(404).json({ 
        error: 'Jurusan tidak ditemukan',
        success: false 
      });
    }
    
    res.json({
      success: true,
      ...major
    });
  } catch (error) {
    console.error('Error fetching major detail:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil detail jurusan',
      success: false 
    });
  }
});

router.get('/major', async (req, res) => {
  try {
    const majors = await prisma.major.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({
      success: true,
      data: majors
    });
  } catch (error) {
    console.error('Error fetching majors:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil data jurusan',
      success: false 
    });
  }
});

router.get('/history/:userId', verifyToken, async (req, res) => {
  const userId = Number(req.params.userId);

  console.log('🔍 Fetching history for userId:', userId);

  // Validasi userId
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ 
      error: 'ID pengguna tidak valid',
      success: false 
    });
  }

  try {
    // Debug: Cek semua session untuk user ini
    const sessionsRaw = await prisma.predictionSession.findMany({
      where: { userId }
    });
    console.log('📊 Raw sessions count:', sessionsRaw.length);

    const sessions = await prisma.predictionSession.findMany({
      where: { userId },
      include: {
        // Include answers juga!
        answers: {
          select: {
            id: true,
            question: true,
            answer: true,
            sessionId: true
          }
        },
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

    console.log(`📈 Found ${sessions.length} sessions for user ${userId}`);

    // Debug setiap session
    sessions.forEach((session, index) => {
      console.log(`📝 Session ${index + 1}:`, {
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        answersCount: session.answers?.length || 0,
        recommendationsCount: session.recommendations?.length || 0,
        answers: session.answers || []
      });
    });

    // Format data untuk frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      userId: session.userId,
      // Include answers dalam response
      answers: session.answers || [],
      recommendations: session.recommendations.map(rec => ({
        id: rec.id,
        score: rec.score,
        major: {
          id: rec.major.id,
          name: rec.major.name,
          description: rec.major.description
        }
      }))
    }));

    console.log('🚀 Sending formatted sessions:', formattedSessions.map(s => ({
      id: s.id,
      answersCount: s.answers.length,
      recommendationsCount: s.recommendations.length
    })));

    res.json({
      success: true,
      data: formattedSessions,
      count: formattedSessions.length
    });

  } catch (error) {
    console.error('❌ Error fetching history:', error);
    res.status(500).json({
      error: 'Gagal mengambil riwayat prediksi',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      success: false
    });
  }
});

// Endpoint untuk mendapatkan detail session tertentu
router.get('/session/:sessionId', verifyToken, async (req, res) => {
  const sessionId = Number(req.params.sessionId);

  if (isNaN(sessionId) || sessionId <= 0) {
    return res.status(400).json({ 
      error: 'ID session tidak valid',
      success: false 
    });
  }

  try {
    const session = await prisma.predictionSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: true,
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
          orderBy: { score: 'desc' }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ 
        error: 'Session tidak ditemukan',
        success: false 
      });
    }

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error fetching session detail:', error);
    res.status(500).json({
      error: 'Gagal mengambil detail session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      success: false
    });
  }
});

// FIXED: Menghapus session tertentu - menambahkan route DELETE untuk /history/:sessionId
router.delete('/history/:sessionId', verifyToken, async (req, res) => {
  const sessionId = Number(req.params.sessionId);

  console.log('🗑️ DELETE request received for session:', sessionId);

  if (isNaN(sessionId) || sessionId <= 0) {
    return res.status(400).json({ 
      error: 'ID session tidak valid',
      success: false 
    });
  }

  try {
    // Cek apakah session ada terlebih dahulu
    const existingSession = await prisma.predictionSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return res.status(404).json({
        error: 'Session tidak ditemukan',
        success: false
      });
    }

    console.log('🔍 Session found, proceeding to delete:', existingSession.id);

    await prisma.$transaction(async (tx) => {
      // Hapus recommendations terlebih dahulu
      const deletedRecommendations = await tx.recommendation.deleteMany({
        where: { sessionId }
      });
      console.log('✅ Deleted recommendations:', deletedRecommendations.count);

      // Hapus answers
      const deletedAnswers = await tx.answer.deleteMany({
        where: { sessionId }
      });
      console.log('✅ Deleted answers:', deletedAnswers.count);

      // Hapus session
      const deletedSession = await tx.predictionSession.delete({
        where: { id: sessionId }
      });
      console.log('✅ Deleted session:', deletedSession.id);
    });

    console.log('🎉 Session deletion completed successfully');

    res.json({
      success: true,
      message: 'Session berhasil dihapus'
    });

  } catch (error) {
    console.error('❌ Error deleting session:', error);
    res.status(500).json({
      error: 'Gagal menghapus session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      success: false
    });
  }
});

// Endpoint untuk menghapus session tertentu (alternatif route)
router.delete('/session/:sessionId', verifyToken, async (req, res) => {
  const sessionId = Number(req.params.sessionId);

  console.log('🗑️ DELETE /session request received for session:', sessionId);

  if (isNaN(sessionId) || sessionId <= 0) {
    return res.status(400).json({ 
      error: 'ID session tidak valid',
      success: false 
    });
  }

  try {
    // Cek apakah session ada terlebih dahulu
    const existingSession = await prisma.predictionSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return res.status(404).json({
        error: 'Session tidak ditemukan',
        success: false
      });
    }

    console.log('🔍 Session found, proceeding to delete:', existingSession.id);

    await prisma.$transaction(async (tx) => {
      // Hapus recommendations terlebih dahulu
      const deletedRecommendations = await tx.recommendation.deleteMany({
        where: { sessionId }
      });
      console.log('✅ Deleted recommendations:', deletedRecommendations.count);

      // Hapus answers
      const deletedAnswers = await tx.answer.deleteMany({
        where: { sessionId }
      });
      console.log('✅ Deleted answers:', deletedAnswers.count);

      // Hapus session
      const deletedSession = await tx.predictionSession.delete({
        where: { id: sessionId }
      });
      console.log('✅ Deleted session:', deletedSession.id);
    });

    console.log('🎉 Session deletion completed successfully');

    res.json({
      success: true,
      message: 'Session berhasil dihapus'
    });

  } catch (error) {
    console.error('❌ Error deleting session:', error);
    res.status(500).json({
      error: 'Gagal menghapus session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      success: false
    });
  }
});

module.exports = router;