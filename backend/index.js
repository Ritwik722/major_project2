const express = require('express');
const cors = require('cors');
const app = express();
const studentRoutes = require('./routes/studentRoutes');



// Add middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api', studentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
