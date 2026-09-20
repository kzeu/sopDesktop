async function carregarForecasts(rowData){

    const status =
        document.getElementById(
            'statusCarregamento'
        );

    /* =====================================================
       MAPA DOS MESES
    ===================================================== */

    const mapaMes = {

        janeiro:1,
        fevereiro:2,
        março:3,
        abril:4,
        maio:5,
        junho:6,
        julho:7,
        agosto:8,
        setembro:9,
        outubro:10,
        novembro:11,
        dezembro:12

    };


    /* =====================================================
       MAPA DE PRODUTOS
       Evita rowData.find() milhares de vezes
    ===================================================== */

    const mapaProdutos = {};

    rowData.forEach(r => {

        if(
            r.tipo == 'subtotal' ||
            r.tipo == 'total'
        ){

            return;

        }

        const chave =
            String(
                r.codigo
            ).trim()

            + '_'

            + String(
                r.tam
            )
            .trim()
            .toUpperCase();


        mapaProdutos[chave] = r;

    });


    /* =====================================================
       PREPARAR ANOS NECESSÁRIOS
    ===================================================== */

    const dadosMeses =
        meses.map(mesNome => {

            const partes =
                mesNome.split('-');

            const nomeMes =
                partes[0];

            const ano =
                '20' + partes[1];

            const numeroMes =
                mapaMes[nomeMes];

            return {

                mesNome,
                nomeMes,
                ano,
                numeroMes

            };

        });


    /* =====================================================
       DESCOBRIR ANOS ÚNICOS
    ===================================================== */

    const anosUnicos =
        [
            ...new Set(
                dadosMeses.map(
                    item => item.ano
                )
            )
        ];


    /* =====================================================
       BUSCAR BUDGET + FORECASTS
       UMA VEZ POR ANO
    ===================================================== */

    const mapaForecastsPorAno = {};


    await Promise.all(

        anosUnicos.map(
            async ano => {

                try{

                    status.innerHTML =
                        `Carregando Forecast ${ano}...`;


                    /* =====================================
                       BUDGET
                    ===================================== */

                    const budgetResp =
                        await fetch(
                            `https://api.volkdobrasil.com.br/api/budget/year/${ano}`
                        );


                    if(!budgetResp.ok){

                        console.warn(
                            'Budget não carregado:',
                            ano,
                            budgetResp.status
                        );

                        mapaForecastsPorAno[ano] = [];

                        return;

                    }


                    const budgetJson =
                        await budgetResp.json();


                    if(!budgetJson.budget){

                        mapaForecastsPorAno[ano] = [];

                        return;

                    }


                    const budgetId =
                        budgetJson.budget.id;


                    /* =====================================
                       FORECASTS DO BUDGET
                    ===================================== */

                    const forecastsResp =
                        await fetch(
                            `https://api.volkdobrasil.com.br/api/forecast/budget/${budgetId}`
                        );


                    if(!forecastsResp.ok){

                        console.warn(
                            'Forecasts não carregados:',
                            ano,
                            forecastsResp.status
                        );

                        mapaForecastsPorAno[ano] = [];

                        return;

                    }


                    const forecastsJson =
                        await forecastsResp.json();


                    mapaForecastsPorAno[ano] =
                        Array.isArray(
                            forecastsJson.forecasts
                        )
                            ? forecastsJson.forecasts
                            : [];


                }
                catch(erro){

                    console.error(
                        `Erro ao carregar Forecast do ano ${ano}:`,
                        erro
                    );

                    mapaForecastsPorAno[ano] = [];

                }

            }
        )

    );


    /* =====================================================
       LOCALIZAR FORECAST DE CADA MÊS
    ===================================================== */

    const mesesParaBuscar = [];


    dadosMeses.forEach(
        item => {

            const forecasts =
                mapaForecastsPorAno[
                    item.ano
                ] || [];


            const forecastMes =
                forecasts.find(
                    f =>
                        Number(f.month)
                        ===
                        item.numeroMes
                );


            if(!forecastMes){

                return;

            }


            mesesParaBuscar.push({

                ...item,

                forecastId:
                    forecastMes.id

            });

        }
    );


    /* =====================================================
       BUSCAR PRODUTOS DOS MESES EM PARALELO
    ===================================================== */

    await Promise.all(

        mesesParaBuscar.map(
            async item => {

                try{

                    status.innerHTML =
                        `Carregando ${item.mesNome}...`;


                    const produtosResp =
                        await fetch(
                            `https://api.volkdobrasil.com.br/api/forecast/products/${item.forecastId}`
                        );


                    if(!produtosResp.ok){

                        console.warn(
                            `Forecast de produtos não carregado: ${item.mesNome}`,
                            produtosResp.status
                        );

                        return;

                    }


                    const produtosJson =
                        await produtosResp.json();


                    if(
                        !produtosJson.forecast_products
                    ){

                        return;

                    }


                    /* =====================================
                       PREENCHER GRID
                    ===================================== */

                    produtosJson
                        .forecast_products
                        .forEach(fp => {

                            const chave =

                                String(
                                    fp['Código']
                                )
                                .trim()

                                + '_'

                                + String(
                                    fp['Derivação']
                                )
                                .trim()
                                .toUpperCase();


                            const linhaGrid =
                                mapaProdutos[chave];


                            if(!linhaGrid){

                                return;

                            }


                            const forecast =
                                parseFloat(

                                    String(
                                        fp.Qtde || 0
                                    )
                                    .replace(
                                        /\./g,
                                        ''
                                    )
                                    .replace(
                                        ',',
                                        '.'
                                    )

                                ) || 0;


                            linhaGrid[
                                `${item.mesNome}_forecast`
                            ] = forecast;

                        });


                }
                catch(erro){

                    console.error(
                        `Erro ao carregar Forecast ${item.mesNome}:`,
                        erro
                    );

                }

            }
        )

    );


    status.innerHTML =
        'Forecast carregado';

}


