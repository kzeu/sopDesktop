const fs = require("fs");
const path = require("path");
const { usarBanco } = require("./database");


function importarOrdens() {

    const { app } = require("electron");


    const pastaBase = app.isPackaged
        ? path.dirname(process.execPath)
        : __dirname;


    const caminhoJson = path.join(
        pastaBase,
        "dados",
        "ordensbionline.json"
    );


    if (!fs.existsSync(caminhoJson)) {

        console.log(
            "Arquivo ordensC.json não encontrado."
        );

        return;

    }


    console.log(
        "Importando ordens..."
    );


    const json = JSON.parse(
        fs.readFileSync(
            caminhoJson,
            "utf8"
        )
    );


    /* =====================================================
       ABRIR BANCO
       IMPORTAR TUDO
       FECHAR BANCO
    ===================================================== */

    usarBanco(db => {

        /* =================================================
           LIMPAR ORDENS ANTIGAS
        ================================================= */

        db.exec(
            "DELETE FROM ordens_compra"
        );


        /* =================================================
           PREPARAR INSERT
        ================================================= */

        const stmt = db.prepare(`

            INSERT INTO ordens_compra(

                numOcp,
                codLot,
                codPro,
                codDer,
                seqOcp,
                desPro,
                qtdIte,
                valorUnit,
                valorTotal,
                codNcm,
                datOcp,
                codeDerivation,
                importador,
                status,
                fornecedor,
                paisOrigem,
                portoOrigem,
                via,
                etd,
                eta,
                etaVolk,
                curvaABC

            )

            VALUES(

                ?,?,?,?,?,?,
                ?,?,?,?,?,?,
                ?,?,?,?,?,?,
                ?,?,?,?

            )

        `);


        /* =================================================
           TRANSACTION
        ================================================= */

        const inserir =
            db.transaction((dados) => {

                for (const item of dados) {


                    /* =====================================
                       INSERT
                    ===================================== */

                    stmt.run(

                        item["BIONLINE[OC]"],

                        item["BIONLINE[Lote]"],

                        item["BIONLINE[Cód. produto]"],

                        item["BIONLINE[Deriv]"],

                        1,

                        item["BIONLINE[Desc. produto]"],

                        Number(
                            item["BIONLINE[Quantidade]"] || 0
                        ),

                        Number(
                            item["BIONLINE[Valor un.]"] || 0
                        ),

                        Number(
                            item["BIONLINE[Valor total]"] || 0
                        ),

                        item["BIONLINE[NCM]"],

                        item["BIONLINE[DATA EMBARQUE]"],

                        item["BIONLINE[Cód. produto]"]
                            + "-"
                            + item["BIONLINE[Deriv]"],

                        item["BIONLINE[Importador]"],

                        item["BIONLINE[Status]"],

                        item["BIONLINE[Fornecedor]"],

                        "",

                        "",

                        item["BIONLINE[Via Transporte]"],

                        item["BIONLINE[ETD]"],

                        item["BIONLINE[ETA]"],

                        item["BIONLINE[ETA VDB]"],

                        ""

                    );

                }

            });


        /* =================================================
           EXECUTAR IMPORTAÇÃO
        ================================================= */

        inserir(json);

    });


    /* =====================================================
       BANCO JÁ FOI FECHADO AQUI
    ================================================= */

    console.log(
        `${json.length} ordens importadas.`
    );

}


module.exports = importarOrdens;