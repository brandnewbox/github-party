const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => console.error('Redis Client Error', err));

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

app.use(cors());
app.use(express.json());

// Endpoint to update user viewing status
app.post('/api/viewing', async (req, res) => {
  try {
    const { username, orgId, issueUrl } = req.body;
    
    if (!username || !orgId || !issueUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const key = `viewing:${orgId}:${issueUrl}`;
    
    // Get current viewers
    const currentViewers = await redisClient.get(key);
    let viewers = currentViewers ? JSON.parse(currentViewers) : [];
    
    // Add current user if not already present
    if (!viewers.includes(username)) {
      viewers.push(username);
    }
    
    // Set with 30 second expiration
    await redisClient.set(key, JSON.stringify(viewers), {
      EX: 30
    });

    res.json({ success: true, viewers });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get current viewers
app.get('/api/viewing', async (req, res) => {
  try {
    const { orgId, issueUrl } = req.query;
    
    if (!orgId || !issueUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const key = `viewing:${orgId}:${issueUrl}`;
    const viewers = await redisClient.get(key);
    
    res.json({ viewers: viewers ? JSON.parse(viewers) : [] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 