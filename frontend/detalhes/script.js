const API_BASE_URL = 'http://localhost:3000/api/tarefas';

let todasAsTarefas = [];
let tarefasFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 20;

const mapTipoTecido = {
    0: 'meia malha', 1: 'cotton', 2: 'punho pun',
    3: 'punho new', 4: 'punho san', 5: 'punho elan'
};
const mapTipoSaida = { 0: 'rolinho', 1: 'fraldado' };
const mapStatus = ['Pendente', 'Em andamento', 'Concluída', 'Incompleta'];

const mapTipoTecidoParaValor = Object.fromEntries(Object.entries(mapTipoTecido).map(([key, value]) => [value, key]));
const mapTipoSaidaParaValor = Object.fromEntries(Object.entries(mapTipoSaida).map(([key, value]) => [value, key]));

// Elementos do DOM
let tabelaCorpo, totalSpan, paginacaoInfo, paginacaoNav, inputBusca, inputBuscaData, 
    botaoBuscar, loadingSpinner, tabelaContainer, paginacaoContainer,
    taskFormModal, taskForm, taskFormLabel, taskIdInput, formErrorMessage,
    confirmDeleteModal, btnConfirmarExclusao, deleteTaskInfoElement;

/**
 * @returns {boolean}
 */
function inicializarSeletoresDOM() {
    tabelaCorpo = document.getElementById('tabela-corpo');
    totalSpan = document.getElementById('total-tarefas-detalhes');
    paginacaoInfo = document.getElementById('pagination-info');
    paginacaoNav = document.querySelector('#pagination-nav .pagination');
    inputBusca = document.getElementById('filtro-numero'); 
    inputBuscaData = document.getElementById('filtro-data');
    botaoBuscar = document.getElementById('btn-buscar');
    loadingSpinner = document.getElementById('loading-spinner');
    tabelaContainer = document.getElementById('tabela-container');
    paginacaoContainer = document.getElementById('pagination-container');

    taskFormModal = new bootstrap.Modal(document.getElementById('task-form-modal'));
    taskForm = document.getElementById('task-form');
    taskFormLabel = document.getElementById('task-form-modal-label');
    taskIdInput = document.getElementById('task-id');
    formErrorMessage = document.getElementById('form-error-message');

    confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirm-delete-modal'));
    btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
    deleteTaskInfoElement = document.getElementById('delete-task-info');

    const todosEncontrados = !!(tabelaCorpo && totalSpan && paginacaoNav && inputBusca && botaoBuscar && loadingSpinner && taskFormModal && confirmDeleteModal);

    if (!todosEncontrados) {
        console.error("Erro na inicialização: Um ou mais elementos do DOM não foram encontrados.");
    }
    return todosEncontrados;
}

