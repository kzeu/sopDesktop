/* =========================================================
   RESUMO DO CENÁRIO
========================================================= */

let filtroResumo = {
    tipo: "todos",
    linha: "",
    codigo: ""
};


/* =========================================================
   ABRIR / FECHAR
========================================================= */

function abrirResumoCenario(){

    filtroResumo = {
        tipo: "todos",
        linha: "",
        codigo: ""
    };

    montarArvoreResumo();
    atualizarResumo();

    document.getElementById(
        "modalResumoCenario"
    ).style.display = "block";
}


function fecharResumoCenario(){

    document.getElementById(
        "modalResumoCenario"
    ).style.display = "none";
}


/* =========================================================
   DADOS SEM SUBTOTAIS
========================================================= */

function dadosResumo(){

    return rowData.filter(x =>
        x.tipo !== "subtotal" &&
        x.tipo !== "total"
    );
}


/* =========================================================
   DADOS CONFORME FILTRO
========================================================= */

function dadosFiltradosResumo(){

    const dados = dadosResumo();

    if(filtroResumo.tipo === "linha"){

        return dados.filter(x =>
            String(x.linha) ===
            String(filtroResumo.linha)
        );
    }

    if(filtroResumo.tipo === "produto"){

        return dados.filter(x =>
            String(x.linha) ===
            String(filtroResumo.linha)
            &&
            String(x.codigo) ===
            String(filtroResumo.codigo)
        );
    }

    return dados;
}


/* =========================================================
   SOMA
========================================================= */




function soma(dados, campo){

    return dados.reduce(
        (total, x) =>
            total + (Number(x[campo]) || 0),
        0
    );
} 


/* =========================================================
   MÉDIA PONDERADA
========================================================= */

function ponderado(dados, campoValor, campoPeso){

    let valorTotal = 0;
    let pesoTotal = 0;

    dados.forEach(x => {

        const valor =
            Number(x[campoValor]) || 0;

        const peso =
            Number(x[campoPeso]) || 0;

        if(peso > 0){

            valorTotal += valor * peso;
            pesoTotal += peso;
        }
    });

    return pesoTotal > 0
        ? valorTotal / pesoTotal
        : 0;
}


/* =========================================================
   FOB PONDERADO
========================================================= */

function fobPonderado(
    dados,
    campoFob,
    campoQtd
){

    return ponderado(
        dados,
        campoFob,
        campoQtd
    );
}


/* =========================================================
   CALCULAR RESUMO
========================================================= */

