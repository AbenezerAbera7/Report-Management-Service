// server.js
const express = require('express');
require('dotenv').config();
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const protectedRoutes = require('./routes/protectedRoute');


const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static('uploads'));

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Use routes
app.use('/api', protectedRoutes);
app.get('/test', (req, res) => {
    return res.send("The Server is Up.")
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`REPORT Generation SERVICE is running on port ${PORT}`);
});
