import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

// Handle __dirname and __filename in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Update this to your frontend's URL
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Rate Limiting
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests, please try again later.',
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Azure Speech Configuration
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
const AZURE_VOICE_NAME = process.env.AZURE_VOICE_NAME;

if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION || !AZURE_VOICE_NAME) {
  throw new Error('Azure Speech service environment variables are not defined.');
}

// Function to build SSML with viseme information
function buildSSML(message) {
  return `<speak version="1.0"
  xmlns="http://www.w3.org/2001/10/synthesis"
  xmlns:mstts="https://www.w3.org/2001/mstts"
  xml:lang="en-US">
  <voice name="${AZURE_VOICE_NAME}">
      <mstts:viseme type="redlips_front"/>
      <mstts:express-as style="excited">
          <prosody rate="-8%" pitch="23%">
              ${message}
          </prosody>
      </mstts:express-as>
      <mstts:viseme type="sil"/>
      <mstts:viseme type="sil"/>
  </voice>
  </speak>`;
}

// Text-to-Speech Function with Viseme Capture
const textToSpeech = async (message) => {
  return new Promise((resolve, reject) => {
    const ssml = buildSSML(message);
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3; // MP3 format
    speechConfig.speechSynthesisVoiceName = AZURE_VOICE_NAME;

    let visemes = [];

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    synthesizer.visemeReceived = (s, e) => {
      visemes.push({
        offset: e.audioOffset / 10000, // Convert to desired units if needed
        id: e.visemeId,
      });
    };

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const audioBuffer = Buffer.from(result.audioData);
          synthesizer.close();
          resolve({ audioBuffer, visemes });
        } else {
          synthesizer.close();
          reject(new Error('Speech synthesis failed.'));
        }
      },
      (error) => {
        synthesizer.close();
        reject(error);
      }
    );
  });
};

// Endpoint to handle chat messages with viseme data
app.post('/api/chat', chatLimiter, async (req, res) => {
  let { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Sanitize input
  message = sanitizeHtml(message, {
    allowedTags: [],
    allowedAttributes: {},
  });

  try {
    // Get response from OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
    });

    const aiText = aiResponse.choices[0].message.content.trim();

    // Convert text to speech using Azure with visemes
    const { audioBuffer, visemes } = await textToSpeech(aiText);

    // Generate unique filename
    const uniqueFilename = `response_${uuidv4()}.mp3`;
    const filePath = path.join(__dirname, uniqueFilename);

    // Save the audio buffer to a file
    fs.writeFileSync(filePath, audioBuffer);

    // Send response, audio filename, and visemes
    res.json({ response: aiText, audio: uniqueFilename, visemes });
  } catch (error) {
    console.error('Error in /api/chat:', error.message);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Endpoint to serve audio files based on filename
app.get('/api/audio/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'Audio file not found.' });
    }

    res.set({
      'Content-Type': 'audio/mpeg', // Updated for MP3
      'Content-Disposition': `attachment; filename=${filename}`,
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    // Delete the file after serving
    res.on('finish', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
