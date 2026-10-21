<p align="center"><img src="public/assets/logo-ecomed.jfif" width="320" alt="EcoMed Brasil"></p>

# EcoMed Brasil

**Informação que cuida. Descarte que transforma.**

Aplicação educacional que orienta o descarte de medicamentos, consulta referências de estabelecimentos próximos e demonstra a separação de embalagens em um recipiente inteligente.

## Executar

Requer Node.js 20 ou superior e npm.

```bash
npm start
```

O comando instala as dependências e inicia o Express em http://localhost:3000. Internet é necessária para a primeira instalação, mapas e consultas externas.

Após instalar, use `npm run dev` para reiniciar o servidor automaticamente ao editar o código. A porta pode ser configurada pela variável de ambiente `PORT`.

## Navegação

| Página | Recursos |
| --- | --- |
| Início | Foto fornecida pela equipe, apresentação, orientação, localização e demonstração |
| Descarte | Consulta por CEP, localização autorizada, mapa e lista de locais |
| Recipiente | Explicação dos compartimentos e simulador com bloqueio de condições inseguras |
| Aprender | Perguntas frequentes com expansão por teclado ou toque |
| Sobre | Objetivo e escopo do projeto |
| Privacidade | Descrição inicial do tratamento de localização e serviços consultados |

## Identidade e interface

Todas as páginas utilizam exclusivamente a logo e o favicon fornecidos pelo projeto. A foto da entrada também foi fornecida pela equipe.

O CSS compartilhado define espaçamento, cores, tipografia, cartões, formulários e navegação adaptável. O menu móvel oferece estado expandido, fechamento por Escape e navegação por teclado. As revelações usam IntersectionObserver, com transições de aproximadamente 1,2 segundo e suporte a redução de movimento. O conteúdo permanece acessível quando JavaScript está desativado.

## Tecnologias utilizadas

| Ferramenta | Uso |
| --- | --- |
| Node.js | Execução do servidor e testes |
| Express 5 | Arquivos públicos e endpoints JSON |
| HTML, CSS e JavaScript | Interface sem compilação |
| Leaflet 1.9.4 | Mapa interativo carregado pelo CDN unpkg |
| OpenStreetMap | Base cartográfica e links de rota |
| ViaCEP | Consulta de endereço por CEP |
| Nominatim | Geocodificação do endereço |
| Overpass | Consulta de estabelecimentos mapeados |
| Geolocation API | Localização mediante autorização do visitante |

## Estrutura

```text
public/
  assets/             Imagens oficiais
  *.html              Telas
  styles.css          Sistema visual compartilhado
  ui.js               Menu e transições
  app.js              Busca e simulador
  favicon.png         Ícone oficial
server.js             Servidor Express
test/                 Testes automatizados
package.json          Comandos e dependências
package-lock.json     Versões das dependências
```

## API

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | /healthz | Disponibilidade do servidor |
| GET | /api/cep/:cep | Endereço e coordenadas |
| GET | /api/collection-points?near=lat,lng | Referências próximas |
| POST | /api/container/decision | Decisão do simulador |

O simulador recebe `material` (`glass`, `packaging` ou desconhecido), `cameraReady` e `binsAvailable`. Uma condição insegura devolve HTTP 409 e mantém a abertura bloqueada.

## Verificar

```bash
npm test
```

## Estado real do projeto

Esta versão oferece as telas públicas e um simulador manual. Ela ainda não implementa autenticação, cadastro, doações, estoque, solicitações, pontos, notificações, painel profissional, classificação por câmera ou controle de hardware. Esses módulos continuam necessários para atingir o escopo integral dos documentos do projeto. Os testes existentes não comprovam esses fluxos.

Os locais retornados pelo OpenStreetMap precisam de confirmação de recebimento. Serviços externos podem ficar indisponíveis. Conteúdo técnico e política de privacidade ainda precisam de responsáveis e revisão antes da abertura pública completa.

O histórico Git preserva a versão original e os arquivos removidos. Não inclua senhas, tokens ou arquivos de ambiente no repositório.
