const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Facebook pages table
  db.run(`
    CREATE TABLE IF NOT EXISTS facebook_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      page_id TEXT NOT NULL,
      page_name TEXT NOT NULL,
      access_token TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Conversations table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      message_id TEXT UNIQUE NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message_text TEXT NOT NULL,
      is_from_customer BOOLEAN DEFAULT 1,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    )
  `);
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
          res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: this.lastID, name, email }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(user);
  });
});

// Connect Facebook page
app.post('/api/facebook/connect', authenticateToken, (req, res) => {
  const { pageId, pageName, accessToken } = req.body;

  if (!pageId || !pageName || !accessToken) {
    return res.status(400).json({ error: 'Page ID, name, and access token are required' });
  }

  // Check if page is already connected
  db.get(
    'SELECT * FROM facebook_pages WHERE user_id = ? AND page_id = ?',
    [req.user.id, pageId],
    (err, page) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (page) {
        return res.status(400).json({ error: 'Page already connected' });
      }

      // Insert new page connection
      db.run(
        'INSERT INTO facebook_pages (user_id, page_id, page_name, access_token) VALUES (?, ?, ?, ?)',
        [req.user.id, pageId, pageName, accessToken],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to connect page' });
          }

          res.json({
            message: 'Page connected successfully',
            page: { id: this.lastID, pageId, pageName }
          });
        }
      );
    }
  );
});

// Get connected Facebook pages
app.get('/api/facebook/pages', authenticateToken, (req, res) => {
  db.all(
    'SELECT id, page_id, page_name, created_at FROM facebook_pages WHERE user_id = ?',
    [req.user.id],
    (err, pages) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(pages);
    }
  );
});

// Disconnect Facebook page
app.delete('/api/facebook/pages/:pageId', authenticateToken, (req, res) => {
  const { pageId } = req.params;

  db.run(
    'DELETE FROM facebook_pages WHERE user_id = ? AND page_id = ?',
    [req.user.id, pageId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Page not found' });
      }

      res.json({ message: 'Page disconnected successfully' });
    }
  );
});

// Get conversations
app.get('/api/conversations', authenticateToken, (req, res) => {
  // Get user's connected pages
  db.all(
    'SELECT page_id FROM facebook_pages WHERE user_id = ?',
    [req.user.id],
    (err, pages) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (pages.length === 0) {
        return res.json([]);
      }

      const pageIds = pages.map(p => p.page_id);
      const placeholders = pageIds.map(() => '?').join(',');

      db.all(
        `SELECT 
          c.*,
          (SELECT message_text FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
         FROM conversations c 
         WHERE c.page_id IN (${placeholders})
         ORDER BY c.last_message_at DESC`,
        pageIds,
        (err, conversations) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(conversations);
        }
      );
    }
  );
});

// Get conversation messages
app.get('/api/conversations/:id/messages', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.all(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
    [id],
    (err, messages) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(messages);
    }
  );
});

// Send message
app.post('/api/conversations/:id/messages', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Get conversation details
  db.get('SELECT * FROM conversations WHERE id = ?', [id], (err, conversation) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get user details
    db.get('SELECT name FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Insert message
      const messageId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      db.run(
        'INSERT INTO messages (conversation_id, message_id, sender_id, sender_name, message_text, is_from_customer) VALUES (?, ?, ?, ?, ?, ?)',
        [id, messageId, req.user.id, user.name, message, 0],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to send message' });
          }

          // Update conversation last message time
          db.run(
            'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
          );

          res.json({
            message: 'Message sent successfully',
            messageData: {
              id: this.lastID,
              conversation_id: id,
              message_id: messageId,
              sender_id: req.user.id,
              sender_name: user.name,
              message_text: message,
              is_from_customer: 0,
              timestamp: new Date().toISOString()
            }
          });
        }
      );
    });
  });
});

// Facebook webhook verification
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'your-verify-token';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Facebook webhook handler
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach((entry) => {
      const webhookEvent = entry.messaging[0];
      console.log('Received webhook event:', webhookEvent);

      if (webhookEvent.message) {
        handleMessage(webhookEvent);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Handle incoming Facebook messages
function handleMessage(event) {
  const senderId = event.sender.id;
  const pageId = event.recipient.id;
  const messageText = event.message.text;
  const messageId = event.message.mid;

  // Check if we have a recent conversation (within 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  db.get(
    'SELECT * FROM conversations WHERE page_id = ? AND customer_id = ? AND last_message_at > ? ORDER BY last_message_at DESC LIMIT 1',
    [pageId, senderId, twentyFourHoursAgo],
    (err, conversation) => {
      if (err) {
        console.error('Database error:', err);
        return;
      }

      if (conversation) {
        // Add message to existing conversation
        addMessageToConversation(conversation.id, messageId, senderId, messageText);
      } else {
        // Create new conversation
        createNewConversation(pageId, senderId, messageId, messageText);
      }
    }
  );
}

function createNewConversation(pageId, customerId, messageId, messageText) {
  // For demo purposes, we'll use a simple name format
  const customerName = `Customer ${customerId.substr(-4)}`;

  db.run(
    'INSERT INTO conversations (page_id, customer_id, customer_name) VALUES (?, ?, ?)',
    [pageId, customerId, customerName],
    function (err) {
      if (err) {
        console.error('Error creating conversation:', err);
        return;
      }

      addMessageToConversation(this.lastID, messageId, customerId, messageText, customerName);
    }
  );
}

function addMessageToConversation(conversationId, messageId, senderId, messageText, senderName = null) {
  const name = senderName || `Customer ${senderId.substr(-4)}`;

  db.run(
    'INSERT INTO messages (conversation_id, message_id, sender_id, sender_name, message_text, is_from_customer) VALUES (?, ?, ?, ?, ?, ?)',
    [conversationId, messageId, senderId, name, messageText, 1],
    (err) => {
      if (err) {
        console.error('Error adding message:', err);
        return;
      }

      // Update conversation last message time
      db.run(
        'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );

      console.log('Message added to conversation');
    }
  );
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});