async function pegaDados() {
    if (!loadingSpinner || !tabelaContainer) return;

    const buscaValor = inputBusca.value;
    const data = inputBuscaData.value;

    let url = API_BASE_URL + '?';
    const params = new URLSearchParams();
    if (buscaValor) params.append('busca', buscaValor);
    if (data) params.append('dataBusca', data);
    url += params.toString();

    // Usa classes do Bootstrap para mostrar spinner e esconder conteúdo
    loadingSpinner.classList.remove('d-none');
    loadingSpinner.classList.add('d-flex'); // Usa d-flex para centralizar
    tabelaContainer.classList.add('d-none'); // Esconde a tabela
    paginacaoContainer.classList.add('d-none'); // Esconde a paginação
    paginacaoContainer.classList.remove('d-flex');

    try {
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error(`Erro ao buscar dados: ${resposta.statusText}`);
        const tarefasDaApi = await resposta.json();

        todasAsTarefas = tarefasDaApi;
        tarefasFiltradas = [...todasAsTarefas];
        paginaAtual = 1;

        atualizarSugestoesFormulario(todasAsTarefas);
        preencheTabela(tarefasFiltradas);

    } catch (erro) {
        console.error('Erro na API:', erro);
        if (tabelaCorpo) tabelaCorpo.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Falha ao carregar tarefas.</td></tr>`;
        if (totalSpan) totalSpan.textContent = '0';
        tabelaContainer.classList.remove('d-none');
    } finally {
        loadingSpinner.classList.add('d-none');
        loadingSpinner.classList.remove('d-flex');
    }
}


function atualizarSugestoesFormulario(tarefas) {
    const maquinasDisponiveis = new Set();
    
    const tecidosDisponiveis = new Set(Object.values(mapTipoTecido));
    const saidasDisponiveis = new Set(Object.values(mapTipoSaida));

    tarefas.forEach(t => {
        if (t.maquina) maquinasDisponiveis.add(t.maquina);
    });

    document.getElementById('lista-maquinas-form').innerHTML = 
        [...maquinasDisponiveis].sort().map(m => `<option value="${m}">`).join('');
        
    document.getElementById('lista-tecidos-form').innerHTML = 
        [...tecidosDisponiveis].sort().map(t => `<option value="${t}">`).join('');
        
    document.getElementById('lista-saidas-form').innerHTML = 
        [...saidasDisponiveis].sort().map(s => `<option value="${s}">`).join('');
}

function preencheTabela(tarefas) {
    if (!tabelaCorpo || !totalSpan) return;

    tabelaCorpo.innerHTML = '';
    totalSpan.textContent = tarefas.length;

    if (tarefas.length === 0) {
        tabelaCorpo.innerHTML = `<tr><td colspan="8" class="text-center text-secondary">Nenhuma tarefa encontrada...</td></tr>`;
        tabelaContainer.classList.remove('d-none');
        paginacaoContainer.classList.add('d-none');
        paginacaoContainer.classList.remove('d-flex');
        return;
    }

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const tarefasPagina = tarefas.slice(inicio, fim);

    tarefasPagina.forEach(tarefa => {
        const linha = document.createElement('tr');
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
            <td data-label="Data">${dataCurta}</td>
            <td data-label="ID"><strong>${tarefa.id || '-'}</strong></td>
            <td data-label="N° Tarefa">${tarefa.numero_tarefa || '-'}</td>
            <td data-label="Tecido">${tarefa.tipo_tecido || '-'}</td>
            <td data-label="Metros">${(tarefa.metros || 0).toLocaleString('pt-BR')}</td>
            <td data-label="Tiras">${tarefa.qtd_tiras || 0}</td>
            <td data-label="Status">${formatarStatusTabela(tarefa.status, tarefa.completa)}</td>
            <td data-label="Ações">
                <button class="btn btn-sm btn-outline-primary bi-eye-fill btn-visualizar" data-id="${tarefa.id}" title="Visualizar"></button>
                <button class="btn btn-sm btn-outline-warning bi-pencil-fill btn-editar" data-id="${tarefa.id}" title="Editar"></button>
                <button class="btn btn-sm btn-outline-danger bi-trash-fill btn-excluir" data-id="${tarefa.id}" title="Excluir"></button>
            </td>
        `;
        tabelaCorpo.appendChild(linha);
    });

    const totalPaginas = Math.ceil(tarefas.length / itensPorPagina);
    const inicioExibido = tarefas.length > 0 ? inicio + 1 : 0;
    const fimExibido = Math.min(fim, tarefas.length);
    paginacaoInfo.textContent = `Mostrando ${inicioExibido} a ${fimExibido} de ${tarefas.length} tarefas`;

    criaPaginacao(totalPaginas);
    tabelaContainer.classList.remove('d-none');
    
    if (totalPaginas > 1) {
        paginacaoContainer.classList.remove('d-none');
        paginacaoContainer.classList.add('d-flex');
    } else {
        paginacaoContainer.classList.add('d-none');
        paginacaoContainer.classList.remove('d-flex');
    }
}


function handleNovaTarefaClick() {
    taskForm.reset();
    taskIdInput.value = '';
    taskFormLabel.textContent = 'Criar Nova Tarefa';
    formErrorMessage.classList.add('d-none');
    taskFormModal.show();
}

/**
 * @param {Event} e
 */
function handleEditarClick(e) {
    const id = e.target.closest('button').dataset.id;
    const tarefa = todasAsTarefas.find(t => t.id == id);
    
    if (!tarefa) {
        alert('Erro: Tarefa não encontrada.');
        return;
    }

    taskFormLabel.textContent = `Editar Tarefa (ID: ${tarefa.id})`;
    taskIdInput.value = tarefa.id;
    document.getElementById('numero_tarefa').value = tarefa.numero_tarefa || '';
    document.getElementById('maquina').value = tarefa.maquina || '';
    document.getElementById('tipo_tecido').value = tarefa.tipo_tecido || '';
    document.getElementById('tipo_saida').value = tarefa.tipo_saida || '';
    document.getElementById('metros').value = tarefa.metros || 0;
    document.getElementById('qtd_tiras').value = tarefa.qtd_tiras || 0;
    document.getElementById('tempo_setup').value = tarefa.tempo_setup || 0;
    document.getElementById('tempo_producao').value = tarefa.tempo_producao || 0;
    document.getElementById('status').value = tarefa.status || 'Pendente';
    document.getElementById('tarefa_completa').checked = tarefa.completa;
    document.getElementById('tem_sobra').checked = tarefa.sobra;
    document.getElementById('obs').value = tarefa.observacao || '';
    
    formErrorMessage.classList.add('d-none');
    taskFormModal.show();
}

/**
 * @param {Event} e
 */
