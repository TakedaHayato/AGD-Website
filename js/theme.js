/**
 * AGD Operations Center - Core Logic
 * Handelt Authentifizierung, Navigation und Discord-Integration
 */

const CLIENT_ID = '1292148049358884905';
const GUILD_ID = '1129433598253084826';
const REDIRECT_URI = window.location.origin + window.location.pathname;

// --- NAVIGATION & UI STEUERUNG ---

/**
 * Öffnet/Schließt das Hamburger-Menü
 */
function toggleMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('dropdown');
    dropdown.classList.toggle('active');
}

/**
 * Schließt das Menü (wird bei Klicks außerhalb aufgerufen)
 */
function closeMenu() {
    const dropdown = document.getElementById('dropdown');
    if (dropdown) dropdown.classList.remove('active');
}

/**
 * Wechselt zwischen den verschiedenen Unterseiten (Dashboard, Credits, etc.)
 */
function showPage(id) {
    // Alle Seiten ausblenden
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Zielseite einblenden
    const targetPage = document.getElementById(id);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Menü nach Klick schließen
    closeMenu();
    // Nach oben scrollen
    window.scrollTo(0, 0);
}

// --- AUTHENTIFIZIERUNG & DISCORD API ---

/**
 * Startet den Login-Prozess über Discord OAuth2
 */
function login() {
    // Scopes: identify (Profil) + guilds.join (Server-Beitritt)
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify+guilds.join`;
    window.location.href = url;
}

/**
 * Meldet den Nutzer ab und bereinigt die Session
 */
function logout() {
    localStorage.removeItem('agd_token');
    window.location.href = REDIRECT_URI;
}

/**
 * Initialisiert die Sitzung beim Laden der Seite
 */
async function initSession() {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    let token = hash.get('access_token') || localStorage.getItem('agd_token');

    if (token) {
        try {
            // Nutzerdaten von Discord abrufen
            const res = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Invalid Session");
            
            const user = await res.json();

            // 1. Token dauerhaft speichern
            localStorage.setItem('agd_token', token);

            // 2. Interface umschalten
            document.getElementById('welcome-screen').classList.add('hidden');
            document.getElementById('main-interface').classList.remove('hidden');

            // 3. UI personalisieren
            const userNameDisplay = document.getElementById('u-name');
            if (userNameDisplay) userNameDisplay.innerText = user.username.toUpperCase();

            // 4. Team-Avatare im Credits-Bereich setzen
            updateTeamAvatars(user, token);

            // 5. Automatischer Server-Beitritt (Guild Join)
            tryJoinServer(user.id, token);

        } catch (e) {
            console.error("Auth-Error:", e);
            localStorage.removeItem('agd_token');
        }
        
        // URL von Hash-Parametern säubern
        window.history.replaceState({}, document.title, REDIRECT_URI);
    }
}

/**
 * Versucht den Nutzer automatisch dem AGD-Server hinzuzufügen
 */
async function tryJoinServer(userId, token) {
    try {
        await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
            method: 'PUT',
            headers: { 
                Authorization: `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ access_token: token })
        });
    } catch (err) {
        console.log("Auto-Join optional oder bereits Mitglied.");
    }
}

/**
 * Aktualisiert die Avatare im Credits-Bereich basierend auf den IDs
 */
function updateTeamAvatars(currentUser, token) {
    const ownerImg = document.getElementById('avatar-owner');
    const devImg = document.getElementById('avatar-dev');

    // Falls der eingeloggte Nutzer selbst der Owner oder Dev ist, nutzen wir sein Bild sofort
    if (currentUser.id === "444127208735506433" && ownerImg) {
        ownerImg.src = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=128`;
    }
    if (currentUser.id === "1400867817951072428" && devImg) {
        devImg.src = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=128`;
    }
    
    // Hinweis: Fremde Avatare ohne Bot-Token sind clientseitig schwer zu laden. 
    // Hier werden die Standard-Platzhalter verwendet, falls man nicht selbst die Person ist.
}

// --- INITIALISIERUNG BEIM START ---
document.addEventListener('DOMContentLoaded', initSession);