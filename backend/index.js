const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/businesses', require('./routes/business'));
app.use('/api/branches', require('./routes/branch'));
app.use('/api/clients', require('./routes/client'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/finances', require('./routes/finance'));
app.use('/api/services', require('./routes/service'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
