fetch('http://localhost:3000/tabela')
  .then(res => res.json())
  .then(dados => {
    const maquina1 = dados.filter(item => item.Maquina === "Máquina 1");

    const labels = maquina1.map(item => item["Tipo de Saida"] + " " + item["Numero da tarefa"]);
    const metros = maquina1.map(item => item["Metros Produzidos"]);

    new Chart(document.getElementById('metrosChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: "Metros Produzidos",
          data: metros,
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
          fill: true,
          tension: 0.3
        }]
      }
    });

    const completas = maquina1.filter(i => i["Tarefa completa?"] === "TRUE").length;
    const incompletas = maquina1.length - completas;

    new Chart(document.getElementById('sucessoChart'), {
      type: 'doughnut',
      data: {
        labels: ["Completas", "Incompletas"],
        datasets: [{
          data: [completas, incompletas],
          backgroundColor: ["#4caf50", "#f44336"]
        }]
      }
    });
  })
  .catch(err => console.error("Erro no Dashboard: ", err));
