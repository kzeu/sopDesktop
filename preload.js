const {
    contextBridge,
    ipcRenderer,
    webUtils
} = require("electron");

contextBridge.exposeInMainWorld("api", {

    buscarOrdens: () =>
        ipcRenderer.invoke("buscarOrdens"),

    buscarOrdensProduto: (codigo, mes) =>
        ipcRenderer.invoke(
            "buscarOrdensProduto",
            codigo,
            mes
        ),

    buscarItensOC: (oc) =>
        ipcRenderer.invoke(
            "buscarItensOC",
            oc
        ),

    salvarOC: (dados) =>
        ipcRenderer.invoke(
            "salvarOC",
            dados
        ),

        buscarOrdensCodigoDerivacao: (
    codigo,
    derivacao
) =>
    ipcRenderer.invoke(
        "buscarOrdensCodigoDerivacao",
        codigo,
        derivacao
    ),

    buscarFaturado: () =>
    ipcRenderer.invoke("buscarFaturado"),

    buscarPedidosAbertos: () =>
    ipcRenderer.invoke("buscarPedidosAbertos"),


    buscarOrdensBI: () =>
    ipcRenderer.invoke("buscarOrdensBI"),

     inserirCenario: (dados) =>
        ipcRenderer.invoke(
            "inserirCenario",
            dados
        ),

        listarCenarios: () =>
        ipcRenderer.invoke(
        "listarCenarios"
    ),
    buscarCenario: (id) =>
    ipcRenderer.invoke(
        "buscarCenario",
        id
    ),
    atualizarCenario: (dados) =>
    ipcRenderer.invoke(
        "atualizarCenario",
        dados
    ),

    excluirCenario: (id) => ipcRenderer.invoke("excluirCenario", id),

    buscarDatasOC: (cenarioId) =>

    ipcRenderer.invoke(
        "buscarDatasOC",
        cenarioId
    ),


    

salvarDatasOC: (cenarioId,dados) =>

    ipcRenderer.invoke(
        "salvarDatasOC",
        cenarioId,
        dados
    ),


    buscarCacheHoje: () =>

    ipcRenderer.invoke("buscarCacheHoje"),

    salvarCacheHoje: (rowData,ordens) =>

    ipcRenderer.invoke(

        "salvarCacheHoje",

        rowData,

        ordens

    ),

    excluirCacheHoje: () =>
    ipcRenderer.invoke(
        "excluirCacheHoje"
    ),


   lerProdutosExcel: (arquivo) => {

        const caminhoArquivo =
            webUtils.getPathForFile(arquivo);

        return ipcRenderer.invoke(
            "lerProdutosExcel",
            caminhoArquivo
        );

    },

salvarProdutos: (produtos) =>
    ipcRenderer.invoke(
        "salvarProdutos",
        produtos
    ),

        buscarProdutos: () =>
        ipcRenderer.invoke(
            "buscarProdutos"
        ),

        exportarXlsx: (dados) =>
    ipcRenderer.invoke(
        "exportarXlsx",
        dados
    ),

   
});