function handleExcluirClick(e) {
    const id = e.target.closest('button').dataset.id;
    const tarefa = todasAsTarefas.find(t => t.id == id);
    
    if (!tarefa) {
        alert('Erro: Tarefa não encontrada.');
        return;
    }

    deleteTaskInfoElement.textContent = `ID ${tarefa.id} (Lote ${tarefa.numero_tarefa})`;
    btnConfirmarExclusao.dataset.id = id; 
    
    confirmDeleteModal.show();
}

async function excluirTarefa() {
    const id = btnConfirmarExclusao.dataset.id;
    if (!id) return;

    btnConfirmarExclusao.disabled = true;
    btnConfirmarExclusao.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Falha ao excluir');
        }

        confirmDeleteModal.hide();
        await pegaDados();

    } catch (erro) {
        alert(`Erro ao excluir: ${erro.message}`);
    } finally {
        btnConfirmarExclusao.disabled = false;
        btnConfirmarExclusao.innerHTML = 'Excluir Tarefa';
    }
}

/**
 * @param {Event} e
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    formErrorMessage.classList.add('d-none');

    const id = taskIdInput.value;
    const isEdit = !!id;

    const dadosTarefa = {
        numero_tarefa: document.getElementById('numero_tarefa').value,
        maquina: document.getElementById('maquina').value,
        status: document.getElementById('status').value,
        
        tipo_tecido: mapTipoTecidoParaValor[document.getElementById('tipo_tecido').value] || document.getElementById('tipo_tecido').value,
        tipo_saida: mapTipoSaidaParaValor[document.getElementById('tipo_saida').value] || document.getElementById('tipo_saida').value,
        
        metros: parseInt(document.getElementById('metros').value, 10) || 0,
        qtd_tiras: parseInt(document.getElementById('qtd_tiras').value, 10) || 0,
        tempo_setup: parseInt(document.getElementById('tempo_setup').value, 10) || 0,
        tempo_producao: parseInt(document.getElementById('tempo_producao').value, 10) || 0,
        
        tarefa_completa: document.getElementById('tarefa_completa').checked ? 'TRUE' : 'FALSE',
        tem_sobra: document.getElementById('tem_sobra').checked ? 'TRUE' : 'FALSE',
        obs: document.getElementById('obs').value,
    };

    if (!dadosTarefa.numero_tarefa || !dadosTarefa.maquina || !dadosTarefa.status) {
        formErrorMessage.textContent = 'Erro: N° Tarefa, Máquina e Status são obrigatórios.';
        formErrorMessage.classList.remove('d-none');
        return;
    }

    const url = isEdit ? `${API_BASE_URL}/${id}` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    const btnSalvar = document.getElementById('btn-salvar-tarefa');
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosTarefa)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || `Falha ao ${isEdit ? 'atualizar' : 'criar'}`);
        }

        taskFormModal.hide();
        await pegaDados();

    } catch (erro) {
        formErrorMessage.textContent = `Erro: ${erro.message}`;
        formErrorMessage.classList.remove('d-none');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = 'Salvar Tarefa';
    }
}


function simularStatusSeNecessario(tarefa, index) {
    if (!tarefa.status) {
        if (index % 20 === 0) tarefa.status = 'Pendente';
        else if (index % 15 === 0) tarefa.status = 'Em Andamento';
    }
    return tarefa;
}

/**
 * @param {Event} e
 */
function handleVisualizarClick(e) {
    const id = e.target.closest('button').dataset.id;
    const tarefa = todasAsTarefas.find(t => t.id == id);
    if (!tarefa) return;

    const modalBody = document.getElementById('task-modal-body');
    const observacao = tarefa.observacao || 'Nenhuma';
    const dataFormatada = tarefa.data ? new Date(tarefa.data).toLocaleString('pt-BR') : '-';
    const statusFormatado = formatarStatusTabela(tarefa.status, tarefa.completa, true);
    const metrosProduzidos = (tarefa.metros || 0).toLocaleString('pt-BR');
    const tirasProduzidas = tarefa.qtd_tiras || 0;

    const detailsHtml = `
        <p><strong>ID:</strong> ${tarefa.id || '-'}</p>
        <p><strong>Número da Tarefa:</strong> ${tarefa.numero_tarefa || '-'}</p>
        <p><strong>Status:</strong> ${statusFormatado}</p>
        <p><strong>Data:</strong> ${dataFormatada}</p>
        <p><strong>Máquina:</strong> ${tarefa.maquina || '-'}</p>
        <hr>
        <p><strong>Tipo de Tecido:</strong> ${tarefa.tipo_tecido || '-'}</p>
        <p><strong>Tipo de Saída:</strong> ${tarefa.tipo_saida || '-'}</p>
        <p><strong>Metros Produzidos:</strong> ${metrosProduzidos} m</p>
        <p><strong>Tiras Produzidas:</strong> ${tirasProduzidas}</p>
        <hr>
        <p><strong>Tempo de Setup:</strong> ${tarefa.tempo_setup || '-'} seg</p>
        <p><strong>Tempo de Produção:</strong> ${tarefa.tempo_producao || '-'} seg</p>
        <p><strong>Sobra de Rolo:</strong> ${tarefa.sobra ? 'Sim' : 'Não'}</p>
        <p><strong>Observação:</strong> ${observacao}</p>
    `;
    modalBody.innerHTML = detailsHtml;

    const taskModalElement = document.getElementById('task-details-modal');
    const modal = bootstrap.Modal.getOrCreateInstance(taskModalElement);
    modal.show();
}

