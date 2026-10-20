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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName.toUpperCase()}</Text>
        <Section style={card}>
          <Heading style={heading}>Você foi convidado</Heading>
          <Text style={text}>
            Você recebeu um convite para participar do{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            , plataforma de doação e reaproveitamento seguro de medicamentos integrada ao SUS.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Aceitar convite
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não esperava este convite, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
