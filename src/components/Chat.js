import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "../styles/style";
import axios from "axios";

const URL = `http://${window.location.hostname}:3001`;

export default function Chat() {

  // Chat-komponentti vastaa pelihuoneen näkymästä, jossa pelaajat näkevät toistensa nimet, pisteet ja viimeisimmät arvausyritykset. Pelaajat voivat myös nähdä, onko peli alkanut vai ei, ja odottaa muiden liittymistä ennen pelin aloittamista. Pelin päätyttyä pelaajat näkevät tulokset ja voivat aloittaa uuden pelin.
  const [message, setMessage] = useState([]);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [round, setRound] = useState(0)
  const [selectedMaxRounds, setSelectedMaxRounds] = useState(null)
  const [serverMaxRounds, setServerMaxRounds] = useState(0)
  const [scoreMode, setScoreMode] = useState('classic')

 
  const location = useLocation()
  const urlSessionId = new URLSearchParams(location.search).get('sessionId');

  // Tyylit pelaajalistaukselle ja arvausyritysten visualisoinnille
  const cellStyle = (variant) => ({
    ...styles.miniCell,
    ...(variant === "correct" ? styles.cellCorrect :
      variant === "present" ? styles.cellPresent :
      variant === "absent" ? styles.cellAbsent : {}
    )
  })

  // Tyylit max round ja score mode -valitsimille
  const btnStyle = (isActive) => ({
    flex: 1,
      ...(isActive ? styles.colorPickerActiveBtn : styles.colorPickerBtn)
  })

// Funktio, joka hakee palvelimelta pelaajatiedot, pelin tilan ja muut olennaiset tiedot, ja päivittää komponentin tilan näiden tietojen perusteella. Tämä funktio kutsutaan useEffect-koukussa, joka tarkkailee urlSessionId:tä, ja hakee tietoja säännöllisin väliajoin varmistaakseen, että pelaajatiedot ja pelin tila pysyvät ajan tasalla.
  const FetchPlayers =() => {
    axios.get(URL + "/state", { params: { sessionId: urlSessionId } })
          .then(response => {
              setPlayers(response.data.players);
              setStarted(response.data.started)
              setRound(response.data.round)
              setServerMaxRounds(response.data.maxRounds)
              setFinished(response.data.finished)
              console.log(response.data.players);
            })
            .catch(error => {
                setError(error.message ? error.message : error);
                console.error(error);
            });
    }

// Funktio, joka lähettää palvelimelle pyynnön pelin aloittamiseksi. Tämä funktio tarkistaa myös, että peliin on liittynyt pelaajia ja että max round -asetus on valittu ennen pelin aloittamista.
  const startGame = async () => {
    try {
      await axios.post(URL + "/start", {sessionId: urlSessionId, maxRounds: selectedMaxRounds, scoreMode: scoreMode})
  } catch (e) {
  alert(e.response?.data?.error || "Start epäonnistui");
  }
}

// useEffect-koukku, joka tarkkailee urlSessionId:tä, ja hakee pelaajatiedot ja pelin tilan säännöllisin väliajoin.
  useEffect(() => {
    if (urlSessionId) {
      FetchPlayers();
      const id = setInterval(FetchPlayers, 2000);
      return () => clearInterval(id);
    } else {
         alert('Session ID puuttuu URL-osoitteesta.');
    }
        
}, [urlSessionId]);


// Funktio, joka lähettää palvelimelle pyynnön pelin uudelleenkäynnistämiseksi. Tämä funktio kutsutaan, kun peli on päättynyt ja pelaajat haluavat aloittaa uuden pelin.
    const restartGame = async () => {
      try {
        await axios.post(URL + "/restart", {sessionId: urlSessionId})
        FetchPlayers()
    } catch (e) {
    alert(e.response?.data?.error || "Start epäonnistui");
    }
  }

// Komponentit, jotka renderöivät pelin eri tilanteet: ennen pelin alkua, pelin aikana ja pelin päätyttyä. Nämä komponentit näyttävät pelaajalistan, pelin tilan, tulokset ja tarjoavat mahdollisuuden aloittaa uusi peli.
    const RoundPicker = () => {
      return(
        <div style={styles.roundPickerContainer}>
          <button onClick={() => setSelectedMaxRounds(5)} style={btnStyle(selectedMaxRounds === 5)}>
            5
          </button>
          <button onClick={() => setSelectedMaxRounds(10)} style={btnStyle(selectedMaxRounds === 10)}>
            10
          </button>
          <button onClick={() => setSelectedMaxRounds(15)} style={btnStyle(selectedMaxRounds === 15)}>
            15
          </button>
        </div>
      )
    }

    const ScoreModePicker = () => {
      return (
        <div style={{display: "flex", gap: 20, paddingTop: 10, paddingBottom: 10}}>
          <button onClick={() => setScoreMode('classic')} style={btnStyle(scoreMode === 'classic')}>
            Klassinen
          </button>
          <button onClick={() => setScoreMode('weighted')} style={btnStyle(scoreMode === 'weighted')}>
            Painotettu
          </button>
        </div>
      )
    }

    const ScoreBoard = () => {
      return(
        <>
          <div style={styles.scoreBoard}>
            <h2 style={{textAlign: "center"}}>Tulokset!</h2>
            <ul style={{listStyle: "none"}}>
              {[...players]
              .sort((a,b) => b.score-a.score)
              .map((player, i) => (
                <li style={{fontWeight: 600}} key={player.nickname}>
                  # {i+1} {player.nickname} - {player.score}
                </li>
              ))}
            </ul>
          </div>
            <button style={{...styles.activeButton, marginTop: 30, fontSize: 16}} onClick={restartGame}>
              Pelaa uudestaan
            </button>
          </>
      )
    }

    const GameSituation = () => {

    if (finished) {
      return <ScoreBoard />
    }
    
    if (!started) {
      return (
        <>
        <RoundPicker />
        <ScoreModePicker />
        <button 
          onClick={startGame} 
          disabled={isDisabled}
          style={isDisabled ? styles.disabledButton : styles.activeButton}
          >
          Aloita
        </button>
        <PlayerList minimal players={players}/>
      </>
      )
    } else {
      return(
        <>
          <p>Sana: {round + 1}/ {selectedMaxRounds}</p>
          <PlayerList minimal={!started} players={players}/>
        </>
      )
    }
  }
  

    const PlayerList = ({ minimal }) => {
      if (players.length === 0) {
        return <p>Ei pelaajia — odotetaan liittymisiä</p>;
      } else {
        return (
          <ul style={{listStyle: "none", padding: 0}}>
            {players.map(player => (
              <li key={player.nickname}
              style={styles.playerBoxContainer}
              >
                {minimal ? (
                  player.nickname
                ) : (
                  <>
                {player.nickname} - Pisteet: {player.score} - Onko arvannut: {player.submitted ? "✓" : "✕"} - 
                 viimeisin arvaus: {player.lastScore && 
                ( <span style={{marginLeft: 10}}> 
                  {player.lastScore.map((v, i) => (
                    <span key={i} style={cellStyle(v)}/>
                ))}
                  </span>
                )}
                </>
                )}
              </li>
            ))}
          </ul>
        );
      }
    };

    const isDisabled = started || players.length === 0 || !selectedMaxRounds

  return (
    <div style={styles.appRoot}>
      <h1>Kamuli lobby näkymä</h1>
        <GameSituation />
    </div>
  );
}