function calcularResumo(dados){

    const resumo = {};

    meses.forEach((mes, i) => {

        const futuro = i > 0;

        const anterior =
            i > 0
            ? meses[i - 1]
            : null;


        /* =====================================
           QUANTIDADES
        ===================================== */

        let qtdInicial;

        if(!futuro){

            qtdInicial =
                soma(dados, "est_total");

        }else if(i === 1){

            qtdInicial =
                soma(dados, "qtd_final_c");

        }else{

            qtdInicial =
                soma(
                    dados,
                    `${anterior}_cf_qtd_final`
                );
        }


        const qtdEntrada =
            !futuro
            ? soma(dados, "Est_Entrada")
            : soma(
                dados,
                `${mes}_entrada`
            );


        const qtdSimulada =
            !futuro
            ? 0
            : soma(
                dados,
                `${mes}_Qtd_Simu`
            );


        const qtdSaida =
    !futuro
    ? soma(
        dados,
        "qtd_disp"
    )
    : soma(
        dados,
        `${mes}_cf_qtd_disp`
    );


const qtdSaldo =
    !futuro
    ? soma(
        dados,
        "qtd_final_c"
    )
    : soma(
        dados,
        `${mes}_cf_qtd_final`
    );


        /* =====================================
           CUSTOS
        ===================================== */

        let custoInicial;

        if(!futuro){

            custoInicial =
                soma(
                    dados,
                    "valor_estoque"
                );

        }else if(i === 1){

            custoInicial =
                soma(
                    dados,
                    "custo_total_final"
                );

        }else{

            custoInicial =
                soma(
                    dados,
                    `${anterior}_cf_custo_final`
                );
        }

            const custoEntrada =
                !futuro
                ? soma(
                    dados,
                    "custo_entrada"
                )
                : soma(
                    dados,
                    `${mes}_cf_entrada`
                );


            const custoEntradaSimulada =
                !futuro
                ? 0
                : soma(
                    dados,
                    `${mes}_cf_entrada_simu`
                );


        const custoSaida =
            !futuro
            ? soma(
                dados,
                "custo_saida"
            )
            : soma(
                dados,
                `${mes}_cf_custo_saida`
            );


        const custoSaldo =
            !futuro
            ? soma(
                dados,
                "custo_total_final"
            )
            : soma(
                dados,
                `${mes}_cf_custo_final`
            );


        /* =====================================
           CME
        ===================================== */

        const cme =
            qtdSaldo > 0
            ? custoSaldo / qtdSaldo
            : 0;


        /* =====================================
           COBERTURA
        ===================================== */

        const forecast =
            soma(
                dados,
                `${mes}_forecast`
            );


        const cobertura =
            forecast > 0
            ? qtdSaldo / forecast
            : 0;


        /* =====================================
           FOB ENTRADA UNITÁRIO PONDERADO
        ===================================== */

       const fobEntrada =
            !futuro

            ? ponderado(
                dados,
                "fob_unit",
                "Est_Entrada"
            )

            : ponderado(
                dados,
                `${mes}_cf_fob_unit`,
                `${mes}_entrada`
            );

        /* =====================================
           FOB SIMULADO UNITÁRIO PONDERADO
        ===================================== */

        const fobSimulado =
            !futuro

            ? 0

            : fobPonderado(
                dados,
                `${mes}_cf_fob_simu`,
                `${mes}_Qtd_Simu`
            );


        /* =====================================
           FATOR PONDERADO
           PESO = ENTRADA TOTAL DO MÊS
        ===================================== */

        const fator =
            !futuro

            ? ponderado(
                dados,
                "fator",
                "Est_Entrada"
            )

            : ponderado(
                dados,
                `${mes}_cf_fator`,
                `${mes}_entrada`
            );


        /* =====================================
           DÓLAR PONDERADO
           PESO = ENTRADA TOTAL DO MÊS
        ===================================== */

        const dolar =
            !futuro

            ? ponderado(
                dados,
                "dolar",
                "Est_Entrada"
            )

            : ponderado(
                dados,
                `${mes}_cf_dolar`,
                `${mes}_entrada`
            );


        /* =====================================
           RESULTADO
        ===================================== */

        resumo[mes] = {
     
            custoInicial,
            custoEntrada,
            custoEntradaSimulada,
            custoSaida,
            custoSaldo,

            cme,

            mesesCusto:
                cobertura,

            diasCusto:
                cobertura * 30,

            fobEntrada,
            fobSimulado,
            fator,
            dolar,

            qtdInicial,
            qtdEntrada,
            qtdSimulada,
            qtdSaida,
            qtdSaldo,

            mesesQtd:
                cobertura,

            diasQtd:
                cobertura * 30
        };

    });

    return resumo;
}


/* =========================================================
   ATUALIZAR
========================================================= */

function atualizarResumo(){

    const dados =
        dadosFiltradosResumo();

    const resumo =
        calcularResumo(dados);

    atualizarTituloResumo();
    renderizarResumo(resumo);
}


/* =========================================================
   TÍTULO
========================================================= */

function atualizarTituloResumo(){

    const el =
        document.getElementById(
            "resumoSelecaoAtual"
        );

    if(filtroResumo.tipo === "todos"){

        el.textContent = "Todos";
    }

    if(filtroResumo.tipo === "linha"){

        el.textContent =
            "Linha: " +
            filtroResumo.linha;
    }

    if(filtroResumo.tipo === "produto"){

        el.textContent =
            "Produto: " +
            filtroResumo.codigo;
    }
}


/* =========================================================
   ÁRVORE
========================================================= */

