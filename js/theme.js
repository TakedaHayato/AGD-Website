document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('lang-toggle');
    const themeBtn = document.getElementById('theme-toggle');
    const pcBtn = document.getElementById('pc-toggle-btn');
    const menuBtn = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const enterBtn = document.getElementById('enter-btn');

    let isEnglish = false;
    let isPCMode = false;

    function updateUI() {
        const logs = isEnglish ? ["UI: Header alignment fixed.", "MODE: PC/Mobile switch ready."] : ["UI: Header-Ausrichtung fixiert.", "MODE: PC/Handy-Switch bereit."];
        document.getElementById('log-content').innerHTML = logs.map(l => `<li style="margin:5px 0;">● ${l}</li>`).join('');
        langBtn.innerText = isEnglish ? 'DE' : 'EN';
        pcBtn.innerText = isPCMode ? (isEnglish ? '📱 MOBILE' : '📱 HANDY') : (isEnglish ? '🖥️ PC MODE' : '🖥️ PC MODUS');
    }

    pcBtn.onclick = () => {
        isPCMode = !isPCMode;
        document.body.classList.toggle('mobile-mode', !isPCMode);
        updateUI();
        updateWeather(); // Radar anpassen
    };

    async function updateWeather() {
        let lat = 48.8, lon = 11.5;
        try {
            const res = await fetch('https://ipapi.co/json/');
            const geo = await res.json();
            if(geo.latitude) { lat = geo.latitude; lon = geo.longitude; }
        } catch (e) {}
        
        document.getElementById('radar-iframe').src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&level=surface&overlay=rain&product=ecmwf&message=false`;
    }

    enterBtn.onclick = () => {
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('main-interface').style.display = 'block';
        updateUI(); updateWeather();
    };

    themeBtn.onclick = () => document.body.classList.toggle('light-theme');
    menuBtn.onclick = (e) => { e.stopPropagation(); navMenu.classList.toggle('active'); };
    
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.onclick = () => {
            const id = link.getAttribute('href').substring(1);
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            navMenu.classList.remove('active');
        };
    });
    window.onclick = () => navMenu.classList.remove('active');
});