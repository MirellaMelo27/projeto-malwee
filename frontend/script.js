function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = 'none';
  });
  document.getElementById(sectionId).style.display = 'block';


  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
      link.classList.remove('active');
  });
  document.getElementById(`nav-${sectionId}`).classList.add('active');
 
  if (sectionId === 'visao-geral') {
      initCharts();
  } else if (sectionId === 'detalhes') {
      populateTable();
  }
}


document.addEventListener('DOMContentLoaded', () => {
  showSection('visao-geral');
});




const allTasks = [];
const TOTAL_TASKS = 1000;
const PAGE_SIZE = 20;


function generateTasks() {
  for (let i = 1; i <= TOTAL_TASKS; i++) {
      const isComplete = Math.random() < 0.85;
      allTasks.push({
          id: i,
          data: `2023-10-2${Math.floor(Math.random() * 5) + 1} 1${Math.floor(Math.random() * 10)}:00:00`,
          tarefa: `T-${String(i).padStart(4, '0')}`,
          tecido: ['Algodão', 'Poliéster', 'Seda', 'Nylon'][Math.floor(Math.random() * 4)],
          metros: (Math.random() * 500).toFixed(2),
          tiras: Math.floor(Math.random() * 30) + 5,
          status: isComplete ? 'Sim' : 'Não',
          details: {
              dataMaquina: `M-${Math.floor(Math.random() * 3) + 1}`,
              tipoSaida: ['Rolo', 'Fardo'][Math.floor(Math.random() * 2)],
              tempoSetup: `${Math.floor(Math.random() * 15)} min`,
              tempoProducao: `${Math.floor(Math.random() * 60)} min`,
              tarefaCompleta: isComplete ? 'Sim' : 'Não',
              sobraRolo: isComplete && Math.random() < 0.15 ? 'Sim' : 'Não'
          }
      });
  }
}
generateTasks();




function populateTable(page = 1) {
  const tableBody = document.getElementById('task-table').querySelector('tbody');
  tableBody.innerHTML = '';


  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const tasksToShow = allTasks.slice(startIndex, endIndex);


  tasksToShow.forEach(task => {
      const statusBadge = `<span class="btn-status-sim">${task.status}</span>`;
      const row = document.createElement('tr');
      row.innerHTML = `
          <td style="cursor: pointer;" onclick="toggleDetails(${task.id})"><i class="bi bi-chevron-right" id="icon-${task.id}"></i></td>
          <td>${task.data.split(' ')[0]}</td>
          <td>${task.tarefa}</td>
          <td>${task.tecido}</td>
          <td>${task.metros}</td>
          <td>${task.tiras}</td>
          <td>${statusBadge}</td>
      `;
      tableBody.appendChild(row);


      const detailsRow = document.createElement('tr');
      detailsRow.id = `details-${task.id}`;
      detailsRow.classList.add('task-details-row', 'collapse');
      detailsRow.innerHTML = `
          <td colspan="7">
              <div class="p-3 row">
                  <div class="col-md-3 text-secondary">Data Máquina: <strong class="float-end text-white">${task.details.dataMaquina}</strong></div>
                  <div class="col-md-3 text-secondary">Tipo Tecido: <strong class="float-end text-white">${task.tecido}</strong></div>
                  <div class="col-md-3 text-secondary">Tipo de Saída: <strong class="float-end text-white">${task.details.tipoSaida}</strong></div>
                  <div class="col-md-3 text-secondary">Tempo de Setup: <strong class="float-end text-white">${task.details.tempoSetup}</strong></div>


                  <div class="col-md-3 text-secondary">Tempo de Produção: <strong class="float-end text-white">${task.details.tempoProducao}</strong></div>
                  <div class="col-md-3 text-secondary">Tarefa Completa: <strong class="float-end text-${task.details.tarefaCompleta === 'Sim' ? 'success' : 'danger'}">${task.details.tarefaCompleta}</strong></div>
                  <div class="col-md-3 text-secondary">Sobra de Rolo: <strong class="float-end text-${task.details.sobraRolo === 'Sim' ? 'warning' : 'secondary'}">${task.details.sobraRolo}</strong></div>
              </div>
          </td>
      `;
      tableBody.appendChild(detailsRow);
  });
}


function toggleDetails(taskId) {
  const detailsRow = document.getElementById(`details-${taskId}`);
  const icon = document.getElementById(`icon-${taskId}`);
 
  if (detailsRow.classList.contains('show')) {
      detailsRow.classList.remove('show');
      icon.classList.replace('bi-chevron-down', 'bi-chevron-right');
  } else {
      detailsRow.classList.add('show');
      icon.classList.replace('bi-chevron-right', 'bi-chevron-down');
  }
}




let completionChart, productivityChart;


