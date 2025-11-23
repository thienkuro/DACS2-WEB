// backend/server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500', // FE Live Server
    credentials: true
}));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,            // dev HTTP
        sameSite: 'lax',          // tường minh (mặc định là 'lax' nhưng nên ghi rõ)
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/auth', require('./routes/auth'));

app.listen(PORT, () => {
    console.log(`Server Node.js đang chạy tại http://127.0.0.1:${PORT}`);
    console.log(`Frontend: http://127.0.0.1:5500`);
});