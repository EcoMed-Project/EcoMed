import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import { brand, button, card, container, footer, heading, hr, link, main, text } from './styles'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName.toUpperCase()}</Text>
        <Section style={card}>
          <Heading style={heading}>Confirme seu e-mail</Heading>
          <Text style={text}>
            Boas-vindas ao{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            , a plataforma de doação e reaproveitamento seguro de medicamentos integrada ao SUS.
          </Text>
          <Text style={text}>
            Para ativar sua conta, confirme o endereço <strong>{recipient}</strong>:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirmar e-mail
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não criou uma conta no {siteName}, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
