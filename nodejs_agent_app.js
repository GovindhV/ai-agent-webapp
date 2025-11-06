// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Configuration for your AI Agent (LangFlow/Flowise endpoint)
const AGENT_CONFIG = {
  url: 'http://localhost:7860/api/v1/run/YOUR_FLOW_ID', // LangFlow default
  // Alternative for Flowise: 'http://localhost:3000/api/v1/prediction/YOUR_CHATFLOW_ID'
  apiKey: 'YOUR_API_KEY' // Optional, depending on your setup
};

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to communicate with AI Agent
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Received message: ${message}`);

    // Call the AI Agent API
    const response = await axios.post(
      AGENT_CONFIG.url,
      {
        input: message,
        session_id: sessionId || 'default-session',
        // Additional parameters based on your agent configuration
        tweaks: {
          // You can add custom parameters here
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AGENT_CONFIG.apiKey}`,
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Extract the agent's response
    const agentResponse = response.data.output || response.data.text || response.data;

    res.json({
      success: true,
      response: agentResponse,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Error calling AI Agent:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get response from AI Agent',
      details: error.response?.data || error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`AI Agent URL: ${AGENT_CONFIG.url}`);
});