function montarArvoreResumo(){

    const container =
        document.getElementById(
            "arvoreResumoCenario"
        );

    const dados = dadosResumo();

    const arvore = {};


    dados.forEach(x => {

        const linha =
            String(x.linha || "SEM LINHA");

        const codigo =
            String(x.codigo || "");

        if(!arvore[linha]){
            arvore[linha] = new Set();
        }

        arvore[linha].add(codigo);
    });


    let html = `

        <div
            class="resumo-no resumo-no-todos ativo"
            onclick="selecionarTodosResumo(this)"
        >
            ● Todos
        </div>

    `;


    Object.keys(arvore)
        .sort()
        .forEach((linha, i) => {

            const id =
                `linhaResumo_${i}`;

            html += `

                <div
                    class="resumo-no resumo-linha"
                    onclick="
                        selecionarLinhaResumo(
                            '${escaparJsResumo(linha)}',
                            this
                        )
                    "
                >

                    <span
                        class="resumo-seta"
                        onclick="
                            event.stopPropagation();
                            abrirFecharLinhaResumo(
                                '${id}',
                                this
                            )
                        "
                    >
                        ▶
                    </span>

                    ${linha}

                </div>


                <div
                    id="${id}"
                    class="resumo-filhos"
                >

            `;


            [...arvore[linha]]
                .sort()
                .forEach(codigo => {

                    html += `

                        <div
                            class="resumo-no resumo-produto"
                            onclick="
                                selecionarProdutoResumo(
                                    '${escaparJsResumo(linha)}',
                                    '${escaparJsResumo(codigo)}',
                                    this
                                )
                            "
                        >
                            • ${codigo}
                        </div>

                    `;
                });


            html += `</div>`;
        });


    container.innerHTML = html;
}


/* =========================================================
   ABRIR / FECHAR LINHA
========================================================= */

function abrirFecharLinhaResumo(
    id,
    seta
){

    const filhos =
        document.getElementById(id);

    const aberto =
        filhos.classList.toggle(
            "aberto"
        );

    seta.textContent =
        aberto ? "▼" : "▶";
}


/* =========================================================
   SELEÇÕES
========================================================= */

function selecionarTodosResumo(el){

    filtroResumo = {
        tipo:"todos",
        linha:"",
        codigo:""
    };

    marcarAtivoResumo(el);
    atualizarResumo();
}


function selecionarLinhaResumo(
    linha,
    el
){

    filtroResumo = {
        tipo:"linha",
        linha,
        codigo:""
    };

    marcarAtivoResumo(el);
    atualizarResumo();
}


function selecionarProdutoResumo(
    linha,
    codigo,
    el
){

    filtroResumo = {
        tipo:"produto",
        linha,
        codigo
    };

    marcarAtivoResumo(el);
    atualizarResumo();
}


function marcarAtivoResumo(el){

    document
        .querySelectorAll(
            "#arvoreResumoCenario .resumo-no"
        )
        .forEach(x =>
            x.classList.remove("ativo")
        );

    el.classList.add("ativo");
}


/* =========================================================
   RENDER
========================================================= */

function renderizarResumo(resumo){

    const container =
        document.getElementById(
            "tabelaResumoCenario"
        );


    let html = `

        <table class="tabela-resumo">

            <thead>

                <tr>

                    <th>Indicador</th>

    `;


    meses.forEach(mes => {

        html += `
            <th>
                ${formatarMesResumo(mes)}
            </th>
        `;
    });


    html += `

                </tr>

            </thead>

            <tbody>

    `;


    /* CUSTOS */

    html += grupoResumo("Custos");

    html += linhaResumo(
        "Inicial",
        resumo,
        "custoInicial",
        2
    );

    html += linhaResumo(
        "Entrada",
        resumo,
        "custoEntrada",
        2
    );

    html += linhaResumo(
    "Entrada Simulada",
    resumo,
    "custoEntradaSimulada",
    2
);

    html += linhaResumo(
        "Saída",
        resumo,
        "custoSaida",
        2
    );

    html += linhaResumo(
        "Saldo",
        resumo,
        "custoSaldo",
        2
    );

    html += linhaResumo(
        "CME",
        resumo,
        "cme",
        2
    );

    html += linhaResumo(
        "Meses",
        resumo,
        "mesesCusto",
        2
    );

   

    html += separadorResumo();


    /* FOB */

    html += linhaResumo(
        "FOB Entrada",
        resumo,
        "fobEntrada",
        2
    );

    html += linhaResumo(
        "FOB Simulado",
        resumo,
        "fobSimulado",
        2
    );

    html += linhaResumo(
        "Fator",
        resumo,
        "fator",
        3
    );

    html += linhaResumo(
        "Dólar",
        resumo,
        "dolar",
        2
    );


    html += separadorResumo();


    /* QTDS */

    html += grupoResumo("Qtds");

    html += linhaResumo(
        "Inicial",
        resumo,
        "qtdInicial",
        0
    );

    html += linhaResumo(
        "Entrada",
        resumo,
        "qtdEntrada",
        0
    );

    /* NOVO */

    html += linhaResumo(
        "Simulada",
        resumo,
        "qtdSimulada",
        0
    );

    html += linhaResumo(
        "Saída",
        resumo,
        "qtdSaida",
        0
    );

    html += linhaResumo(
        "Saldo",
        resumo,
        "qtdSaldo",
        0
    );

    html += linhaResumo(
        "Meses",
        resumo,
        "mesesQtd",
        2
    );

   


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML = html;
}


