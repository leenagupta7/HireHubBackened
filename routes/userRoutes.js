const express = require('express');
const router = express.Router();
const User = require('../Modal/UserModal');
const Client = require('../Modal/ClientModal');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const fetchUser = require('../middleware/middleware')

const saltRounds = 10;

async function hashPassword(password){
    try{
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password,salt);
        return hashedPassword;
    }catch(error){
        console.log(error);
    }
}

router.post('/login', async (req, res) => {
    const { email, password, category } = req.body;
    try {
        let userModel;

        if (category === 'User') {
            userModel = Freelancer;
        } else if (category === 'Client') {
            userModel = Client;
        } else {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const found = await userModel.findOne({ email: email });
        if (!found) {
            return res.status(400).json({ message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(password, found.password);
        if (passwordMatch) {
            const data = {
                user: {
                    id: found._id,
                    name: found.name,
                    email: found.email,
                }
            }
            const token = jwt.sign(data, process.env.secret_key);
            res.json({ success: true, token, data });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error', details: error });
    }
});

router.post('/signup',async(req,res)=>{
    const { name, email, password, category } = req.body;
    try {
        let userModel;

        if (category === 'Freelancer') {
            userModel = User;
        } else if (category === 'Client') {
            userModel = Client;
        } else {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const found = await userModel.findOne({ email: email });
        if (found) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
        });
        await newUser.save();

        const data = {
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        };
        const token = jwt.sign(data, process.env.secret_key);
        res.json({
            success: true,
            token,
            data,
            category
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
})

  router.post('/postProject/:id', async (req, res) => {
    try {
      const clientId  = req.params.id;
      const { description, skills } = req.body;
      const file = req.files?.file ?? null;
    if (!file) {
        return res.status(500).json({ error: 'Error file is null' });
    }
    cloudinary.uploader.upload(file.tempFilePath, async (err, result) => {
        if (err) {
            console.error('Error uploading to Cloudinary:', err);
            return res.status(500).json({ error: 'Error uploading to Cloudinary' });
        }
      const newProject = {
        description,
        filePath: result.secure_url,  // The secure URL from Cloudinary
        skills: skills.split(','),  // Assuming skills are passed as a comma-separated string
      };
  
      // Find the client by ID and add the project to their projects array
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      const lastProject = client.projects[client.projects.length - 1];
      const newId = lastProject ? lastProject.id + 1 : 1; // Default to 1 if no projects exist

      newProject.id = newId;
      client.projects.push(newProject);
      await client.save();
  
      res.status(200).json({
        message: 'Project added successfully',
        project: newProject,
      });
    })
        
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error adding project' });
    }
  });

  router.get('/getproject', async (req, res) => {
    try {
      // Retrieve all clients from the database
      const clients = await Client.find();
  
      if (!clients || clients.length === 0) {
        return res.status(404).json({ message: 'No clients found' });
      }
  
      // Initialize an array to store all projects
      let allProjects = [];
  
      // Traverse through every client and push their projects into the array
      clients.forEach(client => {
        if (client.projects && client.projects.length > 0) {
          // Add client_id to each project
          const projectsWithClientId = client.projects.map(project => ({
            ...project.toObject(), // Convert project to a plain object if it's a Mongoose object
            client_id: client._id // Add the client ID to the project
          }));
          
          // Add projects with client_id to allProjects array
          allProjects = [...allProjects, ...projectsWithClientId];
        }
      });
  
      // Sort all projects by timestamp in descending order (most recent first)
      allProjects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
      res.status(200).json({
        message: 'Projects received and sorted successfully',
        projects: allProjects,
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving projects' });
    }
  });
  
  router.post('/placebid/:userid', async (req, res) => {
    try {
      const { userid } = req.params;
      const { clientid, id } = req.body;
  
      // Use findOneAndUpdate to update the specific project in the projects array
      const client = await Client.findOneAndUpdate(
        {
          _id: clientid,
          'projects.id': id,
        },
        {
          $addToSet: { 'projects.$.freelancer': userid },
        },
        { new: true, upsert: false }
      );
  
      if (!client) {
        return res.status(404).json({ message: 'Client or project not found' });
      }
  
      res.status(200).json({
        message: 'Bid placed successfully',
        project: client.projects.find(project => project.id === id),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error placing bid' });
    }
  });
  
module.exports = router;

