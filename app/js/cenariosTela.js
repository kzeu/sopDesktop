let cenarioSelecionado = null;

let modoModal = "abrir";

/* =====================================================
   GRID CENÁRIOS
===================================================== */

let gridApiCenarios;




const columnDefsCenarios = [

    {
        headerName: "Nome",
        field: "nome",
        flex:1,
         checkboxSelection: false
    },

    {
        headerName:"Criado",

        field:"data_criacao",

        width:120
    }

];

const gridOptionsCenarios={

    rowData:[],

    columnDefs:columnDefsCenarios,

    defaultColDef:{

        sortable:true,

        resizable:true

    },

    rowSelection: {
        mode: "singleRow",
        checkboxes: false,
        headerCheckbox: false
    },

    onRowClicked:(e)=>{

        cenarioSelecionado=e.data;

        txtNomeCenario.value=e.data.nome;

        txtDescricaoCenario.value=e.data.descricao || "";

        lblDataCenario.innerHTML=e.data.data_alteracao;

    }

};

async function abrirModalCenarios(){

    document
        .getElementById("modalCenarios")
        .style.display = "flex";

    if(modoModal == "abrir"){

      

        document.getElementById("btnNovoCenario").style.display = "none";
        document.getElementById("btnExcluirCenario").style.display = "inline-block";
        document.getElementById("btnAbrirCenario").style.display = "inline-block";
        document.getElementById("btnSalvarCenario").style.display = "none";

        document.getElementById("txtPesquisarCenario").style.display="block";

        document.getElementById("gridCenarios").style.display="block";

        criarGridCenarios();

        await carregarListaCenarios();

    }

    if(modoModal == "salvar"){

        

        document.getElementById("btnNovoCenario").style.display = "none";
        document.getElementById("btnExcluirCenario").style.display = "none";
        document.getElementById("btnAbrirCenario").style.display = "none";
        document.getElementById("btnSalvarCenario").style.display = "inline-block";

        document.getElementById("txtPesquisarCenario").style.display="none";

document.getElementById("gridCenarios").style.display="none";

    }

}



function fecharModalCenarios(){

    document
        .getElementById("modalCenarios")
        .style.display="none";

    modoModal = "abrir";

}

async function voltarCenarioPadrao(){

    if(!cenarioSelecionado){
        fecharModalCenarios();
        return;
    }

    const confirmar = await mostrarConfirmacao(
        "Deseja voltar para o Cenário Padrão?"
    );

    if(!confirmar){
        return;
    }

      cenarioSelecionado = null;

        comprasCenario = [];

        /* VOLTAR PARA O PERÍODO ATUAL */

        meses =
            gerarMeses(
                18,
                new Date()
            );

        mesesPassados =
            gerarMesesPassados(
                12,
                new Date()
            );

        mesAtual =
            meses[0];

        atualizarColunasPeriodo();

        document.getElementById(
            "lblNomeCenario"
        ).innerHTML =
            "Cenário: Padrão";

        fecharModalCenarios();

        await iniciarSistema();

        }

async function abrirCenarioSelecionado(){

    if(!cenarioSelecionado){

        mostrarAlerta("Selecione um cenário.");

        return;

    }

    const cenario=

        await window.api.buscarCenario(

            cenarioSelecionado.id

        );

        cenarioSelecionado = cenario;

            // Carrega o cenário salvo
           // Carrega o cenário salvo
            const dados =
                JSON.parse(cenario.dados_json);

            /* =========================================
            RESTAURAR PERÍODO DO CENÁRIO
            ========================================= */

            if(dados.mesBase){

                definirPeriodoPorMes(
                    dados.mesBase
                );

            }

            rowData =
                dados.rowData || [];

           comprasCenario =

            JSON.parse(

                cenario.ordens_json || "[]"

            );

            console.log(
                "Datas das OCs do cenário:",
                comprasCenario.length
            );

            console.log(comprasCenario);

            // Remove subtotal e total gravados
            rowData = rowData.filter(linha =>
                linha.tipo != "subtotal" &&
                linha.tipo != "total"
            );

            // Recria subtotal e total
            rowData = gerarSubtotais(rowData);

            // Atualiza a grid
            gridApi.setGridOption(
                "rowData",
                rowData
            );

        

    // Atualiza o nome do cenário na tela principal
        document.getElementById("lblNomeCenario").innerHTML =
            "Cenário: " + cenario.nome;

        

    fecharModalCenarios();

}

async function excluirCenario(){

    if(!cenarioSelecionado){

        mostr("Selecione um cenário.");

        return;

    }

   const confirmar = await mostrarConfirmacao(
    "Deseja excluir este cenário?"
    );

    if(!confirmar){
        return;
    }

    await window.api.excluirCenario(cenarioSelecionado.id);

    cenarioSelecionado = null;

    await carregarListaCenarios();

    

}



async function carregarListaCenarios(){

    const lista = await window.api.listarCenarios();

    console.log("Lista de cenários:", lista);

    if(!gridApiCenarios){
        return;
    }

    gridApiCenarios.setGridOption(
        "rowData",
        lista
    );

}

function criarGridCenarios(){

    if(gridApiCenarios){

        return;

    }

    gridApiCenarios=

        agGrid.createGrid(

            document.getElementById("gridCenarios"),

            gridOptionsCenarios

        );

}

document
.getElementById("txtPesquisarCenario")
.addEventListener(

    "input",

    e=>{

        gridApiCenarios.setGridOption(

            "quickFilterText",

            e.target.value

        );

    }

);
window.abrirModalCenarios = abrirModalCenarios;
window.fecharModalCenarios = fecharModalCenarios;