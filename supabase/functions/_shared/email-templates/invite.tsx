/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join Inhale Stays</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}><strong>Inhale Stays</strong></Link>.
          Click the button below to accept the invitation.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#f8fafb', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', marginTop: '40px', marginBottom: '40px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1E5A8A', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 25px', textAlign: 'center' as const }
const link = { color: '#1E5A8A', textDecoration: 'underline' }
const button = { backgroundColor: '#1E5A8A', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', textAlign: 'center' as const }
