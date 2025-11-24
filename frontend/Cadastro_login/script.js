function mostrarCadastro() {
  document.getElementById('loginCard').classList.add('d-none');
  document.getElementById('cadastroCard').classList.remove('d-none');
}

function mostrarLogin() {
  document.getElementById('cadastroCard').classList.add('d-none');
  document.getElementById('loginCard').classList.remove('d-none');
}


function validarDominio(email) {
  const dominioPermitido = 'malwee.com.br';
  if (!email || typeof email !== 'string' || !email.toLowerCase().endsWith('@' + dominioPermitido)) {
      alert('Acesso restrito. Por favor, use um e-mail corporativo @' + dominioPermitido);
      return false;
  }
  return true;
}

document.querySelector('#cadastroCard button').addEventListener('click', async () => {
  const nome = document.getElementById('cadNome').value.trim();
  const email = document.getElementById('cadEmail').value.trim();
  const senha = document.getElementById('cadSenha').value.trim();

  if (!nome || !email || !senha) {
      alert('Preencha todos os campos!');
      return;
  }

  if (!validarDominio(email)) {
      return;
  }

  try {
      const resposta = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
          alert(dados.mensagem);
          mostrarLogin();
      } else {
          alert(dados.erro || 'Erro desconhecido no cadastro.');
      }
  } catch (error) {
      console.error('Erro no fetch do cadastro:', error);
      alert('Não foi possível conectar ao servidor para cadastro.');
  }
});

document.querySelector('#loginCard button').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();

  if (!email || !senha) {
      alert('Preencha email e senha!');
      return;
  }

  if (!validarDominio(email)) {
      return;
  }

  try {
      const resposta = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok && dados.sucesso) {

          if (dados.usuario && dados.usuario.nome) {
              localStorage.setItem('usuarioNome', dados.usuario.nome);
          } else {
              console.warn('Backend não retornou o nome do usuário. Usando fallback do email.');
              const nomeDoEmail = email.split('@')[0]
                .replace(/[._-]+/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
              localStorage.setItem('usuarioNome', nomeDoEmail);
          }
          localStorage.setItem('usuarioEmail', email);

          window.location.href = '/frontend/visaogeral/index.html';
      } else {
          alert(dados.erro || 'Erro desconhecido no login.');
      }
  } catch (error) {
      console.error('Erro no fetch do login:', error);
      alert('Não foi possível conectar ao servidor para login.');
  }
});

// a gente implementou algumas lógicas aqui. por mais que não haja segurança real (nao da pra usar isso sem rever, mas ok) voce so pode registrar
// se usar algum email com o dominio da malwee. tbm tem a estrutura pra salvar teu nome na hora de mostrar o dashboard, e exibir "Olá, Pessoa"