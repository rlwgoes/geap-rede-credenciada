# Rede Credenciada GEAP

Página que mostra a rede credenciada GEAP (`apicore.geap.com.br`) de todos os tipos de estabelecimento, sem paginação, em **lista** ou **mapa**, com exportação para Excel (uma aba por tipo).

**No ar:** https://geap-rede-credenciada.vercel.app

## Como funciona

- `api/rede.js`: função serverless (Vercel, região `gru1` São Paulo). Consulta os 8 tipos em paralelo, percorre todas as páginas e devolve um JSON compacto. Fica em cache na CDN por 12h (`stale-while-revalidate` de 7 dias).
- `api/geap.js`: proxy simples de uma página da API (uso avulso).
- `index.html`: interface em HTML + JS puro, com cache local no navegador (12h).
  - Mapa: [Leaflet](https://leafletjs.com) + tiles do [OpenStreetMap](https://www.openstreetmap.org) + Leaflet.markercluster. Sem chave de API e sem custo.
  - Excel: [SheetJS](https://sheetjs.com), carregado só quando você clica em "Baixar Excel".

Parâmetros: UF, NroCidade e NroPlano (padrão SC / 7438 Florianópolis / 15 GEAP Para Você SC).

Tipos: 1 Internação Hospitalar · 2 Pronto Socorro · 3 Serviço Diagnóstico/Exames · 4 Consultórios/Clínicas Especializadas · 5 Hospital com Atendimento Ambulatorial · 6 Maternidade · 7 Telemedicina · 8 (sem nome no site).
