# news+ 🏠

Un prototipo di applicazione React Native (Expo) progettata appositamente per i genitori, con un design "soft", accessibile e semplificato.

## 🚀 Funzionalità
- **Calendario**: Gestione eventi locali con orari e persistence SQLite.
- **Meteo**: Previsioni attuali e a 7 giorni basate sulla posizione GPS (OpenWeatherMap).
- **Notizie**: Feed di notizie aggiornate con fallback locale.
- **Notifiche**: Sistema di avvisi locali (scheduling).
- **Design Soft**: Colori pastello, bordi arrotondati, testi grandi e target touch ottimizzati.

## 🛠️ Requisiti e Avvio
1. Assicurati di avere Node.js installato.
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Avvia il progetto con Expo:
   ```bash
   npx expo start
   ```
4. Scansiona il QR code con l'app **Expo Go** (Android) o la fotocamera (iOS).

## 🔑 Configurazione API (Meteo e Notizie)
Per visualizzare il meteo reale e le ultime notizie:
1. Apri l'app e vai su **Settings** (icona ingranaggio in alto a destra).
2. Inserisci la tua **OpenWeatherMap API Key**. Puoi ottenerne una gratuitamente su [openweathermap.org](https://openweathermap.org/).
3. (Opzionale) Inserisci una News API Key. Se non presente, l'app userà dati di esempio pre-caricati.

## 📱 Note sui Permessi
- **Posizione**: Necessaria per il Meteo. Viene richiesta all'apertura della sezione Meteo.
- **Notifiche**: Necessarie per gli avvisi del Calendario. Viene richiesta al primo avvio.
  - *Nota iOS*: In ambiente simulatore le notifiche potrebbero non apparire; testare su dispositivo fisico con Expo Go.
  - *Autorizzazioni*: Assicurati di accettare i permessi quando richiesti.

## 📦 Struttura Progetto
- `/src/components`: Componenti UI riutilizzabili (ButtonSoft, CardSoft, etc.)
- `/src/services`: Logica per Database (SQLite), Notifiche, Meteo e News.
- `/src/screens`: Schermate principali dell'app.
- `/src/theme`: Definizione dei colori pastello, spaziature e ombre.

## 🧪 Dati di Prova
Al primo avvio, il database sarà vuoto. Puoi aggiungere eventi toccando il tasto "+" in qualsiasi giorno della griglia del calendario. Tutti i dati sono salvati localmente sul dispositivo.