/* =========================================================
   LINHA
========================================================= */

function linhaResumo(
    titulo,
    resumo,
    campo,
    casas
){

    const destaque =
        ["Saldo", "CME", "Meses"]
        .includes(titulo);

    let html = `
        <tr class="${destaque ? "resumo-resultado" : ""}">
            <td>${titulo}</td>
    `;

    meses.forEach(mes => {

        const valor =
            Number(
                resumo[mes]?.[campo]
            ) || 0;


        html += `

            <td>
                ${valor.toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits:casas,
                        maximumFractionDigits:casas
                    }
                )}
            </td>

        `;
    });


    return html + `</tr>`;
}


/* =========================================================
   GRUPO
========================================================= */

function grupoResumo(titulo){

    return `

        <tr class="resumo-grupo">

            <td>${titulo}</td>

            ${meses.map(
                () => "<td></td>"
            ).join("")}

        </tr>

    `;
}


/* =========================================================
   SEPARADOR
========================================================= */

function separadorResumo(){

    return `

        <tr class="resumo-separador">

            <td></td>

            ${meses.map(
                () => "<td></td>"
            ).join("")}

        </tr>

    `;
}


/* =========================================================
   MÊS
========================================================= */

function formatarMesResumo(mes){

    const nomes = {

        janeiro:"jan",
        fevereiro:"fev",
        março:"mar",
        abril:"abr",
        maio:"mai",
        junho:"jun",
        julho:"jul",
        agosto:"ago",
        setembro:"set",
        outubro:"out",
        novembro:"nov",
        dezembro:"dez"
    };


    const [nome, ano] =
        String(mes).split("-");


    return (
        nomes[nome] || nome
    )
    +
    "-"
    +
    ano;
}


/* =========================================================
   ESCAPE SIMPLES
========================================================= */

function escaparJsResumo(valor){

    return String(valor)
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}

function filtrarArvoreResumo(){

    const busca =
        document
            .getElementById("filtroProdutoResumo")
            .value
            .trim()
            .toLowerCase();

    const linhas =
        document.querySelectorAll(
            "#arvoreResumoCenario .resumo-linha"
        );

    linhas.forEach(linhaEl => {

        const filhos =
            linhaEl.nextElementSibling;

        if(!filhos){
            return;
        }

        const produtos =
            filhos.querySelectorAll(
                ".resumo-produto"
            );

        let encontrou = false;

        produtos.forEach(produtoEl => {

            const texto =
                produtoEl.textContent
                    .trim()
                    .toLowerCase();

            const mostrar =
                !busca ||
                texto.includes(busca);

            produtoEl.style.display =
                mostrar ? "" : "none";

            if(mostrar){
                encontrou = true;
            }

        });


        /* MOSTRA / ESCONDE A LINHA */

        linhaEl.style.display =
            encontrou || !busca
                ? ""
                : "none";


        /* SE ESTÁ BUSCANDO, ABRE OS PRODUTOS */

        if(busca && encontrou){

            filhos.classList.add("aberto");

            const seta =
                linhaEl.querySelector(
                    ".resumo-seta"
                );

            if(seta){
                seta.textContent = "▼";
            }

        }


        /* SEM BUSCA, VOLTA A MOSTRAR */

        if(!busca){

            produtos.forEach(produtoEl => {
                produtoEl.style.display = "";
            });

            linhaEl.style.display = "";
        }

    });

}