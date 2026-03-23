// NOTE: For testing Gmail Markup, both the Sender AND Receiver MUST be EXACTLY the same email string.
// No aliases (like +test) are allowed by Google's strict security filters during testing.
const nodemailer = require('nodemailer');
const testEmail = 'estt.community@gmail.com';

const targetEmail = testEmail;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: testEmail, // Must be identical to the target
    pass: 'xx',
  },
});

const markup = `
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "EventReservation",
  "reservationNumber": "TICKET-TEST-123",
  "reservationStatus": "http://schema.org/Confirmed",
  "underName": {
    "@type": "Person",
    "name": "Test User"
  },
  "reservationFor": {
    "@type": "Event",
    "name": "ESTT Annual Tech Meetup",
    "startDate": "2026-04-15T19:00:00Z",
    "location": {
      "@type": "Place",
      "name": "ESTT Campus",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Route de Ziaten",
        "addressLocality": "Tangier",
        "addressRegion": "Tanger-Tetouan-Al Hoceima",
        "postalCode": "90000",
        "addressCountry": "MA"
      }
    }
  }
}
</script>
`;

const emailHtml = `
<html>
  <head>
    ${markup}
  </head>
  <body>
      <h1>Test: ESTT Event Ticket</h1>
      <p>This is a test email to verify if the Gmail Markup (Schema.org) for ticket purchases works.</p>
  </body>
</html>
`;

const mailOptions = {
  from: testEmail, // The FROM exact address must also match
  to: targetEmail,
  subject: 'Your Ticket: ESTT Annual Tech Meetup',
  html: emailHtml,
};

console.log('Sending test email with Gmail Markup to: ' + targetEmail);

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error('Error sending email:', error);
  }
  console.log('Email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('-> Check your inbox on the Gmail web app or mobile app to see if the rich event card appears above the email body.');
});
