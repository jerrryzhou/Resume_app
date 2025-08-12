const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const session = require('express-session');
require('dotenv').config();
const apikey = process.env.GEMINI_API_KEY;
console.log(apikey);


const SYSTEM_PROMPT = "You are an expert career advisor and resume optimization specialist.\n\nYour task is to carefully compare a candidate's resume with a specific job description. Based on the comparison, provide clear, actionable suggestions on how the candidate can tailor their resume to better align with the job requirements. If the job description is clearly nonsensical or unrelated to a real job, reply: Job description appears invalid.\n\nFocus on:\n- Highlighting relevant skills, experiences, or keywords that are present in the job description but missing or underemphasized in the resume.\n- Suggesting ways to rephrase existing resume content to better match the language of the job description.\n- Ensuring the suggestions remain truthful to the candidate's actual experience.\n- Keeping your tone professional, encouraging, and concise.\n\nAt the end, return your suggestions in json for easy implementation."

const app = express();
const PORT = 3000;

app.use(
  session({
    secret: "your-secret-key", // change this to something secure
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 5 * 60 * 1000 } // session lasts 5 minutes
  })
);

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

const parseUploadedPDF = async (filePath) => {
  const pdfBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(pdfBuffer);
  fs.unlink(filePath);
  return data.text;
};

app.post('/upload', upload.single('file'), async (req, res) => {
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

//   fs.writeFile(jsonPath, JSON.stringify(uploadData, null, 2), (err) => {
//   if (err) {
//     console.error('Error saving metadata JSON:', err);
//     return res.status(500).json({ message: 'Failed to save metadata' });
//   }

//   res.status(200).json({
//     message: 'PDF and description uploaded successfully',
//     file: req.file.filename,
//     metadataFile: jsonFilename
//   });
// });

  fs.writeFileSync(jsonPath, JSON.stringify(uploadData, null, 2));

   const fileBuffer = fs.readFileSync(file.path);
    const parsedData = await pdfParse(fileBuffer);
    const extractedText = parsedData.text;
    // console.log(extractedText);

    const prompt = `You are an expert. Based on the given Resume and Job Description, Tailor the resume and come up with suggestions on how to get through ATS.\n
    I do not need a description of said role.\n
    Resume: ${extractedText}\n
    Job Description: ${description}`;
    console.log("sending");
    console.log(prompt);

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        contents: [{parts: [{text:prompt}] }]
      },
      {
        params: { key: apikey }
      }
    );
    const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    req.session.aiResponse = aiResponse;
    console.log(aiResponse);
    return res.json({ success: true, redirectUrl: '/page' });
  // res.status(200).json({ message: 'PDF uploaded successfully', file: req.file.filename });
});



// app.listen(PORT, async () => {
//   console.log(`Server listening on http://localhost:${PORT}`);
//   console.log('Sending system prompt to Gemini API on startup...');
//     const suggestions = await createContext(SYSTEM_PROMPT);

//     if (suggestions) {
//         console.log('Startup response from Gemini:', suggestions);
//     } else {
//         console.log('Failed to get startup response.');
//     }
// });

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
    req.session.generatedText = generatedText;
    console.log(generatedText);
    console.log('test');
    
  }
  catch(error) {
  console.error('Gemini API Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to get response from Gemini' });
  
  }
});

async function createContext(prompt) {
  try {
    const message = [
      { role: 'user', content: SYSTEM_PROMPT }
    ]
    const response = await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [{
          role: 'user',
          parts: [{text: prompt}]
        }]
      },
      {
        params: { key: apikey }
      }
    )
    const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return result;
  }
  catch (error) {
    console.error('Error communicating with Gemini API:', error.response?.data || error.message);
    return null;
  }
}

// app.post('/api/context', async (req, res) => {
//   const { prompt } = req.body;
//   if (!prompt) {
//     return res.status(400).json({message: 'no prompt' });
//   }
//   try {
//     const message = [
//       { role: 'user', content: SYSTEM_PROMPT }
//     ]
//     const response = await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
//       {
//         contents: [{
//           role: 'user',
//           parts: [{text: prompt}]
//         }]
//       },
//       {
//         params: { key: apikey }
//       }
//     )
//     const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
//     res.json({ suggestions: aiResponse || 'No suggestions generated.' });
//   }
//   catch (error) {
//     console.error('Error communicating with Gemini API:', error.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to generate suggestions.' });
//   }
// });

app.post('/api/context', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'No prompt provided.' });
    }

    const suggestions = await createContext(prompt);
    if (suggestions) {
        res.json({ suggestions });
    } else {
        res.status(500).json({ error: 'Failed to generate suggestions.' });
    }
});

app.post('/upload-resume', upload.single('file'), async (req, res) => {
  try {
    const pdfBuffer = fs.readFileSync(req.file.path); 
    
        const data = await pdfParse(pdfBuffer);
        const text = data.text;

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({ extractedText: text });
  }
  catch (error) {
    console.error('Error parsing PDF:', err);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
})

app.get('/page', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log('Sending system prompt to Gemini API on startup...');
    const suggestions = await createContext(SYSTEM_PROMPT);

    if (suggestions) {
        console.log('Startup response from Gemini:', suggestions);
    } else {
        console.log('Failed to get startup response.');
    }
});