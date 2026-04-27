document.addEventListener('DOMContentLoaded', () => {
    const CLIENT_ID = '1292148049358884905'; 
    const REDIRECT_URI = window.location.origin + window.location.pathname;

    // --- AUTHENTIFIZIERUNG ---
    async function checkAuth() {
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
                document.getElementById('user-name').innerText = data.username.toUpperCase();
                document.getElementById('user-avatar').src = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;
                
                updateWeather();
            } catch (e) { 
                localStorage.removeItem('agd_token'); 
            }
            window.history.replaceState({}, document.title, REDIRECT_URI);
        }
    }

    // --- WETTER & RADAR ---
    async function updateWeather() {
        navigator.geolocation.getCurrentPosition(async (p) => {
            fetchData(p.coords.latitude, p.coords.longitude);
        }, () => fetchData(52.52, 13.40));
    }

    async function fetchData(lat, lon) {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
        const data = await res.json();
        document.getElementById('w-temp').innerText = Math.round(data.current_weather.temperature);
        document.getElementById('w-hum').innerText = data.hourly.relative_humidity_2m[0];
        document.getElementById('radar-iframe').src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&overlay=rain`;
    }

    // --- UI EVENTS ---
    document.getElementById('login-btn-welcome').onclick = () => {
        window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
    };

    document.getElementById('theme-toggle').onclick = () => document.body.classList.toggle('light-theme');

    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('agd_token');
        window.location.reload();
    };

    checkAuth();
});