function formatarStatusTabela(status, completa, textoCompleto = false) {
    const s = (status || '').toLowerCase();

    if (s === 'em andamento') {
        return textoCompleto
            ? '<span class="text-primary">Em andamento</span>'
            : '<span class="text-primary"><span class="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true"></span>Em andamento</span>';
    }
    if (s === 'pendente') {
        return '<span class="text-warning">Pendente</span>';
    }
    if (s === 'concluída' || completa === true) {
        return '<span class="text-success">Concluída</span>';
    }
    if (s === 'incompleta') {
        return '<span class="text-danger">Incompleta</span>';
    }
    return `<span class="text-secondary">${status || '-'}</span>`;
}

function criaPaginacao(totalPaginas) {
    if (!paginacaoNav || !paginacaoContainer) return;

    paginacaoNav.innerHTML = '';

    if (totalPaginas <= 1) {
        paginacaoContainer.classList.add('d-none');
        paginacaoContainer.classList.remove('d-flex');
        return;
    } else {
        paginacaoContainer.classList.remove('d-none');
        paginacaoContainer.classList.add('d-flex');
    }

    const maxBotoesVisiveis = 5;

    const criaBotao = (pagina, conteudo, ativa = false, desabilitada = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${ativa ? 'active' : ''} ${desabilitada ? 'disabled' : ''}`;
        const a = document.createElement('a');
        a.className = `page-link`;
        a.href = "#";
        a.innerHTML = conteudo;
        a.onclick = (evento) => {
            evento.preventDefault();
            if (!desabilitada) {
                mudaPagina(pagina);
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
        let paginasAMostrar = [1];
        let inicioMeio = Math.max(2, paginaAtual - Math.floor((maxBotoesVisiveis - 2) / 2));
        let fimMeio = Math.min(totalPaginas - 1, paginaAtual + Math.floor((maxBotoesVisiveis - 2) / 2));
        if (paginaAtual < maxBotoesVisiveis -1) fimMeio = Math.min(totalPaginas - 1, maxBotoesVisiveis -1);
        if (paginaAtual > totalPaginas - (maxBotoesVisiveis - 2)) inicioMeio = Math.max(2, totalPaginas - (maxBotoesVisiveis - 2) );
        
        if (inicioMeio > 2) paginasAMostrar.push(-1);
        for (let i = inicioMeio; i <= fimMeio; i++) paginasAMostrar.push(i);
        if (fimMeio < totalPaginas - 1) paginasAMostrar.push(-1);
        paginasAMostrar.push(totalPaginas);

        paginasAMostrar = [...new Set(paginasAMostrar)];

        paginasAMostrar.forEach(p => {
             if (p === -1) {
                 paginacaoNav.appendChild(criaInputPular());
             } else {
                 paginacaoNav.appendChild(criaBotao(p, p, p === paginaAtual));
             }
        });
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



document.addEventListener('DOMContentLoaded', () => {
    if (!inicializarSeletoresDOM()) {
        alert("Erro crítico ao carregar a página. Verifique o console para mais detalhes (F12).");
        return;
    }

    pegaDados();

    botaoBuscar.addEventListener('click', pegaDados);
    inputBusca.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') pegaDados();
    });
    inputBuscaData.addEventListener('change', pegaDados);

    document.getElementById('btn-nova-tarefa').addEventListener('click', handleNovaTarefaClick);

    tabelaCorpo.addEventListener('click', (e) => {
        const btnVisualizar = e.target.closest('.btn-visualizar');
        const btnEditar = e.target.closest('.btn-editar');
        const btnExcluir = e.target.closest('.btn-excluir');

        if (btnVisualizar) {
            handleVisualizarClick(e);
            return;
        }
        if (btnEditar) {
            handleEditarClick(e);
            return;
        }
        if (btnExcluir) {
            handleExcluirClick(e);
            return;
        }
    });

    taskForm.addEventListener('submit', handleFormSubmit);

    btnConfirmarExclusao.addEventListener('click', excluirTarefa);
});