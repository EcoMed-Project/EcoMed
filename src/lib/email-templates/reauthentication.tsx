import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import { brand, card, code, container, footer, heading, hr, main, text } from './styles'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação EcoMed Brasil</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>ECOMED BRASIL</Text>
        <Section style={card}>
          <Heading style={heading}>Código de verificação</Heading>
          <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
          <Text style={code}>{token}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          O código expira em poucos minutos. Se não foi você quem solicitou, ignore este e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
