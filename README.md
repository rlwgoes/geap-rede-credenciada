# Rede Credenciada GEAP

Página que consulta a API pública da rede credenciada GEAP (`apicore.geap.com.br`) para todos os tipos de estabelecimento (1 a 8), percorre todas as páginas e exporta o resultado para Excel (uma aba por tipo).

- `index.html` — interface (HTML + JS puro, SheetJS para o .xlsx)
- `api/geap.js` — função serverless da Vercel que repassa a consulta à API da GEAP

Parâmetros: UF, NroCidade, NroPlano e PageSize (padrão SC / 7438 Florianópolis / plano 15 / 100).
