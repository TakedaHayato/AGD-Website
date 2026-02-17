document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURATION ---
    const CLIENT_ID = '1292148049358884905'; 
    const REDIRECT_URI = window.location.origin + window.location.pathname;

    const loginBtnWelcome = document.getElementById('login-btn-welcome');
    const logoutBtn = document.getElementById('logout-btn');

    // 1. DISCORD LOGIN STARTEN
    function redirectToDiscord() {
        const scope = encodeURIComponent('identify'); 
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${scope}`;
        window.location.href = url;
    }

    // 2. AUTH PRÜFUNG (LOGIN MERKEN)
    async function handleAuth() {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        let accessToken = fragment.get('access_token') || localStorage.getItem('agd_token');

        if (accessToken) {
            try {
                const userRes = await fetch('https://discord.com/api/users/@me', { 
                    headers: { authorization: `Bearer ${accessToken}` } 
                });
                if (!userRes.ok) throw new Error();
                const userData = await userRes.json();

                // ERFOLG: Token speichern
                localStorage.setItem('agd_token', accessToken);
                
                // Interface anzeigen
                document.getElementById('welcome-screen').style.display = 'none';
                document.getElementById('main-interface').style.display = 'block';
                
                // User Profil im Header
                const profile = document.getElementById('user-profile');
                if(profile) profile.style.display = 'flex';
                
                const uName = document.getElementById('user-name');
                const uAvatar = document.getElementById('user-avatar');
                if(uName) uName.innerText = userData.username.toUpperCase();
                if(uAvatar) uAvatar.src = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
                
                // ID im Dashboard setzen
                const displayId = document.getElementById('display-id');
                if(displayId) displayId.innerText = userData.username.toUpperCase();
                
                updateWeather(); // Wetter laden
            } catch (e) {
                console.error("Auth expired");
                localStorage.removeItem('agd_token');
            }
            // URL säubern
            window.history.replaceState({}, document.title, REDIRECT_URI);
        }
    }

    // 3. WETTER FUNKTION
    async function updateWeather() {
        let lat = 52.52, lon = 13.40; 
        try {
            const geoRes = await fetch('https://ipapi.co/json/').catch(() => null);
            if (geoRes) {
                const geo = await geoRes.json();
                if (geo.latitude) { lat = geo.latitude; lon = geo.longitude; }
            }
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
            const w = await wRes.json();
            
            if(document.getElementById('w-temp')) document.getElementById('w-temp').innerText = Math.round(w.current_weather.temperature);
            if(document.getElementById('w-wind')) document.getElementById('w-wind').innerText = Math.round(w.current_weather.windspeed);
            if(document.getElementById('w-hum')) document.getElementById('w-hum').innerText = w.hourly ? w.hourly.relative_humidity_2m[0] : "45";
            
            const radar = document.getElementById('radar-iframe');
            if(radar) {
                radar.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&level=surface&overlay=rain&product=ecmwf&message=false`;
            }
        } catch (error) { console.error("Weather failed", error); }
    }

    // 4. NAVIGATION & UI
    if(loginBtnWelcome) loginBtnWelcome.onclick = redirectToDiscord;
    
    if(logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('agd_token');
            window.location.reload();
        };
    }

    const navMenu = document.getElementById('nav-menu');
    const menuBtn = document.getElementById('menu-toggle');
    
    function switchPage(id) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(id);
        if(target) target.classList.add('active');
        if(navMenu) navMenu.classList.remove('active');
        window.scrollTo(0,0);
    }

    document.querySelectorAll('.nav-link-item, .footer-link').forEach(link => {
        if(link.id === 'logout-btn') return;
        link.onclick = (e) => {
            const href = link.getAttribute('href');
            if(href && href.startsWith('#')) {
                e.preventDefault();
                switchPage(href.substring(1));
            }
        };
    });

    if(menuBtn) menuBtn.onclick = (e) => { e.stopPropagation(); navMenu.classList.toggle('active'); };
    
    const themeToggle = document.getElementById('theme-toggle');
    if(themeToggle) themeToggle.onclick = () => document.body.classList.toggle('light-theme');
    
    const homeQuick = document.getElementById('home-quick-btn');
    if(homeQuick) homeQuick.onclick = () => switchPage('home');

    // Start
    handleAuth();
});