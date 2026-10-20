# EcoMed Brasil

> Tecnologia, saúde e sustentabilidade para orientar o descarte consciente de medicamentos.

<p align="center">
  <img src="public/favicon.svg" width="72" alt="Marca EcoMed Brasil">
</p>

## Visão geral

O EcoMed Brasil é uma aplicação web e uma proposta de recipiente inteligente que tornam a jornada de descarte mais simples: a pessoa aprende como preparar os medicamentos, encontra referências públicas de locais próximos e entende como as embalagens podem ser separadas no ponto de entrega.

O projeto não identifica medicamentos, não declara parceria com estabelecimentos e não substitui orientação profissional. O recipiente identifica somente o tipo de embalagem, como vidro ou caixa/embalagem, e segue uma regra de segurança: na dúvida, não abre.

## Telas

| Tela | Objetivo | Recursos |
| --- | --- | --- |
| Início | Apresentar a proposta e a jornada | Navegação, resumo do processo, CTA de localização |
| Descarte | Preparar e localizar o descarte | CEP, geolocalização opcional, mapa e lista de referências |
| Recipiente | Explicar a solução física | Fluxo câmera, regra, LED e servo; simulador fail-closed |
| Aprender | Responder dúvidas essenciais | Perguntas expansíveis e aviso de revisão técnica |
| Sobre | Delimitar a proposta e compromissos | Orientar, localizar e separar sem alegações não verificadas |
| Privacidade | Explicar o uso de CEP e localização | Política técnica inicial e itens necessários para publicação |

## Funcionalidades

- Consulta de CEP com ViaCEP e geocodificação por Nominatim.
- Geolocalização do navegador somente após consentimento.
- Descoberta de farmácias/referências públicas no OpenStreetMap por Overpass.
- Cache em memória de resultados de busca para reduzir chamadas externas.
- Mapa Leaflet/OpenStreetMap e lista textual equivalente para acessibilidade.
- Links de rota no OpenStreetMap.
- Simulador local do recipiente inteligente.
- Regra fail-closed: câmera indisponível, classificação desconhecida ou compartimento indisponível mantêm a tampa fechada.
- Endpoint de disponibilidade em `GET /healthz`.
- Página 404 e estados de carregamento, erro e ausência de resultados na busca.

## Design e acessibilidade

A identidade usa azul-petróleo para saúde e confiança, verde profundo para sustentabilidade e azul para o material vidro. A interface é responsiva, mantém texto e ícones como sinais redundantes, oferece foco visível, um atalho para o conteúdo principal, alvos de toque adequados e uma lista equivalente ao mapa.

O ícone do projeto é vetorial e próprio, em `public/favicon.svg`. A foto presente na base recebida não foi usada na experiência pública porque não havia registro de licença ou atribuição.

## Ferramentas

| Camada | Ferramentas |
| --- | --- |
| Servidor | Node.js, Express 5 |
| Interface | HTML semântico, CSS responsivo, JavaScript nativo |
| Mapa | Leaflet, OpenStreetMap |
| Localização | Geolocation API, ViaCEP, Nominatim, Overpass API |
| Qualidade | Node Test Runner, health check HTTP |

## Executar

Pré-requisito: Node.js 20 ou superior.

```bash
npm start
```

O comando instala a dependência necessária e inicia o servidor em `http://localhost:3000`.

Para desenvolvimento com reinicialização automática:

```bash
npm run dev
```

Para os testes:

```bash
npm test
```

## Endpoints

| Método | Caminho | Finalidade |
| --- | --- | --- |
| GET | `/healthz` | Verificação de disponibilidade |
| GET | `/api/cep/:cep` | Consulta e geocodificação de CEP |
| GET | `/api/collection-points?near=lat,lng` | Referências públicas próximas |
| POST | `/api/container/decision` | Decisão segura do simulador de recipiente |

## Publicação responsável

Antes de disponibilizar ao público, conclua os itens abaixo:

1. Validar o conteúdo sanitário com profissional responsável.
2. Cadastrar pontos de coleta confirmados pelo grupo, com fonte e data de verificação.
3. Informar controlador de dados, contato, prazo de retenção e política LGPD definitiva.
4. Rotacionar quaisquer credenciais que tenham existido no arquivo compactado original.
5. Definir armazenamento, autenticação e regras de acesso antes de ativar doações, pontos, perfis ou painel profissional.
6. Testar o hardware real com câmera, servo, LED e sensores antes de associá-lo ao aplicativo.

## Licença e fontes de dados

Os resultados geográficos dependem de dados e disponibilidade de serviços externos. Dados de mapa têm atribuição ao OpenStreetMap e os locais retornados devem ser confirmados diretamente antes do deslocamento.
