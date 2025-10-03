


async function loadView(view) {
  const res = await fetch(`views/${view}.html`);
  const html = await res.text();
  document.getElementById("content").innerHTML = html;

  fetch('http://localhost:3000/tabela')
  .then(response => { 
    if (!response.ok) {
      throw new Error('Erro ao buscar os produtos')
    } 
    return response.json();
  })
  .then(tabelas => { 
    console.log(tabelas);

    tabelas.slice(0, 50).forEach(item => {
    });
  })
  .catch(err => console.error(err));
}

document.getElementById("btn-dashboard").addEventListener("click", () => loadView("dashboard"));
document.getElementById("btn-infos").addEventListener("click", () => loadView("informacoes"));

loadView("dashboard")