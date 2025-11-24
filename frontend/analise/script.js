   const API_BASE_URL = 'http://localhost:3000/api/tarefas';
   let tarefasCache = [];
   let charts = {};
   
   
   function formatarNumero(num) {
       return new Intl.NumberFormat('pt-BR').format(num);
   }
   
   function formatarTempo(segundos) {
       if (isNaN(segundos) || segundos === 0) return '0m 0s';
       const min = Math.floor(segundos / 60);
       const s = Math.round(segundos % 60);
       return `${min}m ${s}s`;
   }
   
   function formatarKPI(valorA, valorB, unidade = '') {
       const formatadoA = `${formatarNumero(valorA)}${unidade}`;
       if (valorB === null || valorB === undefined) {
           return formatadoA;
       }
       const formatadoB = `${formatarNumero(valorB)}${unidade}`;
       return `${formatadoA} <span class="text-secondary small">vs</span> ${formatadoB}`;
   }
   
   function formatarKPITempo(valorA, valorB) {
       const formatadoA = formatarTempo(valorA);
       if (valorB === null || valorB === undefined) {
           return formatadoA;
       }
       const formatadoB = formatarTempo(valorB);
       return `${formatadoA} <span class="text-secondary small">vs</span> ${formatadoB}`;
   }
      
   function getChartColors() {
       const theme = document.documentElement.getAttribute('data-bs-theme') || 'dark';
       const isDark = theme === 'dark';
       
       const coresStatus = {
           'Pendente': '#ffc107',
           'Em andamento': '#0dcaf0',
           'Concluída': '#198754',
           'Incompleta': '#dc3545',
           'N/A': '#6c757d'
       };
       
       const corGrupoA = isDark ? '#0d6efd' : '#0b5ed7';
       const corGrupoB = isDark ? '#0dcaf0' : '#0aa3c2';
   
       const corEixo = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
       const corGrid = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
       const corFundo = isDark ? '#1c1f23' : '#ffffff'; 
   
       return { coresStatus, corGrupoA, corGrupoB, corEixo, corGrid, corFundo };
   }
   
   
   async function buscarTarefas(force = false) {
       console.log("Buscando dados...");
       mostrarLoading(true);
       
       try {
           const response = await fetch(API_BASE_URL); 
           if (!response.ok) throw new Error('Falha ao carregar dados da API');
           
           tarefasCache = await response.json();
           
           if (force) {
               atualizarSugestoes(tarefasCache);
           }
           
           aplicarFiltros();
           
       } catch (error) {
           console.error("Erro ao buscar tarefas:", error);
           alert("Não foi possível carregar os dados. Verifique o console.");
       } finally {
           mostrarLoading(false);
       }
   }
   
   function atualizarSugestoes(tarefas) {
       const listaLotes = document.getElementById('lista-lotes');
       const listaMaquinas = document.getElementById('lista-maquinas');
       const listaTecidos = document.getElementById('lista-tecidos');
   
       const lotes = [...new Set(tarefas.map(t => t.numero_tarefa))].sort((a,b) => a - b);
       const maquinas = [...new Set(tarefas.map(t => t.maquina))].sort();
        const tecidos = [...new Set(
            tarefas.map(t => (t.tipo_tecido || '').replace(/\\/g, ' '))
        )].sort();
    
   
       if(listaLotes) listaLotes.innerHTML = lotes.map(n => `<option value="${n}">`).join('');
       if(listaMaquinas) listaMaquinas.innerHTML = maquinas.map(n => `<option value="${n}">`).join('');
       if(listaTecidos) listaTecidos.innerHTML = tecidos.map(n => `<option value="${n}">`).join('');

   }
   
   /**
    * @param {string} sufixo
    * @returns {Array}
    */
   function filtrarGrupo(sufixo) {
       const dataInicio = document.getElementById(`filtro-data-inicio-${sufixo}`)?.value;
       const dataFim = document.getElementById(`filtro-data-fim-${sufixo}`)?.value;
       const lote = document.getElementById(`filtro-lote-${sufixo}`)?.value;
       const maquina = document.getElementById(`filtro-maquina-${sufixo}`)?.value;
       const tecido = document.getElementById(`filtro-tecido-${sufixo}`)?.value;
   
       let tarefasFiltradas = [...tarefasCache];
   
       if (lote) {
           tarefasFiltradas = tarefasFiltradas.filter(t => t.numero_tarefa == lote);
       } else if (dataInicio || dataFim) {
           if (dataInicio) {
               tarefasFiltradas = tarefasFiltradas.filter(t => t.data.split('T')[0] >= dataInicio);
           }
           if (dataFim) {
                tarefasFiltradas = tarefasFiltradas.filter(t => t.data.split('T')[0] <= dataFim);
           }
       }
       if (maquina) {
           tarefasFiltradas = tarefasFiltradas.filter(t => t.maquina === maquina);
       }
       if (tecido) {
           tarefasFiltradas = tarefasFiltradas.filter(t => t.tipo_tecido === tecido);
       }
       
       return tarefasFiltradas;
   }
   
   function aplicarFiltros() {
       const modoComparacao = document.getElementById('modo-comparacao').checked;
   
       const grupoA = filtrarGrupo('a');
       let grupoB = null;
   
       if (modoComparacao) {
           grupoB = filtrarGrupo('b');
       }
   
       atualizarAnalise(grupoA, grupoB);
   }

   function limparFiltros() {
       const idsFiltros = [
           'filtro-data-inicio-a', 'filtro-data-fim-a', 'filtro-lote-a', 'filtro-maquina-a', 'filtro-tecido-a',
           'filtro-data-inicio-b', 'filtro-data-fim-b', 'filtro-lote-b', 'filtro-maquina-b', 'filtro-tecido-b'
       ];
       
       idsFiltros.forEach(id => {
           const el = document.getElementById(id);
           if (el) {
               el.value = '';
           }
       });
       
       document.getElementById('modo-comparacao').checked = false;
       document.getElementById('coluna-filtro-b').classList.add('d-none');
       
       atualizarAnalise(tarefasCache, null);
   }
   

   function calcularStats(tarefas) {
       const total = tarefas.length;
       if (total === 0) {
           return { total: 0, concluidas: 0, andamento: 0, pendentes: 0, incompletas: 0, mediaSetup: 0, mediaProducao: 0, totalMetros: 0, totalTiras: 0 };
       }
       
       const concluidas = tarefas.filter(t => t.status === 'Concluída').length;
       const pendentes = tarefas.filter(t => t.status === 'Pendente').length;
       const andamento = tarefas.filter(t => t.status === 'Em andamento').length;
       const incompletas = tarefas.filter(t => t.status === 'Incompleta').length;
   
       const totalSetup = tarefas.reduce((acc, t) => acc + (t.tempo_setup || 0), 0);
       const totalProducao = tarefas.reduce((acc, t) => acc + (t.tempo_producao || 0), 0);
       const mediaSetup = totalSetup / total;
       const mediaProducao = totalProducao / total;
       
       const totalMetros = tarefas.reduce((acc, t) => acc + (t.metros || 0), 0);
       const totalTiras = tarefas.reduce((acc, t) => acc + (t.qtd_tiras || 0), 0);
       
       return { total, concluidas, andamento, pendentes, incompletas, mediaSetup, mediaProducao, totalMetros, totalTiras };
   }

   function initCharts(empty = false) {
    const { coresStatus, corGrupoA, corEixo, corGrid, corFundo } = getChartColors();
    
    const placeholderLabels = empty ? ['Nenhum dado'] : [];
    const placeholderDataA = empty ? [{ label: 'Filtro A', data: [0], backgroundColor: corGrupoA }] : [];
    const placeholderStatusLabels = ['Concluída', 'Em andamento', 'Pendente', 'Incompleta'];
    const placeholderStatusData = [{
         label: 'Filtro A',
         data: [0, 0, 0, 0],
         backgroundColor: [coresStatus['Concluída'], coresStatus['Em andamento'], coresStatus['Pendente'], coresStatus['Incompleta']]
    }];

    criarGrafico('graficoStatus', 'bar', placeholderStatusLabels, placeholderStatusData, corFundo, corEixo, corGrid);
    criarGrafico('graficoTecido', 'bar', placeholderLabels, placeholderDataA, corFundo, corEixo, corGrid);
    criarGrafico('graficoMaquina', 'bar', placeholderLabels, placeholderDataA, corFundo, corEixo, corGrid);
    criarGrafico('graficoLote', 'bar', placeholderLabels, placeholderDataA, corFundo, corEixo, corGrid);
}

   /**
    * @param {Array} tarefasA
    * @param {Array|null} tarefasB
    */
   function atualizarAnalise(tarefasA, tarefasB) {
       
       const statsA = calcularStats(tarefasA);
       const statsB = tarefasB ? calcularStats(tarefasB) : null;
       
       const valorB = (key) => statsB ? statsB[key] : null;
   
       document.getElementById('kpi-total').innerHTML = formatarKPI(statsA.total, valorB('total'));
       document.getElementById('kpi-concluidas').innerHTML = formatarKPI(statsA.concluidas, valorB('concluidas'));
       document.getElementById('kpi-andamento').innerHTML = formatarKPI(statsA.andamento, valorB('andamento'));
       document.getElementById('kpi-pendentes').innerHTML = formatarKPI(statsA.pendentes, valorB('pendentes'));
       document.getElementById('kpi-incompletas').innerHTML = formatarKPI(statsA.incompletas, valorB('incompletas'));
       
       document.getElementById('kpi-setup').innerHTML = formatarKPITempo(statsA.mediaSetup, valorB('mediaSetup'));
       document.getElementById('kpi-producao').innerHTML = formatarKPITempo(statsA.mediaProducao, valorB('mediaProducao'));
       document.getElementById('kpi-metros').innerHTML = formatarKPI(statsA.totalMetros, valorB('totalMetros'), ' m²');
       document.getElementById('kpi-tiras').innerHTML = formatarKPI(statsA.totalTiras, valorB('totalTiras'));
   
       atualizarGraficos(tarefasA, tarefasB);
   }
   

   function atualizarGraficos(tarefasA, tarefasB) {
       const { coresStatus, corGrupoA, corGrupoB, corEixo, corGrid, corFundo } = getChartColors();
       const modoComparacao = !!tarefasB;
   
       const statsA = calcularStats(tarefasA);
       const statusLabels = ['Concluída', 'Em andamento', 'Pendente', 'Incompleta'];
       const datasetsStatus = [{
           label: 'Filtro A',
           data: [statsA.concluidas, statsA.andamento, statsA.pendentes, statsA.incompletas],
           backgroundColor: [coresStatus['Concluída'], coresStatus['Em andamento'], coresStatus['Pendente'], coresStatus['Incompleta']],
       }];
       
       if (modoComparacao) {
           const statsB = calcularStats(tarefasB);
           datasetsStatus.push({
               label: 'Filtro B',
               data: [statsB.concluidas, statsB.andamento, statsB.pendentes, statsB.incompletas],
               backgroundColor: Object.values(coresStatus).map(color => `${color}B3`),
           });
       }
       criarGrafico('graficoStatus', 'bar', statusLabels, datasetsStatus, corFundo, corEixo, corGrid);
   
   
       const [labelsTecido, datasetsTecido] = prepararDadosAgrupados(
           tarefasA, tarefasB, 'tipo_tecido', 'metros', corGrupoA, corGrupoB
       );
       criarGrafico('graficoTecido', 'bar', labelsTecido, datasetsTecido, corFundo, corEixo, corGrid);
       
       
       const [labelsMaquina, datasetsMaquina] = prepararDadosAgrupados(
           tarefasA, tarefasB, 'maquina', 'metros', corGrupoA, corGrupoB
       );
        criarGrafico('graficoMaquina', 'bar', labelsMaquina, datasetsMaquina, corFundo, corEixo, corGrid);
   
       const [labelsLote, datasetsLote] = prepararDadosAgrupados(
           tarefasA, tarefasB, 'numero_tarefa', 'metros', corGrupoA, corGrupoB, 10 // Top 10
       );
       criarGrafico('graficoLote', 'bar', labelsLote, datasetsLote, corFundo, corEixo, corGrid);
   }
   

   function prepararDadosAgrupados(tarefasA, tarefasB, chave, valor, corA, corB, topN = null) {
       const modoComparacao = !!tarefasB;
   
       const agrupar = (tarefas) => {
           return tarefas.reduce((acc, t) => {
               const k = t[chave] || 'N/A';
               acc[k] = (acc[k] || 0) + (t[valor] || 0);
               return acc;
           }, {});
       };
   
       const dadosA = agrupar(tarefasA);
       const dadosB = modoComparacao ? agrupar(tarefasB) : {};
   
       let allLabels = [...new Set([...Object.keys(dadosA), ...Object.keys(dadosB)])];
       
       allLabels.sort((a, b) => (dadosA[b] || dadosB[b] || 0) - (dadosA[a] || dadosB[a] || 0));
   
       if (topN) {
           allLabels = allLabels.slice(0, topN);
       }
   
       const datasets = [{
           label: 'Filtro A',
           data: allLabels.map(label => dadosA[label] || 0),
           backgroundColor: corA,
       }];
   
       if (modoComparacao) {
           datasets.push({
               label: 'Filtro B',
               data: allLabels.map(label => dadosB[label] || 0),
               backgroundColor: corB,
           });
       }
   
       return [allLabels, datasets];
   }
   
   

   function criarGrafico(id, type, labels, datasets, borderColor, legendColor, gridColor) {
       const ctx = document.getElementById(id);
       if (!ctx) return;
       
       if (charts[id]) {
           charts[id].destroy();
       }
   
       const isDoughnut = type === 'doughnut';
   
       charts[id] = new Chart(ctx, {
           type: type,
           data: {
               labels: labels,
               datasets: datasets
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   legend: { 
                       position: isDoughnut ? 'bottom' : 'top', 
                       labels: { color: legendColor } 
                   },
                   datalabels: { display: false }
               },
               scales: isDoughnut ? {} : {
                   x: { 
                       ticks: { color: legendColor },
                       grid: { color: gridColor }
                   },
                   y: { 
                       beginAtZero: true, 
                       ticks: { color: legendColor },
                       grid: { color: gridColor }
                   }
               }
           }
       });
   }
   
   
   function mostrarLoading(mostrar) {
       const spinner = document.getElementById('loading-spinner');
       const container = document.getElementById('analise-container');
       
       if (mostrar) {
           spinner.classList.remove('d-none');
           spinner.classList.add('d-flex');
           container.classList.add('d-none');
       } else {
           spinner.classList.add('d-none');
           spinner.classList.remove('d-flex');
           container.classList.remove('d-none');
       }
   }
   
   
   document.addEventListener('DOMContentLoaded', () => {
       if (window.ChartDataLabels) {
           Chart.register(window.ChartDataLabels);
       }
       
       initCharts(true);
   
       buscarTarefas(true);
   
       document.getElementById('filtro-aplicar').addEventListener('click', aplicarFiltros);
       document.getElementById('filtro-limpar').addEventListener('click', limparFiltros);
       document.getElementById('btn-atualizar').addEventListener('click', () => buscarTarefas(true));
   
       document.getElementById('modo-comparacao').addEventListener('change', (e) => {
           const colunaB = document.getElementById('coluna-filtro-b');
           if (e.target.checked) {
               colunaB.classList.remove('d-none');
           } else {
               colunaB.classList.add('d-none');
           }
       });
   
       document.documentElement.addEventListener('themeChanged', (event) => {
           aplicarFiltros(); 
       });
   
       setInterval(() => buscarTarefas(false), 60000);
   });