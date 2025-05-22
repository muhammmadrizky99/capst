// const express = require('express');
// const app = express();
// const predictRoute = require('./routes/predict');
// const cors = require('cors');
// const authRouter = require('./routes/auth');
// const userRouter = require('./routes/user'); 

// // Middleware CORS
// app.use(cors());
// app.use(express.json());

// // Routing
// app.use('/auth', authRouter);
// app.use('/user', userRouter);
// app.use('/predict', predictRoute);

// // Menjalankan server
// const PORT = 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

require('dotenv').config(); 
const express = require('express');
const app = express();
const userRouter = require('./routes/user');
const predictRouter = require('./routes/predict');
const authRouter = require('./routes/auth');
const majorRoutes = require('./routes/major')
const cors = require('cors');

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));
app.use(express.json());

// Logging untuk semua request
// Di app.js, sebelum route
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routing
app.use('/api/user', userRouter); 
app.use('/api/predict', predictRouter);
app.use('/api/auth', authRouter);
app.use('/api/major', majorRoutes)

// Test route dasar
app.get('/api/test', (req, res) => {
  res.json({ message: 'API bekerja' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('GET /api/user/me');
  console.log('GET /api/test');
});
