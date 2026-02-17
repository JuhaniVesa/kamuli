const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const app = express();
const fs = require("fs")
require('dotenv').config()

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;


const sessions = {
    
};

// Sanalista, josta palvelin arpoo pelissa arvattavat sanat. Tämä lista luetaan tiedostosta, joka sisältää suomenkielisiä viiden kirjaimen sanoja. Sanat tallennetaan sekä listana että setinä, jotta sanan tarkistaminen ja satunnaisen sanan valitseminen onnistuu tehokkaasti.
const sanaLista = fs.readFileSync("./words-fi-5.txt", "utf8")
.split(/\r?\n/)
.map(s => s.trim().toLocaleLowerCase("fi-FI"))
.filter(Boolean)

const sanaSet = new Set(sanaLista)

console.log("Sanat ladattu: ", sanaLista.length);

// /state -endpoint, joka palauttaa pelin tilan, mukaan lukien pelaajatiedot, nykyinen kierros, max round -asetus, onko peli alkanut ja onko peli päättynyt. 
// Tämä endpoint on keskeinen pelin logiikan kannalta, sillä se tarjoaa kaikki tarvittavat tiedot pelin tilasta, 
// jotta frontend-komponentit voivat renderöidä oikeat näkymät ja tarjota pelaajille ajantasaista tietoa pelin edetessä.
app.get('/state', (req, res) => {
    const sessionId = req.query.sessionId;
    if (typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId query parameter is required' });
    }
    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Invalid session ID' });
    }

    const session = sessions[sessionId];

    const scoreGuess = (guessWord, targetWord) => {
        guessWord = guessWord.toLocaleLowerCase('fi-FI')
        targetWord = targetWord.toLocaleLowerCase('fi-FI')
        const res = Array(5).fill("absent");
        const counts = {};
        for (let i = 0; i < 5; i++) counts[targetWord[i]] = (counts[targetWord[i]] || 0) + 1;
        for (let i = 0; i < 5; i++) if (guessWord[i] === targetWord[i]) { res[i] = "correct"; counts[guessWord[i]]--; }
        for (let i = 0; i < 5; i++) if (res[i] === "absent" && counts[guessWord[i]] > 0) { res[i] = "present"; counts[guessWord[i]]--; }
        return res;
    };

        const playersForUI = {
            started: session.started, 
            round: session.round,
            maxRounds: session.maxRounds,
            finished: session.finished,
            players: session.players.map(p => {
                const lastGuess = p.guesses[p.guesses.length -1] || ''
                const lastScore = lastGuess ? scoreGuess(lastGuess, session.targetWord) : null

                return { nickname: p.nickname, score: p.score, submitted: p.submitted, hasSolved: p.hasSolved, guessCount: p.guesses.length, lastGuess, lastScore}})};

    res.status(200).json(playersForUI);
});