function calcularMedia3Meses(rowData){

    const ultimos3 =
        mesesPassados.slice(-3);

    rowData.forEach(item=>{

        let somaForecast = 0;
        let somaVendas = 0;
        let somaDesvio = 0;
        let somaPerc = 0;

        ultimos3.forEach(m=>{

            const forecast =
                Number(
                    item[`${m}_forecast`] || 0
                );

            const vendas =
                Number(
                    item[`${m}_vendas`] || 0
                );

            const desvio =
                vendas - forecast;

            somaForecast += forecast;
            somaVendas += vendas;
            somaDesvio += desvio;

            if(forecast > 0){

                somaPerc +=
                    desvio / forecast;

            }

        });

        /* ============================
           MÉDIA VENDAS
        ============================ */

        item.media_3m =
            Math.round(
                somaVendas / 3
            );

        /* ============================
           MÉDIA FORECAST
        ============================ */

        item.media_forecast =
            Math.round(
                somaForecast / 3
            );

        /* ============================
           MÉDIA DESVIO
        ============================ */

        item.media_desvio =
            Math.round(
                somaDesvio/ 3
            );

        /* ============================
           MÉDIA % DESVIO
        ============================ */

        item.media_desvio_perc =
            somaPerc / item.media_desvio/ 3;

        /* ============================
           DESVIO EM MESES
        ============================ */

      if(
    item.media_forecast &&
    item.media_forecast > 0
){

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

    });

}






async function carregarForecastsPassados(rowData){

    const status =
        document.getElementById(
            'statusCarregamento'
        );


    /* =====================================================
       MAPA DOS MESES
    ===================================================== */

    const mapaMes = {

        janeiro:1,
        fevereiro:2,
        março:3,
        abril:4,
        maio:5,
        junho:6,
        julho:7,
        agosto:8,
        setembro:9,
        outubro:10,
        novembro:11,
        dezembro:12

    };


    /* =====================================================
       MAPA DE PRODUTOS
       Evita rowData.find() milhares de vezes
    ===================================================== */

    const mapaProdutos = {};


    rowData.forEach(r => {

        if(
            r.tipo == 'subtotal' ||
            r.tipo == 'total'
        ){

            return;

        }


        const chave =
            String(
                r.codigo
            ).trim()

            + '_'

            + String(
                r.tam
            )
            .trim()
            .toUpperCase();


        mapaProdutos[chave] = r;

    });


    /* =====================================================
       PREPARAR OS 12 MESES
    ===================================================== */

    const dadosMeses =
        mesesPassados.map(mesNome => {

            const partes =
                mesNome.split('-');

            const nomeMes =
                partes[0];

            const ano =
                '20' + partes[1];

            const numeroMes =
                mapaMes[nomeMes];

            return {

                mesNome,
                nomeMes,
                ano,
                numeroMes

            };

        });


    /* =====================================================
       ANOS ÚNICOS
       Evita buscar o mesmo budget várias vezes
    ===================================================== */

    const anosUnicos =
        [
            ...new Set(
                dadosMeses.map(
                    item => item.ano
                )
            )
        ];


    /* =====================================================
       BUSCAR BUDGET + FORECASTS
       UMA VEZ POR ANO
    ===================================================== */

    const mapaForecastsPorAno = {};


    await Promise.all(

        anosUnicos.map(
            async ano => {

                try{

                    status.innerHTML =
                        `Carregando histórico ${ano}...`;


                    /* =====================================
                       BUDGET
                    ===================================== */

                    const budgetResp =
                        await fetch(
                            `https://api.volkdobrasil.com.br/api/budget/year/${ano}`
                        );


                    if(!budgetResp.ok){

                        console.warn(
                            'Budget não carregado:',
                            ano,
                            budgetResp.status
                        );

                        mapaForecastsPorAno[ano] = [];

                        return;

                    }


                    const budgetJson =
                        await budgetResp.json();


                    if(!budgetJson.budget){

                        mapaForecastsPorAno[ano] = [];

                        return;

                    }


                    const budgetId =
                        budgetJson.budget.id;


                    /* =====================================
                       FORECASTS DO BUDGET
                    ===================================== */

                    const forecastsResp =
                        await fetch(
                            `https://api.volkdobrasil.com.br/api/forecast/budget/${budgetId}`
                        );


                    if(!forecastsResp.ok){

                        console.warn(
                            'Forecasts não carregados:',
                            ano,
                            forecastsResp.status
                        );

                        mapaForecastsPorAno[ano] = [];

                        return;

                    }


                    const forecastsJson =
                        await forecastsResp.json();


                    mapaForecastsPorAno[ano] =
                        Array.isArray(
                            forecastsJson.forecasts
                        )
                            ? forecastsJson.forecasts
                            : [];

                }
                catch(erro){

                    console.error(
                        `Erro histórico ano ${ano}:`,
                        erro
                    );

                    mapaForecastsPorAno[ano] = [];

                }

            }
        )

    );


    /* =====================================================
       LOCALIZAR O FORECAST DE CADA MÊS
    ===================================================== */

    const mesesParaBuscar = [];


    dadosMeses.forEach(
        item => {

            const forecasts =
                mapaForecastsPorAno[
                    item.ano
                ] || [];


            const forecastMes =
                forecasts.find(
                    f =>
                        Number(f.month)
                        ===
                        item.numeroMes
                );


            if(!forecastMes){

                return;

            }


            mesesParaBuscar.push({

                ...item,

                forecastId:
                    forecastMes.id

            });

        }
    );


    /* =====================================================
       BUSCAR PRODUTOS DOS 12 MESES EM PARALELO
    ===================================================== */

    await Promise.all(

        mesesParaBuscar.map(
            async item => {

                try{

                    status.innerHTML =
                        `Carregando histórico ${item.mesNome}...`;


                    const produtosResp =
                        await fetch(
                            `https://api.volkdobrasil.com.br/api/forecast/products/${item.forecastId}`
                        );


                    if(!produtosResp.ok){

                        console.warn(
                            `Forecast histórico não carregado: ${item.mesNome}`,
                            produtosResp.status
                        );

                        return;

                    }


                    const produtosJson =
                        await produtosResp.json();


                    if(
                        !produtosJson.forecast_products
                    ){

                        return;

                    }


                    /* =====================================
                       PREENCHER GRID
                    ===================================== */

                    produtosJson
                        .forecast_products
                        .forEach(fp => {

                            const chave =

                                String(
                                    fp['Código']
                                )
                                .trim()

                                + '_'

                                + String(
                                    fp['Derivação']
                                )
                                .trim()
                                .toUpperCase();


                            const linhaGrid =
                                mapaProdutos[chave];


                            if(!linhaGrid){

                                return;

                            }


                            const forecast =
                                parseFloat(
                                    String(
                                        fp.Qtde || 0
                                    )
                                    .replace(
                                        /\./g,
                                        ''
                                    )
                                    .replace(
                                        ',',
                                        '.'
                                    )
                                ) || 0;


                            /* FORECAST */

                            linhaGrid[
                                `${item.mesNome}_forecast`
                            ] = forecast;


                            /* VENDAS */

                            linhaGrid[
                                `${item.mesNome}_vendas`
                            ] = 0;


                            /* DESVIO */

                            linhaGrid[
                                `${item.mesNome}_desvio`
                            ] = -forecast;

                        });

                }
                catch(erro){

                    console.error(
                        'Erro histórico:',
                        item.mesNome,
                        erro
                    );

                }

            }
        )

    );


    status.innerHTML =
        'Histórico carregado';

}

async function carregarPedidos(rowData){

    const pedidos =
        await window.api.buscarPedidosAbertos();

    const mapaProdutos = {};

    rowData.forEach(item=>{

        if(
            item.tipo=="subtotal" ||
            item.tipo=="total"
        ) return;

        item.Ped_nao_fechado = 0;
        item.Ped_Aberto = 0;
        item.Ped_Logistica = 0;

        mapaProdutos[
            item.codigo + "_" + item.tam.toUpperCase()
        ] = item;

    });

    pedidos.forEach(p=>{

       const codigoPrincipal =

    obterCodigoPrincipal(

        String(p["PEDIDOS[CODPRO]"]).trim()

            );

        const chave =

            codigoPrincipal

            + "_"

            +

            String(p["PEDIDOS[CODDER]"])
            .trim()
            .toUpperCase();

        const linha = mapaProdutos[chave];

        if(!linha) return;

        const qtd =
            Number(p["[QTDABE]"]) || 0;

            const valorp =
            Number(p["[VLRBRU]"]) || 0;

        const status =
            Number(p["PEDIDOS[SITIPD]"]);

        const descricao =

            String(
                p["PEDIDOS[DESSIT]"] || ""
            ).toUpperCase();

        /* NÃO FECHADO */

        if(status == 9){

            linha.Ped_nao_fechado += qtd;

            return;
        }

        /* PEDIDO ABERTO */

        if(status == 1){

            linha.Ped_Aberto += qtd;
            linha.Vlr_Ped_Aberto += valorp;

            return;
        }

        /* LOGÍSTICA */

        if(

            descricao.includes("WMS")

            &&

            descricao.includes("LIBERADO")

        ){

            linha.Ped_Logistica += qtd;

        }
        else{

            linha.Ped_Aberto += qtd;

        }

    });

}



async function carregarFaturado(rowData){


    const status =
        document.getElementById(
            "statusCarregamento"
        );

    status.innerHTML =
        "Carregando Faturado...";

    /* ==========================================
       LER JSON
    ========================================== */

   const faturado =
await window.api.buscarFaturado();

    /* ==========================================
       MAPA DOS PRODUTOS
    ========================================== */

    const mapaProdutos = {};

    rowData.forEach(item=>{

        if(
            item.tipo=="subtotal"
            ||
            item.tipo=="total"
        ){
            return;
        }

        mapaProdutos[
            String(item.codigo).trim()
            +
            "_"
            +
            String(item.tam)
            .trim()
            .toUpperCase()
        ] = item;

    });



    /* ==========================================
       MAPA DOS MESES
    ========================================== */

    const nomesMes = {

        1:"janeiro",
        2:"fevereiro",
        3:"março",
        4:"abril",
        5:"maio",
        6:"junho",
        7:"julho",
        8:"agosto",
        9:"setembro",
        10:"outubro",
        11:"novembro",
        12:"dezembro"

    };

    /* ==========================================
       PERCORRER FATURADO
    ========================================== */

    faturado.forEach(venda=>{

        if(!venda["F_NFS[SKU]"]){

            return;

        }

        /* ==============================
           CÓDIGO + DERIVAÇÃO
        ============================== */

        const partes =

            venda["F_NFS[SKU]"]
            .trim()
            .split(" ");

        const codigo =
            partes[0];

        const derivacao =
            partes
            .slice(1)
            .join(" ")
            .toUpperCase();

            const codigoPrincipal =

            obterCodigoPrincipal(codigo);

        /* ==============================
           MÊS
        ============================== */


        const anoMes =
                String(
                    venda["F_NFS[AnoMes]"] || ""
                ).trim();

            if(
                !/^\d{6}$/.test(anoMes)
            ){
                console.warn(
                    "Faturado ignorado. AnoMes inválido:",
                    venda
                );

                return;
            }

            const ano =
                anoMes.substring(0,4);

            const numeroMes =
                Number(
                    anoMes.substring(4,6)
                );

        const mesGrid =

            nomesMes[numeroMes]

            +

            "-"

            +

            ano.slice(-2);

        /* ==============================
           LOCALIZAR PRODUTO
        ============================== */

       const linha =

        mapaProdutos[
            codigoPrincipal
            +
            "_"
            +
            derivacao
        ];

        if(!linha){

            return;

        }

        /* ==============================
           QUANTIDADE FATURADA
        ============================== */

        linha[
            `${mesGrid}_vendas`
        ] =

            (

                linha[
                    `${mesGrid}_vendas`
                ] || 0

            )

            +

            (

                Number(
                    venda["[QUANTIDADE]"]
                )

                ||

                0

            );

        /* ==============================
           VALOR BRUTO
        ============================== */

        linha[
            `${mesGrid}_vlr_bruto`
        ] =

            (

                linha[
                    `${mesGrid}_vlr_bruto`
                ] || 0

            )

            +

            (

                Number(
                    venda["[VLRBRUTO]"]
                )

                ||

                0

            );

            /* ==============================
   PREÇO MÉDIO
============================== */

            const qtd =

                linha[
                    `${mesGrid}_vendas`
                ] || 0;

            const bruto =

                linha[
                    `${mesGrid}_vlr_bruto`
                ] || 0;

            linha[
                `${mesGrid}_preco_medio`
            ] =

                qtd > 0

                ?

                Number(

                    (
                        bruto / qtd
                    ).toFixed(2)

                )

                :

                0;

                


            /* ==============================
                DESVIO = VENDAS - FORECAST
                ============================== */

                linha[
                    `${mesGrid}_desvio`
                ] =

                    Number(
                        linha[
                            `${mesGrid}_vendas`
                        ] || 0
                    )

                    -

                    Number(
                        linha[
                            `${mesGrid}_forecast`
                        ] || 0
                    );

    });

    status.innerHTML =
        "Faturado carregado";



}

async function carregarGruposProdutos(){

    const resp = await fetch(
        "https://api.volkdobrasil.com.br/api/productsGroup"
    );

    const json = await resp.json();

    cacheGrupoProduto = {};

   cacheGrupos = {};

for(const grupo of json.product_groups){

    const respItens = await fetch(
        `https://api.volkdobrasil.com.br/api/productsGroup/${grupo.id}/products`
    );

    const jsonItens = await respItens.json();

    cacheGrupos[grupo.name] = [];

    jsonItens.products.forEach(p=>{

        cacheGrupoProduto[
            p.product.code
        ] = grupo.name;

        cacheGrupos[
            grupo.name
        ].push(
            p.product.code
        );

    });

}
console.log(cacheGrupos);

}

function obterCodigoPrincipal(codigo){

    return cacheGrupoProduto[codigo] || codigo;

}



async function carregarEstoques(rowData){


    const mapaProdutos = {}

        rowData.forEach(r => {

        mapaProdutos[
            r.codigo + '_' + r.tam
        ] = r

        })

   const processosResp =
   await fetch(
      'https://api.volkdobrasil.com.br/api/processes'
   )

   const processosJson =
   await processosResp.json()

   const processoEstoque =

   processosJson.processes.find(

      p => p.type == 'Estoque'

   )

   if(!processoEstoque){

      return

   }

   const estoqueResp =
   await fetch(

      `https://api.volkdobrasil.com.br/api/processes/stocks/${processoEstoque.id}`

   )

   const estoqueJson =
   await estoqueResp.json()

   const mapaDeposito = {

      

    '205':'est_disp',

   '207':'Est_terceiros',
   'CDI':'Est_terceiros',

   '208':'Est_Rejeitado',

   '201':'Est_Quarentena',

   '225':'Est_Reserva',

   '2C.Q': 'Est_CQ',
   '202': 'Est_Embalagem',
    '202B': 'Est_Embalagem'


   }


   estoqueJson.processItems.forEach(item => {

    const codigoPrincipal =

        obterCodigoPrincipal(item.codPro);


        if(item.codPro !== codigoPrincipal){

    

}

    const linhaGrid =

        mapaProdutos[
            codigoPrincipal + "_" + item.codDer
        ];

    if(!linhaGrid){

        return;

    }

      const coluna =

      mapaDeposito[item.codDep]

      if(!coluna){

         return

      }

      linhaGrid[coluna] =

        (linhaGrid[coluna] || 0)

        +


      parseFloat(item.qtdEst) || 0


      /* EST TOTAL */

linhaGrid.est_total =

    (linhaGrid.est_total || 0)

    +

    (

        parseFloat(item.qtdEst)

        || 0

    )

      /* CUSTO MÉDIO */

    const qtd = parseFloat(item.qtdEst) || 0;

const cme = parseFloat(item.prmEst) || 0;

const valor = qtd * cme;

/* Soma valor total */

linhaGrid.valor_estoque =

    (linhaGrid.valor_estoque || 0)

    +

    valor;

/* Recalcula o CME */

linhaGrid.custo_medio =

    linhaGrid.est_total > 0

    ?

    linhaGrid.valor_estoque / linhaGrid.est_total

    :

    0;





  })


}




async function carregarEntradas(rowData, comprasSalvas){

    /* =====================================================
       MAPA PRODUTOS
    ===================================================== */

    const mapaProdutos = {}

    rowData.forEach(r => {

        mapaProdutos[
            r.codigo + '_' + r.tam
        ] = r

    })


    /* =====================================================
       LIMPAR ENTRADAS ANTIGAS
    ===================================================== */

    rowData.forEach(item=>{

        item.Est_Entrada = 0;
        item.fob_total = 0;
        item.cf_qtd_disp = 0;
        item.cf_custo_total = 0;

        meses.forEach(m=>{

            item[`${m}_entrada`] = 0;
            item[`${m}_cf_fob_total`] = 0;

        });

    });


    /* =====================================================
       ORDENS RECEBIDAS
    ===================================================== */

    if(!comprasSalvas){

        console.warn(
            "carregarEntradas: nenhuma ordem foi informada."
        );

        return;

    }


    /* =====================================================
       CACHE LOCAL
    ===================================================== */

    ordensCache = structuredClone(comprasSalvas);


    /* =====================================================
       MAPA MESES
    ===================================================== */

    const nomesMes = {

        1:'janeiro',
        2:'fevereiro',
        3:'março',
        4:'abril',
        5:'maio',
        6:'junho',
        7:'julho',
        8:'agosto',
        9:'setembro',
        10:'outubro',
        11:'novembro',
        12:'dezembro'

    }


    /* =====================================================
       LOOP ITENS
    ===================================================== */

    comprasSalvas.forEach(item => {

        /* IGNORAR FINALIZADO */

        if(
            String(item.status)
                .trim()
                .toUpperCase()
            == "FINALIZADO"
        ){

            return;

        }


        if(!item.etaVolk){

            return;

        }


        /* =================================================
           DATA ETA
        ================================================= */

        const data = new Date(item.etaVolk);

        const mes = data.getMonth() + 1;

        const ano = data.getFullYear().toString();


        /* =================================================
           FORMATO GRID
        ================================================= */

        const mesGrid =
            `${nomesMes[mes]}-${ano.slice(-2)}`


        /* =================================================
           LOCALIZAR PRODUTO
        ================================================= */

        const codigoPrincipal =
            obterCodigoPrincipal(item.codPro);


        const linhaGrid =
            mapaProdutos[
                codigoPrincipal + "_" + item.codDer
            ];


        if(!linhaGrid){

            return

        }


        /* =================================================
           QUANTIDADE
        ================================================= */

        const quantidade =
            parseFloat(item.qtdIte) || 0


        /* FOB TOTAL */

        const fobTotal =
            Number(item.valorTotal) || 0;


        /* =================================================
           MÊS ATUAL
        ================================================= */

        if(mesGrid == mesAtual){

            linhaGrid.Est_Entrada =

                (linhaGrid.Est_Entrada || 0)

                +

                quantidade;


            linhaGrid.fob_total =

                (linhaGrid.fob_total || 0)

                +

                fobTotal;


            linhaGrid.fob_unit =

                linhaGrid.Est_Entrada > 0

                ?

                Number(

                    (

                        linhaGrid.fob_total

                        /

                        linhaGrid.Est_Entrada

                    ).toFixed(3)

                )

                :

                0;

        }


        /* =================================================
           FUTUROS
        ================================================= */

        else{

            linhaGrid[
                `${mesGrid}_entrada`
            ] =

                (

                    linhaGrid[
                        `${mesGrid}_entrada`
                    ] || 0

                )

                +

                quantidade;


            linhaGrid[
                `${mesGrid}_cf_fob_total`
            ] =

                (

                    linhaGrid[
                        `${mesGrid}_cf_fob_total`
                    ] || 0

                )

                +

                fobTotal;

        }

    });

}





async function atualizarEntradaProduto(
    codigo,
    derivacao
){
    const codigoPrincipal =

    obterCodigoPrincipal(codigo);   

    const codigos =

    cacheGrupos[codigoPrincipal]

    ||

    [codigoPrincipal];


    console.log("Principal:", codigoPrincipal);

console.log("Grupo:", codigos);
    /* =========================================
       LOCALIZAR SOMENTE A LINHA
    ========================================= */

    const linhaGrid = rowData.find(r =>

        r.tipo != "subtotal" &&

        r.tipo != "total" &&

        String(r.codigo) == String(codigoPrincipal) &&

        String(r.tam) == String(derivacao)

    );

    if(!linhaGrid){

        console.warn(
            "Linha não encontrada:",
            codigo,
            derivacao
        );

        return null;

    }


    /* =========================================
       ZERAR SOMENTE ESTA LINHA
    ========================================= */

    linhaGrid.Est_Entrada = 0;

    linhaGrid.fob_total = 0;

    linhaGrid.cf_qtd_disp = 0;

    linhaGrid.cf_custo_total = 0;


    meses.forEach(m => {

        linhaGrid[`${m}_entrada`] = 0;

        linhaGrid[
            `${m}_cf_fob_total`
        ] = 0;

    });


    /* =========================================
       BUSCAR SOMENTE ORDENS DESSE SKU
    ========================================= */


let ordens;

if (cenarioSelecionado) {

    ordens = comprasCenario.filter(o =>

        codigos.includes(String(o.codPro))

        &&

        String(o.codDer).trim().toUpperCase()

        ===

        String(derivacao).trim().toUpperCase()

    );

} else {

    ordens = ordensCache.filter(o =>

        codigos.includes(String(o.codPro))

        &&

        String(o.codDer).trim().toUpperCase()

        ===

        String(derivacao).trim().toUpperCase()

    );

}





console.log("ORDENS APÓS MESCLAR");

ordens.forEach(o => {

    console.log(
        o.numOcp,
        o.etaVolk
    );

});


    if(!ordens){

        return linhaGrid;

    }


    /* =========================================
       MAPA MESES
    ========================================= */

    const nomesMes = {

        1: "janeiro",
        2: "fevereiro",
        3: "março",
        4: "abril",
        5: "maio",
        6: "junho",
        7: "julho",
        8: "agosto",
        9: "setembro",
        10: "outubro",
        11: "novembro",
        12: "dezembro"

    };


    /* =========================================
       RECONSTRUIR ENTRADAS SOMENTE DO SKU
    ========================================= */

    ordens.forEach(item => {

        if(
            String(item.status)
                .trim()
                .toUpperCase()
            == "FINALIZADO"
        ){
            return;
        }


        if(!item.etaVolk){
            return;
        }

        const data = new Date(item.etaVolk);

        if(data < new Date('2025-01-01')){
            return;
        }

        const mes = data.getMonth() + 1;
        const ano = data.getFullYear().toString();


        const mesGrid =

            `${nomesMes[mes]}-${ano.slice(-2)}`;


        const quantidade =

            parseFloat(item.qtdIte) || 0;


        const fobTotal = Number(item.valorTotal) || 0;


        /* MÊS ATUAL */

        if(mesGrid == mesAtual){

            linhaGrid.Est_Entrada =

                (linhaGrid.Est_Entrada || 0)

                +

                quantidade;


            linhaGrid.fob_total =

                (linhaGrid.fob_total || 0)

                +

                fobTotal;

        }

        /* FUTUROS */

        else{

            linhaGrid[
                `${mesGrid}_entrada`
            ] =

                (
                    linhaGrid[
                        `${mesGrid}_entrada`
                    ] || 0
                )

                +

                quantidade;


            linhaGrid[
                `${mesGrid}_cf_fob_total`
            ] =

                (
                    linhaGrid[
                        `${mesGrid}_cf_fob_total`
                    ] || 0
                )

                +

                fobTotal;

        }

    });


    return linhaGrid;

}

async function carregarFatores(rowData){      

            const resp = await fetch(
                'https://api.volkdobrasil.com.br/api/factors'
            )

            const json = await resp.json()

            if(!json.factors){

                return

            }

            /* MAPA PRODUTO */

            const mapaFatores = {}
        json.factors
        .filter(f => f.deleted_at == null)
        .forEach(f=>{

            const codigo =

                String(
                    f.code || ''
                ).trim()

            if(!mapaFatores[codigo]){

                mapaFatores[codigo] = []

            }

            mapaFatores[codigo].push({

                inicio:new Date(f.date_initial),

                final:new Date(f.date_final),

                fator:parseFloat(

                    String(
                        f.factor || '1.333'
                    ).replace(',','.')

                ) || 1.333

            })

    })

    /* MAPA DOS MESES */

    const numeroMes = {

        janeiro:0,
        fevereiro:1,
        março:2,
        abril:3,
        maio:4,
        junho:5,
        julho:6,
        agosto:7,
        setembro:8,
        outubro:9,
        novembro:10,
        dezembro:11

    }

    rowData.forEach(item=>{

        const fatoresProduto =

                        mapaFatores[
                            String(item.codigo).trim()
                        ]

                    /* NÃO TEM CADASTRO */

    if(!fatoresProduto){

        item.fator = 1.333

        meses.forEach(m=>{

            item[`${m}_cf_fator`] = 1.333

        })

        return
    }

    /* FATOR DO MÊS ATUAL */

    const hoje = new Date()

    let fatorAtual = 1.333

    for(const fator of fatoresProduto){

        if(
            hoje >= fator.inicio
            &&
            hoje <= fator.final
        ){
            fatorAtual = fator.fator
            break
        }

    }

   item.fator = fatorAtual

        meses.forEach(m=>{

            const partes = m.split('-')

            const nomeMes = partes[0]

            const ano =

                Number(
                    '20' + partes[1]
                )

            const dataMes =

                new Date(

                    ano,

                    numeroMes[nomeMes],

                    1

                )

            let encontrou = false

            for(const fator of fatoresProduto){

                if(

                    dataMes >= fator.inicio

                    &&

                    dataMes <= fator.final

                ){

                    item[
                        `${m}_cf_fator`
                    ] = fator.fator

                    encontrou = true

                    break

                }

            }

            /* NÃO ACHOU */

            if(!encontrou){

                item[
                    `${m}_cf_fator`
                ] = 1.333

            }

        })

    })

}



async function carregarDolar(rowData){

    const resp = await fetch(
        'https://api.volkdobrasil.com.br/api/dolar'
    )

    const json = await resp.json()

    if(!json.dolars){
        return
    }

    const dolares = json.dolars.filter(
        d => d.deleted_at == null
    )

    const numeroMes = {
        janeiro:0,
        fevereiro:1,
        março:2,
        abril:3,
        maio:4,
        junho:5,
        julho:6,
        agosto:7,
        setembro:8,
        outubro:9,
        novembro:10,
        dezembro:11
    }

    rowData.forEach(item=>{

        /* DÓLAR ATUAL */

        const hoje = new Date()

        let dolarAtual = 5

        for(const dolar of dolares){

            const inicio = new Date(dolar.date_initial)
            const fim = new Date(dolar.date_final)

            if(
                hoje >= inicio
                &&
                hoje <= fim
            ){
                dolarAtual =
                    parseFloat(
                        String(dolar.tax)
                        .replace(',','.')
                    )

                break
            }
        }

        item.dolar = dolarAtual

        /* FUTUROS */

        meses.forEach(m=>{

            const partes = m.split('-')

            const nomeMes = partes[0]

            const ano =
                Number('20' + partes[1])

            const dataMes = new Date(
                ano,
                numeroMes[nomeMes],
                1
            )

            let valorMes = 5

            for(const dolar of dolares){

                const inicio =
                    new Date(dolar.date_initial)

                const fim =
                    new Date(dolar.date_final)

                if(
                    dataMes >= inicio
                    &&
                    dataMes <= fim
                ){
                    valorMes =
                        parseFloat(
                            String(dolar.tax)
                            .replace(',','.')
                        )

                    break
                }
            }

            item[`${m}_cf_dolar`] = valorMes

        })

    })

}

    function recalcularPlanejamento(rowData, ordenar = true){

        

        calcularAtual(rowData);

     

        calcularFuturo(rowData);



        if(ordenar){

            

            ordenarPlanejamento(rowData);

            

        }

     

        atualizarGrid(rowData);

  

    }

function calcularAtual(rowData){

   /* FOB UNIT */

        rowData.forEach(item => {

            item.fat_liq =

            item[
                `${mesAtual}_vendas`
            ] || 0;

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

                /* CUSTO ENTRADA */

                item.custo_entrada =

                    Number(

                        (

                            (item.fob_total || 0)

                            *

                            (item.dolar || 0)

                            *

                            (item.fator || 0)

                        )

                        .toFixed(2)

                    )

                
                     item.a_realizar =

                    (item[`${mesAtual}_forecast`] || 0)

                    -

                    (item.fat_liq || 0)



                     item.Est_Planejamento =

                    (item.est_disp || 0)

                    +

                    (item.Est_terceiros || 0)

                    +

                    (item.Est_Embalagem || 0)

                    +

                    (item.Est_Quarentena || 0)

                    +

                    (item.Est_Reserva || 0)

                    const realizar =

        item.a_realizar < 0

        ? 0

        : item.a_realizar

    item.Est_Final =

        (item.Est_Planejamento || 0)

        +

        (item.Est_Entrada || 0)

        -

        realizar


        /* QTD DISP */

    const estoqueEntrada =

        (item.est_total || 0)

        +

        (item.Est_Entrada || 0)

    item.qtd_disp =

        estoqueEntrada > realizar

        ?

        realizar

        :

        estoqueEntrada


        /* CUSTO SAÍDA */

    const qtdTotal =

    (item.Est_Entrada || 0)

    +

    (item.est_total || 0)

    const custoMedioSaida =

    qtdTotal > 0

    ?

    (

        (

            (item.custo_entrada || 0)

            +

            (item.valor_estoque || 0)

                        )

                        /

                        qtdTotal

                    )

                    :

                    0

                item.custo_saida =

                    Number(

                        (

                            custoMedioSaida

                            *

                            (item.qtd_disp || 0)

                        )

                        .toFixed(2)

                    )


                    /* QTD FINAL C */

                item.qtd_final_c =

                    (

                        item.est_total || 0

                    )

                    +

                    (

                        item.Est_Entrada || 0

                    )

                    -

                    (

                        item.qtd_disp || 0

                    )

                /* CUSTO TOTAL FINAL */

                item.custo_total_final =

                    Number(

                        (

                            (item.valor_estoque || 0)

                            +

                            (item.custo_entrada || 0)

                            -

                            (item.custo_saida || 0)

                        )

                        .toFixed(2)

                    )


                    /* CME FINAL */

                item.cme_final =

                    item.qtd_final_c > 0

                    ?

                    Number(

                        (

                            item.custo_total_final

                            /

                            item.qtd_final_c

                        )

                        .toFixed(2)

                    )

                    :

                    0

                    item[`${mesAtual}_est_final_Média`] =

                (item.fat_liq || 0)

                +

                (item.Est_Planejamento || 0)

                -

                (item.media_3m || 0)



                  const forecasts = []

    /* PEGAR PRÓXIMOS 3 MESES */

    for(let i = 1; i <= 3; i++){

        if(meses[i]){

            forecasts.push(

                item[
                    `${meses[i]}_forecast`
                ] || 0

            )

        }

    }

    /* MÉDIA */

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

    /* M FOR */

    item.m_for_atual =

        media > 0

        ?

        Number(

            (

                item.Est_Final

                /

                media

            )

            .toFixed(1)

        )

        :

        0





        })




}

function calcularFuturo(rowData){

    /* ESTOQUE FUTURO */

for(let i = 1; i < meses.length; i++){

    const mes = meses[i]

    const mesAnterior = meses[i - 1]

    rowData.forEach(item => {

        /* PRIMEIRO FUTURO */

        let estoqueBase = 0

        if(i == 1){

            estoqueBase =

                item.Est_Final || 0

        }

        /* DEMAIS */

        else{

            estoqueBase =

                item[
                    `${mesAnterior}_est_final`
                ] || 0

        }

        /* FORECAST */

        const forecast =

            item[
                `${mes}_forecast`
            ] || 0

        /* ENTRADA */

        const entrada =

            item[
                `${mes}_entrada`
            ] || 0

        const qtdSimu =

        item[
            `${mes}_Qtd_Simu`
        ] || 0

        /* EST FINAL */

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
   CF QTD DISP
===================================== */

let qtdBase = 0

/* PRIMEIRO FUTURO */

if(i == 1){

    qtdBase =

        (item.qtd_final_c || 0)

        +

        entrada

        +

        qtdSimu

}

/* DEMAIS */

else{

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

/* FORECAST */

        const forecastCf =

            forecast || 0

        /* RESULTADO */

        item[
            `${mes}_cf_qtd_disp`
        ] =

            qtdBase > forecastCf

            ?

            forecastCf

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

        )

        .toFixed(2)

    )

    :

    0

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

        )

        .toFixed(2)

    )

    

/* =====================================
   CF CUSTO SAÍDA
===================================== */

let custoBase = 0

let qtdBaseCusto = 0

/* PRIMEIRO FUTURO */

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

}

/* DEMAIS */

else{

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

/* CUSTO MÉDIO */

const custoMedioCf =

    qtdBaseCusto > 0

    ?

    (

        custoBase

        /

        qtdBaseCusto

    )

    :

    0

/* RESULTADO */

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

        )

        .toFixed(2)

    )



