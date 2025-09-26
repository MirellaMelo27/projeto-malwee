const mysql = require('mysql2');

const express = require('express');
const cors =  require('cors');

const app = express();

const porta = 3000;

connection.connect((erro) => {
    if (erro) {
      console.error('Erro ao conectar no MySQL:', erro);
      return;
    }
    console.log('Conectado ao MySQL!');
  });

app.get('/tabela', (req, res) => {
    connection.query('select * from data', (erro, resultado) => {
        if (erro) {
            console.log("Erro ", erro )
            return
        } 
        res.send(resultado)
    })
})


const connection = mysql.createConnection({
  host: 'localhost',       // Servidor do MySQL
  user: 'root',     // Usuário do MySQL
  password: '',   // Senha do MySQL
  database: 'planilha' // AQUI você coloca o nome do banco
});

app.listen(porta, ()  => {
    console.log("http://localhost:3000")
})