const {
    app,
    BrowserWindow,
    ipcMain,
    dialog
} = require("electron");
const fs = require("fs");
const path = require("path");
const cenario = require("./app/js/cenario");
const cache = require("./app/js/cache");
const XLSX = require("xlsx");

const { execFile } = require("child_process");


/*==================================================
  PASTAS DO SISTEMA
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

          WHERE etaVolk >= '2025-01-01'

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


/*==================================================
  BUSCAR ORDENS DO PRODUTO
==================================================*/

ipcMain.handle(
    "buscarOrdensProduto",
    (event, codigos, mes) => {

        console.log(
            "buscarOrdensProduto:",
            codigos,
            mes
        );

        /* GARANTIR QUE SEJA ARRAY */

        if(!Array.isArray(codigos)){
            codigos = [codigos];
        }

        /* REMOVER VAZIOS */

        codigos = codigos
            .map(c => String(c).trim())
            .filter(Boolean);

        if(codigos.length === 0){
            return [];
        }

        const placeholders =
            codigos.map(() => "?").join(",");

        /* =========================================
           BUSCAR OCs
        ========================================= */

        const ordens =
            db.prepare(`
                SELECT DISTINCT
                    numOcp
                FROM ordens_compra
                WHERE
                    status <> 'FINALIZADO'
                    AND codPro IN (${placeholders})
                    AND substr(etaVolk,1,7) = ?
                    AND etaVolk >= '2025-01-01'
                ORDER BY
                    etaVolk,
                    numOcp
            `).all(
                ...codigos,
                mes
            );

        /* =========================================
           BUSCAR ITENS DAS OCs
        ========================================= */

        const stmtItens =
            db.prepare(`
                SELECT *
                FROM ordens_compra
                WHERE
                    numOcp = ?
                    AND status <> 'FINALIZADO'
                    AND etaVolk >= '2025-01-01'
                ORDER BY
                    codPro,
                    codDer
            `);

        const retorno = [];

        ordens.forEach(o => {

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

            AND etaVolk >= '2025-01-01'

            

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
            
            
            codPro IN (${placeholders})
              AND codDer = ?

              AND etaVolk >= '2025-01-01'

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


ipcMain.handle(
    "excluirCacheHoje",
    () => {
        return cache.excluirCacheHoje();
    }
);

/*==================================================
  LER PRODUTOS DO EXCEL
==================================================*/

ipcMain.handle(
    "lerProdutosExcel",
    async (event, caminhoArquivo) => {

        try {

            const workbook =
                XLSX.readFile(caminhoArquivo);

            const nomeAba =
                workbook.SheetNames[0];

            const planilha =
                workbook.Sheets[nomeAba];

            const produtos =
                XLSX.utils.sheet_to_json(
                    planilha,
                    {
                        defval: ""
                    }
                );

            console.log(
                "Produtos lidos do Excel:",
                produtos.length
            );

            console.log(
                produtos.slice(0, 5)
            );

            return {
                sucesso: true,
                produtos: produtos
            };

        }
        catch(erro){

            console.error(
                "Erro ao ler Excel:",
                erro
            );

            return {
                sucesso: false,
                erro: erro.message
            };

        }

    }
);

/*==================================================
  SALVAR PRODUTOS NO SQLITE
==================================================*/

ipcMain.handle(
    "salvarProdutos",
    async (event, produtos) => {

        try {

            const stmt = db.prepare(`
                INSERT INTO produtos
                (
                    produto,
                    descricao
                )
                VALUES
                (
                    @produto,
                    @descricao
                )
                ON CONFLICT(produto)
                DO UPDATE SET
                    descricao = excluded.descricao,
                    data_alteracao = CURRENT_TIMESTAMP
            `);

            const inserir =
                db.transaction((lista) => {

                    for(const item of lista){

                        const encontrarColuna = (obj, nome) => {

    return Object.keys(obj).find(chave =>

        chave
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
        === nome.toLowerCase()

    );

                };


                const colunaProduto =
                    encontrarColuna(item, "produto");

                const colunaDescricao =
                    encontrarColuna(item, "descricao");


                const produto =
                    String(
                        item[colunaProduto] ?? ""
                    ).trim();

                const descricao =
                    String(
                        item[colunaDescricao] ?? ""
                    ).trim();


                if(!produto){
                    continue;
                }

                        inserirProduto.run({
                            produto: produto,
                            descricao: descricao
                        });

                    }

                });

            const inserirProduto = stmt;

            inserir(produtos);

            return {
                sucesso: true,
                quantidade: produtos.length
            };

        }
        catch(erro){

            console.error(
                "Erro ao salvar produtos:",
                erro
            );

            return {
                sucesso: false,
                erro: erro.message
            };

        }

    }
);


/*==================================================
  BUSCAR DESCRIÇÕES DOS PRODUTOS
==================================================*/

ipcMain.handle(
    "buscarProdutos",
    async () => {

        try {

            const produtos =
                db.prepare(`
                    SELECT
                        produto,
                        descricao
                    FROM produtos
                `).all();

            console.log(
                "Descrições carregadas do SQLite:",
                produtos.length
            );

            return produtos;

        }
        catch(erro){

            console.error(
                "Erro ao buscar produtos:",
                erro
            );

            return [];

        }

    }
);


ipcMain.handle(
    "exportarXlsx",
    async (event, dados) => {

        try{

            const resultado =
                await dialog.showSaveDialog({
                    title:
                        "Salvar arquivo Excel",

                    defaultPath:
                        `${dados.nomeArquivo}.xlsx`,

                    filters:[
                        {
                            name:
                                "Excel",
                            extensions:[
                                "xlsx"
                            ]
                        }
                    ]
                });


            if(
                resultado.canceled ||
                !resultado.filePath
            ){

                return {
                    sucesso:false,
                    cancelado:true
                };

            }


            const worksheet =
                XLSX.utils.aoa_to_sheet(
                    dados.dados
                );


            const workbook =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Dados"
            );


            XLSX.writeFile(
                workbook,
                resultado.filePath
            );


            return {
                sucesso:true,
                caminho:
                    resultado.filePath
            };

        }
        catch(erro){

            console.error(
                "Erro ao exportar XLSX:",
                erro
            );

            return {
                sucesso:false,
                erro:
                    erro.message
            };

        }

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

   /*  janela.webContents.openDevTools(); */

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