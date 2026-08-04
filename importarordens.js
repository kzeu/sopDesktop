const fs = require("fs");
const path = require("path");
const db = require("./database");

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

        console.log("Arquivo ordensC.json não encontrado.");

        return;

    }

    console.log("Importando ordens...");

    const json = JSON.parse(
        fs.readFileSync(caminhoJson, "utf8")
    );

    db.exec("DELETE FROM ordens_compra");

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

    const inserir = db.transaction((dados) => {

        for (const item of dados) {

         /*   stmt.run(

                item["O-Ordens_Compras[numOcp]"],

                item["O-Ordens_Compras[codLot]"],

                item["O-Ordens_Compras[codPro]"],

                item["O-Ordens_Compras[codDer]"],

                item["O-Ordens_Compras[seqOcp]"],

                item["O-Ordens_Compras[desPro]"],

                Number(item["O-Ordens_Compras[qtdIte]"] || 0),

                item["O-Ordens_Compras[codNcm]"],

                item["O-Ordens_Compras[datOcp]"],

                item["O-Ordens_Compras[code-derivation2]"],

                item["O-Ordens_Compras[Importador]"],

                item["O-Ordens_Compras[Status]"],

                item["O-Ordens_Compras[Fornecedor]"],

                item["O-Ordens_Compras[Pais Origem]"],

                item["O-Ordens_Compras[Porto_Origem]"],

                item["O-Ordens_Compras[Via]"],

                item["O-Ordens_Compras[Etd]"],

                item["O-Ordens_Compras[Eta]"],

                item["O-Ordens_Compras[Eta_Volk]"],

                item["O-Ordens_Compras[CurvaABC]"]

            ); */


                    stmt.run(

                item["BIONLINE[OC]"],

                item["BIONLINE[Lote]"],

                item["BIONLINE[Cód. produto]"],

                item["BIONLINE[Deriv]"],

                1,

                item["BIONLINE[Desc. produto]"],

                Number(item["BIONLINE[Quantidade]"] || 0),

                Number(item["BIONLINE[Valor un.]"] || 0),

                Number(item["BIONLINE[Valor total]"] || 0),

                item["BIONLINE[NCM]"],

                item["BIONLINE[DATA EMBARQUE]"],

                item["BIONLINE[Cód. produto]"] + "-" + item["BIONLINE[Deriv]"],

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

    inserir(json);

    console.log(`${json.length} ordens importadas.`);

}

module.exports = importarOrdens;