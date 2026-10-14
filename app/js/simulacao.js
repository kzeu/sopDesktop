let atualizandoGrid = false;

async function simularMes(mes){

    

    const indiceMes = meses.indexOf(mes);

    if(indiceMes < 1){
        return;
    }

    let itensAlterados = 0;

    // JÁ VAMOS MONTANDO O ARRAY
    const dadosOriginais = [];

    gridApi.forEachNodeAfterFilterAndSort(node=>{

        const item = node.data;

        if(
            item.tipo == "subtotal"
            ||
            item.tipo == "total"
        ){
           return;
        }

        // NÃO PRECISAMOS PERCORRER A GRID NOVAMENTE
        dadosOriginais.push(item);
        

        const mFor =
            item[`${mes}_m_for`] || 0;

        const nivel =
            parseFloat(
                String(item.nivel)
                .replace(",",".")
            ) || 0;

        /* já possui cobertura */

        if(mFor >= nivel){

            return;

        }

        const forecasts = [];

        /* próximos 3 meses */

        for(
            let x = indiceMes + 1;
            x <= indiceMes + 3;
            x++
        ){

            if(meses[x]){

                forecasts.push(

                    item[
                        `${meses[x]}_forecast`
                    ] || 0

                );

            }

        }

        /* sem próximos */

        if(forecasts.length === 0){

            for(
                let x = indiceMes - 1;
                x >= indiceMes - 3;
                x--
            ){

                if(meses[x]){

                    forecasts.push(

                        item[
                            `${meses[x]}_forecast`
                        ] || 0

                    );

                }

            }

        }

        const media =

            forecasts.length

            ?

            forecasts.reduce(
                (a,b)=>a+b,
                0
            ) / forecasts.length

            :

            0;

        const estoqueDesejado =
            media * nivel;

        const estoqueFinal =
            item[
                `${mes}_est_final`
            ] || 0;
                const qtdSimu =
                    estoqueDesejado
                    -
                    estoqueFinal;

                const necessidadeSimu =
                    qtdSimu > 0
                    ?
                    Math.ceil(qtdSimu)
                    :
                    0;

                item[
                    `${mes}_Qtd_Simu`
                ] =
                    (item[`${mes}_Qtd_Simu`] || 0)
                    +
                    necessidadeSimu;

                if(necessidadeSimu > 0){
                    itensAlterados++;
                }

                /* recalcula toda cadeia futura */

                recalcularSimulacao(
                    item,
                    mes
                );

            });



    /* RECRIAR SUBTOTAL E TOTAL */

    const novo =
        gerarSubtotais(
            dadosOriginais
        );

 
 atualizandoGrid = true;

    gridApi.setGridOption(
     "rowData",
         novo
     );
    mostrarAlerta(
        `Simulação do mês ${mes} concluída.\nItens processados: ${itensAlterados}`
    );


atualizandoGrid = false;

} 





function simularNivel(){

    const linhasVisiveis = []

    gridApi.forEachNodeAfterFilterAndSort(node => {

        if(
            node.data.tipo != 'subtotal'
            &&
            node.data.tipo != 'total'
        ){
            linhasVisiveis.push(node.data)
        }

    })

    linhasVisiveis.forEach(item => {

        for(let i = 1; i < meses.length; i++){

            const mes = meses[i]

            const forecasts = []

            /* próximos 3 meses */

            for(let x = i + 1; x <= i + 3; x++){

                if(meses[x]){

                    forecasts.push(
                        item[
                            `${meses[x]}_forecast`
                        ] || 0
                    )

                }

            }

            /* sem 3 futuros */

            if(forecasts.length < 3){

                forecasts.length = 0

                for(let x = i - 1; x >= i - 3; x--){

                    if(meses[x]){

                        forecasts.push(
                            item[
                                `${meses[x]}_forecast`
                            ] || 0
                        )

                    }

                }

            }

            const media =

                forecasts.length > 0

                ?

                forecasts.reduce(
                    (a,b)=>a+b,
                    0
                ) / forecasts.length

                :

                0

            const nivel =

                parseFloat(
                    String(item.nivel)
                    .replace(',','.')
                ) || 0

            const estoqueDesejado =

                media * nivel

            const estoqueAtual =

                item[
                    `${mes}_est_final`
                ] || 0

            const qtdSimu =

                estoqueDesejado
                -
                estoqueAtual

            item[
                `${mes}_Qtd_Simu`
            ] =

                qtdSimu > 0

                ?

                Math.ceil(qtdSimu)

                :

                0

        }

    })

    /* recalcular tudo */

    linhasVisiveis.forEach(item => {

        recalcularLinha(
            item,
            `${meses[1]}_Qtd_Simu`
        )

    })

}



