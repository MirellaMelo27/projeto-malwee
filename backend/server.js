const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const portinha = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

const bagulhoDoBanco = mysql.createPool({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'projeto_malwee',
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

app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
        }

        const [linhas] = await bagulhoDoBanco.query(
            'SELECT nome, email FROM dadoslogin WHERE email = ? AND senha = ?',
            [email, senha]
        );

        if (linhas.length === 0) {
            return res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas.' });
        }

        res.json({
            sucesso: true,
            usuario: linhas[0]
        });

    } catch (erro) {
        console.error('Erro no login:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

app.post('/api/registro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
        }

        const [existe] = await bagulhoDoBanco.query(
            'SELECT * FROM dadoslogin WHERE email = ?',
            [email]
        );

        if (existe.length > 0) {
            return res.status(400).json({ erro: 'E-mail já cadastrado.' });
        }

        await bagulhoDoBanco.query(
            'INSERT INTO dadoslogin (nome, email, senha) VALUES (?, ?, ?)',
            [nome, email, senha]
        );

        res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });

    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

app.get('/api/reinicios', async (req, res) => {
    try {
        const { mes, ano } = req.query;

        let query = `
            SELECT id, data_registro AS data, Maquina, obs
            FROM historicoatividades
            WHERE status = 'Reinicio'
        `;

        const params = [];

        if (mes && ano) {
            query += ` AND MONTH(data_registro) = ? AND YEAR(data_registro) = ?`;
            params.push(mes, ano);
        }

        query += ` ORDER BY data_registro DESC`;

        const [linhas] = await bagulhoDoBanco.query(query, params);

        res.json(linhas);

    } catch (err) {
        console.error("Erro ao buscar reinícios:", err);
        res.status(500).json({ erro: 'Erro interno ao buscar reinicializações.' });
    }
});

app.get('/api/tarefas', async (req, res) => {
    try {
        const { busca, dataBusca } = req.query;

        let querySql = `
            SELECT
                \`id\` AS id, \`data_registro\` AS data, \`Maquina\` AS maquina,
                \`Tipo Tecido\` AS tipo_tecido, \`Tipo de Saida\` AS tipo_saida,
                \`Numero da tarefa\` AS numero_tarefa, \`Tempo de setup\` AS tempo_setup,
                \`Tempo de Produção\` AS tempo_producao, \`Quantidade de Tiras\` AS qtd_tiras,
                \`Metros Produzidos\` AS metros, \`tarefa_completa\` AS tarefa_completa,
                \`sobra_rolo\` AS tem_sobra, \`obs\` AS observacao, \`status\` AS status
            FROM \`tarefas_producao\`
        `;

        const condicoes = [];
        const params = [];

        if (dataBusca) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dataBusca)) {
                condicoes.push('DATE(`data_registro`) = ?');
                params.push(dataBusca);
            } else {
                console.warn("Formato de data inválido recebido:", dataBusca);
            }
        }

        if (busca) {
            const idNum = parseInt(busca, 10);
            if (!Number.isNaN(idNum) && String(idNum) === busca) {
                condicoes.push('(`id` = ? OR `Numero da tarefa` = ?)');
                params.push(idNum); 
                params.push(busca); 
            } else {
                condicoes.push('`Numero da tarefa` = ?');
                params.push(busca);
            }
        }

        if (condicoes.length) querySql += ' WHERE ' + condicoes.join(' AND ');
        querySql += ' ORDER BY `data_registro` DESC';

        const [linhas] = await bagulhoDoBanco.query(querySql, params);

        const mapTipoTecido = { 0: 'meia malha', 1: 'cotton', 2: 'punho pun', 3: 'punho new', 4: 'punho san', 5: 'punho elan' };
        const mapTipoSaida = { 0: 'rolinho', 1: 'fraldado' };

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
        console.error('--- ERRO AO BUSCAR TAREFAS ---');
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno no servidor ao buscar tarefas.' });
    }
});

