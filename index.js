const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {app,server} = require('./Socket')
const fileupload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const port = process.env.PORT || 4000;
require('dotenv').config();

//MiddleWares
app.use(express.json());
app.use(cors({
    origin: '*', 
  }));
app.use(fileupload({
    useTempFiles: true
}));

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.cloudname,
    api_key: process.env.apikey,
    api_secret: process.env.apisecret,
});

// Routes

const userRoutes = require('./routes/userRoutes');
const messageRoute = require('./routes/messageRoute');


app.use('/api/users', userRoutes);
app.use('/api/message', messageRoute);

mongoose.connect('mongodb+srv://leenagupta993:2Y56w77f7ALUYjRO@cluster0.wzkkw.mongodb.net/')
    .then(() => {
        console.log('Connected to MongoDB and website running at port 4000');
        server.listen(port, () => console.log(`Server is running on port ${port}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
