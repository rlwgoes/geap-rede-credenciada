// Proxy serverless (Vercel) para a API pública da rede credenciada GEAP.
// GET /api/geap?tipo=1&plano=15&uf=SC&cidade=7438&page=1&size=100
const BASE =
  "https://apicore.geap.com.br/Beneficiario/v1/RedeCredenciada/ConsultaRedeCredenciada";

const num = (v, def, min, max) => {
  const n = parseInt(v ?? def, 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
};

module.exports = async (req, res) => {
  const q = req.query || {};
  const tipo = num(q.tipo, 1, 1, 99);
  const plano = num(q.plano, 15, 1, 99999);
  const cidade = num(q.cidade, 7438, 1, 9999999);
  const page = num(q.page, 1, 1, 10000);
  const size = num(q.size, 100, 1, 500);
  const uf = String(q.uf || "SC").toUpperCase();

  if ([tipo, plano, cidade, page, size].includes(null) || !/^[A-Z]{2}$/.test(uf)) {
    res.status(400).json({ error: "Parâmetros inválidos" });
    return;
  }

  const params =
    `tipoConsulta:1;NroPlano:${plano};SglUF:${uf};NroCidade:${cidade};` +
    `NroTpoEstabelecimento:${tipo};NroEspAtendimento:;Bairro:;NmeFantasia:;` +
    `StaUrgEmerg:;StaHoraMarcada:;NroContratado:;reciprocidadeId:;`;
  const url = `${BASE}?Parameters=${params}&PageSize=${size}&pageNumber=${page}`;

  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const body = await r.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(r.status).send(body);
  } catch (e) {
    res.status(502).json({ error: "Falha ao consultar a API da GEAP", detail: String(e) });
  }
};