/* =====================================
   CF QTD FINAL
===================================== */

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

        (
            item[
                `${mes}_cf_qtd_disp`
            ] || 0
        )

}

/* DEMAIS */

else{

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

        (
            item[
                `${mes}_cf_qtd_disp`
            ] || 0
        )

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

            )

            .toFixed(2)

        )

}

/* DEMAIS */

else{

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

            )

            .toFixed(2)

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

        )

        .toFixed(2)

    )

    :

    0



})


}





/* EST FINAL MÉDIA FUTURO */

for(let i = 1; i < meses.length; i++){

    const mes = meses[i]

    const mesAnterior = meses[i - 1]

    rowData.forEach(item => {

        let estoqueBase = 0

        /* PRIMEIRO FUTURO */

        if(i == 1){

            estoqueBase =

                item[
                    `${mesAtual}_est_final_Média`
                ] || 0

        }

        /* DEMAIS */

        else{

            estoqueBase =

                item[
                    `${mesAnterior}_est_final_Média`
                ] || 0

        }

        /* ENTRADA */

        const entrada =

            item[
                `${mes}_entrada`
            ] || 0

        
        const qtdSimu =

        item[
            `${mes}_Qtd_Simu`
        ] || 0


        

        /* MÉDIA 3M */

        const media3m =

            item.media_3m || 0

        /* RESULTADO */

        item[
            `${mes}_est_final_Média`
        ] =

            estoqueBase

            +

            entrada
            +

            qtdSimu

            -

            media3m

    })

}