app.post('/api/tarefas', async (req, res) => {
    try {
        const { maquina, tipo_tecido, tipo_saida, numero_tarefa, tempo_setup, tempo_producao, qtd_tiras, metros, tarefa_completa, tem_sobra, obs, status } = req.body;
        if (!numero_tarefa || !maquina || !status) {
            return res.status(400).json({ erro: 'N° Tarefa, Máquina e Status são obrigatórios.' });
        }
        const [resultado] = await bagulhoDoBanco.query(
            `INSERT INTO tarefas_producao (data_registro, Maquina, \`Tipo Tecido\`, \`Tipo de Saida\`, \`Numero da tarefa\`, \`Tempo de setup\`, \`Tempo de Produção\`, \`Quantidade de Tiras\`, \`Metros Produzidos\`, tarefa_completa, sobra_rolo, obs, status) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ maquina, tipo_tecido, tipo_saida, numero_tarefa, tempo_setup || 0, tempo_producao || 0, qtd_tiras || 0, metros || 0, tarefa_completa || 'FALSE', tem_sobra || 'FALSE', obs || '', status ]
        );
        res.status(201).json({ id: resultado.insertId, mensagem: 'Tarefa criada com sucesso!' });
    } catch (erro) {
        console.error('--- ERRO AO CRIAR TAREFA ---');
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno no servidor ao criar tarefa.' });
    }
});

app.put('/api/tarefas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            maquina, tipo_tecido, tipo_saida, numero_tarefa,
            tempo_setup, tempo_producao, qtd_tiras, metros,
            tarefa_completa, tem_sobra, obs, status
        } = req.body;

        if (!numero_tarefa || !maquina || !status) {
            return res.status(400).json({ erro: 'N° Tarefa, Máquina e Status são obrigatórios.' });
        }

        const [resultado] = await bagulhoDoBanco.query(
            `UPDATE tarefas_producao SET
                Maquina = ?, \`Tipo Tecido\` = ?, \`Tipo de Saida\` = ?, \`Numero da tarefa\` = ?,
                \`Tempo de setup\` = ?, \`Tempo de Produção\` = ?, \`Quantidade de Tiras\` = ?,
                \`Metros Produzidos\` = ?, tarefa_completa = ?, sobra_rolo = ?, obs = ?, status = ?
            WHERE id = ?`,
            [
                maquina, tipo_tecido, tipo_saida, numero_tarefa,
                tempo_setup, tempo_producao, qtd_tiras, metros,
                tarefa_completa, tem_sobra, obs, status,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Tarefa não encontrada.' });
        }

        res.json({ mensagem: 'Tarefa atualizada com sucesso!' });

    } catch (erro) {
        console.error('--- ERRO AO ATUALIZAR TAREFA ---');
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno no servidor ao atualizar tarefa.' });
    }
});

app.delete('/api/tarefas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await bagulhoDoBanco.query(
            'DELETE FROM tarefas_producao WHERE id = ?',
            [id]
        );
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Tarefa não encontrada.' });
        }
        res.json({ mensagem: 'Tarefa excluída com sucesso!' });
    } catch (erro) {
        console.error('--- ERRO AO EXCLUIR TAREFA ---');
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno no servidor ao excluir tarefa.' });
    }
});


let numeroTarefaAtual = 1000;
let quantidadeNoLote = 0;
let maxPorLote = 5;

async function mudarStatus(id, novoStatus) {
    try {
        await bagulhoDoBanco.query(
            'UPDATE tarefas_producao SET status = ? WHERE id = ?',
            [novoStatus, id]
        );
        console.log(`Tarefa ${id} agora está "${novoStatus}"`);
    } catch (err) {
        console.error(`Erro ao mudar status da tarefa ${id}:`, err);
    }
}

