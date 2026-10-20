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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName.toUpperCase()}</Text>
        <Section style={card}>
          <Heading style={heading}>Redefinir senha</Heading>
          <Text style={text}>
            Recebemos um pedido para redefinir a senha da sua conta no {siteName}. Clique no botão
            abaixo para escolher uma nova senha.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Redefinir senha
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não solicitou a redefinição, ignore este e-mail — sua senha continuará a mesma.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
