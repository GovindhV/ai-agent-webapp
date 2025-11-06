const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const AGENT_CONFIG = {
  url: '',
  apiKey: ''
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Received message: ${message}`);

    // Check if using mock mode (when Flow ID not configured)
    if (AGENT_CONFIG.url.includes('YOUR_FLOW_ID')) {
      // Mock response for testing
      const mockResponse = `Echo: ${message}\n\n(This is a mock response. To connect a real AI agent, please:\n1. Install LangFlow: pip install langflow\n2. Run: langflow run\n3. Create a flow and get your Flow ID\n4. Update AGENT_CONFIG.url in server.js)`;
      
      return res.json({
        success: true,
        response: mockResponse,
        sessionId: sessionId
      });
    }

    // LangFlow request format - try the correct structure
    const requestBody = {
      input_value: message,
      output_type: "chat",
      input_type: "chat",
      tweaks: {}
    };

    console.log('Sending request to:', AGENT_CONFIG.url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      AGENT_CONFIG.url,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(AGENT_CONFIG.apiKey && { 'x-api-key': AGENT_CONFIG.apiKey })
        },
        timeout: 30000
      }
    );

    console.log('Response:', JSON.stringify(response.data, null, 2));

    const agentResponse = response.data.outputs?.[0]?.outputs?.[0]?.results?.message?.text 
      || response.data.output 
      || response.data.result 
      || response.data.text 
      || response.data.message
      || JSON.stringify(response.data);

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`AI Agent URL: ${AGENT_CONFIG.url}`);
});