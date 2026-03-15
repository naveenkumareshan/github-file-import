/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({
  siteName,
  token,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for Inhale Stays</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Verification Code</Heading>
        <Text style={text}>
          Use the code below to sign in to your Inhale Stays account. This code will expire in 10 minutes.
        </Text>
        <Text style={codeStyle}>{token || '------'}</Text>
        <Text style={text}>
          Enter this code on the login page to complete your sign-in.
        </Text>
        <Text style={footer}>
          If you didn't request this code, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#f8fafb', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', marginTop: '40px', marginBottom: '40px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1E5A8A', margin: '0 0 16px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 20px', textAlign: 'center' as const }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '36px', fontWeight: 'bold' as const, color: '#1E5A8A', letterSpacing: '8px', textAlign: 'center' as const, margin: '10px 0 30px', padding: '16px 24px', backgroundColor: '#f0f7fb', borderRadius: '8px', border: '2px dashed #7BC4D4' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', textAlign: 'center' as const }
