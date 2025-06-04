const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Redis client setup with retry strategy
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with an error
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands with an error
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

redisClient.on('error', err => console.error('Redis Client Error', err));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

app.use(cors());
app.use(express.json());

// Health check endpoint for Railway
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await redisClient.ping();
    res.json({ status: 'healthy', redis: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', redis: 'disconnected' });
  }
});

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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redisClient.quit();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 