import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { to, subject, text, html } = await request.json();

    // Validate input
    if (!to || !subject || (!text && !html)) {
      return new Response(
        JSON.stringify({
          error:
            "Recipient, subject, and either text or HTML content are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a transporter
    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or any email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({
        message: "Email sent successfully!",
        info,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send email. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// {
//     "to": "recipient@example.com",
//     "subject": "Hello from Next.js App Router",
//     "text": "This is a plain text email.",
//     "html": "<p>This is an <strong>HTML</strong> email.</p>"
//   }

// {
//     "message": "Email sent successfully!",
//     "info": {
//       "messageId": "abc123@your-email-service.com"
//     }
//   }

// {
//     "error": "Failed to send email. Please try again later."
//   }