// /me -endpoint, joka palauttaa pelaajan tilan, mukaan lukien onko pelaaja jo lähettänyt arvauksen, onko pelaaja ratkaissut sanan, nykyinen kierros, 
// pelaajan pisteet ja aiemmat arvausyritykset. Tämä endpoint on keskeinen pelin logiikan kannalta, sillä se tarjoaa kaikki tarvittavat tiedot pelaajan tilasta, 
// jotta frontend-komponentit voivat renderöidä oikeat näkymät ja tarjota pelaajille ajantasaista tietoa heidän edistymisestään pelissä.
app.get('/me', (req, res) => {
    const sessionId = req.query.sessionId;
    const token = (req.header("x-player-token") || "").trim();

    if (!sessionId || !token) {
        return res.status(400).json({ error: 'sessionId query parameters and x-player-token are required' });
    }

    if (typeof sessionId !== 'string' || !sessions[sessionId]) {
        return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = sessions[sessionId];
    const player = session.players.find(p => p.token === token);
    const targetWord = session.targetWord

    if (!player) {
        return res.status(404).json({ error: 'Player not found in this session' });
    }

    const scoreGuess = (guessWord, targetWord) => {
        guessWord = guessWord.toLocaleLowerCase('fi-FI')
        targetWord = targetWord.toLocaleLowerCase('fi-FI')
        const res = Array(5).fill("absent");
        const counts = {};
        for (let i = 0; i < 5; i++) counts[targetWord[i]] = (counts[targetWord[i]] || 0) + 1;
        for (let i = 0; i < 5; i++) if (guessWord[i] === targetWord[i]) { res[i] = "correct"; counts[guessWord[i]]--; }
        for (let i = 0; i < 5; i++) if (res[i] === "absent" && counts[guessWord[i]] > 0) { res[i] = "present"; counts[guessWord[i]]--; }
        return res;
    };

    const scoredGuesses = player.guesses.map(guessWord => scoreGuess(guessWord, targetWord))

    res.status(200).json({
        started: session.started,
        nickname: player.nickname,
        score: player.score,
        submitted: player.submitted,
        guessCount: player.guesses.length,
        hasSolved: player.hasSolved,
        maxGuesses: 6,
        round: session.round,
        guesses: player.guesses,
        scores: scoredGuesses,
        maxRounds: session.maxRounds,
    });
});

// /session -endpoint, joka luo uuden pelisession. Tämä endpoint generoi satunnaisen session ID:n, arpoo sanan sanaListasta, ja tallentaa sessionin tilan sessions-objektiin. 
// Onnistuneen session luomisen jälkeen se palauttaa luodun session ID:n.
app.post('/session', (req, res) => {

    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions[sessionId] = { messages: [], players: [], targetWord: '', round: 0, maxRounds: 5, nextRoundScheduled: false, started: false, finished: false, };

    const n = sanaLista.length
    const random = Math.floor(Math.random() * n)
    const sana = sanaLista[random]

    const session = sessions[sessionId];
    session.targetWord = sana

    console.log("New session: ", sessionId, "targetWord: ", session.targetWord);
    

    res.status(201).json({sessionId: sessionId});
})

// /guess -endpoint, joka vastaanottaa pelaajan arvauksen, tarkistaa sen ja päivittää pelin tilan sen mukaisesti. 
// Tämä endpoint tarkistaa, että pyyntö sisältää validin session ID:n, että pelaaja on liittynyt peliin tokenillaan, 
// että peli on alkanut mutta ei vielä päättynyt, ja että arvauksessa on viisi kirjainta. Jos kaikki tarkistukset menevät läpi, 
// se päivittää pelaajan arvausyritykset, tarkistaa onko arvaus oikein, ja päivittää pelin tilan sen mukaisesti. 
// Jos kaikki pelaajat ovat lähettäneet arvauksensa tai ratkaisseet sanan, se aloittaa uuden kierroksen tai päättää pelin, jos max round on saavutettu.
app.post('/guess', (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    if (typeof req.body.guess !== 'string') {
        return res.status(400).json({ error: 'Guess must be a string' });
    }

    if (typeof req.body.sessionId !== 'string' || !sessions[req.body.sessionId]) {
        return res.status(400).json({ error: 'Invalid session ID' });
    }

    if (typeof req.body.token !== 'string' || req.body.token.length === 0) {
        return res.status(400).json({ error: 'Token must be a string and must be required' })
    }
        
    const session = sessions[req.body.sessionId];

    if (session.finished) {
        return res.status(403).json({ error: "Game is already finished"})
    }

    if (!session.started) {
        return res.status(403).json({error: "Game has not started yet"})
    }

    const players = sessions[req.body.sessionId].players;
    const player = players.find(p => p.token === req.body.token);

    if (!player) {
        return res.status(403).json({ error: 'Invalid token. Not joined to this session.' });
    }

    if (player.submitted) {
        return res.status(409).json({ error: 'You have already submitted your guess for this round.' });
    }

    if (player.hasSolved) {
        return res.status(409).json({error: "You have already guessed a word"})
    }

    const trimGuess = req.body.guess.trim();
    const normalizedGuess = trimGuess.toLocaleLowerCase('fi-FI');

    if (trimGuess.length === 0)
        return res.status(400).json({ error: 'Guess is required' });

    if (trimGuess.length !== 5)
        return res.status(400).json({ error: 'Guess must be exactly 5 characters long' });

    if(!sanaSet.has(normalizedGuess)) {
        return res.status(400).json({ error: 'Guess is not in the word list' });
    }

    if(player.guesses.length >= 6) {
        return res.status(409).json({error: 'You have used all guesses'})
    }

    player.guesses.push(normalizedGuess);
    player.submitted = true;

    if(normalizedGuess === session.targetWord) {
        player.hasSolved = true
        player.solvedIn = player.guesses.length
        }

    const weightedPoints = {1: 9, 2: 7, 3: 5, 4: 4, 5: 2, 6: 1}

    const pointsForSolve = (attemptNumber, scoreMode) => {
        if (scoreMode === 'classic') return 1
        return weightedPoints[attemptNumber] ?? 0
    }

    const allReady = session.players.every(p => p.submitted === true || p.hasSolved === true || p.guesses.length >= 6);
    if (allReady) {
        session.players.forEach(p => p.submitted = false);
    }


    const roundOver = session.players.every(p => p.hasSolved === true || p.guesses.length >= 6)
    if (roundOver && !session.nextRoundScheduled) {
        session.nextRoundScheduled = true
        session.players.forEach(p => {
            if(p.hasSolved) 
                p.score += pointsForSolve(p.solvedIn, session.scoreMode)
        })
        if (session.round + 1 >= session.maxRounds) {
            session.finished = true
            return res.json({ok: true, finished: true})
        }
        setTimeout(() => {
    
        const n = sanaLista.length
        const sana = sanaLista[Math.floor(Math.random() * n)]
    
        session.targetWord = sana
        session.round += 1
       
        session.players.forEach(p => {
            p.guesses = []
            p.hasSolved = false
            p.submitted = false
            p.solvedIn = null
        });
        
        session.nextRoundScheduled = false
        console.log("NEW ROUND", session.round, session.targetWord);

    }, 2000) 
}


    res.status(201).json({ ok: true, guessCount: player.guesses.length, hasSolved: player.hasSolved });
});

// /laheta -endpoint, joka vastaanottaa pelaajan lähettämän viestin, tarkistaa sen ja tallentaa sen sessionin viestihistoriaan.
app.post('/laheta', (req, res) => {
    console.log(req.headers['content-type']);
    console.log(req.body);
    

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    if (typeof req.body.message !== 'string') {
        return res.status(400).json({ error: 'Message must be a string' });
    }
        const trimMessage = req.body.message.trim()

    if (trimMessage.length === 0)
        return res.status(400).json({ error: 'Message is required' });

    if (trimMessage.length > 200 || trimMessage.length < 1)
        return res.status(400).json({ error: 'Message is too long or too short' });

    if (typeof req.body.sessionId !== 'string' || !sessions[req.body.sessionId]) {
        return res.status(400).json({ error: 'Invalid session ID' });
    } 

    if (typeof req.body.token !== 'string' || req.body.token.length === 0) {
        return res.status(400).json({ error: 'Token must be a string and must be required' })
    }

    const players = sessions[req.body.sessionId].players;
    const player = players.find(p => p.token === req.body.token);
    if (!player) {
        return res.status(403).json({ error: 'Invalid token. Not joined to this session.' });
    }
    const nickname = player.nickname;

    const newMessage = {
        id: sessions[req.body.sessionId].messages.length + 1,
        nickname: nickname,
        message: trimMessage,
        timestamp: new Date().toISOString()
    }

    sessions[req.body.sessionId].messages.push(newMessage);
    res.status(201).json(newMessage);
})

// /start -endpoint, joka aloittaa pelin. Tämä endpoint tarkistaa, että pyyntö sisältää validin session ID:n, että peli ei ole vielä alkanut, 
// että peliin on liittynyt pelaajia, ja että max round -asetus on valittu. 
// Jos kaikki tarkistukset menevät läpi, se asettaa sessionin started-tilaksi true:n ja tallentaa max round -asetuksen ja score mode -asetuksen sessioniin.
app.post('/start', (req, res) => {
    const { sessionId } = req.body || {}
    if (typeof sessionId !== "string" || !sessions[sessionId]) {
        return res.status(400).json({error: "Invalid session ID"})
    }

    const session = sessions[sessionId]

    const chosenMaxRounds = Number(req.body.maxRounds)

    const allowedRounds = [5,10,15]

    if (!allowedRounds.includes(chosenMaxRounds)) {
        return res.status(400).json({error: "Select number of rounds"})
    }

    if (session.started) {
        return res.status(409).json({error: "Game already started"})
    }

    const mode = req.body.scoreMode
    if(mode !== 'classic' && mode !== 'weighted') {
        return res.status(400).json({error: "Invalid scoremode"})
    }

    session.maxRounds = chosenMaxRounds
    session.started = true
    session.scoreMode = mode

    return res.status(200).json({ok: true, started: true, maxRounds: session.maxRounds, scoreMode: session.scoreMode})
})

// /restart -endpoint, joka käynnistää pelin uudestaan. Tämä endpoint tarkistaa, että pyyntö sisältää validin session ID:n ja että peli on päättynyt.
// Jos tarkistukset menevät läpi, se nollaa sessionin tilan, arpoo uuden sanan sanaListasta, 
// ja asettaa sessionin started-tilaksi false:n ja finished-tilaksi false:n, jotta peli voidaan aloittaa uudestaan.
app.post('/restart', (req, res) => {
    const { sessionId } = req.body || {}
    if (typeof sessionId !== "string" || !sessions[sessionId]) {
        return res.status(400).json({error: "Invalid session ID"})
    }

    const session = sessions[sessionId]
    if (session.finished !== true) {
        return res.status(400).json({error: "Game isn't over yet!"})
    }

    const n = sanaLista.length
    const sana = sanaLista[Math.floor(Math.random() * n)]
    

    session.started = false
    session.finished = false
    session.round = 0
    session.targetWord = sana
    session.nextRoundScheduled = false

    session.players.forEach( p => {
        p.score = 0
        p.guesses = []
        p.submitted = false
        p.hasSolved = false
    })

    return res.status(200).json({ok: true})
})

// /join -endpoint, joka lisää pelaajan peliin. Tämä endpoint tarkistaa, että pyyntö sisältää validin session ID:n, että peli ei ole vielä alkanut,
app.post('/join', (req, res) => {
    console.log(req.body.sessionId, Object.keys(sessions));
    
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    if (typeof req.body.sessionId !== 'string' || !sessions[req.body.sessionId]) {
        return res.status(400).json({ error: 'Invalid session ID' });
    }

    const nickname = req.body.nickname;
    if (typeof nickname !== 'string') {
        return res.status(400).json({ error: 'Nickname must be a string' });
    }

    const trimNickname = nickname.trim();
    if (trimNickname.length === 0) {
        return res.status(400).json({ error: 'Nickname is required' });
    }
    if (trimNickname.length > 20 || trimNickname.length < 2) {
        return res.status(400).json({ error: 'Nickname is too long or too short' });
    }

    const session = sessions[req.body.sessionId]

    if (session.started) {
        return res.status(403).json({error: "Game already started"})
    }

    const token = crypto.randomBytes(16).toString('hex');
    const existingPlayer = sessions[req.body.sessionId].players.find(p => p.nickname === trimNickname);
    if (existingPlayer) {
        return res.status(409).json({ error: 'Nickname is already taken in this session' });
    }
    sessions[req.body.sessionId].players.push({
        nickname: trimNickname,
        token: token,
        score: 0,
        guesses: [],
        hasSolved: false,
        submitted: false,
    });

    res.status(201).json({
        nickname: trimNickname,
        token: token
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port: ${port}`);

});