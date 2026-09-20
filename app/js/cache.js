const db = require("../../database");

function buscarCacheHoje() {

    const hoje = new Date().toISOString().slice(0,10);

    return db.prepare(`
        SELECT *
        FROM cache_dia
        WHERE data_cache = ?
    `).get(hoje);

}


function excluirCacheHoje() {

    const hoje =
        new Date()
            .toISOString()
            .slice(0,10);

    db.prepare(`
        DELETE FROM cache_dia
        WHERE data_cache = ?
    `).run(hoje);

}

function salvarCacheHoje(rowData, ordens) {

    const hoje = new Date().toISOString().slice(0,10);

    db.prepare(`
        INSERT OR REPLACE INTO cache_dia(

            data_cache,

            rowdata_json,

            ordens_json

        )

        VALUES(?,?,?)

    `).run(

        hoje,

        JSON.stringify(rowData),

        JSON.stringify(ordens)

    );

}

module.exports = {

    buscarCacheHoje,

    salvarCacheHoje,

    excluirCacheHoje

};