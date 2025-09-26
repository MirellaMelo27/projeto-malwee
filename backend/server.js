const mysql = require('mysql2');
const express = require('express');
const cors =  require('cors');

const app = express();
const porta = 3000;

app.use(cors());

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

  app.get('/tabela', (req, res) => {
    connection.query('SELECT * FROM data', (erro, resultado) => {
      if (erro) {
        console.error("Erro no MySQL:", erro);
        return res.status(500).json({erro: 'Erro ao consultar banco'});
      }
      res.json(resultado);
    });
  });

app.listen(porta, ()  => {
    console.log("http://localhost:3000")
})