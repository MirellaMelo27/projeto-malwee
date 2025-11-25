// script.js (versão corrigida)

/* API root - ajusta se seu backend estiver em outro host/porta */
const API_ROOT = 'http://localhost:3000';

const API_BASE_URL = `${API_ROOT}/api/tarefas`; // seu código antigo usava essa constante para tarefas
// nós vamos usar `${API_ROOT}/api/comentarios` nas chamadas do fórum

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

/* === Fórum / comentários ===
   Este bloco assume que seu HTML chama enviarComentario() via:
   <button onclick="enviarComentario()">Enviar</button>
   e que o login já salvou o e-mail em localStorage como 'usuarioEmail'
*/

document.addEventListener('DOMContentLoaded', () => {
  // Carrega comentários quando a página carregar
  carregarComentarios();
});

// chamada inline no botão do HTML
async function enviarComentario() {
  // pegar valor do textarea
  const descricao = document.getElementById('forum-texto').value.trim();
  const email_usuario = localStorage.getItem('usuarioEmail'); // obrigatório

  // sem feedback visível se não estiver logado ou comentário vazio (do jeito que você pediu)
  if (!descricao || !email_usuario) return;

  try {
    await fetch(`${API_ROOT}/api/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_usuario, descricao })
    });

    // limpa campo e recarrega lista
    document.getElementById('forum-texto').value = '';
    carregarComentarios();
  } catch (error) {
    console.error('Erro ao enviar comentário:', error);
  }
}

async function carregarComentarios() {
  try {
    const res = await fetch(`${API_ROOT}/api/comentarios`);
    // Se o backend estiver retornando HTML de erro, aqui vai quebrar — então checamos
    const text = await res.text();
    // se não for JSON válido, res.json() iria lançar SyntaxError; aqui tratamos isso
    try {
      const comentarios = JSON.parse(text);
      renderizarComentarios(comentarios);
    } catch {
      // recebeu HTML (erro) ou texto; log e limpa lista
      console.error('Resposta inesperada ao buscar comentários:', text);
      const lista = document.getElementById('lista-comentarios');
      if (lista) {
        lista.innerHTML = `
          <li class="list-group-item bg-black text-white border-secondary">
            Erro ao carregar comentários.
          </li>`;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar comentários:', error);
  }
}

function renderizarComentarios(comentarios) {
  const lista = document.getElementById('lista-comentarios');
  if (!lista) return;
  lista.innerHTML = '';

  if (!Array.isArray(comentarios) || comentarios.length === 0) {
    lista.innerHTML = `
      <li class="list-group-item bg-black text-white border-secondary">
        Nenhum comentário ainda.
      </li>`;
    return;
  }

  comentarios.forEach(c => {
    const li = document.createElement('li');
    li.className = 'list-group-item bg-black text-white border-secondary';
    li.innerHTML = `
      <div class="d-flex justify-content-between mb-1">
        <strong>${escapeHtml(c.email_usuario)}</strong>
        <small class="text-secondary">${formatDate(c.data_comentario)}</small>
      </div>
      <p class="mb-0">${escapeHtml(c.descricao)}</p>
    `;
    lista.appendChild(li);
  });
}

function escapeHtml(str) {
  return str?.replaceAll('&', '&amp;')
             .replaceAll('<', '&lt;')
             .replaceAll('>', '&gt;')
             .replaceAll('"', '&quot;')
             .replaceAll("'", '&#039;')
             .replaceAll('\n', '<br>') || '';
}

function formatDate(d) {
  const dt = new Date(d);
  return !isNaN(dt) ? dt.toLocaleDateString('pt-BR') : d;
}

/* fim do script */
