let modalAberto = false;

let itensOrdensModal = [];



async function abrirOrdensProduto(item,campo){

    const mes = campo.replace("_entrada","");

    const meses = {

    janeiro:"01",
    fevereiro:"02",
    março:"03",
    abril:"04",
    maio:"05",
    junho:"06",
    julho:"07",
    agosto:"08",
    setembro:"09",
    outubro:"10",
    novembro:"11",
    dezembro:"12"

};

const partes = mes.split("-");

const mesBanco =

    "20"+partes[1]+"-"+meses[partes[0]];

console.log(mesBanco);

    console.log(campo);

    modalAberto = true;

    

   
    document.getElementById("produtoModal").innerHTML =

    item.codigo;

    const codigoPrincipal = obterCodigoPrincipal(item.codigo);

const codigos =

    cacheGrupos[codigoPrincipal]

    ||

    [codigoPrincipal];
   


      let ordens;

        if (cenarioSelecionado) {

            ordens = comprasCenario.filter(o => {

                if (!o.etaVolk) return false;

                return (

                    codigos.includes(String(o.codPro))

                    &&

                    o.etaVolk.substring(0,7) === mesBanco

                );

            });

        } else {

            ordens = await window.api.buscarOrdensProduto(

                codigos,

                mesBanco

            );

        }

    itensOrdensModal = ordens;

    let total = 0;
    

    ordens.forEach(o=>{

        if(o.codPro==item.codigo){

            total += Number(o.qtdIte);

        }

     });

document.getElementById("totalProduto").innerHTML =

    "Total do Produto: " +

    total.toLocaleString("pt-BR");

     ordens.forEach(o=>{

            if(o.codPro==item.codigo){

                total+=Number(o.qtdIte);

            }

        });


    montarOrdens(ordens);

    document.getElementById("modalordens").style.display = "block";

  

}

function fecharOrdens(){
modalAberto = false;

    document.getElementById("conteudoOrdens").innerHTML = "";

    document.getElementById("modalordens").style.display = "none";

}

function montarOrdens(ordens){




    const conteudo =
        document.getElementById("conteudoOrdens");

    conteudo.innerHTML = "";

    let ocAtual = "";

    ordens.forEach(o=>{

        if(o.numOcp != ocAtual){

            ocAtual = o.numOcp;

            conteudo.innerHTML += `

        <div class="cardOC">

<div class="cabecalhoOC">

<div>

<b>

OC ${o.numOcp}

</b>

&nbsp;&nbsp;

Lote ${o.codLot}

</div>

<div>

${o.fornecedor}

</div>

</div>

          <div class="datasOC">

                <label>

                ETD

                <input
                type="date"
                id="etd_${o.numOcp}"
                value="${formatarDataInput(o.etd)}">

                </label>

                <label>

                ETA

                <input
                type="date"
                id="eta_${o.numOcp}"
                value="${formatarDataInput(o.eta)}">

                </label>

                <label>

                ETA Volk

                <input
                type="date"
                id="etaVolk_${o.numOcp}"
                value="${formatarDataInput(o.etaVolk)}">

                </label>

                </div>

            <table class="tabelaItens">

                <thead>

                    <tr>

                        <th>Código</th>

                        <th>Der</th>

                        <th>Descrição</th>

                        <th>Qtd</th>

                    </tr>

                </thead>

                <tbody id="itens_${o.numOcp}">

                </tbody>

            </table>

            <br>

            `;

        }

        document.getElementById(

            "itens_"+o.numOcp

        ).innerHTML += `

        <tr>

            <td>${o.codPro}</td>

            <td>${o.codDer}</td>

            <td>${o.desPro}</td>

            <td>${o.qtdIte}</td>

        </tr>

        `;

    });

}

function formatarDataInput(data){

    if(!data) return "";

    return data.substring(0,10);

}


async function salvarAlteracoes(){

    const etds = document.querySelectorAll(
        "[id^='etd_']"
    );

    console.log(
        "Qtd OCs:",
        etds.length
    );


    /* =========================================
       GUARDAR OCs SALVAS
    ========================================= */

    const ocsSalvas = new Set();




    for(const e of etds){

        const oc = e.id.replace(
            "etd_",
            ""
        );


      const dadosOC = {

    numOcp: oc,

    etd:
        document.getElementById(
            "etd_" + oc
        ).value,

    eta:
        document.getElementById(
            "eta_" + oc
        ).value,

    etaVolk:
        document.getElementById(
            "etaVolk_" + oc
        ).value

};

if (cenarioSelecionado) {

    const ordem = comprasCenario.find(x =>

    String(x.numOcp) === String(oc)

);

if(ordem){

    ordem.etd = dadosOC.etd;

    ordem.eta = dadosOC.eta;

    ordem.etaVolk = dadosOC.etaVolk;

}

} else {

    await window.api.salvarOC(

        dadosOC

    );

}


        if(cenarioSelecionado){

            comprasCenario
                .filter(x => String(x.numOcp) === String(oc))
                .forEach(x => {

                    x.etd = document.getElementById("etd_" + oc).value;
                    x.eta = document.getElementById("eta_" + oc).value;
                    x.etaVolk = document.getElementById("etaVolk_" + oc).value;

                });

        }


        


        ocsSalvas.add(
            String(oc)
        );

    }


   


    /* =========================================
       PEGAR SKUS DAS OCs SALVAS
    ========================================= */

    const skusAfetados = new Map();


    itensOrdensModal.forEach(item => {

        if(
            !ocsSalvas.has(
                String(item.numOcp)
            )
        ){
            return;
        }


        const chave =

            String(item.codPro)

            + "_"

            + String(item.codDer);


        skusAfetados.set(
            chave,
            {
                codigo: item.codPro,
                derivacao: item.codDer
            }
        );

    });


    console.log(
        "SKUs afetados:",
        [...skusAfetados.values()]
    );


    /* =========================================
       FECHAR MODAL
    ========================================= */

    fecharOrdens();


    /* PERMITIR REDESENHO DA TELA */

    await new Promise(
        resolve =>
            setTimeout(resolve, 0)
    );


    /* =========================================
       ATUALIZAR SOMENTE ENTRADAS AFETADAS
    ========================================= */

   


    for(const sku of skusAfetados.values()){

        await atualizarEntradaProduto(

            sku.codigo,

            sku.derivacao

        );

    }


    


    /* =========================================
       POR ENQUANTO:
       CÁLCULOS COMPLETOS
    ========================================= */

    

    calcularAtual(rowData);

    


   

    calcularFuturo(rowData);

  


   

    atualizarGrid(rowData);

    


   

}


async function recalcularTudo(){

    



    await atualizarEntradas();

 
   

}

