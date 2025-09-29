fetch('http://localhost:3000/tabela')
  .then(response => { 
    if (!response.ok) {
      throw new Error('Erro ao buscar os produtos')
    } 
    return response.json();
  })
  .then(tabelas => { 
    console.log(tabelas);
    const info = document.getElementById('infos'); 

    tabelas.slice(0, 50).forEach(item => {
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
    });
  })
  .catch(err => console.error(err));
