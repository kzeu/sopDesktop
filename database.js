console.log("CARREGANDO DATABASE...");

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");


/* =====================================================
   DESCOBRIR PASTA BASE DO SISTEMA
===================================================== */

/*
   DESENVOLVIMENTO:
   usa a pasta atual do projeto

   EXECUTÁVEL:
   usa a pasta onde está o .exe
*/

const pastaBase = app.isPackaged
    ? path.dirname(process.execPath)
    : __dirname;


/* =====================================================
   PASTA DO BANCO
===================================================== */

const pastaBanco = path.join(
    pastaBase,
    "banco"
);


/* =====================================================
   CRIAR PASTA BANCO SE NÃO EXISTIR
===================================================== */

if (!fs.existsSync(pastaBanco)) {

    fs.mkdirSync(
        pastaBanco,
        {
            recursive: true
        }
    );

    console.log(
        "Pasta banco criada:",
        pastaBanco
    );
}


/* =====================================================
   CAMINHO COMPLETO DO BANCO
===================================================== */

const caminhoBanco = path.join(
    pastaBanco,
    "sopdb.db"
);


/* =====================================================
   ABRIR / CRIAR SQLITE
===================================================== */

let db;

try {

    db = new Database(
        caminhoBanco
    );

    console.log(
        "DATABASE CARREGADO"
    );

    console.log(
        "Banco:",
        caminhoBanco
    );

    console.log(
        "Modo:",
        app.isPackaged
            ? "EXECUTÁVEL"
            : "DESENVOLVIMENTO"
    );

}
catch (erro) {

    console.error(
        "ERRO AO ABRIR BANCO:",
        erro
    );

    throw erro;
}


/* =====================================================
   CONFIGURAÇÕES SQLITE
===================================================== */

/*
   Melhora concorrência e desempenho.
*/

db.pragma("journal_mode = WAL");


/*
   Aguarda um pouco se o banco estiver ocupado,
   em vez de falhar imediatamente.
*/

db.pragma("busy_timeout = 5000");


/* =====================================================
   EXPORTAR CONEXÃO
===================================================== */

module.exports = db;