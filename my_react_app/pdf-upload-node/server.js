const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const apikey = process.env.GEMINI_API_KEY;
console.log(apikey);
// import { GoogleGenAI } from "@google/genai";
// Use REST api instead

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const description = req.body.description;

  const uploadData = {
    filename: file.filename,
    originalName: file.originalname,
    filePath: path.join('uploads', file.filename),
    description: description,
    uploadedAt: new Date().toISOString()
  };

  const jsonFilename = file.filename + '.json';
  const jsonPath = path.join('uploads', jsonFilename);

  // if (!req.file) {
  //   return res.status(400).json({ message: 'No file uploaded or invalid file type' });
  // }
  // if (!description || description.trim() === '') {
  //   return res.status(400).json({ message: 'Job description is required' });
  // }

  fs.writeFile(jsonPath, JSON.stringify(uploadData, null, 2), (err) => {
  if (err) {
    console.error('Error saving metadata JSON:', err);
    return res.status(500).json({ message: 'Failed to save metadata' });
  }

  res.status(200).json({
    message: 'PDF and description uploaded successfully',
    file: req.file.filename,
    metadataFile: jsonFilename
  });
});

  // res.status(200).json({ message: 'PDF uploaded successfully', file: req.file.filename });
});


app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

app.post('/ask-gemini', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'Job description is required' });
  }
  try {
    const response = await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", 
      {
        contents: [{parts: [{text:prompt}] }]
      },
      {
        params: { key: apikey }
      }
    );
    const result = response.data;
    res.json({result});
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(generatedText);
  }
  catch(error) {
  console.error('Gemini API Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to get response from Gemini' });
  
  }
});