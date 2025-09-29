fetch('http://localhost:3000/tabela')
  .then(res => res.json())
  .then(dados => {
    // Filtrar por máquina 1 (depois você pode adicionar botões para trocar máquina)
    const maquina1 = dados.filter(item => item.Maquina === "Máquina 1");

    // Preparar dados para gráfico de Metros Produzidos
    const labels = maquina1.map(item => item["Tipo de Saida"] + " - " + item["Numero da tarefa"]);
    const metros = maquina1.map(item => item["Metros Produzidos"]);

    const ctx1 = document.getElementById('metrosChart').getContext('2d');
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: "Metros Produzidos",
          data: metros,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Preparar dados para gráfico de sucesso (% de tarefas completas)
    const total = maquina1.length;
    const completas = maquina1.filter(item => item["Tarefa completa?"] === "TRUE").length;
    const incompletas = total - completas;

    const ctx2 = document.getElementById('sucessoChart').getContext('2d');
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Completas', 'Incompletas'],
        datasets: [{
          data: [completas, incompletas],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  })
  .catch(err => console.error("Erro ao carregar dados: ", err));
