// backend/server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.static(path.join(__dirname, '../public')));

// Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders')); // <--- Thêm dòng này

app.listen(PORT, () => {
    console.log(`Server Node.js đang chạy tại http://127.0.0.1:${PORT}`);
    console.log(`Frontend: http://127.0.0.1:5500`);
});