import sgMail from '@sendgrid/mail'

const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim()
const emailFrom = process.env.EMAIL_FROM || 'PreLoved <hello@preloved.app>'
const replyTo = process.env.SENDGRID_REPLY_TO?.trim()
const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

function ensureSendGridConfigured() {
  if (!sendGridApiKey) {
    throw new Error('Email is not configured. Missing SENDGRID_API_KEY')
  }

  if (sendGridApiKey === 'your-sendgrid-api-key') {
    throw new Error('SENDGRID_API_KEY is still a placeholder. Set your real SendGrid API key in .env')
  }

  sgMail.setApiKey(sendGridApiKey)
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  ensureSendGridConfigured()
  const verifyUrl = `${appUrl}/verify-email?token=${token}`

  await sgMail.send({
    from: emailFrom,
    to: email,
    replyTo,
    subject: 'Verify your PreLoved account email',
    text: `Hi ${name},\n\nVerify your email by opening this link: ${verifyUrl}\n\nIf you did not create this account, ignore this email.`,
  })
}
