const express = require('express');
const bodyParser = require('body-parser');
const { PDFDocument } = require('pdf-lib');
const sgMail = require('@sendgrid/mail'); // Corrected module name
const path = require('path');
const cors = require('cors');

const app = express();
const corsOptions = {
    origin: 'https://cai-andre-mbuyus-projects.vercel.app/', // Allow requests from your Netlify frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies and credentials
};

app.use(cors(corsOptions));
// Serve static files from the "dist" directory

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Ensure this line is present

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

// Export the Express app as a serverless function
module.exports = app;
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
