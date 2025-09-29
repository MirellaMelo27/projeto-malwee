async function loadView(view) {
  const res = await fetch(`views/${view}.html`);
  const html = await res.text();
  document.getElementById("content").innerHTML = html;
}

document.getElementById("btn-dashboard").addEventListener("click", () => loadView("dashboard"));
document.getElementById("btn-infos").addEventListener("click", () => loadView("informacoes"));

<<<<<<< HEAD
.then(tabelas => {

    console.log(tabelas)
    const info = document.getElementById('infos');

    tabelas.slice(0,11).forEach(item => {
      info.innerHTML += `
        <tr>
          <td>${item["Data (AAAA-MM-DD HH:MM:SS)"]}</td>
          <td>${item["Tipo Tecido"]}</td>
          <td>${item["Tipo de Saida"]}</td>
          <td>${item["Numero da tarefa"]}</td>
          <td>${item["Quantidade de Tiras"]}</td>
          <td>${item["Metros Produzidos"]}</td>
          <td>${item["Tarefa completa?"]}</td>
        </tr>
      `;

      console.log
    });
  })
  .catch(err => console.error(err));
=======
loadView("dashboard");
>>>>>>> b3380a07341cefa4e72d0da06e34e9a0302c6ab5
