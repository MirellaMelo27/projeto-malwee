   let lucroChart, desperdicioChart;

   /**
    * Atualiza as cores dos gráficos quando o tema muda.
    * @param {string} theme - 'light' ou 'dark'
    */
   function atualizarCoresGraficos(theme) {
       const isDark = (theme === 'dark');
       const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
       const fontColor = isDark ? '#adb5bd' : '#495057';
       const doughnutBorder = isDark ? '#1c1f23' : '#ffffff';
   
       Chart.defaults.color = fontColor;
       Chart.defaults.borderColor = gridColor;
   
       if (lucroChart) {
           lucroChart.data.datasets[0].borderColor = doughnutBorder;
           lucroChart.update('none');
       }
       if (desperdicioChart) {
           desperdicioChart.data.datasets[0].borderColor = doughnutBorder;
           desperdicioChart.update('none');
       }
   }
   
   /**
    * Inicializa os gráficos com dados vazios.
    */
   function initCharts() {
       const currentTheme = localStorage.getItem('theme') || 'dark';
       const initialDoughnutBorder = (currentTheme === 'dark') ? '#1c1f23' : '#ffffff';
   
       Chart.defaults.plugins.datalabels.display = false; // Desliga datalabels por padrão
   
       // Gráfico de Lucratividade (Doughnut)
       const lucroCtx = document.getElementById('lucroChart').getContext('2d');
       lucroChart = new Chart(lucroCtx, {
           type: 'doughnut',
           data: {
               labels: [], // Ex: ['Cotton', 'Meia Malha', 'Punho']
               datasets: [{
                   label: 'Lucro (R$)',
                   data: [], // Ex: [5000, 3500, 2000]
                   backgroundColor: ['#198754', '#0d6efd', '#0dcaf0', '#ffc107', '#dc3545'],
                   borderColor: initialDoughnutBorder,
                   hoverOffset: 4
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   legend: { position: 'bottom' }
               }
           }
       });
   
       // Gráfico de Desperdício (Bar)
       const desperdicioCtx = document.getElementById('desperdicioChart').getContext('2d');
       desperdicioChart = new Chart(desperdicioCtx, {
           type: 'bar',
           data: {
               labels: [], // Ex: ['Cotton', 'Meia Malha', 'Punho']
               datasets: [{
                   label: 'Desperdício (R$)',
                   data: [], // Ex: [300, 500, 150]
                   backgroundColor: 'rgba(220, 53, 69, 0.7)', // Cor de perigo (vermelho)
                   borderColor: '#dc3545',
                   borderWidth: 1
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               scales: {
                   y: { beginAtZero: true }
               },
               plugins: {
                   legend: { display: false }
               }
           }
       });
   }
   
   /**
    * @param {object} data - O objeto de dados (KPIs e arrays para gráficos)
    */
   function atualizarPagina(data) {
       const formatadorReais = new Intl.NumberFormat('pt-BR', {
           style: 'currency',
           currency: 'BRL'
       });
   
       document.getElementById('kpi-lucro-total').textContent = formatadorReais.format(data.kpis.lucroTotal);
       document.getElementById('kpi-custo-total').textContent = formatadorReais.format(data.kpis.custoTotal);
       document.getElementById('kpi-desperdicio-total').textContent = formatadorReais.format(data.kpis.desperdicioTotal);
   
       lucroChart.data.labels = data.lucroPorTecido.labels;
       lucroChart.data.datasets[0].data = data.lucroPorTecido.data;
       lucroChart.update();
   
       desperdicioChart.data.labels = data.desperdicioPorTecido.labels;
       desperdicioChart.data.datasets[0].data = data.desperdicioPorTecido.data;
       desperdicioChart.update();
   }
   
   async function pegaDados() {
       console.log("Buscando dados da análise de custos...");
       
       // ===================================================================
       // ATENÇÃO: O endpoint '/api/analise-custos' NÃO EXISTE!
       // Você precisa criá-lo no server.js.
       // Estou usando dados de EXEMPLO (mock) por enquanto.
       // ===================================================================
   
       try {
           /*
           // QUANDO O ENDPOINT EXISTIR, DESCOMENTE ISSO:
           const response = await fetch('/api/analise-custos'); // <-- Crie este endpoint
           if (!response.ok) throw new Error('Falha ao buscar dados');
           const data = await response.json();
           atualizarPagina(data);
           */
   
           // DADOS DE EXEMPLO (MOCK) - REMOVA QUANDO A API ESTIVER PRONTA
           const dadosDeExemplo = {
               kpis: {
                   lucroTotal: 12540.50,
                   custoTotal: 8320.00,
                   desperdicioTotal: 980.00
               },
               lucroPorTecido: {
                   labels: ['cotton', 'meia malha', 'punho new', 'punho elan', 'outros'],
                   data: [5200, 3100, 2000, 1500, 740.50]
               },
               desperdicioPorTecido: {
                labels: ['cotton', 'meia malha', 'punho new', 'punho elan', 'outros'],
                   data: [410, 250, 120, 80, 120]
               }
           };
           atualizarPagina(dadosDeExemplo);
   
       } catch (error) {
           console.error("Erro ao buscar dados de análise:", error);
       }
   }
   
   
   document.addEventListener('DOMContentLoaded', () => {
       
       if (window.ChartDataLabels) {
           Chart.register(ChartDataLabels);
       }
   
       const initialTheme = localStorage.getItem('theme') || 'dark';
       atualizarCoresGraficos(initialTheme);
       document.documentElement.addEventListener('themeChanged', (event) => {
           atualizarCoresGraficos(event.detail.theme);
       });
   
       initCharts();
   
       pegaDados();
   });