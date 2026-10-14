const { usarBanco } = require("../../database");


/* =====================================================
   CRIAR TABELAS
===================================================== */

usarBanco(db => {

    db.exec(`

        CREATE TABLE IF NOT EXISTS cenarios(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nome TEXT NOT NULL,

            descricao TEXT,

            dados_json TEXT NOT NULL,

            data_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP,

            ordens_json TEXT NOT NULL

        );


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

});


/* =====================================================
   SALVAR DATAS DA OC
===================================================== */

function salvarDatasOC(cenarioId, dados){

    console.log(
        "=================================="
    );

    console.log(
        "SALVANDO ALTERAÇÃO DA OC NO CENÁRIO"
    );

    console.log(
        "cenarioId:",
        cenarioId
    );

    console.log(
        "dados:",
        dados
    );


    return usarBanco(db => {

        /* =========================================
           BUSCAR CENÁRIO
        ========================================= */

        const cenario =
            db.prepare(`
                SELECT ordens_json
                FROM cenarios
                WHERE id = ?
            `).get(cenarioId);


        if(!cenario){

            throw new Error(
                "Cenário não encontrado."
            );

        }


        /* =========================================
           LER ORDENS
        ========================================= */

        let ordens = [];


        try{

            ordens =
                JSON.parse(
                    cenario.ordens_json || "[]"
                );

        }
        catch(erro){

            throw new Error(
                "Não foi possível ler as ordens do cenário."
            );

        }


        /* =========================================
           LOCALIZAR TODAS AS LINHAS DA OC
        ========================================= */

        const ordensOC =
            ordens.filter(
                x =>
                    String(x.numOcp) ===
                    String(dados.numOcp)
            );


        if(ordensOC.length === 0){

            throw new Error(
                "A Ordem de Compra " +
                dados.numOcp +
                " não existe neste cenário."
            );

        }


        /* =========================================
           ALTERAR DATAS
        ========================================= */

        ordensOC.forEach(ordem => {

            ordem.etd =
                dados.etd;

            ordem.eta =
                dados.eta;

            ordem.etaVolk =
                dados.etaVolk;

        });


        /* =========================================
           ALTERAR QUANTIDADES
        ========================================= */

        if(
            Array.isArray(
                dados.itens
            )
        ){

            dados.itens.forEach(item => {

                const indice =
                    Number(
                        item.indice
                    );


                if(
                    !Number.isInteger(
                        indice
                    )
                ){

                    return;

                }


                if(
                    !ordens[indice]
                ){

                    return;

                }


                /* GARANTIR QUE É A MESMA OC */

                if(
                    String(
                        ordens[indice].numOcp
                    )
                    !==
                    String(
                        dados.numOcp
                    )
                ){

                    return;

                }


                ordens[indice].qtdIte =
                    Number(
                        item.qtdIte
                    ) || 0;

            });

        }


        /* =========================================
           GRAVAR CENÁRIO
        ========================================= */

        db.prepare(`
            UPDATE cenarios
            SET
                ordens_json = ?,
                data_alteracao =
                    CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(

            JSON.stringify(
                ordens
            ),

            cenarioId

        );


        console.log(
            "OC e quantidades salvas com sucesso."
        );


        return true;

    });

}


/* =====================================================
   BUSCAR DATAS OC
===================================================== */

function buscarDatasOC(cenarioId){

    return usarBanco(db => {

        return db.prepare(`

            SELECT *

            FROM cenario_ordens

            WHERE cenario_id=?

        `).all(cenarioId);

    });

}


/* =====================================================
   INSERIR CENÁRIO
===================================================== */

function inserirCenario(cenario){

    return usarBanco(db => {

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

    });

}


/* =====================================================
   LISTAR CENÁRIOS
===================================================== */

function listarCenarios(){

    return usarBanco(db => {

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

    });

}


/* =====================================================
   BUSCAR CENÁRIO
===================================================== */

function buscarCenario(id){

    return usarBanco(db => {

        const stmt = db.prepare(`

            SELECT *

            FROM cenarios

            WHERE id = ?

        `);


        return stmt.get(id);

    });

}


/* =====================================================
   EXCLUIR CENÁRIO
===================================================== */

function excluirCenario(id){

    return usarBanco(db => {

        const stmt = db.prepare(`

            DELETE FROM cenarios

            WHERE id = ?

        `);


        stmt.run(id);

        return true;

    });

}


/* =====================================================
   ATUALIZAR CENÁRIO
===================================================== */

function atualizarCenario(cenario){

    return usarBanco(db => {

        const stmt = db.prepare(`

            UPDATE cenarios

            SET

                nome = ?,

                descricao = ?,

                dados_json = ?,

                ordens_json = ?,

                data_alteracao =
                    CURRENT_TIMESTAMP

            WHERE id = ?

        `);


        stmt.run(

            cenario.nome,

            cenario.descricao,

            cenario.dados_json,

            cenario.ordens_json,

            cenario.id

        );


        return true;

    });

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