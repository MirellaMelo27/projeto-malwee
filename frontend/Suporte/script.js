const API_BASE_URL = 'http://localhost:3000/api/tarefas';

let todasAsTarefas = [];
let statusChart, productivityChart, tecidoChart;

const numberFormat = new Intl.NumberFormat('pt-BR');

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

   
}

function ver_manual() {
    document.getElementById('manual-container').classList.remove('d-none');
  }
  
  document.addEventListener('click', (e) => {
    if (e.target.id === 'fechar-manual' || e.target.id === 'manual-container') {
      document.getElementById('manual-container').classList.add('d-none');
    }
  });
  