/* M MÉD */

for(let i = 1; i < meses.length; i++){

    const mes = meses[i]

    rowData.forEach(item => {

        const estoque =

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

                    estoque / media3m

                )

                .toFixed(1)

            )

            :

            0

    })

}



/* M FOR */

for(let i = 1; i < meses.length; i++){

    const mes = meses[i]

    rowData.forEach(item => {

        const forecasts = []

        /* =====================================
           PEGAR 3 FUTUROS
        ===================================== */

        for(let x = i + 1; x <= i + 3; x++){

            if(meses[x]){

                forecasts.push(

                    item[
                        `${meses[x]}_forecast`
                    ] || 0

                )

            }

        }

        /* =====================================
           SE NÃO TIVER 3 FUTUROS
           PEGAR ANTERIORES
        ===================================== */

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

        /* =====================================
           MÉDIA
        ===================================== */

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

        /* =====================================
           ESTOQUE FINAL
        ===================================== */

        const estoque =

            item[
                `${mes}_est_final`
            ] || 0

        /* =====================================
           M FOR
        ===================================== */

        item[
            `${mes}_m_for`
        ] =

            media > 0

            ?

            Number(

                (estoque / media)

                .toFixed(1)

            )

            :

            0

            /* =====================================
   M MÉD
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

    })

}

}


function ordenarPlanejamento(rowData){



const ordemLinha = {


    'DESCARTAVEIS':1,
    'REUTILIZAVEIS':2,
    'SUPORTE TEXTIL':3,
    'AUTOSSERVIÇO':4,
    'SMART':5,
    'COVER TECH':6,
    'OCULOS':7,
    'OVERPRO':8,
    'ECO HOPE':9,
    'COLETES':10,
    'POLIETILENO':11,
    'SEGURANÇA ALIMENTAR':12,
    'TNT':13,
    'CINTO ERGONÔMICO':14,
    'JOELHEIRA':15,
    'VESTIMENTAS DE CORTE':16


}

rowData.sort((a,b)=>{

    const ordemA =

        ordemLinha[
            String(a.linha)
            .toUpperCase()
        ] || 999

    const ordemB =

        ordemLinha[
            String(b.linha)
            .toUpperCase()
        ] || 999

    /* =====================================
       ORDEM LINHA
    ===================================== */

    if(ordemA < ordemB) return -1

    if(ordemA > ordemB) return 1

    /* =====================================
       CÓDIGO
    ===================================== */

    if(a.codigo < b.codigo) return -1

    if(a.codigo > b.codigo) return 1

    /* =====================================
       SUBTOTAL SEMPRE POR ÚLTIMO
    ===================================== */

    if(a.tipo == 'subtotal') return 1

    if(b.tipo == 'subtotal') return -1

    /* =====================================
       TAM
    ===================================== */

  /* =====================================
   ORDEM TAMANHO
===================================== */



const tamA = pesoTam(a.tam)

const tamB = pesoTam(b.tam)

if(tamA < tamB) return -1

if(tamA > tamB) return 1

    return 0

})


}

