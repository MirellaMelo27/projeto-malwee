fetch('http://localhost:3000/tabela')
  .then(res => res.json())
  .then(tabelas => {
    const info = document.getElementById('infos');
    tabelas.forEach(item => {
      info.innerHTML += `
        <tr>
          <td>${item["Data (AAAA-MM-DD HH:MM:SS)"]}</td>
          <td>${item["Tipo Tecido"]}</td>
          <td>${item["Tipo de Saida"]}</td>
          <td>${item["Numero da tarefa"]}</td>
          <td>${item["Quantidade de Tiras"]}</td>
          <td>${item["Metros Produzidos"]}</td>
          <td>${item["Tarefa completa?"]}</td>
        </tr>`;
    });
  })
  .catch(err => console.error("Erro nas Informações: ", err));
