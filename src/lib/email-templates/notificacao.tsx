import React from 'react'
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
import type { TemplateEntry } from './registry'

interface Props {
  title?: string
  body?: string
  name?: string
}

const Email = ({ title, body, name }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{title || 'Atualização da sua conta no EcoMed Brasil'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>EcoMed Brasil</Text>
        <Section style={card}>
          <Heading style={heading}>{title || 'Atualização'}</Heading>
          <Text style={text}>{name ? `Olá, ${name}!` : 'Olá!'}</Text>
          <Text style={text}>{body || 'Há uma novidade na sua conta EcoMed Brasil.'}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Você recebeu este aviso porque tem uma conta no EcoMed Brasil, plataforma de doação e
          reaproveitamento seguro de medicamentos integrada ao SUS.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `EcoMed Brasil — ${data['title'] || 'Atualização da sua conta'}`,
  displayName: 'Aviso de doação, estoque ou solicitação',
  previewData: {
    title: 'Doação aprovada!',
    body: 'Sua doação de Dipirona 500mg foi aprovada e você recebeu 30 pontos.',
    name: 'Maria',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const brand = { fontSize: '14px', fontWeight: 700, color: '#0f7b58', letterSpacing: '0.08em' }
const card = {
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px 24px',
  backgroundColor: '#f8fafc',
}
const heading = { fontSize: '20px', color: '#0f172a', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 10px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0 12px' }
const footer = { fontSize: '12px', lineHeight: '18px', color: '#64748b' }