function initCharts() {
  const completed = 850;
  const incomplete = 150;
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const dataMetros = [1200, 1500, 1300, 1800, 2300, 2000, 2345];
 
  if (completionChart) completionChart.destroy();
  const completionCtx = document.getElementById('completionChart').getContext('2d');
  completionChart = new Chart(completionCtx, {
      type: 'doughnut',
      data: {
          labels: ['Completas', 'Incompletas'],
          datasets: [{
              data: [completed, incomplete],
              backgroundColor: ['#0dcaf0', '#dc3545'],
              hoverOffset: 4
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: {
                  position: 'bottom',
                  labels: { color: 'white' }
              },
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          let label = context.label || '';
                          if (label) {
                              label += ': ';
                          }
                          if (context.parsed !== null) {
                              label += new Intl.NumberFormat('pt-BR').format(context.parsed) + ' tarefas';
                          }
                          return label;
                      }
                  }
              }
          }
      }
  });


  if (productivityChart) productivityChart.destroy();
  const productivityCtx = document.getElementById('productivityChart').getContext('2d');
  productivityChart = new Chart(productivityCtx, {
      type: 'line',
      data: {
          labels: labels,
          datasets: [{
              label: 'Metros Produzidos',
              data: dataMetros,
              borderColor: '#198754',
              backgroundColor: 'rgba(25, 135, 84, 0.2)',
              fill: true,
              tension: 0.4
          }]
      },
      options: {
          responsive: true,
          scales: {
              x: { ticks: { color: 'white' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
              y: { beginAtZero: true, ticks: { color: 'white' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
          },
          plugins: {
              legend: { display: false }
          }
      }
  });
}




let simulationInterval;
let currentMetros = 0;
let currentTiras = 0;
let isRunning = false;
let simChart;


const TARGET_METROS = 500;
const TARGET_TIRAS = 25;


document.getElementById('sim-metros-alvo').textContent = TARGET_METROS;
document.getElementById('sim-tiras-alvo').textContent = TARGET_TIRAS;


function initSimChart() {
  if (simChart) simChart.destroy();
  const simCtx = document.getElementById('simulacaoChart').getContext('2d');
  simChart = new Chart(simCtx, {
      type: 'line',
      data: {
          labels: [],
          datasets: [{
              label: 'Metros Produzidos',
              data: [],
              borderColor: '#0dcaf0',
              backgroundColor: 'rgba(13, 202, 240, 0.2)',
              fill: true,
              tension: 0.2
          }]
      },
      options: {
          responsive: true,
          animation: false,
          scales: {
              x: { ticks: { color: 'white' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
              y: { beginAtZero: true, max: TARGET_METROS * 1.1, ticks: { color: 'white' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
          },
          plugins: {
              legend: { display: false }
          }
      }
  });
}


document.getElementById('sim-iniciar').addEventListener('click', () => {
  if (isRunning) {
      clearInterval(simulationInterval);
      isRunning = false;
      document.getElementById('sim-iniciar').innerHTML = '<i class="bi bi-play-fill"></i> Continuar';
      document.getElementById('sim-status-dot').style.color = 'orange';
      document.getElementById('sim-status-text').textContent = 'Pausada';
  } else {
      if (currentMetros === 0) initSimChart();
      isRunning = true;
      document.getElementById('sim-iniciar').innerHTML = '<i class="bi bi-pause-fill"></i> Pausar';
      document.getElementById('sim-status-dot').style.color = 'green';
      document.getElementById('sim-status-text').textContent = 'Em Produção';
     
      simulationInterval = setInterval(updateSimulation, 1000);
  }
});


document.getElementById('sim-resetar').addEventListener('click', () => {
  clearInterval(simulationInterval);
  isRunning = false;
  currentMetros = 0;
  currentTiras = 0;


  document.getElementById('sim-iniciar').innerHTML = '<i class="bi bi-play-fill"></i> Iniciar';
  document.getElementById('sim-status-dot').style.color = 'red';
  document.getElementById('sim-status-text').textContent = 'Parada';
 
  document.getElementById('sim-metros-produzidos').textContent = '0.0';
  document.getElementById('sim-tiras-produzidas').textContent = '0';
  document.getElementById('sim-metros-progress').style.width = '0%';
  document.getElementById('sim-progresso-metros').textContent = '0.0%';
  document.getElementById('sim-tarefa-completa').textContent = 'Não';
  document.getElementById('sim-tarefa-completa').classList.remove('text-success');
  document.getElementById('sim-tarefa-completa').classList.add('text-danger');
 
  if (simChart) simChart.destroy();
});


document.getElementById('sim-velocidade').addEventListener('input', (e) => {
  document.getElementById('sim-velocidade-value').textContent = `${e.target.value}%`;
});




function updateSimulation() {
  if (!isRunning || currentMetros >= TARGET_METROS) {
      if (currentMetros >= TARGET_METROS) {
          clearInterval(simulationInterval);
          isRunning = false;
          document.getElementById('sim-iniciar').innerHTML = '<i class="bi bi-play-fill"></i> Iniciar';
          document.getElementById('sim-status-dot').style.color = 'green';
          document.getElementById('sim-status-text').textContent = 'Completa';
          document.getElementById('sim-tarefa-completa').textContent = 'Sim';
          document.getElementById('sim-tarefa-completa').classList.remove('text-danger');
          document.getElementById('sim-tarefa-completa').classList.add('text-success');


          console.log("Simulação Completa! Dados prontos para envio.");
      }
      return;
  }


  const speed = parseFloat(document.getElementById('sim-velocidade').value) / 100;
  const progressRate = 5 * speed;


  currentMetros += progressRate;
  currentMetros = Math.min(currentMetros, TARGET_METROS);


  currentTiras = Math.floor(currentMetros / (TARGET_METROS / TARGET_TIRAS));


  const progressPercent = (currentMetros / TARGET_METROS) * 100;


  document.getElementById('sim-metros-produzidos').textContent = currentMetros.toFixed(1);
  document.getElementById('sim-tiras-produzidas').textContent = currentTiras;
  document.getElementById('sim-metros-progress').style.width = `${progressPercent}%`;
  document.getElementById('sim-metros-progress').setAttribute('aria-valuenow', progressPercent.toFixed(1));
  document.getElementById('sim-progresso-metros').textContent = `${progressPercent.toFixed(1)}%`;
 
  const now = new Date();
  simChart.data.labels.push(`${now.getMinutes()}:${String(now.getSeconds()).padStart(2, '0')}`);
  simChart.data.datasets[0].data.push(currentMetros);
  simChart.update();
}
