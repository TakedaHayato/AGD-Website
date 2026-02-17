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
    // Standard-Koordinaten (Berlin), falls die Ortung fehlschlägt
    let lat = 52.52;
    let lon = 13.40;

    try {
        // 1. Versuche die Koordinaten vom Browser zu kriegen (Optional)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
                await fetchWeatherData(lat, lon);
            }, async () => {
                // Falls User ablehnt: Nutze Standard
                await fetchWeatherData(lat, lon);
            });
        } else {
            await fetchWeatherData(lat, lon);
        }
    } catch(e) {
        console.log("Weather Uplink Error", e);
    }
}

async function fetchWeatherData(lat, lon) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
        const data = await response.json();
        
        if (data.current_weather) {
            document.getElementById('w-temp').innerText = Math.round(data.current_weather.temperature);
            // Wir nutzen die Feuchtigkeit aus dem ersten Slot der Stunden-Daten
            document.getElementById('w-hum').innerText = data.hourly.relative_humidity_2m[0];
            
            // Radar Update mit den korrekten Koordinaten
            const radar = document.getElementById('radar-iframe');
            if(radar) {
                radar.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&level=surface&overlay=rain&product=ecmwf&message=false`;
            }
        }
    } catch (err) {
        console.error("Fetch failed", err);
    }
}

    handleAuth();
});