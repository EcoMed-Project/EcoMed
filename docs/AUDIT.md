# Diagnóstico inicial — 20/10/2026

## Achados críticos

- O `package-lock.json` não está sincronizado com o `package.json`; `npm ci` não consegue instalar as dependências.
- O ZIP trazia `.env`; ele foi removido da cópia de trabalho e a regra de ignore passou a cobrir `.env*`. A rotação das credenciais originais continua sendo responsabilidade do Programador.
- A base era TanStack Start dependente de pacotes e gateways Lovable, com build alvo não adequado a um servidor Express local.
- A home afirmava integração ao SUS e a tela de descarte apresentava farmácias como parceiras e dizia identificar medicamentos. Essas alegações não estão comprovadas.
- O mapa era um iframe do Google Maps; não havia uma execução Express única e autônoma.

## Resultado da linha de base

`npm ci` falhou porque lockfile e manifesto não estão sincronizados. Por não haver dependências instaladas, `npm run build` também falhou: `vite` não foi reconhecido. O log não comprova uma build funcional da base original.

## Decisão aplicada

O projeto foi convertido para um servidor Node/Express independente, com interface estática progressiva, APIs próprias de CEP/pontos e dados públicos do OpenStreetMap. A execução não requer chaves. Informações sem verificação são rotuladas como demonstração ou requerem confirmação.
