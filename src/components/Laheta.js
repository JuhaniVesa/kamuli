import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import Keyboard from "./Keyboard";
import styles from "../styles/style";


const URL = `http://${window.location.hostname}:3001`;

// Laheta-komponentti vastaa pelin arvausnäkymästä, jossa pelaajat voivat syöttää arvauksiaan, nähdä edelliset arvaukset ja niiden tilan (oikein, väärässä paikassa, väärin). 
// Pelaajat voivat myös nähdä oman nimimerkkinsä ja odottaa muiden pelaajien arvausyrityksiä. Näppäimistökomponentti on integroitu tähän näkymään, ja se tarjoaa visuaalisen palautteen aiemmista arvauksista.
// Pelaajat voivat käyttää sekä fyysistä että virtuaalista näppäimistöä arvausten syöttämiseen.
export default function Laheta() {

    const [nicknameInput, setNicknameInput] = useState('');
    const [playerNickname, setPlayerNickname] = useState(null);
    const [playerToken, setPlayerToken] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [guessInput, setGuessInput] = useState('');
    const [playerGuesses, setPlayerGuesses] = useState([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [hasSolved, setHasSolved] = useState(false)
    const [round, setRound] = useState(0);
    const [scores, setScores] = useState([])
    const [started, setStarted] = useState(false)
    const [finished, setFinished] = useState(false)
    const [selectedMaxRounds, setSelectedMaxRounds] = useState(null)

    const [error, setError] = useState("");

 
        const location = useLocation()
        const urlSessionId = new URLSearchParams(location.search).get('sessionId');

    
// Näppäimistön toimintalogiikkaa

  const canType = started && !hasSubmitted && !hasSolved

// Piilotettu input, jotta fyysinen/mobiilinäppis toimii
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const focusInput = () => inputRef.current?.focus();

// Yhteinen logiikka näppäimille
  const addLetter = (ch) => {
    if (!canType) return;
    setGuessInput(g => (g.length < 5 ? g + ch.toUpperCase() : g));
    };

  const removeLetter = () => {
   if (!canType) return;
    setGuessInput(g => g.slice(0, -1));
  };

// Fyysinen/mobiilinäppis
  const onKeyDown = (e) => {
    if (!canType) return;
    const k = e.key;
    if (k === "Enter")     { e.preventDefault(); (submitCurrentGuess()); return; }
    if (k === "Backspace") { removeLetter(); return; }
    if (/^[a-zåäö]$/i.test(k)) addLetter(k);
  };

// Tyylit pelaajan syötteille ja arvausyrityksille, sekä näppäimistölle. Näissä tyyleissä otetaan huomioon pelin tilanne, pelaajan aiemmat arvausyritykset ja näppäimistön visuaalinen palautteen tarve.
  const cellStyle = (variant) => ({
    ...styles.cell,
    ...(variant === "correct" ? styles.cellCorrect :
      variant === "present" ? styles.cellPresent :
      variant === "absent"  ? styles.cellAbsent  :
      variant === "filled"  ? styles.cellFilled  : {}),
  });

// Funktio, joka lisää pelaajan nimimerkin peliin. Tämä funktio tarkistaa, että URL-osoitteessa on sessionId-parametri ja että nimikenttä ei ole tyhjä ennen kuin se lähettää pyynnön palvelimelle pelaajan liittymiseksi peliin. Onnistuneen liittymisen jälkeen pelaajan nimimerkki ja token tallennetaan komponentin tilaan.
  const addNickname = async (e) => {
    e.preventDefault();

    if(!urlSessionId) {
      alert('Session ID puuttuu URL-osoitteesta.');
      return;
    }

    if (!nicknameInput.trim()) {
      alert('Nimimerkki vaaditaan liittymiseen chat-huoneeseen.');
      return;
    }

    try {
      setIsJoining(true);

      const response = await axios.post(URL + '/join', {
        sessionId: urlSessionId,
        nickname: nicknameInput

    })

      setPlayerNickname(response.data.nickname);
      setPlayerToken(response.data.token);
      setNicknameInput('');
      } catch (e) {
          console.error(error);
          const msg = e.response?.data?.error || 'Liittyminen epäonnistui.';
          setError(msg);
    } finally {
        setIsJoining(false);
    }
    }

    useEffect(() => {
        if (urlSessionId) {
        } else {
            alert('Session ID puuttuu URL-osoitteesta.');
        }
    }, [urlSessionId]);


// Funktio, joka hakee pelaajan tilan palvelimelta, mukaan lukien onko pelaaja jo lähettänyt arvauksen, onko pelaaja ratkaissut sanan, nykyinen kierros, pelaajan pisteet ja aiemmat arvausyritykset. Tämä funktio kutsutaan useEffect-koukussa, joka tarkkailee urlSessionId:tä ja playerToken:ia, ja hakee tietoja säännöllisin väliajoin varmistaakseen, että pelaajan tila pysyy ajan tasalla pelin edetessä.    
  const PlayerStatus = () => {
    if (urlSessionId && playerToken) {
      axios.get(URL + '/me', {params: {sessionId: urlSessionId}, headers: {'x-player-token' : playerToken}})
      .then(response => {
        setHasSubmitted(response.data.submitted)
        setHasSolved(response.data.hasSolved)
        setRound(response.data.round)
        setScores(response.data.scores)
        setPlayerGuesses(response.data.guesses)
        setStarted(response.data.started)
        setFinished(response.data.finished)
        setSelectedMaxRounds(response.data.maxRounds)
      })
      .catch(e => {
        const msg = e.response?.data?.error || 'Virhe viestin lähetyksessä.';
          setError(msg);
          setTimeout(() => setError(""), 3000);
      })
    }
    }

    useEffect(() => {
        setPlayerGuesses([])
        setGuessInput('')
        setHasSolved(false)
        setHasSubmitted(false)

    }, [round])

    useEffect(() => {
      if (urlSessionId && playerToken) {
        PlayerStatus()
        const id = setInterval(PlayerStatus, 500);
        return () => clearInterval(id)
      } 
    }, [urlSessionId, playerToken])

// Funktio, joka lähettää pelaajan nykyisen arvauksen palvelimelle. Tämä funktio tarkistaa, että URL-osoitteessa on sessionId-parametri, että pelaaja on liittynyt peliin (token on olemassa) ja että arvauksessa on viisi kirjainta ennen kuin se lähettää pyynnön palvelimelle. Onnistuneen arvauksen jälkeen pelaajan arvausyritykset päivitetään tilaan, ja jos pelaaja ratkaisee sanan, hasSolved asetetaan true:ksi.
  const sendGuess = (e) => {
    e.preventDefault();
    submitCurrentGuess()
  };


    const submitCurrentGuess = async () => {
      if (!urlSessionId) {
        alert('Session ID puuttuu. Et voi lähettää viestiä.');
        return;
      }

      if (!playerToken) {
        alert('Et ole liittynyt peliin (Token puuttuu).');
        return;
      }

      const trimGuess = guessInput.trim();

      if(trimGuess.length !== 5) {
          setError("Arvauksessa pitää olla viisi kirjainta.");
          setTimeout(() => setError(""), 3000);
        return;
      }

      try {
        const response = await axios.post(URL + '/guess', { 
          sessionId: urlSessionId, 
          token: playerToken, 
          guess: trimGuess 
        });

          console.log(response.data);
          setPlayerGuesses(prevGuesses => [...prevGuesses, trimGuess]);
          setGuessInput('');
          if (response.data.hasSolved) {
            setHasSolved(true)
          }
          setHasSubmitted(true);
          } catch (e) {
              console.error(e);
          if (e.response) {
              const msg = e.response?.data?.error || 'Virhe viestin lähetyksessä.';
              setError(msg);
              setTimeout(() => setError(""), 3000);
          } else {
            alert('palvelimeen ei saada yhteyttä')
          }
        };

    };

// Käy läpi pelaajan aiemmat arvausyritykset ja niiden tilat, ja määrittää näppäimistölle värit näiden tietojen perusteella. Näppäimet saavat värin "correct", "present" tai "absent" sen mukaan, onko kirjain ratkaistu, väärässä paikassa vai väärin aiemmissa arvauksissa. Näppäimistökomponentti käyttää näitä värejä tarjotakseen visuaalista palautetta pelaajalle aiemmista arvausyrityksistä.
    const rank = (v) => (v === "correct" ? 3 : v === "present" ? 2 : v === "absent" ? 1 : 0)

    const keyColors = (() => {
      const map = {}

      for (let i = 0; i < playerGuesses.length; i++) {
        const word = (playerGuesses[i] || "").toUpperCase()
        for (let j = 0; j < 5; j++) {
          const ch = word[j]
          if (!ch || ch === " ") continue

          const v = scores?.[i]?.[j]
          if (!v) continue

          const prev = map[ch]
          if (!prev || rank(v) > rank(prev)) map[ch] = v
        }
      }
      return map
    })()

  const isTouchDevice = 
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)

  return (
    <>
      {/* Piilotettu input: ottaa fokuksen ja näppäimet */}
      {!isTouchDevice && (
      <input
        ref={inputRef}
        style={styles.hiddenInput}
        onKeyDown={onKeyDown}
        inputMode="latin"
        autoCapitalize="characters"
      />
      )}
    {!playerNickname ? (
      <div style={styles.appRoot}>
      <p>Anna nimimerkki</p>
      <form onSubmit={addNickname}>
        <input style={styles.nameInput} value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="Nimimerkki" />
        <br></br>
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
        <button style={styles.activeButton} disabled={isJoining}>{isJoining ? "Liitytään..." : "Liity peliin"}</button>
        </div>
      </form>
      {error && <p style={styles.error}>{error}</p>}
      </div>
    ) : !started ? (
      <div style={styles.appRoot}>
        <p>Odotetaan, että peli alkaa...</p>
      </div>   
    ) : (
    <div style={styles.appRoot} onClick={() => {if (!isTouchDevice) focusInput();}}>
      <h2 style={styles.title}>{playerNickname}</h2>
      <p style={{minHeight: 21, textAlign: 'center'}}>{round +1}/{selectedMaxRounds} - {error ? error : hasSolved ? "Ratkaisit sanan" : hasSubmitted ? "Odotetaan muita pelaajia" : " "}</p>
      <div style={styles.boardRoot}>
        <form onSubmit={sendGuess}>
          {Array.from({ length: 6 }).map((_, i) => {
            const word = playerGuesses[i] ??
            (i === playerGuesses.length ? guessInput : "")
            const letters = word.padEnd(5, " ").split("")
            return (
              <div key={i} style={styles.boardRow}>
                {letters.map((ch, j) => {
                  const variant = playerGuesses[i]
                    ? (scores?.[i]?.[j] ?? "filled")
                    : i === playerGuesses.length && j < guessInput.length
                      ? "filled"
                      : "empty"
                return (
                  <div key={j} style={cellStyle(variant)}>
                    {ch.trim()}
                    </div>
                )
                })}
              </div>
            )
          })}
        </form>
        <Keyboard
          onKey={addLetter}
          onBackspace={removeLetter}
          onEnter={submitCurrentGuess}
          enterLabel={hasSolved ? "Jee!" : hasSubmitted ? "Odotetaan..." : "Arvaa"}
          disabled={!canType}
          keyColors={keyColors}
        />
      </div>
    </div>
    )}
    </>
  );
}