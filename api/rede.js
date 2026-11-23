// Agrega a rede credenciada GEAP de todos os tipos de estabelecimento (1 a 8)
// numa única resposta compacta, com as consultas em paralelo e cache na CDN.
// GET /api/rede?uf=SC&cidade=7438&plano=15
const BASE =
  "https://apicore.geap.com.br/Beneficiario/v1/RedeCredenciada/ConsultaRedeCredenciada";
const TIPOS = [1, 2, 3, 4, 5, 6, 7, 8];
const SIZE = 100;

const int = (v, def, min, max) => {
  const n = parseInt(v ?? def, 10);
  return Number.isNaN(n) || n < min || n > max ? null : n;
};

async function pagina({ uf, cidade, plano }, tipo, page) {
  const params =
    `tipoConsulta:1;NroPlano:${plano};SglUF:${uf};NroCidade:${cidade};` +
    `NroTpoEstabelecimento:${tipo};NroEspAtendimento:;Bairro:;NmeFantasia:;` +
    `StaUrgEmerg:;StaHoraMarcada:;NroContratado:;reciprocidadeId:;`;
  const url = `${BASE}?Parameters=${params}&PageSize=${SIZE}&pageNumber=${page}`;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      return j.resultData || { totalRecords: 0, totalPages: 0, items: [] };
    } catch (e) {
      if (tentativa === 1) throw e;
    }
  }
}

const compacta = (i) => {
  const e = i.endereco || {};
  const p = i.propriedades || {};
  return {
    nome: (i.nmeFantasia || "").trim(),
    contratado: (i.nmeContratado || "").trim(),
    nro: i.nroContratado,
    doc: i.nroCPFCNPJ,
    classe: (i.desClasse || "").replace(/\s+/g, " ").trim(),
    tel: i.telefone,
    log: (e.logradouro || "").trim(),
    comp: e.complemento,
    bairro: e.bairro,
    cidade: e.nmeCidade,
    uf: e.sglEstado,
    cep: e.nroCep ? String(e.nroCep).padStart(8, "0") : "",
    lat: e.nroLatitude,
    lng: e.nroLongitude,
    esp: (i.especialidades || []).map((x) => x.esp),
    urg: !!p.urgEmerg,
    hora: !!p.horaMarcada,
    pa: !!p.prontoAtendimento,
    int: !!p.paInternado,
    ped: !!p.staAtendimentoPediatrico,
    cc: (i.corpoClinico || []).map((c) => (c.nmeCorpoClinico || "").trim()),
  };
};

async function tipoCompleto(q, tipo) {
  const first = await pagina(q, tipo, 1);
  const extras = [];
  for (let pg = 2; pg <= (first.totalPages || 1); pg++) extras.push(pagina(q, tipo, pg));
  const resto = await Promise.all(extras);
  const items = [first, ...resto].flatMap((r) => r.items || []);
  return { tipo, total: first.totalRecords || 0, itens: items.map(compacta) };
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const plano = int(q.plano, 15, 1, 99999);
  const cidade = int(q.cidade, 7438, 1, 9999999);
  const uf = String(q.uf || "SC").toUpperCase();
  if (plano === null || cidade === null || !/^[A-Z]{2}$/.test(uf)) {
    res.status(400).json({ error: "Parâmetros inválidos" });
    return;
  }
  const t0 = Date.now();
  try {
    const tipos = await Promise.all(TIPOS.map((t) => tipoCompleto({ uf, cidade, plano }, t)));
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // CDN da Vercel guarda 12h e serve versão antiga por até 7 dias enquanto atualiza.
    res.setHeader("Cache-Control", "public, s-maxage=43200, stale-while-revalidate=604800");
    if (q.resumo === "1") {
      // Diagnóstico: só contagens e tempo, sem cache
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ ms: Date.now() - t0, tipos: tipos.map((t) => ({ tipo: t.tipo, total: t.total, n: t.itens.length })) });
      return;
    }
    res.status(200).json({ consultadoEm: new Date().toISOString(), uf, cidade, plano, tipos });
  } catch (e) {
    res.status(502).json({ error: "Falha ao consultar a API da GEAP", detail: String(e) });
  }
};
