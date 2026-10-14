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

    /* =========================================
       1. ENCONTRAR AS OCs DO PRODUTO CLICADO
          NO MÊS SELECIONADO
    ========================================= */

    const ocsEncontradas =
        new Set(
            comprasCenario
                .filter(o => {

                    if(!o.etaVolk){
                        return false;
                    }

                    if(
                        String(o.status)
                            .trim()
                            .toUpperCase()
                        ==
                        "FINALIZADO"
                    ){
                        return false;
                    }

                    return (
                        codigos.includes(
                            String(o.codPro)
                        )
                        &&
                        o.etaVolk.substring(0,7)
                        ===
                        mesBanco
                    );
                })
                .map(o => o.numOcp)
        );

    /* =========================================
       2. TRAZER TODOS OS ITENS DESSAS OCs
    ========================================= */

    ordens =
        comprasCenario.filter(o => {

            if(
                String(o.status)
                    .trim()
                    .toUpperCase()
                ==
                "FINALIZADO"
            ){
                return false;
            }

            return ocsEncontradas.has(
                o.numOcp
            );

        });

} else {

            ordens = await window.api.buscarOrdensProduto(

                codigos,

                mesBanco

            );

        }

    itensOrdensModal = ordens;


    console.log("===== DEBUG ORDENS CENÁRIO =====");
console.log("Cenário:", cenarioSelecionado);
console.log("Total comprasCenario:", comprasCenario.length);
console.log("Código principal:", codigoPrincipal);
console.log("Códigos:", codigos);
console.log("Mês banco:", mesBanco);
console.log("Ordens encontradas:", ordens.length);
console.log("Compras do cenário:", comprasCenario);
console.log("================================");

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


    ordens.forEach(o => {

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
                        value="${formatarDataInput(o.etd)}"
                    >

                </label>


                <label>

                    ETA

                    <input
                        type="date"
                        id="eta_${o.numOcp}"
                        value="${formatarDataInput(o.eta)}"
                    >

                </label>


                <label>

                    ETA Volk

                    <input
                        type="date"
                        id="etaVolk_${o.numOcp}"
                        value="${formatarDataInput(o.etaVolk)}"
                    >

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


        /* =========================================
           ÍNDICE ORIGINAL NO comprasCenario
        ========================================= */

        const indiceCenario =
            cenarioSelecionado
                ? comprasCenario.indexOf(o)
                : -1;


        /* =========================================
           QUANTIDADE
        ========================================= */

        let campoQuantidade = "";


        if(cenarioSelecionado){

            campoQuantidade = `

                <input
                    type="number"
                    min="0"
                    step="1"
                    class="inputQtdOC"
                    id="qtd_${indiceCenario}"
                    data-oc="${o.numOcp}"
                    data-indice="${indiceCenario}"
                    value="${Number(o.qtdIte) || 0}"
                    style="
                        width:100px;
                        padding:5px;
                        text-align:right;
                    "
                >

            `;

        }
        else{

            campoQuantidade =
                Number(o.qtdIte || 0)
                .toLocaleString("pt-BR");

        }


        document.getElementById(
            "itens_" + o.numOcp
        ).innerHTML += `

        <tr>

            <td>
                ${o.codPro}
            </td>

            <td>
                ${o.codDer}
            </td>

            <td>
                ${o.desPro}
            </td>

            <td>
                ${campoQuantidade}
            </td>

        </tr>

        `;

    });

}

function formatarDataInput(data){

    if(!data) return "";

    return data.substring(0,10);

}

async function salvarAlteracoes(){

    const etds =
        document.querySelectorAll(
            "[id^='etd_']"
        );


    console.log(
        "Qtd OCs:",
        etds.length
    );


    /* =========================================
       VERIFICAR CENÁRIO
    ========================================= */

    if(!cenarioSelecionado){

        mostrarAlerta(
            "Para alterar uma Ordem de Compra, é necessário " +
            "estar com um cenário salvo aberto.\n\n" +
            "As alterações de ETD, ETA, ETA Volk e Qtd não " +
            "podem ser feitas diretamente nas ordens originais."
        );

        return;
    }


    /* =========================================
       GUARDAR OCs SALVAS
    ========================================= */

    const ocsSalvas =
        new Set();


    try{


        /* =========================================
           PERCORRER AS OCs
        ========================================= */

        for(const e of etds){

            const oc =
                e.id.replace(
                    "etd_",
                    ""
                );


            /* =====================================
               DATAS
            ===================================== */

            const dadosOC = {

                numOcp:
                    oc,

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
                    ).value,

                itens: []

            };


            /* =====================================
               QUANTIDADES DESSA OC
            ===================================== */

            const camposQtd =
                document.querySelectorAll(
                    `[data-oc="${oc}"]`
                );


            camposQtd.forEach(campo => {

                const indice =
                    Number(
                        campo.dataset.indice
                    );


                let quantidade =
                    Number(
                        campo.value
                    );


                if(
                    !Number.isFinite(
                        quantidade
                    )
                ){

                    quantidade = 0;

                }


                if(quantidade < 0){

                    quantidade = 0;

                }


                dadosOC.itens.push({

                    indice:
                        indice,

                    qtdIte:
                        quantidade

                });

            });


            console.log(
                "Salvando OC:",
                dadosOC
            );


            /* =====================================
               SALVAR NO BANCO DO CENÁRIO
            ===================================== */

            await window.api.salvarDatasOC(
                cenarioSelecionado.id,
                dadosOC
            );


            /* =====================================
               ATUALIZAR MEMÓRIA DO CENÁRIO
            ===================================== */

            dadosOC.itens.forEach(item => {

                if(
                    comprasCenario[
                        item.indice
                    ]
                ){

                    comprasCenario[
                        item.indice
                    ].qtdIte =
                        item.qtdIte;

                }

            });


            comprasCenario
                .filter(
                    x =>
                        String(x.numOcp) ===
                        String(oc)
                )
                .forEach(x => {

                    x.etd =
                        dadosOC.etd;

                    x.eta =
                        dadosOC.eta;

                    x.etaVolk =
                        dadosOC.etaVolk;

                });


            /* =====================================
               MARCAR OC
            ===================================== */

            ocsSalvas.add(
                String(oc)
            );

        }


        /* =========================================
           PEGAR SKUS AFETADOS
        ========================================= */

        const skusAfetados =
            new Map();


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
                +
                "_"
                +
                String(item.codDer);


            skusAfetados.set(
                chave,
                {

                    codigo:
                        item.codPro,

                    derivacao:
                        item.codDer

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


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    0
                )
        );


        /* =========================================
           RECALCULAR ENTRADAS
        ========================================= */

        for(
            const sku of skusAfetados.values()
        ){

            await atualizarEntradaProduto(
                sku.codigo,
                sku.derivacao
            );

        }


        /* =========================================
           RECALCULAR
        ========================================= */

        calcularAtual(
            rowData
        );


        calcularFuturo(
            rowData
        );


        atualizarGrid(
            rowData
        );


        /* =========================================
           SUCESSO
        ========================================= */

       mostrarAlerta(
    "✅ Alterações salvas no cenário!"
);

        
          setTimeout(() => {
            window.focus();
        }, 100);

    }
    catch(erro){

        console.error(
            "Erro ao salvar alteração da OC:",
            erro
        );


        mostrarAlerta(
            "❌ Erro ao salvar a alteração:\n\n" +
            erro.message
        );

    }

}


async function recalcularTudo(){

    



    await atualizarEntradas();

 
   

}

