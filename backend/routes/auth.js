// backend/routes/auth.js


const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db'); 
const router = express.Router();


// JWT Secret Key (Use environment variables for production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';


// Register Route
router.post('/register', async (req, res) => {
   const { name, email, password, company } = req.body;


   try {
       // Check if the user already exists
       const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
       if (userQuery.rows.length > 0) {
           return res.status(400).json({ error: 'User already exists' });
       }
       // Hash the password before storing it
       const hashedPassword = await bcrypt.hash(password, 10);
       // Insert the new user into the database
       const insertQuery = `
           INSERT INTO users (name, email, password, company, status, registration_time)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, company;
       `;
       const values = [name, email, hashedPassword, company || 'N/A', 'active', new Date()];
       const result = await pool.query(insertQuery, values);


       res.status(201).json(result.rows[0]);
   } catch (error) {
       console.error('Error registering user:', error);
       res.status(500).json({ error: 'Something went wrong during registration' });
   }
});

// Login Route
router.post('/login', async (req, res) => {
   const { email, password } = req.body;


   try {
       // Check if the user exists
       const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
       if (userQuery.rows.length === 0) {
           return res.status(400).json({ error: 'User not found' });
       }
       const user = userQuery.rows[0];


// Check if the user is blocked
       if (user.status === 'blocked') {
           return res.status(403).json({ error: 'Your account is blocked' });
       }
       // Compare the provided password with the hashed password
       const isMatch = await bcrypt.compare(password, user.password);
       if (!isMatch) {
           return res.status(400).json({ error: 'Invalid credentials' });
       }
       // Update the last login time
       await pool.query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(), user.id]);

       // Generate a JWT token
       const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
       res.json({ token });
   } catch (error) {
       console.error('Error logging in:', error);
       res.status(500).json({ error: 'Something went wrong during login' });
   }
});


// Fetch Users Route (for dashboard view)
router.get('/users', async (req, res) => {
   try {
       // Include last_login and company in the query
       const usersQuery = await pool.query(
           'SELECT id, name, email, company, last_login, status, registration_time FROM users ORDER BY registration_time DESC'
       );


       res.json(usersQuery.rows);
   } catch (error) {
       console.error('Error fetching users:', error);
       res.status(500).json({ error: 'Failed to fetch users' });
   }
});


// DELETE Route to delete selected users
router.post('/delete', async (req, res) => {
   const { userIds } = req.body;


   try {
       const deleteQuery = 'DELETE FROM users WHERE id = ANY($1::int[])';
       const values = [userIds];


       const result = await pool.query(deleteQuery, values);


       if (result.rowCount > 0) {
           res.status(200).json({ message: 'Users deleted successfully' });
       } else {
           res.status(400).json({ error: 'No users were deleted' });
       }
   } catch (error) {
       console.error('Error deleting users:', error);
       res.status(500).json({ error: 'Something went wrong' });
   }
});




// Block Route to block selected users
router.post('/block', async (req, res) => {
   const { userIds } = req.body;


   try {
       const updateQuery = 'UPDATE users SET status = $1 WHERE id = ANY($2::int[])';
       const values = ['blocked', userIds];


       const result = await pool.query(updateQuery, values);


       if (result.rowCount > 0) {
           res.status(200).json({ message: 'Users blocked successfully' });
       } else {
           res.status(400).json({ error: 'No users were blocked' });
       }
   } catch (error) {
       console.error('Error blocking users:', error);
       res.status(500).json({ error: 'Something went wrong' });
   }
});

// Unblock Route to unblock selected users
router.post('/unblock', async (req, res) => {
    const { userIds } = req.body;

    try {
        const updateQuery = 'UPDATE users SET status = $1 WHERE id = ANY($2::int[])';
        const values = ['active', userIds];

        const result = await pool.query(updateQuery, values);

        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Users unblocked successfully' });
        } else {
            res.status(400).json({ error: 'No users were unblocked' });
        }
    } catch (error) {
        console.error('Error unblocking users:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});


// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
   const authHeader = req.headers['authorization'];
   const token = authHeader && authHeader.split(' ')[1];


   if (!token) {
       return res.status(401).json({ error: 'Access denied, token missing' });
   }


   jwt.verify(token, JWT_SECRET, (err, user) => {
       if (err) {
           return res.status(403).json({ error: 'Invalid token' });
       }
       req.user = user;
       next();
   });
};


// Example protected route (optional)
router.get('/profile', authenticateToken, async (req, res) => {
   try {
       const userQuery = await pool.query('SELECT id, name, email, company FROM users WHERE id = $1', [req.user.userId]);
       if (userQuery.rows.length === 0) {
           return res.status(404).json({ error: 'User not found' });
       }
       res.json(userQuery.rows[0]);
   } catch (error) {
       console.error('Error fetching profile:', error);
       res.status(500).json({ error: 'Something went wrong' });
   }
});


module.exports = router;