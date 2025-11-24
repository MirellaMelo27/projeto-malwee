document.addEventListener('DOMContentLoaded', () => {
    const themeSwitch = document.getElementById('theme-switch');
    const themeLabel = document.getElementById('theme-switch-label');
    const fontSlider = document.getElementById('font-slider');
    const fontValueLabel = document.getElementById('font-slider-value');

    // --- LÓGICA DO TEMA ---

    /** Atualiza o texto e o estado do switch de tema */
    function SincronizarSwitchTema(theme) {
        if (theme === 'dark') {
            themeSwitch.checked = true;
            themeLabel.innerHTML = '<i class="bi bi-moon-fill me-2"></i>Modo Escuro';
        } else {
            themeSwitch.checked = false;
            themeLabel.innerHTML = '<i class="bi bi-sun-fill me-2"></i>Modo Claro';
        }
    }

    // Define o estado inicial do switch ao carregar
    const temaInicial = localStorage.getItem('theme') || 'dark';
    SincronizarSwitchTema(temaInicial);

    // Adiciona o evento de clique ao switch
    themeSwitch.addEventListener('change', () => {
        const novoTema = themeSwitch.checked ? 'dark' : 'light';
        localStorage.setItem('theme', novoTema);
        document.documentElement.setAttribute('data-bs-theme', novoTema);
        SincronizarSwitchTema(novoTema);

        // Dispara o evento personalizado (para os gráficos ouvirem)
        document.documentElement.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: novoTema } 
        }));
    });


    // --- LÓGICA DA FONTE ---

    /** Converte o valor de "fontSize" (ex: '1rem') para o valor do slider (ex: 100) */
    function ObterValorSliderDoCSS() {
        const cssTamanho = localStorage.getItem('fontSize'); // ex: '1rem', '0.8rem', '1.2rem'
        if (cssTamanho === '0.8rem') return 80;
        if (cssTamanho === '1.2rem') return 120;
        return 100; // Padrão '1rem' ou nulo
    }

    /** Converte o valor do slider (ex: 100) para o valor CSS (ex: '1rem') */
    function ObterValorCSSDoSlider(valorSlider) {
        const valorNum = parseInt(valorSlider, 10);
        if (valorNum === 80) return '0.8rem';
        if (valorNum === 120) return '1.2rem';
        return '1rem'; // Padrão 100%
    }

    // Define o estado inicial do slider
    const valorFonteInicial = ObterValorSliderDoCSS();
    fontSlider.value = valorFonteInicial;
    fontValueLabel.textContent = `${valorFonteInicial}%`;

    // Adiciona o evento de 'input' (arrastar)
    fontSlider.addEventListener('input', () => {
        const novoValor = fontSlider.value; // ex: "100"
        const novoCSS = ObterValorCSSDoSlider(novoValor); // ex: "1rem"

        // Atualiza a label
        fontValueLabel.textContent = `${novoValor}%`;

        // Aplica e salva
        document.documentElement.style.fontSize = novoCSS;
        localStorage.setItem('fontSize', novoCSS);
    });
});