// essa lógica global serve pra alterar os elementos da interface conforme o tema selecionado

const CAMINHO_LOGO_BRANCA = '/frontend/imagem/malwee_white.png';
const CAMINHO_LOGO_PRETA = '/frontend/imagem/malwee_black.png';
const CAMINHO_LOGO_ICONE = '/frontend/imagem/logo.png'; 

/**
 * @param {string} nomeTema
 */
function atualizarLogoConformeTema(nomeTema) {
    const imagemLogoGrande = document.getElementById('logo-img');
    const imagemLogoPequena = document.getElementById('logo-small');

    if (nomeTema === 'light') {
        // --- TEMA CLARO ---
        if (imagemLogoGrande) {
            imagemLogoGrande.src = CAMINHO_LOGO_BRANCA;
        }
        if (imagemLogoPequena) {
            imagemLogoPequena.src = CAMINHO_LOGO_ICONE;
        }
    } else {
        if (imagemLogoGrande) {
            imagemLogoGrande.src = CAMINHO_LOGO_PRETA;
        }
        if (imagemLogoPequena) {
            imagemLogoPequena.src = CAMINHO_LOGO_ICONE; 
        }
    }
}


(function() {
    const temaInicial = document.documentElement.getAttribute('data-bs-theme') || 'dark';
    atualizarLogoConformeTema(temaInicial); 
})(); 


/* abaixo estao os event listeners globais
    (coisas que rodam em todas as paginas) */

document.addEventListener('DOMContentLoaded', () => {
    
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