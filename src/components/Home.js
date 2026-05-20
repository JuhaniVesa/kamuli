import React from 'react';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import styles from '../styles/style';
import axios from 'axios';


// Tämä komponentti toimii sovelluksen aloitusnäkymänä, jossa käyttäjät voivat luoda uuden pelihuoneen ja saada QR-koodin, jonka kautta muut pelaajat voivat liittyä peliin. Käyttäjät voivat myös siirtyä suoraan pelihuoneen näkymään tästä näkymästä.
const API_URL = `http://${window.location.hostname}:3001`;
const APP_BASE = `${window.location.origin}/kamuli`;
export default function Home() {

  // Uuden Pelihuoneen luomiseen liittyvä state ja funktio
  const [currentSessionId, setCurrentSessionId] = useState('');

  const handleCreateNewChat = (e) => {

    axios.post(API_URL + '/session')
    .then((response) => {
      setCurrentSessionId(response.data.sessionId);
      console.log(response.data);
    })
    .catch(error => {
      console.error(error);
    })
  };

  return (
    <div style={styles.appRoot}>
      <h1 style={styles.title}>Tervetuloa Kamuliin!</h1>
      {currentSessionId ? (
        <>
      <Link style={styles.hyperlink} to={`/laheta?sessionId=${currentSessionId}`}>Siirry peliin liittymiseen selaimessa</Link>
      <br></br>
        <QRCode value={`${APP_BASE}/laheta?sessionId=${currentSessionId}`} />
        <br></br>
      <button style={styles.activeButton} onClick={handleCreateNewChat}>Luo uusi Kamuli</button>
      <br></br>
      <Link style={styles.hyperlink} to={`/chat?sessionId=${currentSessionId}`}>Avaa pelihuone -näkymä</Link>
      </>
      ) : (
        <button style={styles.activeButton} onClick={handleCreateNewChat}>Luo uusi Kamuli</button>
      )}
      </div>
  );
}