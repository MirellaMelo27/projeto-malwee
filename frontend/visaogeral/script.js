const API_BASE_URL = 'http://localhost:3000/api/tarefas';

let todasAsTarefas = [];
let statusChart, productivityChart, tecidoChart;

const numberFormat = new Intl.NumberFormat('pt-BR');

// essa foi a primeira página que tentamos incrementar a função de alternar tema. teve muito bug, muito problema e demorou praticamente um dia inteiro e muiiiiito chatgpt!
/**
 * @param {string} theme - 'light' ou 'dark'
 */
function atualizarCoresGraficos(theme) {
    const isDark = (theme === 'dark');

    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const fontColor = isDark ? '#adb5bd' : '#495057';
    const doughnutBorder = isDark ? '#1c1f23' : '#ffffff'; // fundo

    Chart.defaults.color = fontColor;
    Chart.defaults.borderColor = gridColor;

    if (statusChart) {
        statusChart.data.datasets[0].borderColor = doughnutBorder;
        statusChart.update('none');
    }

    if (productivityChart) {
        productivityChart.options.scales.y.grid.color = gridColor;
        productivityChart.options.scales.y.ticks.color = fontColor;
        productivityChart.options.scales.x.grid.color = gridColor;
        productivityChart.options.scales.x.ticks.color = fontColor;
        productivityChart.update('none');
    }
    if (reinicioChart) {
        reinicioChart.options.scales.x.ticks.color = fontColor;
        reinicioChart.options.scales.y.grid.color = gridColor;
        reinicioChart.options.scales.y.ticks.color = fontColor;
        reinicioChart.update('none');
    }
    if (tecidoChart) {
        tecidoChart.options.scales.x.grid.color = gridColor;
        tecidoChart.options.scales.x.ticks.color = fontColor;
        tecidoChart.options.scales.y.grid.color = gridColor;
        tecidoChart.options.scales.y.ticks.color = fontColor;
        tecidoChart.update('none');
    } // nao sei se percebeu, mas a gente fez com que certos elementos tivessem alteracoes especificas, porque tava dando pau nem alguns elementos do graficos.
}


document.addEventListener('DOMContentLoaded', () => {

    if (window.ChartDataLabels) {
        Chart.register(ChartDataLabels);
    }
    //oiiii, nome
    const nomeUsuario = localStorage.getItem('usuarioNome');
    if (nomeUsuario) {
        document.getElementById('welcome-message').textContent = `Olá, ${nomeUsuario}`;
    } else {
        document.getElementById('welcome-message').textContent = 'Olá!';
    }

    Chart.defaults.plugins.datalabels.display = false;

    const initialTheme = localStorage.getItem('theme') || 'dark';
    atualizarCoresGraficos(initialTheme);

    document.documentElement.addEventListener('themeChanged', (event) => {
        atualizarCoresGraficos(event.detail.theme);
    });

    initCharts();

    initGraficoReinicio();

    preencherSelectMes();

    pegaDados();

    setInterval(pegaDados, 5000);
});

async function pegaDados() {
    try {
        const resposta = await fetch(API_BASE_URL);
        if (!resposta.ok) throw new Error(`Erro ao buscar dados: ${resposta.statusText}`);
        const novasTarefas = await resposta.json();

        const reinicios = novasTarefas.filter(t => t.status === "Reinicio");
        atualizarReinicios(reinicios);

        if (JSON.stringify(novasTarefas) === JSON.stringify(todasAsTarefas)) {
            return;
        }

        todasAsTarefas = novasTarefas;
        atualizarDashboard(todasAsTarefas);

    } catch (erro) {
        console.error('Erro na API:', erro);
    }
}


function atualizarReinicios(reinicios) {
    const agora = new Date();
    const reinicios30dias = reinicios.filter(r => {
        const data = new Date(r.data);
        return agora - data <= 1000 * 60 * 60 * 24 * 30; // últimos 30 dias
    });

    document.getElementById("kpi-reinicios").textContent = reinicios30dias.length;
}


let reinicioChart;

