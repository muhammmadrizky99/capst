const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const predictRouter = require('../predict');
const { PythonShell } = require('python-shell');

jest.mock('python-shell');

const app = express();
app.use(bodyParser.json());
app.use('/predict', predictRouter);

describe('POST /predict', () => {
  it('should return 400 if input is empty', async () => {
    const res = await request(app).post('/predict').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Input tidak valid atau kosong');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/predict').send({ Gender: 'Laki-laki' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Field yang diperlukan tidak lengkap');
    expect(res.body.missingFields).toContain('Minat_Teknologi');
  });

  it('should return 400 if Gender is invalid', async () => {
    const input = {
      Gender: 'Other',
      Minat_Teknologi: 'Ya',
      Minat_Seni: 'Ya',
      Minat_Bisnis: 'Ya',
      Minat_Hukum: 'Ya',
      Minat_Kesehatan: 'Ya',
      Minat_Sains: 'Ya',
      Problem_Solving: 'Sedang',
      Kreativitas: 'Sedang',
      Kepemimpinan: 'Sedang',
      Kerja_Tim: 'Sedang',
      'nilai akhir SMA/SMK': '80'
    };
    const res = await request(app).post('/predict').send(input);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Gender harus "Laki-laki" atau "Perempuan"');
  });

  it('should return 400 if minat fields are invalid', async () => {
    const input = {
      Gender: 'Laki-laki',
      Minat_Teknologi: 'Maybe',
      Minat_Seni: 'Ya',
      Minat_Bisnis: 'Ya',
      Minat_Hukum: 'Ya',
      Minat_Kesehatan: 'Ya',
      Minat_Sains: 'Ya',
      Problem_Solving: 'Sedang',
      Kreativitas: 'Sedang',
      Kepemimpinan: 'Sedang',
      Kerja_Tim: 'Sedang',
      'nilai akhir SMA/SMK': '80'
    };
    const res = await request(app).post('/predict').send(input);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Minat_Teknologi harus "Ya" atau "Tidak"');
  });

  it('should return 400 if skill levels are invalid', async () => {
    const input = {
      Gender: 'Laki-laki',
      Minat_Teknologi: 'Ya',
      Minat_Seni: 'Ya',
      Minat_Bisnis: 'Ya',
      Minat_Hukum: 'Ya',
      Minat_Kesehatan: 'Ya',
      Minat_Sains: 'Ya',
      Problem_Solving: 'Very High',
      Kreativitas: 'Sedang',
      Kepemimpinan: 'Sedang',
      Kerja_Tim: 'Sedang',
      'nilai akhir SMA/SMK': '80'
    };
    const res = await request(app).post('/predict').send(input);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Problem_Solving harus salah satu dari/);
  });

  it('should return 400 if nilai akhir SMA/SMK is invalid', async () => {
    const input = {
      Gender: 'Laki-laki',
      Minat_Teknologi: 'Ya',
      Minat_Seni: 'Ya',
      Minat_Bisnis: 'Ya',
      Minat_Hukum: 'Ya',
      Minat_Kesehatan: 'Ya',
      Minat_Sains: 'Ya',
      Problem_Solving: 'Sedang',
      Kreativitas: 'Sedang',
      Kepemimpinan: 'Sedang',
      Kerja_Tim: 'Sedang',
      'nilai akhir SMA/SMK': 'abc'
    };
    const res = await request(app).post('/predict').send(input);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Nilai akhir SMA/SMK harus berupa angka antara 0-100');
  });

  it('should call PythonShell.run and return prediction result on valid input', async () => {
    const input = {
      Gender: 'Laki-laki',
      Minat_Teknologi: 'Ya',
      Minat_Seni: 'Ya',
      Minat_Bisnis: 'Ya',
      Minat_Hukum: 'Ya',
      Minat_Kesehatan: 'Ya',
      Minat_Sains: 'Ya',
      Problem_Solving: 'Sedang',
      Kreativitas: 'Sedang',
      Kepemimpinan: 'Sedang',
      Kerja_Tim: 'Sedang',
      'nilai akhir SMA/SMK': '80'
    };

    const mockResults = [
      'Some log',
      '>>> Final result: {"top3":[["Teknologi Informasi",0.9],["Seni Rupa",0.8],["Bisnis",0.7]],"prediction":"Teknologi Informasi"}'
    ];

    PythonShell.run.mockResolvedValue(mockResults);

    const res = await request(app).post('/predict').send(input);

    expect(PythonShell.run).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.prediction).toBe('Teknologi Informasi');
    expect(res.body.result).toEqual([
      { majorName: 'Teknologi Informasi', score: 0.9 },
      { majorName: 'Seni Rupa', score: 0.8 },
      { majorName: 'Bisnis', score: 0.7 }
    ]);
  });

  it('should return 500 if PythonShell.run throws an error', async () => {
    const input = {
      Gender: 'Laki-laki',
      Minat_Teknologi: 'Ya',
      Minat_Seni: 'Ya',
      Minat_Bisnis: 'Ya',
      Minat_Hukum: 'Ya',
      Minat_Kesehatan: 'Ya',
      Minat_Sains: 'Ya',
      Problem_Solving: 'Sedang',
      Kreativitas: 'Sedang',
      Kepemimpinan: 'Sedang',
      Kerja_Tim: 'Sedang',
      'nilai akhir SMA/SMK': '80'
    };

    PythonShell.run.mockRejectedValue(new Error('Python error'));

    const res = await request(app).post('/predict').send(input);

    expect(PythonShell.run).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Gagal menjalankan prediksi');
  });

  it('should return 500 if PythonShell.run returns no output', async () => {
    const input = {
      Gender: 'Laki-laki',
      Minat_Teknologi: 'Ya',
      Minat_Seni: 'Ya',
      Minat_Bisnis: 'Ya',
      Minat_Hukum: 'Ya',
      Minat_Kesehatan: 'Ya',
      Minat_Sains: 'Ya',
      Problem_Solving: 'Sedang',
      Kreativitas: 'Sedang',
      Kepemimpinan: 'Sedang',
      Kerja_Tim: 'Sedang',
      'nilai akhir SMA/SMK': '80'
    };

    PythonShell.run.mockResolvedValue([]);

    const res = await request(app).post('/predict').send(input);

    expect(PythonShell.run).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Tidak ada output dari script Python');
  });

  // Additional tests for /save-result route
  describe('POST /predict/save-result', () => {
    const jwt = require('jsonwebtoken');
    beforeAll(() => {
      jest.spyOn(jwt, 'verify').mockImplementation((token, secret) => {
        if (token === 'validtoken') {
          return { id: 1 };
        }
        throw new Error('invalid token');
      });
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).post('/predict/save-result').send({});
      expect(res.statusCode).toBe(401);
    });

    it('should return 400 if required fields are missing', async () => {
      const token = 'validtoken';
      const res = await request(app)
        .post('/predict/save-result')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: 1 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Data tidak lengkap');
    });

    // More tests can be added here for successful save-result and error handling
  });

  // Tests for GET /major and GET /major/:majorName routes
  describe('GET /predict/major', () => {
    it('should return list of majors', async () => {
      const res = await request(app).get('/predict/major');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /predict/major/:majorName', () => {
    it('should return 404 if major not found', async () => {
      const res = await request(app).get('/predict/major/NonExistentMajor');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    // Additional tests can be added here for existing major
  });
});
