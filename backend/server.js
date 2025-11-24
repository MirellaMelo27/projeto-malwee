const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const portinha = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

const bagulhoDoBanco = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'planilha',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

bagulhoDoBanco.getConnection()
    .then(conexao => {
        console.log('sql tá funcionando, tudo nos conformes');
        conexao.release();
    })
    .catch(erro => {
        console.error('deu ruim pra conectar no mysql:', erro.message);
        process.exit(1);
    });

app.get('/api/tarefas', async (req, res) => {
    try {
        const { id, dataBusca } = req.query;

        let querySql = `
            SELECT
                \`id\` AS id,
                \`Data (AAAA-MM-DD HH:MM:SS)\` AS data,
                \`Maquina\` AS maquina,
                \`Tipo Tecido\` AS tipo_tecido,
                \`Tipo de Saida\` AS tipo_saida,
                \`Numero da tarefa\` AS numero_tarefa,
                \`Tempo de setup\` AS tempo_setup,
                \`Tempo de Produção\` AS tempo_producao,
                \`Quantidade de Tiras\` AS qtd_tiras,
                \`Metros Produzidos\` AS metros,
                \`Tarefa completa?\` AS tarefa_completa,
                \`Sobra de Rolo?\` AS tem_sobra,
                \`obs\` AS observacao
            FROM \`tarefas_producao\`
        `;

        const condicoes = [];
        const params = [];

        if (dataBusca) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dataBusca)) {
                condicoes.push('DATE(`Data (AAAA-MM-DD HH:MM:SS)`) = ?');
                params.push(dataBusca);
            } else {
                console.warn("Formato de data inválido recebido:", dataBusca);
            }
        }

        if (id) {
            const idNum = parseInt(id, 10);
            if (!Number.isNaN(idNum)) {
                condicoes.push('`id` = ?');
                params.push(idNum);
            } else {
                console.warn('ID inválido recebido:', id);
            }
        }

        if (condicoes.length) querySql += ' WHERE ' + condicoes.join(' AND ');

        querySql += ' ORDER BY `Data (AAAA-MM-DD HH:MM:SS)` DESC';

        console.log('Executando SQL (parametrizado):', querySql);
        console.log('Params:', params);
        const [linhas] = await bagulhoDoBanco.query(querySql, params);

        const mapTipoTecido = {
            0: 'meia malha',
            1: 'cotton',
            2: 'punho pun',
            3: 'punho new',
            4: 'punho san',
            5: 'punho elan'
        };

        const mapTipoSaida = {
            0: 'rolinho',
            1: 'fraldado'
        };

        const tarefas = linhas.map(tarefa => ({
            ...tarefa,
            tipo_tecido: mapTipoTecido[tarefa.tipo_tecido] || tarefa.tipo_tecido,
            tipo_saida: mapTipoSaida[tarefa.tipo_saida] || tarefa.tipo_saida,
            completa: tarefa.tarefa_completa === 'TRUE',
            sobra: tarefa.tem_sobra === 'TRUE',
            unidade_tempo: 'segundos'
        }));

        res.json(tarefas);

    } catch (erro) {
        console.error('-----------------------------------------');
        console.error('!!! ERRO DETALHADO ao buscar tarefas !!!');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Query Params Recebidos:', req.query);
        console.error('Erro Code:', erro && erro.code);
        console.error('Erro SQL Message:', erro && erro.sqlMessage);
        console.error('Erro Stack:', erro && erro.stack);
        console.error('-----------------------------------------');
        res.status(500).json({ erro: 'Erro interno no servidor ao buscar tarefas.' });
    }
});

