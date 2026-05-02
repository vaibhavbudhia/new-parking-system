const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/slots',   require('./routes/slots'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin',   require('./routes/admin'));

app.get('/', (req, res) => res.json({ message: 'Parking System API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
