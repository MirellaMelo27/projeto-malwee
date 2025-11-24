document.addEventListener('DOMContentLoaded', () => {
    const themeSwitch = document.getElementById('theme-switch');
    const themeLabel = document.getElementById('theme-switch-label');
    const fontSlider = document.getElementById('font-slider');
    const fontValueLabel = document.getElementById('font-slider-value');


    function SincronizarSwitchTema(theme) {
        if (theme === 'dark') {
            themeSwitch.checked = true;
            themeLabel.innerHTML = '<i class="bi bi-moon-fill me-2"></i>Modo Escuro';
        } else {
            themeSwitch.checked = false;
            themeLabel.innerHTML = '<i class="bi bi-sun-fill me-2"></i>Modo Claro';
        }
    }

    const temaInicial = localStorage.getItem('theme') || 'dark';
    SincronizarSwitchTema(temaInicial);

    themeSwitch.addEventListener('change', () => {
        const novoTema = themeSwitch.checked ? 'dark' : 'light';
        localStorage.setItem('theme', novoTema);
        document.documentElement.setAttribute('data-bs-theme', novoTema);
        SincronizarSwitchTema(novoTema);

        document.documentElement.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: novoTema } 
        }));
    });


    function ObterValorSliderDoCSS() {
        const cssTamanho = localStorage.getItem('fontSize');
        if (cssTamanho === '0.8rem') return 80;
        if (cssTamanho === '1.2rem') return 120;
        return 100;
    }

    function ObterValorCSSDoSlider(valorSlider) {
        const valorNum = parseInt(valorSlider, 10);
        if (valorNum === 80) return '0.8rem';
        if (valorNum === 120) return '1.2rem';
        return '1rem';
    }

    const valorFonteInicial = ObterValorSliderDoCSS();
    fontSlider.value = valorFonteInicial;
    fontValueLabel.textContent = `${valorFonteInicial}%`;

    fontSlider.addEventListener('input', () => {
        const novoValor = fontSlider.value;
        const novoCSS = ObterValorCSSDoSlider(novoValor);

        fontValueLabel.textContent = `${novoValor}%`;

        document.documentElement.style.fontSize = novoCSS;
        localStorage.setItem('fontSize', novoCSS);
    });
});