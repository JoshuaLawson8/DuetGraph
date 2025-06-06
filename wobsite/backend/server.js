const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', require('./routes/api-routes.js'));

// // Serve React frontend
// app.use(express.static(path.join(__dirname, '../frontend/dist')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });

app.listen(PORT, () => console.log(`🟢 Server running on http://localhost:${PORT}`));
