// essa lógica global serve pra alterar os elementos da interface conforme o tema selecionado


const CAMINHO_LOGO_BRANCA = '/frontend/imagem/malwee_white.png';
const CAMINHO_LOGO_PRETA = '/frontend/imagem/malwee_black.png';

/**
 * @param {string} nomeTema - 'light' ou 'dark'
 */
function atualizarLogoConformeTema(nomeTema) {
    const imagemLogo = document.getElementById('logo-img');
    if (!imagemLogo) {
        return; 
    }

    if (nomeTema === 'light') {
        imagemLogo.src = CAMINHO_LOGO_BRANCA;
    } else {
        imagemLogo.src = CAMINHO_LOGO_PRETA;
    }
}


/* abaixo estao os event listeners globais
   (coisas que rodam em todas as paginas) */

document.addEventListener('DOMContentLoaded', () => {
    
    
    const temaInicial = document.documentElement.getAttribute('data-bs-theme') || 'dark';
    
    // Aplica o logo correto IMEDIATAMENTE ao carregar a página
    atualizarLogoConformeTema(temaInicial);

    // ouve o evento 'themeChanged' disparado pela página de configuracoes.
    // isso garante que, se o usuário mudar o tema, o logo na sidebar
    // mude em tempo real, mesmo que não esteja na pagina de configuracoes.
    document.documentElement.addEventListener('themeChanged', (event) => {
        if (event.detail && event.detail.theme) {
            atualizarLogoConformeTema(event.detail.theme);
        }
    });

    const btnLogout = document.getElementById('btn-logout');
    
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            
            localStorage.removeItem('usuarioNome');
            
            window.location.href = '/frontend/Cadastro_login/login.html'; 
        });
    }
});