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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso ao {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName.toUpperCase()}</Text>
        <Section style={card}>
          <Heading style={heading}>Seu link de acesso</Heading>
          <Text style={text}>
            Clique no botão abaixo para entrar no {siteName}. Por segurança, o link expira em pouco
            tempo e só pode ser usado uma vez.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Entrar na plataforma
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não pediu este link, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