app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos' });
    try {
        const [existe] = await bagulhoDoBanco.query('SELECT * FROM dadoslogin WHERE email = ?', [email]);
        if (existe.length > 0) return res.status(400).json({ erro: 'Email já cadastrado' });
        await bagulhoDoBanco.query('INSERT INTO dadoslogin (nome, email, senha) VALUES (?, ?, ?)', [nome, email, senha]);
        res.json({ sucesso: true, mensagem: 'Conta criada com sucesso!' });
    } catch (erro) {
        console.error('erro ao cadastrar usuário:', erro);
        res.status(500).json({ erro: 'deu ruim no servidor ao criar conta' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Preencha email e senha' });
    try {
        const [resultado] = await bagulhoDoBanco.query('SELECT * FROM dadoslogin WHERE email = ?', [email]);
        if (resultado.length === 0) return res.status(401).json({ erro: 'Usuário não encontrado' });
        const usuario = resultado[0];
        if (usuario.senha !== senha) return res.status(401).json({ erro: 'Senha incorreta' });
        res.json({ sucesso: true, mensagem: 'Login bem-sucedido!', usuario: { nome: usuario.nome, email: usuario.email } });
    } catch (erro) {
        console.error('erro ao fazer login:', erro);
        res.status(500).json({ erro: 'deu ruim no servidor ao fazer login' });
    }
});

app.get('/api/indicadores', async (req, res) => {
    try {
        const [resultado] = await bagulhoDoBanco.query(`
            SELECT 
                COUNT(*) AS total_tarefas,
                SUM(\`Metros Produzidos\`) AS total_metros,
                SUM(CASE WHEN \`Tarefa completa?\` = 'TRUE' THEN 1 ELSE 0 END) AS tarefas_completas,
                SUM(\`Quantidade de Tiras\`) AS total_tiras
            FROM \`tarefas_producao\`;
        `);
        res.json(resultado[0]);
    } catch (erro) {
        console.error('erro ao buscar indicadores:', erro);
        res.status(500).json({ erro: 'deu ruim pra buscar os indicadores' });
    }
});

app.get('/api/performance-maquina', async (req, res) => {
    try {
        const [linhas] = await bagulhoDoBanco.query(`
            SELECT 
                Maquina AS maquina, 
                SUM(\`Metros Produzidos\`) AS total_metros
            FROM \`tarefas_producao\`
            GROUP BY Maquina
            ORDER BY total_metros DESC;
        `);
        res.json(linhas);
    } catch (erro) {
        console.error('erro ao buscar performance:', erro);
        res.status(500).json({ erro: 'deu ruim pra buscar a performance' });
    }
});

function numeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escolherAleatorio(array) {
    return array[numeroAleatorio(0, array.length - 1)];
}

async function criarTarefaAleatoria() {
    try {
        const maquinas = ['Máquina A', 'Máquina B', 'Máquina C'];
        const tiposTecido = ['meia malha', 'cotton', 'punho pun', 'punho new', 'punho san', 'punho elan'];
        const tiposSaida = ['rolinho', 'fraldado'];

        const maquina = escolherAleatorio(maquinas);
        const tipoTecido = escolherAleatorio(tiposTecido);
        const tipoSaida = escolherAleatorio(tiposSaida);
        const numeroTarefa = numeroAleatorio(1000, 9999);
        const tempoSetup = numeroAleatorio(60, 600);
        const tempoProducao = numeroAleatorio(300, 3600);
        const qtdTiras = numeroAleatorio(10, 200);
        const metros = numeroAleatorio(50, 1000);
        const tarefaCompleta = escolherAleatorio(['TRUE', 'FALSE']);
        const temSobra = escolherAleatorio(['TRUE', 'FALSE']);
        const observacao = `Observação automática ${Date.now()}`;

        await bagulhoDoBanco.query(
            `INSERT INTO tarefas_producao
            (\`Data (AAAA-MM-DD HH:MM:SS)\`, Maquina, \`Tipo Tecido\`, \`Tipo de Saida\`, \`Numero da tarefa\`, 
             \`Tempo de setup\`, \`Tempo de Produção\`, \`Quantidade de Tiras\`, \`Metros Produzidos\`, 
             \`Tarefa completa?\`, \`Sobra de Rolo?\`, \`obs\`)
            VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [maquina, tipoTecido, tipoSaida, numeroTarefa, tempoSetup, tempoProducao, qtdTiras, metros, tarefaCompleta, temSobra, observacao]
        );

        console.log(`Tarefa aleatória inserida: ${numeroTarefa} (${maquina})`);
    } catch (err) {
        console.error('Erro ao criar tarefa aleatória:', err);
    }
}

setInterval(criarTarefaAleatoria, 10000);

app.listen(portinha, () => {
    console.log(`servidor rodando na porta ${portinha}, tudo nos conformes`);
});