function initGraficoReinicio() {
    const ctx = document.getElementById('reinicioChart').getContext('2d');

    reinicioChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{
            label: "Reinícios",
            data: [],
            backgroundColor: '#dc3545',
            maxBarThickness: 50 
        }]},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Dia ${context[0].label}`;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    ticks: { color: Chart.defaults.color },
                    grid: { display: false }
                },
                y: { 
                    beginAtZero: true, 
                    ticks: { precision: 0, stepSize: 1, color: Chart.defaults.color },
                    grid: { color: Chart.defaults.borderColor }
                }
            }
        }
    });
}

async function atualizarGraficoReinicio(mes, ano) {
    const resp = await fetch(`http://localhost:3000/api/reinicios?mes=${mes}&ano=${ano}`);
    const dados = await resp.json();

    const ocorrenciasPorDia = {};

    dados.forEach(r => {
        const dataObj = new Date(r.data);
        const dia = dataObj.getDate(); 
        ocorrenciasPorDia[dia] = (ocorrenciasPorDia[dia] || 0) + 1;
    });

    
    const qtdDiasNoMes = new Date(ano, mes, 0).getDate();
    
    const labels = [];
    const valores = [];

    for (let i = 1; i <= qtdDiasNoMes; i++) {
        labels.push(i);
        valores.push(ocorrenciasPorDia[i] || 0);
    }

    reinicioChart.data.labels = labels;
    reinicioChart.data.datasets[0].data = valores;
    
    const totalMes = valores.reduce((a, b) => a + b, 0);
    const kpiReinicios = document.getElementById("kpi-reinicios");
    if(kpiReinicios) kpiReinicios.textContent = totalMes;

    reinicioChart.update();
}

function preencherSelectMes() {
    const select = document.getElementById("selectMes");
    const agora = new Date();

    for (let i = 0; i < 12; i++) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const mes = (d.getMonth() + 1).toString().padStart(2, '0');
        const ano = d.getFullYear();

        const opt = document.createElement("option");
        opt.value = `${mes}-${ano}`;
        opt.textContent = `${mes}/${ano}`;
        select.appendChild(opt);
    }

    select.addEventListener("change", () => {
        const [mes, ano] = select.value.split("-");
        atualizarGraficoReinicio(mes, ano);
    });

    const [mesAtual, anoAtual] = select.value.split("-");
    atualizarGraficoReinicio(mesAtual, anoAtual);
}

function initCharts() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const initialDoughnutBorder = (currentTheme === 'dark') ? '#1c1f23' : '#ffffff';

    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completas', 'Em Andamento', 'Pendentes', 'Incompletas'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#198754', '#0d6efd', '#ffc107', '#dc3545'], // Success, Primary, Warning, Danger
                hoverOffset: 4,
                borderColor: initialDoughnutBorder
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });

    const productivityCtx = document.getElementById('productivityChart').getContext('2d');
    productivityChart = new Chart(productivityCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Metros Produzidos',
                data: [],
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: Chart.defaults.borderColor }, // Pega a cor global
                    ticks: { color: Chart.defaults.color }       // Pega a cor global
                },
                x: {
                    grid: { color: Chart.defaults.borderColor },
                    ticks: { color: Chart.defaults.color }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    const tecidoCtx = document.getElementById('tecidoChart').getContext('2d');
    tecidoChart = new Chart(tecidoCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Metros Produzidos',
                data: [],
                backgroundColor: '#0dcaf0',
                borderColor: '#0dcaf0',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            // *** ATUALIZADO AQUI: Define os eixos para poderem ser atualizados ***
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Metros' },
                    grid: { color: Chart.defaults.borderColor },
                    ticks: { color: Chart.defaults.color }
                },
                y: {
                    grid: { color: Chart.defaults.borderColor },
                    ticks: { color: Chart.defaults.color }
                }
            },
            plugins: { legend: { display: false } }
        }

    });
}

function atualizarDashboard(tarefas) {
    atualizarKPIs(tarefas);
    atualizarGraficoStatus(tarefas);
    atualizarGraficoProdutividade(tarefas);
    atualizarGraficoTecidos(tarefas);
}


