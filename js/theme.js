document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURATION ---
    const CLIENT_ID = '1292148049358884905'; 
    const GUILD_ID = '1129433598253084826'; // Deine Discord Server ID (Rechtsklick auf Server -> ID kopieren)
    const REDIRECT_URI = window.location.origin + window.location.pathname;

    const loginBtnWelcome = document.getElementById('login-btn-welcome');
    const logoutBtn = document.getElementById('logout-btn');

    // 1. LOGIN STARTEN
    function redirectToDiscord() {
        const scope = encodeURIComponent('identify guilds');
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${scope}`;
        window.location.href = url;
    }

    // 2. AUTH & SERVER-CHECK
    async function handleAuth() {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        let accessToken = fragment.get('access_token') || localStorage.getItem('agd_token');

        if (accessToken) {
            try {
                // User Daten abrufen
                const userRes = await fetch('https://discord.com/api/users/@me', { 
                    headers: { authorization: `Bearer ${accessToken}` } 
                });
                if (!userRes.ok) throw new Error();
                const userData = await userRes.json();

                // Guilds (Server) Daten abrufen
                const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { 
                    headers: { authorization: `Bearer ${accessToken}` } 
                });
                const guilds = await guildsRes.json();

                // Prüfen, ob User auf dem Server ist
                const isMember = guilds.some(g => g.id === GUILD_ID);

                if (isMember) {
                    localStorage.setItem('agd_token', accessToken);
                    
                    // Interface anzeigen
                    document.getElementById('welcome-screen').style.display = 'none';
                    document.getElementById('main-interface').style.display = 'block';
                    
                    // User Profil im Header befüllen
                    document.getElementById('user-profile').style.display = 'flex';
                    document.getElementById('user-name').innerText = userData.username.toUpperCase();
                    document.getElementById('user-avatar').src = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
                    
                    // ID im Dashboard setzen
                    const displayId = document.getElementById('display-id');
                    if(displayId) displayId.innerText = userData.username.toUpperCase();
                    
                    // Wetter-Update starten
                    updateWeather();
                } else {
                    alert("ZUGRIFF VERWEIGERT: Du musst Mitglied des AGD-Servers sein.");
                    localStorage.removeItem('agd_token');
                    window.location.hash = ""; // URL säubern
                }
            } catch (e) {
                console.error("Auth-Fehler:", e);
                localStorage.removeItem('agd_token');
            }
            // URL säubern
            window.history.replaceState({}, document.title, REDIRECT_URI);
        }
    }

    // 3. WETTER FUNKTION (Vollständig)
    async function updateWeather() {
        let lat = 48.8, lon = 11.5; // Standard-Koordinaten
        try {
            // Standort über IP ermitteln
            const res = await fetch('https://ipapi.co/json/');
            const geo = await res.json();
            if(geo.latitude) { lat = geo.latitude; lon = geo.longitude; }
            
            // Wetter-Daten abrufen
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
            const w = await wRes.json();
            
            // HTML Elemente befüllen
            const tempElem = document.getElementById('w-temp');
            const windElem = document.getElementById('w-wind');
            const humElem = document.getElementById('w-hum');
            
            if(tempElem) tempElem.innerText = Math.round(w.current_weather.temperature);
            if(windElem) windElem.innerText = Math.round(w.current_weather.windspeed);
            if(humElem) humElem.innerText = w.hourly ? w.hourly.relative_humidity_2m[0] : "45";
            
            // Radar Karte aktualisieren
            const radar = document.getElementById('radar-iframe');
            if(radar) {
                radar.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&level=surface&overlay=rain&product=ecmwf&message=false`;
            }
        } catch (error) {
            console.error("Wetter konnte nicht geladen werden", error);
        }
    }

    // 4. LOGOUT
    if(logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('agd_token');
            window.location.reload();
        };
    }

    // 5. NAVIGATION & UI LOGIK
    const menuBtn = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const themeBtn = document.getElementById('theme-toggle');
    const homeBtn = document.getElementById('home-quick-btn');

    if(loginBtnWelcome) loginBtnWelcome.onclick = redirectToDiscord;
    if(themeBtn) themeBtn.onclick = () => document.body.classList.toggle('light-theme');
    
    if(homeBtn) {
        homeBtn.onclick = () => switchPage('home');
    }

    function switchPage(id) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(id);
        if(target) target.classList.add('active');
        if(navMenu) navMenu.classList.remove('active');
        window.scrollTo(0, 0);
    }

    document.querySelectorAll('.nav-link-item, .footer-link').forEach(link => {
        // Logout ignorieren für normales Seiten-Umschalten
        if(link.id === 'logout-btn') return;
        
        link.onclick = (e) => {
            const href = link.getAttribute('href');
            if(href && href.startsWith('#')) {
                e.preventDefault();
                switchPage(href.substring(1));
            }
        };
    });

    if(menuBtn) {
        menuBtn.onclick = (e) => { 
            e.stopPropagation(); 
            navMenu.classList.toggle('active'); 
        };
    }

    window.onclick = () => {
        if(navMenu) navMenu.classList.remove('active');
    };

    // Initialisierung
    handleAuth();
});