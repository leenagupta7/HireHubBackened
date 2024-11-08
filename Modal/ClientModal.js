const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ClientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type:String,
        required:true,
    },
    projects: [{
        id: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true
          },
          filePath: {
            type: String, // Assuming file URL from Cloudinary or local file path
            required: true
          },
          skills: {
            type: [String], // Array of skills related to the project
            required: true
          },
          freelancer:[{ type: Schema.Types.ObjectId,
            ref: 'User'}],
          }
    ],
}, {
    timestamps: true,
});

const Client = mongoose.model('Client', ClientSchema);

module.exports =  Client; 