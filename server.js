const express = require('express');
const bodyParser = require('body-parser');
const { PDFDocument } = require('pdf-lib');
const sgMail = require('@sendgrid/mail');
const cors = require('cors');

const app = express();

const corsOptions = {
    origin: 'https://chars-i.netlify.app', // Allow requests from your Netlify frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies and credentials
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Handle form submission
app.post('/submit', async (req, res) => {
    const userInfo = req.body; // Extract user data from the request body

    try {
        // Create PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 400]); // Set page size
        const { width, height } = page.getSize();

        // Add user information to the PDF
        page.drawText(`Name: ${userInfo.firstName} ${userInfo.lastName}`, { x: 50, y: height - 50, size: 12 });
        page.drawText(`Email: ${userInfo.email}`, { x: 50, y: height - 70, size: 12 });
        page.drawText(`Age: ${userInfo.age}`, { x: 50, y: height - 90, size: 12 });
        page.drawText(`Gender: ${userInfo.gender}`, { x: 50, y: height - 110, size: 12 });

        // Save the PDF
        const pdfBytes = await pdfDoc.save();

        // Send Email with SendGrid
        const msg = {
            to: 'chars.index@gmail.com', // Send to this email
            from: 'andrembuyu487@gmail.com', // Verified sender in SendGrid
            subject: 'New User Registration',
            text: `New user registered with the following details:
                   Name: ${userInfo.firstName} ${userInfo.lastName}
                   Email: ${userInfo.email}
                   Age: ${userInfo.age}
                   Gender: ${userInfo.gender}`,
            attachments: [
                {
                    content: Buffer.from(pdfBytes).toString('base64'), // Convert PDF to base64
                    filename: 'user-info.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        };

        // Send the email
        await sgMail.send(msg);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send(`Failed to send email: ${error.message}`);
    }
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Add the new /login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Retrieve user data from IndexedDB or your database
        const user = await getUserByEmail(email); // Replace with your actual function

        if (user && user.password === password) {
            // Return user data (excluding password for security)
            res.status(200).json({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                age: user.age
            });
        } else {
            res.status(401).send('Invalid email or password.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred while logging in.');
    }
});

// Simulated function to retrieve user by email
async function getUserByEmail(email) {
    // Replace this with actual database lookup (e.g., IndexedDB, MongoDB, etc.)
    const users = [
        {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            age: 25,
            password: 'password123', // In a real app, store hashed passwords
            gender: 'male'
        },
        // Add more users as needed
    ];

    return users.find(user => user.email === email);
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