function pesoTam(tam){

    tam = String(tam || "").toUpperCase();

    const ordem = {

        EP:1,
        P:2,
        M:3,
        G:4,
        EG:5,
        EEG:6,
        EEEG:7,
        U:8,

        "6.0":9,
        "6.5":10,
        "7.0":11,
        "7.5":12,
        "8.0":13,
        "8.5":14,
        "9.0":15

    };

    return ordem[tam] || 999;

}

function atualizarGrid(rowData){

    // Remove subtotal e total antigos
    const dados = rowData.filter(x =>

        x.tipo != "subtotal"

        &&

        x.tipo != "total"

    );

    const rowDataFinal = gerarSubtotais(dados);

   gridApi.stopEditing();

    gridApi.setGridOption(
        "rowData",
        rowDataFinal
    );

    gridApi.refreshCells({
        force:true
    });

   

}


async function atualizarEntradas(){

    await carregarEntradas(
        rowData,
        ordensCache
    );

    calcularAtual(rowData);

    calcularFuturo(rowData);

    atualizarGrid(rowData);

}


async function salvarCenarioAtual(){

    if(cenarioSelecionado == null){

        modoModal = "salvar";

        abrirModalCenarios();

        return;
    }

    await salvarCenario();

   

    setTimeout(() => {

        const grid =
            document.getElementById("myGrid");

        if(grid){

            grid.focus({
                preventScroll:true
            });

        }

    }, 100);

}