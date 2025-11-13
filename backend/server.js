import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Study Buddy backend is running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // Get Gemini API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set. Make sure .env contains GEMINI_API_KEY.');
      return res.status(500).json({ error: 'Server configuration error: missing API key' });
    }

    console.info('Preparing to send message to Gemini API');

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the model instance
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate content with the user's message
    const result = await model.generateContent(message);
    const response = result.response;
    const responseText = response.text();

    console.log('AI response received');

    // Return the chatbot response
    res.json({ response: responseText });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Study Buddy backend server running on http://localhost:${PORT}`);
});