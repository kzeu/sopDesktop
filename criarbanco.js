const db = require("./database");

db.exec(`

CREATE TABLE IF NOT EXISTS configuracao(

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ultimaAtualizacao TEXT

);

CREATE TABLE IF NOT EXISTS ordens_compra(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    numOcp TEXT,
    codLot TEXT,
    codPro TEXT,
    codDer TEXT,
    seqOcp TEXT,

    desPro TEXT,
    qtdIte REAL,

    valorUnit REAL,
    valorTotal REAL,

    codNcm TEXT,
    datOcp TEXT,
    codeDerivation TEXT,
    importador TEXT,

    status TEXT,
    fornecedor TEXT,

    paisOrigem TEXT,
    portoOrigem TEXT,
    via TEXT,

    etd TEXT,
    eta TEXT,
    etaVolk TEXT,

    curvaABC TEXT,

    simulado INTEGER DEFAULT 0

);
`);

console.log("Banco criado.");

module.exports = db;