document.addEventListener('DOMContentLoaded', () => {
    const CLIENT_ID = '1292148049358884905'; 
    const REDIRECT_URI = window.location.origin + window.location.pathname;

    // --- Layout Management ---
    const modeBtn = document.getElementById('mode-toggle');
    let currentMode = localStorage.getItem('view_mode') || 'auto';

    function applyLayout(mode) {
        document.body.classList.remove('pc-mode', 'mobile-forced');
        if(mode === 'pc') document.body.classList.add('pc-mode');
        else if(mode === 'mobile') document.body.classList.add('mobile-forced');
        modeBtn.innerText = mode === 'auto' ? "⚙️ AUTO" : mode === 'pc' ? "🖥️ PC MODE" : "📱 MOBILE";
    }
    applyLayout(currentMode);

    modeBtn.onclick = () => {
        currentMode = currentMode === 'auto' ? 'pc' : currentMode === 'pc' ? 'mobile' : 'auto';
        localStorage.setItem('view_mode', currentMode);
        applyLayout(currentMode);
    };

    // --- Wetter & Radar ---
    async function updateSystems() {
        let lat = 52.52, lon = 13.40; // Default: Berlin
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                lat = pos.coords.latitude; lon = pos.coords.longitude;
                fetchWeatherData(lat, lon);
            }, () => fetchWeatherData(lat, lon));
        } else { fetchWeatherData(lat, lon); }
    }

    async function fetchWeatherData(lat, lon) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
            const data = await res.json();
            document.getElementById('w-temp').innerText = Math.round(data.current_weather.temperature);
            document.getElementById('w-hum').innerText = data.hourly.relative_humidity_2m[0];
            document.getElementById('radar-iframe').src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&overlay=rain&message=false`;
        } catch(e) { console.error("Uplink Error"); }
    }

    // --- Auth & Navigation ---
    async function handleAuth() {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        let token = hash.get('access_token') || localStorage.getItem('agd_token');

        if (token) {
            try {
                const res = await fetch('https://discord.com/api/users/@me', { 
                    headers: { authorization: `Bearer ${token}` } 
                });
                const data = await res.json();
                localStorage.setItem('agd_token', token);
                
                document.getElementById('welcome-screen').style.display = 'none';
                document.getElementById('main-interface').style.display = 'block';
                document.getElementById('user-profile').style.display = 'flex';
                document.getElementById('user-name').innerText = data.username.toUpperCase();
                document.getElementById('display-id').innerText = data.username.toUpperCase();
                document.getElementById('user-avatar').src = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;
                
                updateSystems();
            } catch (e) { localStorage.removeItem('agd_token'); }
            window.history.replaceState({}, document.title, REDIRECT_URI);
        }
    }

    document.getElementById('login-btn-welcome').onclick = () => {
        window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
    };

    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('agd_token');
        window.location.reload();
    };

    document.getElementById('theme-toggle').onclick = () => document.body.classList.toggle('light-theme');
    document.getElementById('menu-toggle').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('nav-menu').classList.toggle('active');
    };

    handleAuth();
});