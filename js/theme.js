document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURATION ---
    const CLIENT_ID = '1292148049358884905'; 
    const GUILD_ID = '1129433598253084826'; // Deine Server-ID (übernommen aus deinem Discord-Link)
    const REDIRECT_URI = window.location.origin + window.location.pathname;

    const loginBtnWelcome = document.getElementById('login-btn-welcome');
    const statusText = document.querySelector('.welcome-status');

    // 1. LOGIN STARTEN
    function redirectToDiscord() {
        // Scopes: identify (für Name/Avatar) + guilds (für Server-Check)
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
                statusText.innerText = "VERIFYING SECTOR ACCESS...";
                
                // User Daten
                const userRes = await fetch('https://discord.com/api/users/@me', { 
                    headers: { authorization: `Bearer ${accessToken}` } 
                });
                if (!userRes.ok) throw new Error();
                const userData = await userRes.json();

                // Guilds (Server) Daten
                const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { 
                    headers: { authorization: `Bearer ${accessToken}` } 
                });
                const guilds = await guildsRes.json();

                // Check: Ist der User auf dem Server?
                const isMember = guilds.some(g => g.id === GUILD_ID);

                if (isMember) {
                    localStorage.setItem('agd_token', accessToken);
                    initializeSystem(userData);
                } else {
                    // FALLS NICHT AUF SERVER: Beitritts-Aufforderung anzeigen
                    statusText.innerHTML = `<span style="color:#ff4444;">ACCESS DENIED: NOT A MEMBER</span>`;
                    loginBtnWelcome.innerText = "JOIN AGD SERVER FIRST";
                    loginBtnWelcome.onclick = () => {
                        window.open('https://discord.gg/agd', '_blank'); // Ersetze dies durch deinen Invite-Link!
                        setTimeout(() => window.location.reload(), 2000);
                    };
                    localStorage.removeItem('agd_token');
                }
            } catch (e) {
                console.error("Auth Error", e);
                localStorage.removeItem('agd_token');
                statusText.innerText = "SESSION EXPIRED. PLEASE RE-LOGIN.";
            }
            window.history.replaceState({}, document.title, REDIRECT_URI);
        }
    }

    function initializeSystem(userData) {
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('main-interface').style.display = 'block';
        
        document.getElementById('user-profile').style.display = 'flex';
        document.getElementById('user-name').innerText = userData.username.toUpperCase();
        document.getElementById('user-avatar').src = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
        
        if(document.getElementById('display-id')) {
            document.getElementById('display-id').innerText = userData.username.toUpperCase();
        }
        
        updateWeather(); // Wetter erst nach Login laden
    }

    // 3. WETTER FUNKTION (REPARIERT)
    async function updateWeather() {
        // Fallback Koordinaten (Berlin), falls Geo-IP blockiert wird
        let lat = 52.52, lon = 13.40; 

        try {
            // Versuch 1: Geo-IP
            const geoRes = await fetch('https://ipapi.co/json/').catch(() => null);
            if (geoRes) {
                const geo = await geoRes.json();
                if (geo.latitude) { lat = geo.latitude; lon = geo.longitude; }
            }

            // Wetter-Daten abrufen
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
            const w = await wRes.json();
            
            // Anzeige im Dashboard
            document.getElementById('w-temp').innerText = Math.round(w.current_weather.temperature);
            document.getElementById('w-wind').innerText = Math.round(w.current_weather.windspeed);
            document.getElementById('w-hum').innerText = w.hourly ? w.hourly.relative_humidity_2m[0] : "45";
            
            // Radar
            const radar = document.getElementById('radar-iframe');
            if(radar) {
                radar.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&level=surface&overlay=rain&product=ecmwf&message=false`;
            }
        } catch (error) {
            console.error("Weather failed", error);
            document.getElementById('w-temp').innerText = "ERR";
        }
    }

    // 4. LOGOUT & NAVIGATION
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('agd_token');
            window.location.reload();
        };
    }

    const menuBtn = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const homeBtn = document.getElementById('home-quick-btn');

    if(loginBtnWelcome && !localStorage.getItem('agd_token')) {
        loginBtnWelcome.onclick = redirectToDiscord;
    }
    
    if(homeBtn) homeBtn.onclick = () => switchPage('home');
    if(menuBtn) menuBtn.onclick = (e) => { e.stopPropagation(); navMenu.classList.toggle('active'); };

    function switchPage(id) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(id);
        if(target) target.classList.add('active');
        navMenu.classList.remove('active');
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

    handleAuth();
});