function recalcularLinha(item,campoEditado){

    /* =====================================
       DESCOBRIR MÊS
    ===================================== */

    const mesEditado =

        campoEditado
        .replace('_Qtd_Simu','')

    const indiceInicial =

        meses.indexOf(mesEditado)

    if(indiceInicial < 1){

        return

    }

    /* =====================================
       RECALCULAR PRA FRENTE
    ===================================== */

    for(let i = indiceInicial; i < meses.length; i++){

        const mes = meses[i]

        const mesAnterior = meses[i - 1]
        

        /* =====================================
           EST FINAL
        ===================================== */

        let estoqueBase = 0

        if(i == 1){

            estoqueBase =

                item.Est_Final || 0

        }else{

            estoqueBase =

                item[
                    `${mesAnterior}_est_final`
                ] || 0

        }

        const forecast =

            item[
                `${mes}_forecast`
            ] || 0

        const entrada =

            item[
                `${mes}_entrada`
            ] || 0

        const qtdSimu =

            item[
                `${mes}_Qtd_Simu`
            ] || 0

        item[
            `${mes}_est_final`
        ] =

            estoqueBase

            +

            entrada

            +

            qtdSimu

            -

            forecast

        /* =====================================
           EST FINAL MÉDIA
        ===================================== */

        let estoqueBaseMedia = 0

        if(i == 1){

            estoqueBaseMedia =

                item[
                    `${mesAtual}_est_final_Média`
                ] || 0

        }else{

            estoqueBaseMedia =

                item[
                    `${mesAnterior}_est_final_Média`
                ] || 0

        }

        item[
            `${mes}_est_final_Média`
        ] =

            estoqueBaseMedia

            +

            entrada

            +

            qtdSimu

            -

            (item.media_3m || 0)

        /* =====================================
           M MÉD
        ===================================== */

        item[
            `${mes}_m_med`
        ] =

            item.media_3m > 0

            ?

            Number(

                (

                    item[
                        `${mes}_est_final_Média`
                    ]

                    /

                    item.media_3m

                )

                .toFixed(1)

            )

            :

            0

            /* =====================================
   M FOR
===================================== */

const forecasts = []

/* PEGAR 3 FUTUROS */

for(let x = i + 1; x <= i + 3; x++){

    if(meses[x]){

        forecasts.push(

            item[
                `${meses[x]}_forecast`
            ] || 0

        )

    }

}

/* SEM 3 FUTUROS */

if(forecasts.length < 3){

    forecasts.length = 0

    for(let x = i - 1; x >= i - 3; x--){

        if(meses[x]){

            forecasts.push(

                item[
                    `${meses[x]}_forecast`
                ] || 0

            )

        }

    }

}

/* MÉDIA */

const somaForecast =

    forecasts.reduce(

        (a,b)=>a+b,

        0

    )

const mediaForecast =

    forecasts.length

    ?

    somaForecast / forecasts.length

    :

    0

/* ESTOQUE */

const estoqueFinal =

    item[
        `${mes}_est_final`
    ] || 0

/* RESULTADO */

item[
    `${mes}_m_for`
] =

    mediaForecast > 0

    ?

    Number(

        (

            estoqueFinal

            /

            mediaForecast

        )

        .toFixed(1)

    )

    :

    0;

    }

    /* =====================================
       REFRESH GRID
    ===================================== */

    const dadosOriginais = []

    gridApi.forEachNode(node => {

        if(

            node.data.tipo != 'subtotal'

            &&

            node.data.tipo != 'total'

        ){

            dadosOriginais.push(

                node.data

            )

        }

    })

    const novo =

        gerarSubtotais(

            dadosOriginais

        )

    gridApi.setGridOption(

        'rowData',

        novo

    )

}




