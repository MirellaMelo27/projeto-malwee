const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const porta = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));  // servir arquivos estáticos

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'planilha'
});

connection.connect(err => {
  if (err) {
    console.error('Erro ao conectar MySQL:', err);
  } else {
    console.log('Conectado ao MySQL!');
  }
});

app.get('/tabela', (req, res) => {
  connection.query('SELECT * FROM data', (erro, resultado) => {
    if (erro) {
      console.error('Erro na query:', erro);
      res.status(500).send('Erro no banco');
    } else {
      res.json(resultado);
    }
  });
});

app.post('/tabela', (req, res) => {
  // lógica de inserir no banco conforme já conversamos
});

app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
