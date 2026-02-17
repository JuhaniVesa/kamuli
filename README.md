# Kamuli - moninpelattava Wordle/Sanuli. 

Kamuli on couch co-op monin pelattava Wordle/Sanuli-peli. Peliä pelataan samassa tilassa yhteisen näytön äärellä: host luo pelisession ja muut liittyvät QR-koodilla omilla laitteillaan. 


### Ominaisuudet

- Moninpeli sessioilla — Luodaan jokaiselle pelikerralle uusi sessio
- Aula: 
 - Näkyy pelaajat, pelaajien pisteet, ketkä ovat jo arvanneet ja viimeisin arvaus (värilaatikoina)
 - Mahdollisuus valita kierrosmäärä kuinka monta sanaa arvataan (5/10/15)
 - Pelikerran tulostaulu sekä mahdollisuus aloittaa uusi peli
 - Backend hallinnoi peliä (arvauksien validointi, pisteytys, kierrokset ja pelin eteminen). Backend toimii ns. "source of truth" -periaatteella, jolloin vähennetetään frontendin mahdollisuutta manipuloida peliä. Kierros päättyy automaattisesti kun kaikki ovat arvanneet tai ratkaisseet sanan.

### Pelimuodot
 - Kaksi eri pelimuotoa:
    - Klassinen: 1 piste / ratkaistu sana
    - Painotettu: 
        1. arvaus = 9p
        2. = 7p
        3. = 5p
        4. = 4p
        5. = 2p
        6. = 1p


### Peli flow

1. Avaa sovellus
2. Luo uusi sessio, joka luo QR-koodin
3. Pelaajat lukevat QR-koodin ja asettavat nimimerkin
4. Avaa Aula -näkymä, valitkaa pelimuoto ja kierros pituus sekä tarkistakaa, että kaikki pelaajat ovat liittyneet
5. Aloittakaa peli
6. Pelatkaa
7. Ihailkaa tulostaulua ja pelatkaa uusi peli halutessanne

### Teknologiat

- Frontend: React
- Backend: Node.js + Express
- Moninpelin synkkaus: Pollaus
- Sanalista: .txt -tiedosto

### Projektin käynnistys paikallisesti
Serverin käynnistys:
- cd server -> npm install -> npm start

Frontin käynnistys:
- npm install -> npm mobiilistart (jotta saadaan myös älylaite yhdistettyä)

Verkkoasetuksista profiilin tyypiksi "Private network"


### API 

POST:
- /session – Luo uuden session
- /join – Liittää pelaajan sessioon
- /start – Aloittaa pelin ja valitsee asetukset
- /guess – Lähettää ja validoi arvauksia, pisteitä, kierroksen lukumääriä jne.
- /restart – Aloittaa uuden pelin

GET:
- /state – Aulan/pelin tilanne
- /me – Pelaajakohtainen tila