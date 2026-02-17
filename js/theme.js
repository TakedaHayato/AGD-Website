document.addEventListener('DOMContentLoaded', () => {
    const CLIENT_ID = '1292148049358884905'; 
    const REDIRECT_URI = window.location.origin + window.location.pathname;

    function redirectToDiscord() {
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
        window.location.href = url;
    }

    async function handleAuth() {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        let accessToken = fragment.get('access_token') || localStorage.getItem('agd_token');

        if (accessToken) {
            try {
                const res = await fetch('https://discord.com/api/users/@me', { 
                    headers: { authorization: `Bearer ${accessToken}` } 
                });
                if (!res.ok) throw new Error();
                const data = await res.json();

                localStorage.setItem('agd_token', accessToken);
                document.getElementById('welcome-screen').style.display = 'none';
                document.getElementById('main-interface').style.display = 'block';
                
                document.getElementById('user-profile').style.display = 'flex';
                document.getElementById('user-name').innerText = data.username.toUpperCase();
                document.getElementById('user-avatar').src = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;
                document.getElementById('display-id').innerText = data.username.toUpperCase();
                
                updateWeather();
            } catch (e) {
                localStorage.removeItem('agd_token');
            }
            window.history.replaceState({}, document.title, REDIRECT_URI);
        }
    }

    // Wetter & Navigation (Bleibt wie zuvor)
    async function updateWeather() {
        let lat = 52.5, lon = 13.4;
        try {
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
            const w = await wRes.json();
            document.getElementById('w-temp').innerText = Math.round(w.current_weather.temperature);
            document.getElementById('w-wind').innerText = Math.round(w.current_weather.windspeed);
            document.getElementById('w-hum').innerText = w.hourly.relative_humidity_2m[0];
            document.getElementById('radar-iframe').src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&level=surface&overlay=rain&product=ecmwf&message=false`;
        } catch(e) {}
    }

    document.getElementById('login-btn-welcome').onclick = redirectToDiscord;
    document.getElementById('logout-btn').onclick = () => { localStorage.removeItem('agd_token'); window.location.reload(); };
    document.getElementById('theme-toggle').onclick = () => document.body.classList.toggle('light-theme');
    
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.onclick = (e) => {
            if(link.id === 'logout-btn') return;
            e.preventDefault();
            const id = link.getAttribute('href').substring(1);
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        };
    });

    handleAuth();
});