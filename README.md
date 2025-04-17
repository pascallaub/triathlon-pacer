# Triathlon Pacer

**Triathlon Pacer** ist eine mobile Anwendung, die Triathleten dabei unterstützt, ihre Zielzeiten für Schwimmen, Radfahren und Laufen effizient zu planen. Durch die Eingabe individueller Zielzeiten erhalten Nutzer eine detaillierte Aufschlüsselung der benötigten Paces für jede Disziplin.

## 🏁 Funktionen

- **Zielzeit-Planung:** Eingabe der gewünschten Gesamtzielzeit für den Triathlon.
- **Disziplin-Aufschlüsselung:** Berechnung der erforderlichen Paces für Schwimmen, Radfahren und Laufen basierend auf der Gesamtzielzeit.
- **Benutzerfreundliche Oberfläche:** Intuitive Navigation und ansprechendes Design für eine optimale Nutzererfahrung.

## 📱 Technologien

- **Framework:** React Native
- **Programmiersprache:** JavaScript
- **Struktur:** Modularer Aufbau mit Komponenten und Screens für einfache Wartung und Erweiterung.

## 🚀 Erste Schritte

### Voraussetzungen

- Node.js (empfohlen: Version 14 oder höher)
- npm oder yarn
- React Native CLI

### Installation

```bash
git clone https://github.com/pascallaub/triathlon-pacer.git
cd triathlon-pacer
npm install  # oder: yarn install
```

### App starten

```bash
npx react-native run-android  # Für Android
# oder
npx react-native run-ios      # Für iOS
```

## 📂 Projektstruktur

```
triathlon-pacer/
├── assets/             # Statische Ressourcen wie Bilder und Icons
├── src/
│   └── screens/        # Verschiedene Screens der Anwendung
├── App.js              # Haupteinstiegspunkt der App
├── package.json        # Projektkonfiguration und Abhängigkeiten
└── ...
```

## 📌 Roadmap

- [ ] Integration von Trainingsplänen basierend auf Zielzeiten
- [ ] Synchronisation mit Fitness-Trackern und Wearables
- [ ] Mehrsprachige Unterstützung (z. B. Deutsch, Englisch)
- [ ] Implementierung von Dark Mode

## 🤝 Beitrag leisten

Beiträge sind herzlich willkommen! Bitte folge diesen Schritten:

1. Forke das Repository
2. Erstelle einen neuen Branch: `git checkout -b feature/DeinFeature`
3. Nimm deine Änderungen vor und committe sie: `git commit -m 'Füge neues Feature hinzu'`
4. Pushe den Branch: `git push origin feature/DeinFeature`
5. Stelle einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).
