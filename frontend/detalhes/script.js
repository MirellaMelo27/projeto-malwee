const API_BASE_URL = 'http://localhost:3000/api/tarefas';

let todasAsTarefas = [];
let tarefasFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 20;

let tabelaCorpo, totalSpan, paginacaoInfo, paginacaoNav, inputBuscaNumero, inputBuscaData, botaoBuscar, loadingSpinner, tabelaContainer, paginacaoContainer;

async function pegaDados() {
    if (!loadingSpinner || !tabelaContainer || !paginacaoContainer || !paginacaoNav || !paginacaoInfo) {
        console.error("Erro Pós-Inicialização: Elementos do DOM não encontrados ao buscar dados.");
        if (!inicializarSeletoresDOM()){
             console.error("ERRO CRÍTICO: Falha ao reinicializar seletores DOM.");
             return;
        }
    }

    const idValor = inputBuscaNumero.value; // agora busca por id
    const data = inputBuscaData.value;

    let url = API_BASE_URL + '?';
    const params = new URLSearchParams();
    if (idValor) params.append('id', idValor);
    if (data) params.append('dataBusca', data);
    url += params.toString();

    console.log("Mostrando spinner...");
    loadingSpinner.classList.remove('d-none');
    loadingSpinner.classList.add('d-flex');
    loadingSpinner.style.display = 'flex';

    tabelaContainer.style.display = 'none';
    paginacaoContainer.style.display = 'none';
    paginacaoNav.innerHTML = '';
    paginacaoInfo.textContent = 'Carregando...';

    try {
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error(`Erro ao buscar dados: ${resposta.statusText}`);
        const tarefasDaApi = await resposta.json();

        todasAsTarefas = tarefasDaApi.map(simularStatusSeNecessario);
        tarefasFiltradas = [...todasAsTarefas];
        paginaAtual = 1;
        preencheTabela(tarefasFiltradas);

    } catch (erro) {
        console.error('Erro na API:', erro);
        if (tabelaCorpo) tabelaCorpo.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Falha ao carregar tarefas.</td></tr>`;
        if (totalSpan) totalSpan.textContent = '0';
        if (paginacaoInfo) paginacaoInfo.textContent = 'Erro ao carregar';
        if (paginacaoNav) paginacaoNav.innerHTML = '';
        if (tabelaContainer) tabelaContainer.style.display = 'block';
        if (paginacaoContainer) paginacaoContainer.style.display = 'none';

    } finally {
        if (loadingSpinner) {
            console.log("Escondendo spinner no finally...");
            loadingSpinner.classList.remove('d-flex');
            loadingSpinner.classList.add('d-none');
            loadingSpinner.style.display = 'none';
        }
    }
}

function simularStatusSeNecessario(tarefa, index) {
     if (!tarefa.status) {
         if (index % 20 === 0) tarefa.status = 'Pendente';
         else if (index % 15 === 0) tarefa.status = 'Em Andamento';
     }
     return tarefa;
}

function mostraDetalhes(tarefa) {
    const modalBody = document.getElementById('task-modal-body');
    if (!modalBody) return;

    const observacao = tarefa.observacao || 'Nenhuma';
    const dataFormatada = tarefa.data ? new Date(tarefa.data).toLocaleString('pt-BR') : '-';
    const statusFormatado = formatarStatusTabela(tarefa.status, tarefa.completa, true);
    const metrosProduzidos = (tarefa.metros_produzidos !== undefined ? tarefa.metros_produzidos : tarefa.metros).toLocaleString('pt-BR');
    const metrosAlvo = (tarefa.metros || 0).toLocaleString('pt-BR');
    const tirasProduzidas = tarefa.qtd_tiras_produzidas !== undefined ? tarefa.qtd_tiras_produzidas : tarefa.qtd_tiras;
    const tirasAlvo = tarefa.qtd_tiras || 0;

    const detailsHtml = `
        <p><strong>ID:</strong> ${tarefa.id || '-'}</p>
        <p><strong>Número da Tarefa:</strong> ${tarefa.numero_tarefa || '-'}</p>
        <p><strong>Status:</strong> ${statusFormatado}</p>
        <p><strong>Data:</strong> ${dataFormatada}</p>
        <p><strong>Máquina:</strong> ${tarefa.maquina || '-'}</p>
        <hr>
        <p><strong>Tipo de Tecido:</strong> ${tarefa.tipo_tecido || '-'}</p>
        <p><strong>Tipo de Saída:</strong> ${tarefa.tipo_saida || '-'}</p>
        <p><strong>Progresso Metros:</strong> ${metrosProduzidos} / ${metrosAlvo} m</p>
        <p><strong>Progresso Tiras:</strong> ${tirasProduzidas} / ${tirasAlvo}</p>
        <hr>
        <p><strong>Tempo de Setup:</strong> ${tarefa.tempo_setup || '-'}</p>
        <p><strong>Tempo de Produção:</strong> ${tarefa.tempo_producao || '-'}</p>
        <p><strong>Sobra de Rolo:</strong> ${tarefa.sobra ? 'Sim' : 'Não'}</p>
        <p><strong>Observação:</strong> ${observacao}</p>
    `;
    modalBody.innerHTML = detailsHtml;

    const taskModalElement = document.getElementById('task-details-modal');
    if(taskModalElement){
        const taskModal = new bootstrap.Modal(taskModalElement);
        taskModal.show();
    }
}

function formatarStatusTabela(status, completa, textoCompleto = false) {
    if (status === 'Em Andamento') {
        return textoCompleto
            ? '<span class="text-primary">Em Andamento</span>'
            : '<span class="text-primary"><span class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>Em Andamento</span>';
    }
    if (status === 'Pendente') {
        return '<span class="text-warning">Pendente</span>';
    }
    if (status === 'Completa' || completa === true) {
         return '<span class="text-success">Completa</span>';
    }
    return '<span class="text-danger">Incompleta</span>';
}

function preencheTabela(tarefas) {
    if (!tabelaCorpo || !totalSpan || !paginacaoNav || !paginacaoInfo || !tabelaContainer || !paginacaoContainer) {
         console.error("Erro Fatal: Elementos DOM nulos em preencheTabela.");
         return;
    }

    tabelaCorpo.innerHTML = '';
    totalSpan.textContent = tarefas.length;

    if (tarefas.length === 0) {
        tabelaCorpo.innerHTML = `<tr><td colspan="7" class="text-center text-secondary">Nenhuma tarefa encontrada...</td></tr>`;
        paginacaoNav.innerHTML = '';
        paginacaoInfo.textContent = 'Nenhuma tarefa encontrada';
        tabelaContainer.style.display = 'block';
        paginacaoContainer.style.display = 'none';
        return;
    }

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const tarefasPagina = tarefas.slice(inicio, fim);

    tarefasPagina.forEach(tarefa => {
        const linha = document.createElement('tr');
        linha.style.cursor = 'pointer';
        let dataCurta = '-';
        if (tarefa.data) {
             try {
                 const d = new Date(tarefa.data);
                 const dia = d.getDate().toString().padStart(2, '0');
                 const mes = (d.getMonth() + 1).toString().padStart(2, '0');
                 const hora = d.getHours().toString().padStart(2, '0');
                 const min = d.getMinutes().toString().padStart(2, '0');
                 dataCurta = `${dia}/${mes} ${hora}:${min}`;
             } catch (e) {}
        }

        linha.innerHTML = `
            <td>${dataCurta}</td>
            <td>${tarefa.id || '-'}</td>
            <td>${tarefa.numero_tarefa || '-'}</td>
            <td>${tarefa.tipo_tecido || '-'}</td>
            <td>${(tarefa.metros || 0).toLocaleString('pt-BR')}</td>
            <td>${tarefa.qtd_tiras || 0}</td>
            <td>${formatarStatusTabela(tarefa.status, tarefa.completa)}</td>
        `;
        linha.addEventListener('click', () => mostraDetalhes(tarefa));
        tabelaCorpo.appendChild(linha);
    });

    const totalPaginas = Math.ceil(tarefas.length / itensPorPagina);
    const inicioExibido = tarefas.length > 0 ? inicio + 1 : 0;
    const fimExibido = Math.min(fim, tarefas.length);
    paginacaoInfo.textContent = `Mostrando ${inicioExibido} a ${fimExibido} de ${tarefas.length} tarefas`;

    criaPaginacao(totalPaginas);
    tabelaContainer.style.display = 'block';
    if (totalPaginas > 1) {
        paginacaoContainer.style.display = 'flex';
    } else {
        paginacaoContainer.style.display = 'none';
    }
}

function criaPaginacao(totalPaginas) {
    if (!paginacaoNav || !paginacaoContainer) return;

    paginacaoNav.innerHTML = '';

    if (totalPaginas <= 1) {
        paginacaoContainer.style.display = 'none';
        return;
    } else {
        paginacaoContainer.style.display = 'flex';
    }

    const maxBotoesVisiveis = 5;

    const criaBotao = (pagina, conteudo, ativa = false, desabilitada = false, onClickOverride = null) => {
         const li = document.createElement('li');
        li.className = `page-item ${ativa ? 'active' : ''} ${desabilitada ? 'disabled' : ''}`;
        const a = document.createElement('a');
        a.className = `page-link`;
        a.href = "#";
        a.innerHTML = conteudo;
        a.onclick = (evento) => {
            evento.preventDefault();
            if (!desabilitada) {
                if (onClickOverride) onClickOverride();
                else mudaPagina(pagina);
            }
        };
        li.appendChild(a);
        return li;
    };

     const criaInputPular = () => {
        const li = document.createElement('li');
        li.className = "page-item mx-1";
        const input = document.createElement('input');
        input.type = "number";
        input.className = "form-control form-control-sm";
        input.style.width = "70px"; input.style.textAlign = "center";
        input.placeholder="Ir..."; input.min = "1"; input.max = totalPaginas;
        input.ariaLabel = "Ir para a página";
        input.onkeypress = (evento) => {
             if (evento.key === 'Enter') {
                evento.preventDefault();
                const paginaDesejada = parseInt(input.value, 10);
                if (!isNaN(paginaDesejada) && paginaDesejada >= 1 && paginaDesejada <= totalPaginas) mudaPagina(paginaDesejada);
                else input.value = '';
            }
        };
        li.appendChild(input);
        return li;
    };

    paginacaoNav.appendChild(criaBotao(paginaAtual - 1, '<i class="bi bi-chevron-left"></i>', false, paginaAtual === 1));

    if (totalPaginas <= maxBotoesVisiveis + 2) {
        for (let i = 1; i <= totalPaginas; i++) paginacaoNav.appendChild(criaBotao(i, i, i === paginaAtual));
    } else {
        let paginasAMostrar = []; paginasAMostrar.push(1);
        let inicioMeio = Math.max(2, paginaAtual - Math.floor((maxBotoesVisiveis - 2) / 2));
        let fimMeio = Math.min(totalPaginas - 1, paginaAtual + Math.floor((maxBotoesVisiveis - 2) / 2));
         if (paginaAtual < maxBotoesVisiveis -1) fimMeio = Math.min(totalPaginas - 1, maxBotoesVisiveis -1);
        if (paginaAtual > totalPaginas - (maxBotoesVisiveis - 2)) inicioMeio = Math.max(2, totalPaginas - (maxBotoesVisiveis - 2) );
        if (inicioMeio > 2) paginacaoNav.appendChild(criaInputPular());
        for (let i = inicioMeio; i <= fimMeio; i++) paginasAMostrar.push(i);
         if (fimMeio < totalPaginas - 1) {
             if (inicioMeio > 2) {
                const liEllipsis = document.createElement('li'); liEllipsis.className = "page-item disabled";
                liEllipsis.innerHTML = `<span class="page-link">...</span>`; paginacaoNav.appendChild(liEllipsis);
             } else paginacaoNav.appendChild(criaInputPular());
        }
        paginasAMostrar.push(totalPaginas);
        paginasAMostrar = [...new Set(paginasAMostrar)];
        paginasAMostrar.forEach(p => paginacaoNav.appendChild(criaBotao(p, p, p === paginaAtual)));
    }

    paginacaoNav.appendChild(criaBotao(paginaAtual + 1, '<i class="bi bi-chevron-right"></i>', false, paginaAtual === totalPaginas));
}

function mudaPagina(pagina) {
    if (!tarefasFiltradas || tarefasFiltradas.length === 0) return;
    const totalPaginas = Math.ceil(tarefasFiltradas.length / itensPorPagina);
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaAtual = pagina;
        preencheTabela(tarefasFiltradas);
    }
}

function inicializarSeletoresDOM() {
    tabelaCorpo = document.getElementById('tabela-corpo');
    totalSpan = document.getElementById('total-tarefas-detalhes');
    paginacaoInfo = document.getElementById('pagination-info');
    paginacaoNav = document.querySelector('#pagination-nav .pagination');
    inputBuscaNumero = document.getElementById('filtro-numero');
    inputBuscaData = document.getElementById('filtro-data');
    botaoBuscar = document.getElementById('btn-buscar');
    loadingSpinner = document.getElementById('loading-spinner');
    tabelaContainer = document.getElementById('tabela-container');
    paginacaoContainer = document.getElementById('pagination-container');

    const todosEncontrados = !!(tabelaCorpo && totalSpan && paginacaoInfo && paginacaoNav && inputBuscaNumero && inputBuscaData && botaoBuscar && loadingSpinner && tabelaContainer && paginacaoContainer);

    if (!todosEncontrados) {
        console.error("Erro na inicialização: Um ou mais elementos do DOM não foram encontrados.");
    }
    return todosEncontrados;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!inicializarSeletoresDOM()) {
        console.error("Erro Fatal: Nem todos os elementos do DOM foram encontrados na inicialização.");
        alert("Erro crítico ao carregar a página. Verifique o console para mais detalhes (F12).");
        return;
    }

    pegaDados();

    botaoBuscar.addEventListener('click', pegaDados);
    inputBuscaNumero.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') pegaDados();
    });
    inputBuscaData.addEventListener('keypress', (e) => {
         if (e.key === 'Enter') pegaDados();
    });
    inputBuscaData.addEventListener('change', pegaDados);
});
