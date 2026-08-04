const db = require("../../database");

/* =====================================================
   CRIAR TABELA
===================================================== */

db.exec(`

CREATE TABLE IF NOT EXISTS cenarios(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    nome TEXT NOT NULL,

    descricao TEXT,

    dados_json TEXT NOT NULL,

    data_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP,

    ordens_json TEXT NOT NULL

)

`);

db.exec(`

CREATE TABLE IF NOT EXISTS cenario_ordens(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    cenario_id INTEGER NOT NULL,

    numOcp TEXT NOT NULL,

    etd TEXT,

    eta TEXT,

    etaVolk TEXT,

    UNIQUE(cenario_id,numOcp)

)

`);
function salvarDatasOC(cenarioId, dados){

    console.log("INÍCIO");

    const sql1 = `
        SELECT id
        FROM cenario_ordens
        WHERE cenario_id = ?
          AND numOcp = ?
    `;

    console.log("SELECT");

    const existe = db.prepare(sql1).get(
        cenarioId,
        dados.numOcp
    );

    console.log("EXISTE:", existe);

    return true;
}


function buscarDatasOC(cenarioId){

    return db.prepare(`

        SELECT *

        FROM cenario_ordens

        WHERE cenario_id=?

    `).all(cenarioId);

}


/* =====================================================
   INSERIR CENÁRIO
===================================================== */

function inserirCenario(cenario){

    const stmt = db.prepare(`

      INSERT INTO cenarios(

            nome,
            descricao,
            dados_json,
            ordens_json

        )

        VALUES(

            ?,?,?,?

        )

    `);

    const info = stmt.run(

    cenario.nome,
    cenario.descricao,
    cenario.dados_json,
    cenario.ordens_json

    );

    return info.lastInsertRowid;

}

function listarCenarios(){

    const stmt = db.prepare(`

        SELECT
            id,
            nome,
            descricao,
            data_criacao,
            data_alteracao

        FROM cenarios

        ORDER BY data_alteracao DESC

    `);

    return stmt.all();

}
function buscarCenario(id){

    const stmt = db.prepare(`

        SELECT *

        FROM cenarios

        WHERE id = ?

    `);

    return stmt.get(id);

}

function excluirCenario(id){

    const stmt = db.prepare(`

        DELETE FROM cenarios

        WHERE id = ?

    `);

    stmt.run(id);

}

function atualizarCenario(cenario){

    const stmt = db.prepare(`

       UPDATE cenarios

       SET

        nome = ?,
        descricao = ?,
        dados_json = ?,
        ordens_json = ?,
        data_alteracao = CURRENT_TIMESTAMP

        WHERE id = ?

    `);

    stmt.run(

        cenario.nome,
        cenario.descricao,
        cenario.dados_json,
        cenario.ordens_json,
        cenario.id

    );

}

/* =====================================================
   EXPORTAR
===================================================== */

module.exports = {

    inserirCenario,
    listarCenarios,
    buscarCenario,
    excluirCenario,
    atualizarCenario,
    salvarDatasOC,
    buscarDatasOC

};