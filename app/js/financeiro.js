function abrirTelaCme(){

    const modal =

        document.getElementById(
            'modalCme'
        )

    const conteudo =

        document.getElementById(
            'conteudoCme'
        )

    let html = `

    <table
        style="
            border-collapse:collapse;
            width:100%;
            font-size:9px;
            font-family:Arial,sans-serif;
        "
    >

    <tr
        style="
            background:#002b5c;
            color:white;
        "
    >

        <th
            style="
                padding:5px;
                border:1px solid #dbe2ea;
            "
        >
            Código
        </th>

        <th
            style="
                padding:5px;
                border:1px solid #dbe2ea;
            "
        >
            CME Atual
        </th>

    `

    meses.slice(1).forEach(m=>{

        html += `

        <th
            style="
                padding:5px;
                border:1px solid #dbe2ea;
            "
        >
            ${m}
        </th>

        `

    })

    html += `</tr>`

    /* =====================================
       SOMENTE LINHAS TOTAL CÓDIGO
    ===================================== */

    gridApi.forEachNode(node=>{

        const item = node.data

        if(

            !String(item.codigo || '')
            .includes('TOTAL')

        ){

            return

        }

        html += `

        <tr>

            <td
                style="
                    padding:2px 4px;
                    border:1px solid #dbe2ea;
                    font-weight:bold;
                "
            >

                ${String(item.codigo || '')
                .replace('TOTAL ','')}

            </td>

            <td
                style="
                    text-align:center;
                    border:1px solid #dbe2ea;
                "
            >

                ${Number(
                    item.cme_final || 0
                ).toFixed(2)}

            </td>

        `

        meses.slice(1).forEach(m=>{

            html += `

            <td
                style="
                    text-align:center;
                    border:1px solid #dbe2ea;
                "
            >

                ${Number(

                    item[
                        `${m}_cf_cme_final`
                    ] || 0

                ).toFixed(2)}

            </td>

            `

        })

        html += `</tr>`

    })

    html += `</table>`

    conteudo.innerHTML = html

    modal.style.display = 'block'

}

function fecharCme(){

    document.getElementById(
        'modalCme'
    ).style.display = 'none'

}


  async function carregarFobSimulado(rowData){

    console.time("FOB Simulado API");

    try{

        const resposta = await fetch(
            "https://api.volkdobrasil.com.br/api/factors_simulation?simulation_id=28"
        );

        if(!resposta.ok){

            console.error(
                "Erro FOB Simulado:",
                resposta.status
            );

            return;
        }

        const json = await resposta.json();

        const fatores =
            json.factor_simulations || [];


        /* MAPA: CÓDIGO -> FACTOR */

        const mapaFob = {};

        fatores.forEach(f => {

            const codigo =
                String(f.code || "").trim();

            mapaFob[codigo] =
                Number(f.factor) || 0;

        });


        /* PREENCHER GRID */

        rowData.forEach(item => {

            const codigo =
                String(item.codigo || "").trim();

            const fob =
                mapaFob[codigo];


            if(fob === undefined){
                return;
            }


            /* MESMO FOB EM TODOS OS MESES */

            meses.forEach(mes => {

                item[
                    `${mes}_cf_fob_simu`
                ] = fob;

            });

        });


        console.log(
            "FOB Simulado carregado:",
            fatores.length
        );

    }
    catch(erro){

        console.error(
            "Erro ao carregar FOB Simulado:",
            erro
        );

    }
    finally{

        console.timeEnd(
            "FOB Simulado API"
        );

    }

}