const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', require('./routes/api-routes.js'));

app.listen(PORT, () => console.log(`🟢 Server running on http://localhost:${PORT}`));
