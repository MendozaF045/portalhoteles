require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const authHotelRoutes = require('./routes/authHotel.routes');
const authAdminRoutes = require('./routes/authAdmin.routes');
const hotelRoutes = require('./routes/hotel.routes');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth/hotel', authHotelRoutes);
app.use('/api/auth/admin', authAdminRoutes);
app.use('/api/hotel', hotelRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`PortalHoteles API escuchando en http://localhost:${PORT}`);
});