function recalcularSimulacao(item, mesInicial){

    const indiceInicial =
        meses.indexOf(mesInicial)

    if(indiceInicial < 1){
        return
    }

    for(let i = indiceInicial; i < meses.length; i++){



        

        const mes = meses[i]
        const mesAnterior = meses[i - 1]

        /* =====================================
   CACHE DOS CAMPOS
===================================== */

const forecastKey = `${mes}_forecast`;
const entradaKey = `${mes}_entrada`;
const qtdSimuKey = `${mes}_Qtd_Simu`;

const estFinalKey = `${mes}_est_final`;
const estFinalMediaKey = `${mes}_est_final_Média`;

const mMedKey = `${mes}_m_med`;
const mForKey = `${mes}_m_for`;

const cfQtdDispKey = `${mes}_cf_qtd_disp`;
const cfFobUnitKey = `${mes}_cf_fob_unit`;
const cfFobTotalKey = `${mes}_cf_fob_total`;
const cfFobSimuKey = `${mes}_cf_fob_simu`;

const cfEntradaKey = `${mes}_cf_entrada`;
const cfEntradaSimuKey = `${mes}_cf_entrada_simu`;

const cfDolarKey = `${mes}_cf_dolar`;
const cfFatorKey = `${mes}_cf_fator`;

const cfCustoSaidaKey = `${mes}_cf_custo_saida`;
const cfQtdFinalKey = `${mes}_cf_qtd_final`;
const cfCustoFinalKey = `${mes}_cf_custo_final`;
const cfCmeFinalKey = `${mes}_cf_cme_final`;

const media3m = item.media_3m || 0;

        /* =====================================
           EST FINAL
        ===================================== */

        let estoqueBase = 0

        if(i == 1){

            estoqueBase =
                item.Est_Final || 0

        }else{

            estoqueBase =
                item[
                    `${mesAnterior}_est_final`
                ] || 0

        }

                const forecast =
            item[forecastKey] || 0;

            const entrada =
            item[entradaKey] || 0;

            const qtdSimu =
            item[qtdSimuKey] || 0;

            item[estFinalKey] =

            estoqueBase
            +
            entrada
            +
            qtdSimu
            -
            forecast

        /* =====================================
           EST FINAL MÉDIA
        ===================================== */

        let estoqueBaseMedia = 0

        if(i == 1){

            estoqueBaseMedia =
                item[
                    `${mesAtual}_est_final_Média`
                ] || 0

        }else{

            estoqueBaseMedia =
                item[
                    `${mesAnterior}_est_final_Média`
                ] || 0

        }

        item[estFinalMediaKey]=

            estoqueBaseMedia
            +
            entrada
            +
            qtdSimu
            -
            (item.media_3m || 0)

        /* =====================================
           M MÉD
        ===================================== */

       item[mMedKey]=

            item.media_3m > 0

            ?

            Number(
                (
                    item[
                        `${mes}_est_final_Média`
                    ]
                    /
                    item.media_3m
                ).toFixed(1)
            )

            : 0

        /* =====================================
           M FOR
        ===================================== */

        const forecasts = []

        for(let x = i + 1; x <= i + 3; x++){

            if(meses[x]){

                forecasts.push(

                    item[
                        `${meses[x]}_forecast`
                    ] || 0

                )

            }

        }

        if(forecasts.length < 3){

            forecasts.length = 0

            for(let x = i - 1; x >= i - 3; x--){

                if(meses[x]){

                    forecasts.push(

                        item[
                            `${meses[x]}_forecast`
                        ] || 0

                    )

                }

            }

        }

        const somaForecast =
            forecasts.reduce(
                (a,b)=>a+b,
                0
            )

        const mediaForecast =
            forecasts.length
            ?
            somaForecast / forecasts.length
            :
            0

            /* =====================================
   M FOR
===================================== */



const mForCalculado =
    mediaForecast > 0
    ?
    Number(
        (
            item[estFinalKey]
            /
            mediaForecast
        ).toFixed(1)
    )
    :
    0;

            item[mForKey] = mForCalculado;

        /* =====================================
           CF QTD DISP
        ===================================== */

        let qtdBase = 0

        if(i == 1){

            qtdBase =
                (item.qtd_final_c || 0)
                +
                entrada
                +
                qtdSimu

        }else{

            qtdBase =
                (
                    item[
                        `${mesAnterior}_cf_qtd_final`
                    ] || 0
                )
                +
                entrada
                +
                qtdSimu

        }

        item[
            `${mes}_cf_qtd_disp`
        ] =

            qtdBase > forecast
            ?
            forecast
            :
            qtdBase

        /* =====================================
           CF FOB UNIT
        ===================================== */

        item[
            `${mes}_cf_fob_unit`
        ] =

            entrada > 0

            ?

            Number(
                (
                    (
                        item[
                            `${mes}_cf_fob_total`
                        ] || 0
                    )
                    /
                    entrada
                ).toFixed(2)
            )

            : 0

        /* =====================================
           CF ENTRADA
        ===================================== */

        item[
            `${mes}_cf_entrada`
        ] =

            Number(
                (
                    (
                        item[
                            `${mes}_cf_fob_total`
                        ] || 0
                    )
                    *
                    (
                        item[
                            `${mes}_cf_dolar`
                        ] || 0
                    )
                    *
                    (
                        item[
                            `${mes}_cf_fator`
                        ] || 0
                    )
                ).toFixed(2)
            )


            item[`${mes}_cf_entrada_simu`] =
            Number(
                (
                    (item[`${mes}_Qtd_Simu`] || 0)
                    *
                    (item[`${mes}_cf_fob_simu`] || 0)
                    *
                    (item[`${mes}_cf_dolar`] || 0)
                    *
                    (item[`${mes}_cf_fator`] || 0)
                ).toFixed(2)
            )


            
        /* =====================================
           CF CUSTO SAIDA
        ===================================== */

        let custoBase = 0
        let qtdBaseCusto = 0

        if(i == 1){

            custoBase =
                (item.custo_total_final || 0)
                +
                (
                    item[
                        `${mes}_cf_entrada`
                    ] || 0
                )
                +
                (
                    item[
                        `${mes}_cf_entrada_simu`
                    ] || 0
                )

            qtdBaseCusto =
                (item.qtd_final_c || 0)
                +
                entrada
                +
                qtdSimu

        }else{

            custoBase =
                (
                    item[
                        `${mesAnterior}_cf_custo_final`
                    ] || 0
                )
                +
                (
                    item[
                        `${mes}_cf_entrada`
                    ] || 0
                )
                +
                (
                    item[
                        `${mes}_cf_entrada_simu`
                    ] || 0
                )

            qtdBaseCusto =
                (
                    item[
                        `${mesAnterior}_cf_qtd_final`
                    ] || 0
                )
                +
                entrada
                +
                qtdSimu

        }

        const custoMedioCf =

            qtdBaseCusto > 0

            ?

            (
                custoBase
                /
                qtdBaseCusto
            )

            : 0

        item[
            `${mes}_cf_custo_saida`
        ] =

            Number(
                (
                    custoMedioCf
                    *
                    (
                        item[
                            `${mes}_cf_qtd_disp`
                        ] || 0
                    )
                ).toFixed(2)
            )

        /* =====================================
           CF QTD FINAL
        ===================================== */

        if(i == 1){

            item[
                `${mes}_cf_qtd_final`
            ] =

                (item.qtd_final_c || 0)
                +
                entrada
                +
                qtdSimu
                -
                forecast

        }else{

            item[
                `${mes}_cf_qtd_final`
            ] =

                (
                    item[
                        `${mesAnterior}_cf_qtd_final`
                    ] || 0
                )
                +
                entrada
                +
                qtdSimu
                -
                forecast

        }

        /* =====================================
           CF CUSTO FINAL
        ===================================== */

        if(i == 1){

            item[
                `${mes}_cf_custo_final`
            ] =

                Number(
                    (
                        (item.custo_total_final || 0)
                        +
                        (
                            item[
                                `${mes}_cf_entrada`
                            ] || 0
                        )
                        +
                        (
                            item[
                                `${mes}_cf_entrada_simu`
                            ] || 0
                        )
                        -
                        (
                            item[
                                `${mes}_cf_custo_saida`
                            ] || 0
                        )
                    ).toFixed(2)
                )

        }else{

            item[
                `${mes}_cf_custo_final`
            ] =

                Number(
                    (
                        (
                            item[
                                `${mesAnterior}_cf_custo_final`
                            ] || 0
                        )
                        +
                        (
                            item[
                                `${mes}_cf_entrada`
                            ] || 0
                        )
                        +
                        (
                            item[
                                `${mes}_cf_entrada_simu`
                            ] || 0
                        )
                        -
                        (
                            item[
                                `${mes}_cf_custo_saida`
                            ] || 0
                        )
                    ).toFixed(2)
                )

        }

        /* =====================================
           CF CME FINAL
        ===================================== */

        item[
            `${mes}_cf_cme_final`
        ] =

            item[
                `${mes}_cf_qtd_final`
            ] > 0

            ?

            Number(
                (
                    item[
                        `${mes}_cf_custo_final`
                    ]
                    /
                    item[
                        `${mes}_cf_qtd_final`
                    ]
                ).toFixed(2)
            )

            : 0

    } 

}

