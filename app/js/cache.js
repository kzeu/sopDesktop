const { usarBanco } = require("../../database");

function buscarCacheHoje() {

    const hoje = new Date().toISOString().slice(0, 10);

    return usarBanco(db => {

        return db.prepare(`
            SELECT *
            FROM cache_dia
            WHERE data_cache = ?
        `).get(hoje);

    });
}


function excluirCacheHoje() {

    const hoje =
        new Date()
            .toISOString()
            .slice(0, 10);

    return usarBanco(db => {

        db.prepare(`
            DELETE FROM cache_dia
            WHERE data_cache = ?
        `).run(hoje);

        return true;

    });
}


function salvarCacheHoje(rowData, ordens) {

    const hoje = new Date().toISOString().slice(0, 10);

    return usarBanco(db => {

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

        return true;

    });
}


module.exports = {

    buscarCacheHoje,

    salvarCacheHoje,

    excluirCacheHoje

};