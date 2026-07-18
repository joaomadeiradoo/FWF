// COMPETITION TEMPLATES — the dropdown the host picks from.
//
// A TEMPLATE is static: format, scoring, and which data source (if any) can score
// it autonomously. It carries NO real teams and NO drawn fixtures — those belong
// to an INSTANCE created when the host actually runs the edition (see engine.js
// generateSlots + the instance/import flow described in README.md).
//
// HONESTY RULES baked in:
//  - formatStatus: 'confirmed'  = current/next edition's format is official.
//                  'provisional'= inferred from the previous edition; VERIFY before instancing.
//                  'tbd'        = host/format not yet decided; engine refuses to instance.
//  - dataSource.verified: true only for football-data.org FREE-TIER codes confirmed
//    to exist (CL, EC, WC). Everything else is provider:'none' -> manual scoring,
//    until a paid/alternate provider is added. No competition code is guessed.
//  - Third-place matches, best-thirds counts etc. for future editions are inferred
//    from the last edition and flagged; they are NOT asserted as certain.

const TEMPLATES = [
  // ─────────────────────────────── AUTONOMOUS (football-data free tier) ──────────
  {
    id: 'champions-league',
    name: 'Liga dos Campeões',
    confederation: 'UEFA',
    seasonParameterized: true,              // one template, a new instance each season
    host: null,
    window: 'Setembro a Maio',
    formatType: 'LEAGUE_KO',
    formatStatus: 'confirmed',              // 36-team league phase, stable since 2024/25
    format: {
      leagueSize: 36,
      matchesPerTeam: 8,
      points: { win: 3, draw: 1, loss: 0 },
      bands: [
        { id: 'direct',  range: [1, 8],   label: 'Apuramento direto (Oitavos)' },
        { id: 'playoff', range: [9, 24],  label: 'Play-off de acesso' },
        { id: 'out',     range: [25, 36], label: 'Eliminado' },
      ],
      knockout: ['PLAYOFF', 'R16', 'QF', 'SF', 'FINAL'],
      knockoutLegs: { PLAYOFF: 2, R16: 2, QF: 2, SF: 2, FINAL: 1 },
    },
    dataSource: { provider: 'football-data', code: 'CL', verified: true, liveDelayed: true,
      bootstrap: 'GET /competitions/CL/teams + /competitions/CL/matches after the draw' },
    scoring: 'optionB-reach-league',
  },
  {
    id: 'euro-2028',
    name: 'Euro 2028',
    confederation: 'UEFA',
    year: 2028,
    host: 'Reino Unido e República da Irlanda',
    window: 'Junho a Julho de 2028',
    formatType: 'GROUPS_KO',
    formatStatus: 'provisional',            // assumes the 24-team format of Euro 2020/2024
    format: {
      groups: 6, teamsPerGroup: 4,
      advance: { perGroup: 2, bestThirds: 4 },   // 24 -> 16
      knockout: ['R16', 'QF', 'SF', 'FINAL'],     // Euro has no third-place match
    },
    dataSource: { provider: 'football-data', code: 'EC', verified: true, liveDelayed: true,
      bootstrap: 'GET /competitions/EC/teams + /matches once qualifying is done' },
    scoring: 'optionB-reach-cumulative',
  },
  {
    id: 'world-cup-2030',
    name: 'Mundial 2030',
    confederation: 'FIFA',
    year: 2030,
    host: 'Portugal, Espanha e Marrocos',
    window: 'Junho a Julho de 2030',
    formatType: 'GROUPS_KO',
    formatStatus: 'provisional',            // assumes the 48-team / 12-group format of 2026
    format: {
      groups: 12, teamsPerGroup: 4,
      advance: { perGroup: 2, bestThirds: 8 },    // 48 -> 32
      knockout: ['R32', 'R16', 'QF', 'SF', 'FINAL', 'THIRD'],
    },
    dataSource: { provider: 'football-data', code: 'WC', verified: true, liveDelayed: true,
      bootstrap: 'GET /competitions/WC/teams + /matches once qualifying is done' },
    scoring: 'optionB-reach-cumulative',
  },

  // ─────────────────────────────── MANUAL (no free data source) ──────────────────
  {
    id: 'asian-cup-2027',
    name: 'Copa da Ásia 2027',
    confederation: 'AFC',
    year: 2027,
    host: 'Arábia Saudita',
    window: 'Janeiro a Fevereiro de 2027',
    formatType: 'GROUPS_KO',
    formatStatus: 'provisional',            // assumes 24-team format of 2023
    format: {
      groups: 6, teamsPerGroup: 4,
      advance: { perGroup: 2, bestThirds: 4 },
      knockout: ['R16', 'QF', 'SF', 'FINAL'],   // AFC dropped the 3rd-place match; VERIFY
    },
    dataSource: { provider: 'none', verified: false,
      note: 'Not on football-data free tier. Manual entry, or add a provider (api-football/paid).' },
    scoring: 'optionB-reach-cumulative',
  },
  {
    id: 'afcon-2027',
    name: 'Taça das Nações Africanas 2027',
    confederation: 'CAF',
    year: 2027,
    host: 'Quénia, Uganda e Tanzânia',
    window: 'Junho a Julho de 2027',
    formatType: 'GROUPS_KO',
    formatStatus: 'provisional',            // assumes 24-team format of 2023/2025
    format: {
      groups: 6, teamsPerGroup: 4,
      advance: { perGroup: 2, bestThirds: 4 },
      knockout: ['R16', 'QF', 'SF', 'FINAL', 'THIRD'],   // AFCON keeps a 3rd-place match
    },
    dataSource: { provider: 'none', verified: false,
      note: 'Not on football-data free tier. Manual entry, or add a provider.' },
    scoring: 'optionB-reach-cumulative',
  },
  {
    id: 'gold-cup-2027',
    name: 'Copa Ouro CONCACAF 2027',
    confederation: 'CONCACAF',
    year: 2027,
    host: 'EUA (provável)',
    window: 'Junho a Julho de 2027',
    formatType: 'GROUPS_KO',
    formatStatus: 'provisional',            // assumes 16-team format of recent editions
    format: {
      groups: 4, teamsPerGroup: 4,
      advance: { perGroup: 2, bestThirds: 0 },    // 16 -> 8 straight to QF
      knockout: ['QF', 'SF', 'FINAL'],            // no 3rd-place match in recent editions; VERIFY
    },
    dataSource: { provider: 'none', verified: false,
      note: 'Not on football-data free tier. Manual entry, or add a provider.' },
    scoring: 'optionB-reach-cumulative',
  },
  {
    id: 'copa-america-2028',
    name: 'Copa América 2028',
    confederation: 'CONMEBOL',
    year: 2028,
    host: 'Por definir',
    window: 'Junho a Julho de 2028',
    formatType: 'GROUPS_KO',
    formatStatus: 'tbd',                    // host AND format unconfirmed — engine will refuse
    format: {
      groups: 4, teamsPerGroup: 4,          // placeholder mirror of 2024; CONFIRM before use
      advance: { perGroup: 2, bestThirds: 0 },
      knockout: ['QF', 'SF', 'FINAL', 'THIRD'],
    },
    dataSource: { provider: 'none', verified: false,
      note: 'Not on football-data free tier. Manual entry, or add a provider.' },
    scoring: 'optionB-reach-cumulative',
  },
  {
    id: 'club-wc-2029',
    name: 'Mundial de Clubes 2029',
    confederation: 'FIFA',
    year: 2029,
    host: 'Por definir',
    window: 'Junho a Julho de 2029',
    formatType: 'GROUPS_KO',
    formatStatus: 'provisional',            // assumes 32-club / 8-group format of 2025
    format: {
      groups: 8, teamsPerGroup: 4,
      advance: { perGroup: 2, bestThirds: 0 },    // 32 -> 16
      knockout: ['R16', 'QF', 'SF', 'FINAL'],     // no 3rd-place match in 2025; VERIFY
    },
    dataSource: { provider: 'none', verified: false,
      note: 'Not on football-data free tier. Manual entry, or add a provider.' },
    scoring: 'optionB-reach-cumulative',
  },

  // ─────────────────────────────── REGRESSION ORACLE ────────────────────────────
  // WC 2026 as a template: the engine must reproduce this known-correct competition
  // before any real edition depends on it. Not shown in the host dropdown.
  {
    id: 'world-cup-2026',
    name: 'Mundial 2026',
    confederation: 'FIFA',
    year: 2026,
    host: 'Canadá, México e EUA',
    window: 'Junho a Julho de 2026',
    hidden: true,
    formatType: 'GROUPS_KO',
    formatStatus: 'confirmed',
    format: {
      groups: 12, teamsPerGroup: 4,
      advance: { perGroup: 2, bestThirds: 8 },    // 48 -> 32
      knockout: ['R32', 'R16', 'QF', 'SF', 'FINAL', 'THIRD'],
    },
    dataSource: { provider: 'football-data', code: 'WC', verified: true, liveDelayed: true },
    scoring: 'optionB-reach-cumulative',
  },
];

module.exports = { TEMPLATES };
