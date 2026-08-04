
function gerarSubtotais(rowData){

    

    const novo = []

    let subtotal = null

    let codigoAtual = null


    const grupos = {};


        const camposNumericos = [

            ...new Set(

                rowData.flatMap(item =>

                    Object.keys(item).filter(campo =>

                        typeof item[campo] === "number"

                    )

                )

            )

        ];

    rowData.forEach(item => {

        if(!grupos[item.codigo]){

            grupos[item.codigo] = [];

        }

        grupos[item.codigo].push(item);

    });


    

    rowData.forEach((item,index) => {

        /* PRIMEIRO ITEM */

        if(codigoAtual === null){

            codigoAtual = item.codigo

            subtotal = criarSubtotal(item)

        }



        /* TROCOU CÓDIGO */

        if(item.codigo != codigoAtual){

            /* ADICIONA SUBTOTAL */

            novo.push(subtotal)

            /* NOVO GRUPO */

            codigoAtual = item.codigo

            subtotal = criarSubtotal(item)

        }

        /* ITEM NORMAL */

        novo.push(item)

        /* SOMAR CAMPOS */
      /* SOMAR CAMPOS */
    camposNumericos.forEach(campo=>{

       

        /* NÃO SOMAR M FOR */

        if(campo.includes('_m_for')){

            return

        }

        if(campo.includes('_m_med')){

            return

        }

        if(campo == 'custo_medio'){

            return

        }

        if(campo == 'fob_unit'){

            return

        }

        if(campo.includes("_preco_medio")){
            return;
        }


        if(campo == "meses_desvio"){
                return;
            }


       if(

            campo == 'cme_final'

            ||

            campo.includes('cf_cme_final')

        ){

            return

        }

        if(campo == 'm_for_atual'){

            return

        }

        if(campo == 'cme_final'){
        return
       }

       if(campo.includes('cf_fob_unit')){
            return
        }

        if(campo.includes('_cf_fob_simu')){
            return
        }

       if(
            campo == 'fator'
            ||
            campo == 'dolar'

             ||
            campo.includes('cf_fator')
            ||
            campo.includes('cf_dolar')
        ){
            return
        }

       subtotal[campo] =
            (subtotal[campo] ?? 0) +
            (Number(item[campo]) || 0);

    




    }

)

    })

    /* ÚLTIMO SUBTOTAL */

    if(subtotal){

        novo.push(subtotal)

    }


    /* ==========================================
   RECALCULAR M FOR SUBTOTAL
========================================== */



const subtotais =
    novo.filter(x => x.tipo == "subtotal");

subtotais.forEach(item => {

    /* =====================================
       CUSTO MÉDIO SUBTOTAL
    ===================================== */



  /* =====================================
   CUSTO MÉDIO SUBTOTAL
 ===================================== */





const codigo = item.codigo.replace("TOTAL ","");

const itensGrupoDados = grupos[codigo] || [];





 const somaFator = itensGrupoDados.reduce(
    (a,b)=>a + (b.fator || 0),
    0
 )

item.fator =

    itensGrupoDados.length > 0

    ?

    Number(
        (
            somaFator
            /
            itensGrupoDados.length
        ).toFixed(3)
    )

    : 0

    const somaDolar = itensGrupoDados.reduce(
    (a,b)=>a + (b.dolar || 0),
    0
)

item.dolar =

    itensGrupoDados.length > 0

    ?

    Number(
        (
            somaDolar
            /
            itensGrupoDados.length
        ).toFixed(3)
    )

    : 0


    meses.forEach(mes=>{

    const somaCfFator = itensGrupoDados.reduce(
        (a,b)=>a + (b[`${mes}_cf_fator`] || 0),
        0
    )

    const valoresFobSimu =
    itensGrupoDados
        .map(b =>
            Number(b[`${mes}_cf_fob_simu`]) || 0
        )
        .filter(v => v > 0);

        item[`${mes}_cf_fob_simu`] =
            valoresFobSimu.length > 0
            ?
            Number(
                (
                    valoresFobSimu.reduce(
                        (a,b) => a + b,
                        0
                    )
                    /
                    valoresFobSimu.length
                ).toFixed(2)
            )
            :
            0;

    item[`${mes}_cf_fator`] =

        itensGrupoDados.length > 0

        ?

        Number(
            (
                somaCfFator
                /
                itensGrupoDados.length
            ).toFixed(3)
        )

        : 0

    const somaCfDolar = itensGrupoDados.reduce(
        (a,b)=>a + (b[`${mes}_cf_dolar`] || 0),
        0
    )

    item[`${mes}_cf_dolar`] =

        itensGrupoDados.length > 0

        ?

        Number(
            (
                somaCfDolar
                /
                itensGrupoDados.length
            ).toFixed(3)
        )

        : 0

})

item.custo_medio =

    item.est_total > 0

    ?

    Number(

        (

            item.valor_estoque

            /

            item.est_total

        )

        .toFixed(2)

    )

    :

    0;






    /* FOB UNIT SUBTOTAL */

item.fob_unit =

    item.Est_Entrada > 0

    ?

    Number(

        (

            item.fob_total

            /

            item.Est_Entrada

        )

        .toFixed(2)

    )

    :

    0;

    item.cme_final =

    item.qtd_final_c > 0

    ? Number(
        (
            item.custo_total_final
            /
            item.qtd_final_c
        ).toFixed(2)
    )

    : 0

    /* ============================
   MESES DESVIO SUBTOTAL
============================ */

if(item.media_forecast > 0){

    item.meses_desvio = Number(

        (
            item.media_desvio
            /
            item.media_forecast

        ).toFixed(1)

                );

        }
        else{

            item.meses_desvio = 0;

        }



    /* CME FINAL SUBTOTAL */

/* =====================================
   CF CME FINAL SUBTOTAL
===================================== */

meses.forEach(mes=>{

    item[`${mes}_cf_cme_final`] =

        item[`${mes}_cf_qtd_final`] > 0

        ?

        Number(
            (
                item[`${mes}_cf_custo_final`]
                /
                item[`${mes}_cf_qtd_final`]
            ).toFixed(2)
        )

        : 0

    /* =====================================
       CF FOB UNIT SUBTOTAL
    ===================================== */

    item[`${mes}_cf_fob_unit`] =

        (item[`${mes}_entrada`] || 0) > 0

        ?

        Number(
            (
                item[`${mes}_cf_fob_total`]
                /
                item[`${mes}_entrada`]
            ).toFixed(2)
        )

        : 0
/* =====================================
   PREÇO MÉDIO SUBTOTAL
===================================== */

mesesPassados.forEach(mes => {

    const vendas = Number(item[`${mes}_vendas`] || 0);

    const bruto = Number(item[`${mes}_vlr_bruto`] || 0);

    item[`${mes}_preco_medio`] =

        vendas > 0

        ? Number((bruto / vendas).toFixed(2))

        : 0;

});

/* MÊS ATUAL */
            

                 
})





  /* M FOR ATUAL */

const forecastsAtual = []

for(let i = 1; i <= 3; i++){

    if(meses[i]){

        forecastsAtual.push(

            item[
                `${meses[i]}_forecast`
            ] || 0

        )

    }

}

const somaAtual =

    forecastsAtual.reduce(

        (a,b)=>a+b,

        0

    )

const mediaAtual =

    forecastsAtual.length

    ?

    somaAtual / forecastsAtual.length

    :

    0

item.m_for_atual =

    mediaAtual > 0

    ?

    Number(

        (

            item.Est_Final

            /

            mediaAtual

        )

        .toFixed(1)

    )

    :

    0

        

    /* FUTUROS */

    for(let i = 1; i < meses.length; i++){

        const mes = meses[i]

        const forecasts = []

        /* 3 FUTUROS */

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

        const soma =

            forecasts.reduce(

                (a,b)=>a+b,

                0

            )

        const media =

            forecasts.length

            ?

            soma / forecasts.length

            :

            0

        const estoque =

            item[
                `${mes}_est_final`
            ] || 0

        item[
            `${mes}_m_for`
        ] =

            media > 0

            ?

            Number(

                (

                    estoque / media

                )

                .toFixed(1)

            )

            :

            0

            /* =====================================
                M MÉD TOTAL
                ===================================== */
                /* =====================================
                M MÉD SUBTOTAL
                ===================================== */

                const estoqueMed =

                    item[
                        `${mes}_est_final_Média`
                    ] || 0

                const media3m =

                    item.media_3m || 0

                item[
                    `${mes}_m_med`
                ] =

                    media3m > 0

                    ?

                    Number(

                        (

                            estoqueMed / media3m

                        )

                        .toFixed(1)

                    )

                    :

                    0

                    }

})

    /* ==========================================
       TOTAL GERAL
    ========================================== */

    const total = {

        tipo:'total',

        linha:'TOTAL GERAL',

        codigo:'',

        tam:'',
        qtd_final_c:0,
    custo_total_final:0,
    cme_final:0

    }



    rowData.forEach(item => {

         camposNumericos.forEach(campo => {

    
                total[campo] =

                (total[campo] || 0)

                +

                (item[campo] || 0)

            

        })

    })

    novo.push(total)

    /* =====================================
   CUSTO MÉDIO TOTAL
===================================== */

total.custo_medio =

    total.est_total > 0

    ?

    Number(

        (

            total.valor_estoque

            /

            total.est_total

        )

        .toFixed(2)

    )

    :

    0;

    /* FOB UNIT TOTAL */

total.fob_unit =

    total.Est_Entrada > 0

    ?

    Number(

        (

            total.fob_total

            /

            total.Est_Entrada

        )

        .toFixed(2)

    )

    :

    0;

    /* CME FINAL TOTAL */

total.cme_final =

    total.qtd_final_c > 0

    ?

    Number(

        (

            total.custo_total_final

            /

            total.qtd_final_c

        )

        .toFixed(2)

    )

    :

    0


    /* ============================
   MESES DESVIO TOTAL
============================ */

if(total.media_forecast > 0){

    total.meses_desvio = Number(

        (
            total.media_desvio
            /
            total.media_forecast

        ).toFixed(1)

            );

        }
        else{

            total.meses_desvio = 0;

        }



    const qtdItens = rowData.length

total.fator =
    Number(
        (
            total.fator / qtdItens
        ).toFixed(3)
    )

total.dolar =
    Number(
        (
            total.dolar / qtdItens
        ).toFixed(3)
    )

    meses.forEach(mes=>{

    total[`${mes}_cf_fator`] =

        Number(
            (
                total[`${mes}_cf_fator`]
                /
                qtdItens
            ).toFixed(3)
        )

    total[`${mes}_cf_dolar`] =

        Number(
            (
                total[`${mes}_cf_dolar`]
                /
                qtdItens
            ).toFixed(3)
        )

})

    /* CF CME FINAL TOTAL */

meses.forEach(mes=>{

    total[
        `${mes}_cf_cme_final`
    ] =

        total[
            `${mes}_cf_qtd_final`
        ] > 0

        ?

        Number(

            (

                total[
                    `${mes}_cf_custo_final`
                ]

                /

                total[
                    `${mes}_cf_qtd_final`
                ]

            )

            .toFixed(2)

        )

        :

        0



        total[`${mes}_cf_fob_unit`] =

        (total[`${mes}_entrada`] || 0) > 0

        ?

        Number(
            (
                total[`${mes}_cf_fob_total`]
                /
                total[`${mes}_entrada`]
            ).toFixed(2)
        )

        : 0


         

      

})

/* =====================================
   PREÇO MÉDIO TOTAL
===================================== */

mesesPassados.forEach(mes => {

    const vendas =
        Number(total[`${mes}_vendas`] || 0);

    const bruto =
        Number(total[`${mes}_vlr_bruto`] || 0);

    total[`${mes}_preco_medio`] =

        vendas > 0

        ?

        Number(
            (
                bruto / vendas
            ).toFixed(2)
        )

        :

        0;

});



    /* ==========================================
   RECALCULAR M FOR TOTAL GERAL
========================================== */

/* ATUAL */

/* ATUAL */

const forecastsAtual = []

for(let i = 1; i <= 3; i++){

    if(meses[i]){

        forecastsAtual.push(

            total[
                `${meses[i]}_forecast`
            ] || 0

        )

    }

}

const somaAtual =

    forecastsAtual.reduce(

        (a,b)=>a+b,

        0

    )

const mediaAtual =

    forecastsAtual.length

    ?

    somaAtual / forecastsAtual.length

    :

    0

total.m_for_atual =

    mediaAtual > 0

    ?

    Number(

        (

            total.Est_Final

            /

            mediaAtual

        )

        .toFixed(1)

    )

    :

    0

    

/* FUTUROS */

for(let i = 1; i < meses.length; i++){

    const mes = meses[i]

    const forecasts = []

    /* 3 FUTUROS */

    for(let x = i + 1; x <= i + 3; x++){

        if(meses[x]){

            forecasts.push(

                total[
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

                    total[
                        `${meses[x]}_forecast`
                    ] || 0

                )

            }

        }

    }

    const soma =

        forecasts.reduce(

            (a,b)=>a+b,

            0

        )

    const media =

        forecasts.length

        ?

        soma / forecasts.length

        :

        0

    const estoque =

        total[
            `${mes}_est_final`
        ] || 0

    total[
        `${mes}_m_for`
    ] =

    

        media > 0

        ?

        Number(

            (

                estoque / media

            )

            .toFixed(1)

        )

        :

        0


        /* =====================================
   M MÉD TOTAL
===================================== */

const estoqueMed =

    total[
        `${mes}_est_final_Média`
    ] || 0

const media3m =

    total.media_3m || 0

total[
    `${mes}_m_med`
] =

    media3m > 0

    ?

    Number(

        (

            estoqueMed / media3m

        )

        .toFixed(1)

    )

    :

    0;

}



    return novo

}


function criarSubtotal(item){

    const subtotal = {};

    /* =====================================
       PRIMEIRO CRIA OS CAMPOS
    ===================================== */

    Object.keys(item).forEach(campo => {

        if(typeof item[campo] === "number"){

            subtotal[campo] = 0;

        }else{

            subtotal[campo] = "";

        }

    });

    /* =====================================
       DEPOIS DEFINE IDENTIFICAÇÃO
       IMPORTANTE: NÃO SERÃO SOBRESCRITOS
    ===================================== */

    subtotal.tipo = "subtotal";

    subtotal.linha =
        String(item.linha || "");

    subtotal.codigo =
        "TOTAL " + String(item.codigo || "");

    subtotal.tam = "";

    /* =====================================
       GARANTIR CAMPOS DE CÁLCULO
    ===================================== */

    subtotal.qtd_final_c = 0;

    subtotal.custo_total_final = 0;

    subtotal.cme_final = 0;

    return subtotal;
}