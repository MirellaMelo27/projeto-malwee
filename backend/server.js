const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',       // Servidor do MySQL
  user: 'root',     // Usuário do MySQL
  password: '',   // Senha do MySQL
  database: 'planilha' // AQUI você coloca o nome do banco
});

connection.connect((erro) => {
    if (erro) {
      console.error('Erro ao conectar no MySQL:', erro);
      return;
    }
    console.log('Conectado ao MySQL!');
  });


connection.query('select * from data', (erro, resultado) => {
    if (erro) {
        console.log("Erro ", erro )
        return
    } 
    console.log(resultado[0]['Numero da tarefa'])
})