function atualizarKPIs(tarefas) {
    const totalMetros = tarefas.reduce((acc, t) => acc + (t.metros || 0), 0);
    const totalTiras = tarefas.reduce((acc, t) => acc + (t.qtd_tiras || 0), 0);

    const tarefasAtivas = tarefas.filter(t => (t.status || '').toLowerCase() === 'em andamento').length;
    const tarefasPendentes = tarefas.filter(t => (t.status || '').toLowerCase() === 'pendente').length;

    document.getElementById('kpi-total-tarefas').textContent = numberFormat.format(tarefas.length);
    document.getElementById('kpi-total-metros').textContent = `${numberFormat.format(totalMetros)} m²`;
    document.getElementById('kpi-total-tiras').textContent = numberFormat.format(totalTiras);

    document.getElementById('kpi-tarefas-ativas').textContent = numberFormat.format(tarefasAtivas);
    document.getElementById('kpi-tarefas-ativas-sub').textContent =
        `${tarefasAtivas} em andamento, ${tarefasPendentes} pendentes`;
}

function atualizarGraficoStatus(tarefas) {
    const emAndamento = tarefas.filter(t => (t.status || '').toLowerCase() === 'em andamento').length;
    const pendentes = tarefas.filter(t => (t.status || '').toLowerCase() === 'pendente').length;
    const tarefasInativas = tarefas.filter(t => {
        const s = (t.status || '').toLowerCase();
        return s !== 'em andamento' && s !== 'pendente';
    });

    const completas = tarefasInativas.filter(t => t.completa === true).length;
    const incompletas = tarefasInativas.filter(t => t.completa === false).length;

    statusChart.data.datasets[0].data = [completas, emAndamento, pendentes, incompletas];
    statusChart.update();

    document.getElementById('legend-completas').textContent = numberFormat.format(completas);
    document.getElementById('legend-andamento').textContent = numberFormat.format(emAndamento);
    document.getElementById('legend-pendentes').textContent = numberFormat.format(pendentes);

    const legendIncompletas = document.getElementById('legend-incompletas');
    if (legendIncompletas) {
        legendIncompletas.textContent = numberFormat.format(incompletas);
    }
}


function atualizarGraficoProdutividade(tarefas) {
    const labels = [];
    const data = [];
    const hoje = new Date();

    for (let i = 29; i >= 0; i--) {
        const dia = new Date();
        dia.setDate(hoje.getDate() - i);

        const dataFormatada = dia.toISOString().split('T')[0];

        const tarefasDoDia = tarefas.filter(t =>
            t.data &&
            t.data.startsWith(dataFormatada) &&
            t.completa === true
        );

        const metrosDoDia = tarefasDoDia.reduce((acc, t) => acc + (t.metros || 0), 0);

        const diaLabel = dia.getDate().toString().padStart(2, '0');
        const mesLabel = (dia.getMonth() + 1).toString().padStart(2, '0');
        labels.push(`${diaLabel}/${mesLabel}`);

        data.push(metrosDoDia);
    }

    productivityChart.data.labels = labels;
    productivityChart.data.datasets[0].data = data;
    productivityChart.update();
}

function atualizarGraficoTecidos(tarefas) {
    const producaoPorTecido = new Map();

    tarefas.forEach(t => {
        if (!t.tipo_tecido || !(t.metros > 0)) return;
        const tecido = t.tipo_tecido;
        const metrosAtuais = producaoPorTecido.get(tecido) || 0;
        producaoPorTecido.set(tecido, metrosAtuais + t.metros);
    });

    const sorted = [...producaoPorTecido.entries()].sort((a, b) => b[1] - a[1]);
    const topTecidos = sorted.slice(0, 10);
    const labels = topTecidos.map(item => item[0]);
    const data = topTecidos.map(item => item[1]);

    tecidoChart.data.labels = labels;
    tecidoChart.data.datasets[0].data = data;
    tecidoChart.update();
}