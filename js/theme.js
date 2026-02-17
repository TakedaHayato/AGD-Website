document.addEventListener('DOMContentLoaded', () => {
    const CLIENT_ID = '1292148049358884905'; 
    const REDIRECT_URI = window.location.origin + window.location.pathname;

    document.getElementById('login-btn-welcome').onclick = () => {
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
        window.location.href = url;
    };

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

    function switchPage(id) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(id);
        if(target) target.classList.add('active');
        document.getElementById('nav-menu').classList.remove('active');
        window.scrollTo(0, 0);
    }

    // Nav-Links inkl. Footer
    document.querySelectorAll('.nav-link-item, .footer-link').forEach(link => {
        link.onclick = (e) => {
            const href = link.getAttribute('href');
            if(href === '#') { // Logout Case
                localStorage.removeItem('agd_token');
                window.location.reload();
                return;
            }
            e.preventDefault();
            switchPage(href.substring(1));
        };
    });

    document.getElementById('menu-toggle').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('nav-menu').classList.toggle('active');
    };

    document.getElementById('theme-toggle').onclick = () => document.body.classList.toggle('light-theme');
    document.getElementById('home-quick-btn').onclick = () => switchPage('home');

    async function updateWeather() {
        try {
            const res = await fetch('https://ipapi.co/json/').catch(() => ({json: () => ({latitude: 52.5, longitude: 13.4})}));
            const geo = await res.json();
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true&hourly=relative_humidity_2m`);
            const w = await wRes.json();
            document.getElementById('w-temp').innerText = Math.round(w.current_weather.temperature);
            document.getElementById('w-wind').innerText = Math.round(w.current_weather.windspeed);
            document.getElementById('w-hum').innerText = w.hourly.relative_humidity_2m[0];
            document.getElementById('radar-iframe').src = `https://embed.windy.com/embed2.html?lat=${geo.latitude}&lon=${geo.longitude}&zoom=6&level=surface&overlay=rain&product=ecmwf&message=false`;
        } catch(e) {}
    }

    handleAuth();
});