async function salvarCenario() {

    const nome = cenarioSelecionado
    ? cenarioSelecionado.nome
    : txtNomeCenario.value.trim();

     const descricao = cenarioSelecionado
    ? cenarioSelecionado.descricao
    : txtDescricaoCenario.value.trim(); 

    if (!nome) {
        return;
    }
console.log("Compras antes de salvar:", comprasCenario.length);
console.log(comprasCenario);

if (comprasCenario.length === 0) {

    comprasCenario =
        await window.api.buscarOrdens();

}
   

    const dados = {

            nome: txtNomeCenario.value,

            descricao: txtDescricaoCenario.value,

           dados_json: JSON.stringify({

            mesBase: mesAtual,

            rowData:
                rowData.filter(x =>
                    x.tipo != "subtotal" &&
                    x.tipo != "total"
                )

        }),

            ordens_json: JSON.stringify(

                comprasCenario

            )

        };

    try {

        if (cenarioSelecionado == null) {

            // NOVO CENÁRIO
            const retorno = await window.api.inserirCenario(dados);

            console.log(retorno);

            if (!retorno.sucesso) {

                throw new Error(retorno.erro);

            }

            cenarioSelecionado = {

                id: retorno.id,
                nome: dados.nome,
                descricao: dados.descricao

            };


            document.getElementById("lblNomeCenario").innerHTML =
                "Cenário: " + dados.nome;

            modoModal = "abrir";

            fecharModalCenarios();

            mostrarAlerta("✅ Cenário criado com sucesso!");

        } else {

            // ATUALIZA CENÁRIO

            dados.id = cenarioSelecionado.id;

            await window.api.atualizarCenario(dados);

            cenarioSelecionado.nome = dados.nome;
            cenarioSelecionado.descricao = dados.descricao;

            mostrarAlerta("✅ Cenário atualizado com sucesso!");

        }

        await carregarListaCenarios();

    } catch (erro) {

        mostrarAlerta("Erro ao salvar cenário:\n\n" + erro.message);

    }

}

window.salvarCenario = salvarCenario;