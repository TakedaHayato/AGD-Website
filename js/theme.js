document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('lang-toggle');
    const themeBtn = document.getElementById('theme-toggle');
    const pcBtn = document.getElementById('pc-toggle-btn');
    const menuBtn = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const enterBtn = document.getElementById('enter-btn');

    let isEnglish = false;
    let isPCMode = false;

    const translations = {
        de: {
            'card-weather': 'WETTER: BAYERN', 'pc-toggle-btn': '🖥️ PC MODUS',
            'link-dash': '● DASHBOARD', 'link-upd': '● UPDATES', 'link-cont': '● KONTAKT',
            'btn-add-text': 'HAYATO ADDEN', 'btn-server-text': 'SERVER JOINEN',
            'logs': ['UI: PC/Mobile Switcher implementiert.', 'GEO: Bayern Standard-Uplink.', 'FIX: Button-Farben korrigiert.']
        },
        en: {
            'card-weather': 'WEATHER: BAVARIA', 'pc-toggle-btn': '🖥️ PC MODE',
            'link-dash': '● DASHBOARD', 'link-upd': '● UPDATES', 'link-cont': '● CONTACT',
            'btn-add-text': 'ADD HAYATO', 'btn-server-text': 'JOIN SERVER',
            'logs': ['UI: PC/Mobile switcher implemented.', 'GEO: Bavaria default uplink.', 'FIX: Button colors corrected.']
        }
    };

    function updateUI() {
        const set = isEnglish ? translations.en : translations.de;
        for (let id in set) {
            const el = document.getElementById(id);
            if (el && id !== 'logs') el.innerText = set[id];
        }
        document.getElementById('log-content').innerHTML = set.logs.map(l => `<li>● ${l}</li>`).join('');
        langBtn.innerText = isEnglish ? 'DE' : 'EN';
    }

    // PC/Mobile Switcher Logik
    pcBtn.onclick = () => {
        isPCMode = !isPCMode;
        if (isPCMode) {
            document.body.classList.remove('mobile-mode');
            pcBtn.innerText = isEnglish ? "📱 MOBILE MODE" : "📱 MOBILE MODUS";
        } else {
            document.body.classList.add('mobile-mode');
            pcBtn.innerText = isEnglish ? "🖥️ PC MODE" : "🖥️ PC MODUS";
        }
    };

    async function updateWeather() {
        let lat = 48.8, lon = 11.5, city = "BAVARIA";
        try {
            const res = await fetch('https://ipapi.co/json/');
            const geo = await res.json();
            if(geo.latitude) { lat = geo.latitude; lon = geo.longitude; city = geo.city || "LOCAL"; }
        } catch (e) {}

        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const w = await wRes.json();
        document.getElementById('w-temp').innerText = Math.round(w.current_weather.temperature);
        document.getElementById('w-wind').innerText = w.current_weather.windspeed;
        document.getElementById('card-weather').innerText = (isEnglish ? "WEATHER: " : "WETTER: ") + city.toUpperCase();
        
        document.getElementById('radar-iframe').src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&level=surface&overlay=rain&product=ecmwf&message=false`;
    }

    enterBtn.onclick = () => {
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('main-interface').style.display = 'block';
        updateUI(); updateWeather();
        setInterval(() => { document.getElementById('live-clock').innerText = new Date().toLocaleTimeString(); }, 1000);
    };

    langBtn.onclick = () => { isEnglish = !isEnglish; updateUI(); updateWeather(); };
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