async function criarTarefaAleatoria() {
    try {
        const maquinas = ['Máquina A', 'Máquina B', 'Máquina C'];
        const tiposTecido = [0, 1, 2, 3, 4, 5];
        const tiposSaida = [0, 1];
        const tarefaCompletaOpcoes = ['TRUE', 'FALSE'];
        const sobraOpcoes = ['TRUE', 'FALSE'];

        if (quantidadeNoLote >= maxPorLote) {
            numeroTarefaAtual += 1;
            quantidadeNoLote = 0;
            maxPorLote = Math.floor(Math.random() * 5) + 3;
            console.log(`Novo lote iniciado: ${numeroTarefaAtual} (${maxPorLote} tarefas esperadas)`);
        }

        const maquina = maquinas[Math.floor(Math.random() * maquinas.length)];
        const tipoTecido = tiposTecido[Math.floor(Math.random() * tiposTecido.length)];
        const tipoSaida = tiposSaida[Math.floor(Math.random() * tiposSaida.length)];
        const tempoSetup = Math.floor(Math.random() * 600) + 60;
        const tempoProducao = Math.floor(Math.random() * 3600) + 300;
        const qtdTiras = Math.floor(Math.random() * 200) + 10;
        const metros = Math.floor(Math.random() * 1000) + 50;
        const tarefaCompleta = tarefaCompletaOpcoes[Math.floor(Math.random() * tarefaCompletaOpcoes.length)];
        const temSobra = sobraOpcoes[Math.floor(Math.random() * sobraOpcoes.length)];
        const observacao = `Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`;

        const [resultado] = await bagulhoDoBanco.query(
            `INSERT INTO tarefas_producao
            (data_registro, Maquina, \`Tipo Tecido\`, \`Tipo de Saida\`, \`Numero da tarefa\`, 
             \`Tempo de setup\`, \`Tempo de Produção\`, \`Quantidade de Tiras\`, \`Metros Produzidos\`, 
             tarefa_completa, sobra_rolo, obs, status)
            VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente')`,
            [maquina, tipoTecido, tipoSaida, numeroTarefaAtual, tempoSetup, tempoProducao, qtdTiras, metros, tarefaCompleta, temSobra, observacao]
        );

        const idInserido = resultado.insertId;
        quantidadeNoLote += 1;
        console.log(`Inserida tarefa #${numeroTarefaAtual} (id ${idInserido}) — ${quantidadeNoLote}/${maxPorLote}`);

        setTimeout(async () => {
            await mudarStatus(idInserido, 'Em andamento');

            const tempoFinalizacao = Math.floor(Math.random() * 5000) + 10000;
            setTimeout(async () => {
                const novoStatus = Math.random() < 0.8 ? 'Concluída' : 'Incompleta';
                await mudarStatus(idInserido, novoStatus);
            }, tempoFinalizacao);
        }, 5000);

    } catch (err) {
        console.error('Erro ao criar tarefa aleatória:', err);
    }
}

async function criarReinicioMaquina() {
    try {
        const maquinas = ['Máquina A', 'Máquina B', 'Máquina C'];
        const maquina = maquinas[Math.floor(Math.random() * maquinas.length)];

        await bagulhoDoBanco.query(
            `INSERT INTO tarefas_producao
            (data_registro, Maquina, \`Tipo Tecido\`, \`Tipo de Saida\`,
             \`Numero da tarefa\`, \`Tempo de setup\`, \`Tempo de Produção\`,
             \`Quantidade de Tiras\`, \`Metros Produzidos\`,
             tarefa_completa, sobra_rolo, obs, status)
            VALUES (NOW(), ?, 0, 0, 0, 0, 0, 0, 0, 'FALSE', 'FALSE', 'Máquina reiniciada', 'Reinicio')`,
            [maquina]
        );

        console.log("Reinício registrado para:", maquina);

    } catch (err) {
        console.error("Erro ao registrar reinício:", err);
    }
}

function intervaloReinicio() {
    return (1000 * 60 * (1 + Math.random() * 1));
}

function loopReinicio() {
    criarReinicioMaquina();
    setTimeout(loopReinicio, intervaloReinicio());
}

setTimeout(loopReinicio, intervaloReinicio());


setInterval(criarTarefaAleatoria, 4000);

app.listen(portinha, () => {
    console.log(`servidor rodando na porta ${portinha}, tudo nos conformes`);
});