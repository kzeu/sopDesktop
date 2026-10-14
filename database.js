const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

const pastaBase = app.isPackaged
    ? path.dirname(process.execPath)
    : __dirname;

const pastaBanco = path.join(
    pastaBase,
    "banco"
);

if (!fs.existsSync(pastaBanco)) {
    fs.mkdirSync(pastaBanco, {
        recursive: true
    });
}

const caminhoBanco = path.join(
    pastaBanco,
    "sopdb.db"
);


/* =====================================================
   ABRIR BANCO
===================================================== */

function abrirBanco() {

    const db = new Database(
        caminhoBanco
    );

    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 15000");

    return db;
}


/* =====================================================
   EXECUTAR E FECHAR BANCO
===================================================== */

function usarBanco(funcao) {

    const db = abrirBanco();

    try {

        return funcao(db);

    }
    finally {

        db.close();

    }

}


/* =====================================================
   EXPORTAR
===================================================== */

module.exports = {
    abrirBanco,
    usarBanco
};