import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import { brand, button, card, container, footer, heading, hr, main, text } from './styles'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail.
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a troca de e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName.toUpperCase()}</Text>
        <Section style={card}>
          <Heading style={heading}>Confirme a troca de e-mail</Heading>
          <Text style={text}>
            Você pediu para alterar o e-mail da sua conta no {siteName} de{' '}
            <strong>{oldEmail}</strong> para <strong>{newEmail}</strong>.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirmar novo e-mail
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente trocando a senha.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
