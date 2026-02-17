document.addEventListener('DOMContentLoaded', () => {
    // --- DISCORD CONFIG ---
    const CLIENT_ID = '1292148049358884905'; 
    const REDIRECT_URI = window.location.origin + window.location.pathname;

    const loginBtnWelcome = document.getElementById('login-btn-welcome');
    const userProfile = document.getElementById('user-profile');
    const userNameDisplay = document.getElementById('user-name');
    const userAvatarImg = document.getElementById('user-avatar');
    const displayId = document.getElementById('display-id');

    // 1. LOGIN FUNKTION
    function redirectToDiscord() {
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
        window.location.href = url;
    }

    // 2. TOKEN AUS URL PRÜFEN
    function handleAuth() {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = fragment.get('access_token');

        if (accessToken) {
            fetch('https://discord.com/api/users/@me', {
                headers: { authorization: `Bearer ${accessToken}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.username) {
                    // Interface anzeigen
                    document.getElementById('welcome-screen').style.display = 'none';
                    document.getElementById('main-interface').style.display = 'block';
                    
                    // User Daten setzen
                    userProfile.style.display = 'flex';
                    userNameDisplay.innerText = data.username.toUpperCase();
                    userAvatarImg.src = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;
                    displayId.innerText = data.username.toUpperCase() + " | SPZN";
                    
                    updateWeather();
                }
            })
            .catch(err => console.error("Auth Failed", err));
            
            // URL aufräumen
            window.history.replaceState({}, document.title, REDIRECT_URI);
        }
    }

    loginBtnWelcome.onclick = redirectToDiscord;
    handleAuth();

    // --- NAVIGATION & UI LOGIK ---
    const menuBtn = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const themeBtn = document.getElementById('theme-toggle');
    const homeBtn = document.getElementById('home-quick-btn');

    themeBtn.onclick = () => document.body.classList.toggle('light-theme');

    homeBtn.onclick = () => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('home').classList.add('active');
    };

    menuBtn.onclick = (e) => { e.stopPropagation(); navMenu.classList.toggle('active'); };
    
    document.querySelectorAll('.nav-link-item, .footer-link').forEach(link => {
        link.onclick = (e) => {
            const id = link.getAttribute('href').substring(1);
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const target = document.getElementById(id);
            if(target) {
                target.classList.add('active');
                navMenu.classList.remove('active');
                window.scrollTo(0,0);
            }
        };
    });

    // Wetter Funktion (wie zuvor)
    async function updateWeather() {
        // ... (dein bestehender Wetter Code)
    }
});