# Keittovuohi

Telegram-botti, joka arvioi käyttäjän veren alkoholipitoisuutta (promillet) juotujen annosten perusteella. Ryhmissä botti näyttää kaikkien jäsenten promillet tai annokset (12,0 g alkoholia).

Alkuperäinen botti: Joonas Ulmanen ([ultsi/blakkisvuohi](https://github.com/ultsi/blakkisvuohi)), GPL-3.0. Tämä versio on korjattu toimimaan nykyisillä Node.js- ja PostgreSQL-versioilla.

## Mitä korjattiin (v5.0.0)

- **Node 22 -tuki.** Alkuperäinen vaati Node 8:n. Nimimerkkien salaus käytti `crypto.createCipher`-funktiota, joka on poistettu Nodesta. Korvattu yhteensopivalla toteutuksella, joten vanhat salatut nimimerkit purkautuvat yhä samalla `SECRET`-arvolla.
- **Kuvaajat (`/kuvaaja`).** `chartjs-node` + `canvas@1` eivät käänny enää. Tilalla Chart.js 4 ja `@napi-rs/canvas`, joka asentuu valmiiksi käännettynä. Korjattu myös viivojen värien bugi.
- **Tietokanta.** `pg` 7 → 8 (vanha jumittui uusilla Nodeilla). Taulut luodaan automaattisesti käynnistyksessä. SSL-tuki pilvitietokannoille (`DATABASE_SSL=true`).
- **Käyttäjänimi.** Botin nimi oli kovakoodattu `blakkisvuohibot`, joten omalla botilla ryhmäkomennot (`/promillet@omabotti`) eivät toimineet. Nyt nimi haetaan Telegramilta.
- **Admin.** Admin-id oli kovakoodattu alkuperäiselle tekijälle. Nyt `ADMIN_ID`-muuttuja.
- **Kaatumiset.** Uusissa Nodeissa yksikin käsittelemätön virhe (esim. käyttäjä estänyt botin) kaatoi koko botin. Nyt virheet lokitetaan ja botti jatkaa.
- **Webhook.** URL-polku ei enää sisällä bottitokenia, vanha webhook poistetaan automaattisesti polling-tilassa.
- Docker-kuva Node 22:lle ja PostgreSQL 16:lle.

## Käyttöönotto

### 1. Luo botti

1. Avaa Telegramissa [@BotFather](https://t.me/BotFather) ja lähetä `/newbot`. Saat tokenin.
2. Hae oma käyttäjä-id esim. [@userinfobot](https://t.me/userinfobot):lta (admin-komentoja varten).

### 2. Asetukset

```
cp .env_example .env
```

Täytä `.env`: `TOKEN`, `SECRET` (pitkä satunnainen merkkijono, älä vaihda myöhemmin) ja `ADMIN_ID`.

### 3a. Docker Compose (helpoin, sisältää tietokannan)

```
docker compose up -d --build
docker compose logs -f blakkis
```

### 3b. Ilman Dockeria

Tarvitset Node.js 20+ ja PostgreSQL:n. Aseta `.env`:iin myös `DATABASE_URL`.

```
npm install
npm run dev
```

### 3c. Pilvipalvelu (Render, Railway, Fly.io...)

- Käynnistyskomento `npm start`, ympäristömuuttujat kuten `.env_example`:ssa.
- Pilvitietokannalle yleensä `DATABASE_SSL=true`.
- Jos palvelu nukuttaa sovelluksen, käytä `BOT_MODE=webhook` ja `APP_URL=https://sovelluksesi-osoite`. Muuten `polling` riittää.

## Testit

Testit tarvitsevat tyhjän PostgreSQL-tietokannan `DATABASE_URL`:ssa (ne kirjoittavat ja poistavat testidataa).

```
npm test
```

## Lisenssi

GPL-3.0, ks. `LICENSE`.
