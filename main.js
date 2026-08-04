const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const cenario = require("./app/js/cenario");
const cache = require("./app/js/cache");


/*==================================================
  PASTA BASE
==================================================*/
const pastaBase = app.isPackaged
    ? path.dirname(process.execPath)
    : __dirname;

const pastaDados = path.join(
    pastaBase,
    "dados"
);


// Banco
require("./database");
require("./criarbanco");

const db = require("./database");
const importarOrdens = require("./importarordens");

/*==================================================
  BUSCAR TODAS AS ORDENS
==================================================*/

ipcMain.handle("buscarOrdens", () => {

    return db.prepare(`

        SELECT *

        FROM ordens_compra

        WHERE status<>'FINALIZADO'

        ORDER BY etaVolk

    `).all();

});


ipcMain.handle(
    "buscarFaturado",
    () => {

        const caminho = path.join(
    pastaDados,
            "_faturado.json"
        );

        console.log(caminho);

        const texto =
            fs.readFileSync(
                caminho,
                "utf8"
            );

        return JSON.parse(texto);

    }
);


/*==================================================
  BUSCAR ORDENS DO PRODUTO
==================================================*/


ipcMain.handle(
    "buscarOrdensProduto",
    (event, codigos, mes) => {

        const placeholders =
            codigos.map(() => "?").join(",");

        const ordens = db.prepare(`

            SELECT DISTINCT
                numOcp

            FROM ordens_compra

            WHERE

            status <> 'FINALIZADO'

            AND

                codPro IN (${placeholders})

            AND

                substr(etaVolk,1,7)=?

            ORDER BY

                etaVolk,
                numOcp

        `).all(

            ...codigos,

            mes

        );

        let retorno = [];

        const stmtItens = db.prepare(`

            SELECT *

            FROM ordens_compra

            WHERE numOcp=?

            AND status <> 'FINALIZADO'

            ORDER BY

                codPro,
                codDer

        `);

        ordens.forEach(o=>{

            retorno.push(
                ...stmtItens.all(o.numOcp)
            );

        });

        return retorno;

    }
);

/*==================================================
  BUSCAR ITENS DA ORDEM
==================================================*/

ipcMain.handle("buscarItensOC", (event, numOcp) => {

    return db.prepare(`

        SELECT *

        FROM ordens_compra

        WHERE

            numOcp=?

            AND status <> 'FINALIZADO'

        ORDER BY

            codPro,
            codDer

    `).all(numOcp);

});


/*==================================================
  ALTERAR DATAS DA ORDEM
==================================================*/

ipcMain.handle("salvarOC", (event, dados) => {

    console.log("ENTROU NO IPC");

    console.time("UPDATE");
    db.prepare(`

        UPDATE ordens_compra

        SET

            etd=?,
            eta=?,
            etaVolk=?,
            simulado=1

        WHERE

            numOcp=?

    `).run(

        dados.etd,
        dados.eta,
        dados.etaVolk,
        dados.numOcp

    );

    console.timeEnd("UPDATE");

    return true;

});


ipcMain.handle(
    "buscarOrdensCodigoDerivacao",
    (event, codigos, derivacao) => {

       

        const placeholders = codigos.map(()=>"?").join(",");


        const derivacaoLimpa =

        String(derivacao)

        .trim()

        .toUpperCase();

       

        const retorno = db.prepare(`

            SELECT *

            FROM ordens_compra

            WHERE 
            status <> 'FINALIZADO'
            AND
            
            codPro IN (${placeholders})
              AND codDer = ?

        `).all(
            ...codigos,
            derivacaoLimpa
        );

        console.log("RETORNO:", retorno.length);

        console.log(retorno);

        return retorno;

    }
);


ipcMain.handle("buscarOrdensBI", async () => {

    const fs = require("fs");
    const path = require("path");

   const arquivo = path.join(
    pastaDados,
    "ordensbionline.json"
  );

    return JSON.parse(
        fs.readFileSync(
            arquivo,
            "utf8"
        )
    );

});

ipcMain.handle("buscarPedidosAbertos", async () => {

    const fs = require("fs");
    const path = require("path");

    const arquivo = path.join(
        pastaDados,
        "pedidosabertos.json"
    );

    return JSON.parse(
        fs.readFileSync(
            arquivo,
            "utf8"
        )
    );

});

ipcMain.handle(

    "inserirCenario",

    async (event, dados) => {

        try {

            return {

                sucesso: true,

                id: cenario.inserirCenario(dados)

            };

        }
        catch (erro) {

            console.error(erro);

            return {

                sucesso: false,

                erro: erro.message

            };

        }

    }

);


ipcMain.handle(
    "listarCenarios",
    async () => {

        return cenario.listarCenarios();

    }
);

ipcMain.handle(
    "buscarCenario",
    async (event, id) => {

        return cenario.buscarCenario(id);

    }
);
ipcMain.handle(

    "atualizarCenario",

    async (event, dados) => {

        return cenario.atualizarCenario(dados);

    }

);

ipcMain.handle("excluirCenario", async (event, id) => {

    return cenario.excluirCenario(id);

});


ipcMain.handle(

    "buscarDatasOC",

    async (event, cenarioId) => {

        return cenario.buscarDatasOC(cenarioId);

    }

);

ipcMain.handle(
    "salvarDatasOC",
    async (event, cenarioId, dados) => {

        console.log("IPC salvarDatasOC");
        console.log(cenarioId);
        console.log(dados);

        return cenario.salvarDatasOC(
            cenarioId,
            dados
        );

    }
);


ipcMain.handle(

    "buscarCacheHoje",

    () => {

        return cache.buscarCacheHoje();

    }

);

ipcMain.handle(

    "salvarCacheHoje",

    (event,rowData,ordens) => {

        cache.salvarCacheHoje(

            rowData,

            ordens

        );

        return true;

    }

);

/*==================================================
  CRIAR JANELA
==================================================*/

function criarJanela() {

    const janela = new BrowserWindow({

        width: 1900,
        height: 1000,
        autoHideMenuBar: true,

        webPreferences: {

            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false

        }

    });

    janela.loadFile(

        path.join(__dirname, "app", "SOP.html")

    );

   

    janela.webContents.on("did-finish-load", () => {

    janela.webContents.setZoomFactor(1.5);

     janela.webContents.openDevTools();

    });

}


/*==================================================
  INICIAR APP
==================================================*/

app.whenReady().then(() => {

    importarOrdens();

    criarJanela();

});


app.on("window-all-closed", () => {

    if (process.platform !== "darwin") {

        app.quit();

    }

});