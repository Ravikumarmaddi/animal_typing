# Animal Typing Game

Animal Typing Game is an offline typing game for kids. Type the displayed pattern accurately to move an animal across the selected scene. Typing speed determines whether the animal is a snail, turtle, elephant, rabbit, deer, horse, ostrich, or cheetah.

## Motivation

I spent a lot of time looking for games that help my kids build skills through play. Many options had limitations or fell short in performance, appearance, and ease of use. I made this game to give them a simple, enjoyable way to practice typing.

## My Goal

- No play limits, no ads, and no installation.
- Just download, unzip, and play.
- Keep gameplay offline. Detailed character artwork is bundled with the game.

## Portable single-file version

Open `dist/index.html` directly. This standalone page includes all styles, scripts, character images, backgrounds, icons, and audio. You can copy this file anywhere without companion folders. Rebuild it after source changes with `node scripts/build-offline.cjs`.

For the source-folder version, extract the **entire ZIP** first, then open `index.html` next to the `assets`, `css`, `js`, and `config` folders. Opening an HTML file directly inside a ZIP can create a temporary copy without these files, resulting in an unstyled page and broken images.

## Play Offline

1. Download and unzip the game.
2. Open `animal-typing-game/index.html` in Chrome.
3. Choose a lesson and pattern in **Setup**, then select **Start Game**.

The game runs from local files. It does not require Node.js, a server, an account, an API key, or an internet connection.

## Lessons

The course contains **80 lessons**, each with **five patterns**: 400 patterns in total. It progresses through home row, top row, bottom row, numbers and punctuation, mixed rows, difficult drills, and complex text. Patterns use one space between words or groups.

Select any lesson and pattern in **Setup**. After a completed pattern, **Next Pattern** continues within the lesson. After its fifth pattern, **Next Lesson** opens the next lesson. **Retry Lesson** repeats the current pattern, and **Close** dismisses the results dialog.

## Setup and Controls

Setup provides a player name, lesson, pattern, QWERTY US keyboard layout, background, animal set, on-screen keyboard, sound, reduced animation, and optional on-screen key tapping. The five backgrounds are Sunny Meadow, Forest, Beach, Desert, and Starry Night.

The top menu has **Setup**, **New Game**, **Pause/Resume**, **Sound**, **Keyboard**, and **Full Screen** controls. The on-screen keyboard highlights the next key and the opposite-hand Shift key when needed. Its F and J keys have home-row markers. The keyboard can be hidden in Setup or from the top menu.

Correct keystrokes advance the pattern. Incorrect keystrokes count as errors and show the expected key; the learner can retry immediately. Key repeat and modifier shortcuts are ignored. Lowercase targets accept the matching letter when Caps Lock is on, while uppercase targets still require uppercase. The game pauses when the browser window loses focus.

## Progress and Results

The side panel shows WPM, accuracy, errors, correct characters, words, progress, elapsed time, score, current target, lesson and pattern, personal bests, and the last result. The completion dialog shows the final metrics and animal.

- **Accuracy:** correct keystrokes ÷ total typing keystrokes × 100.
- **WPM:** (correct characters ÷ 5) ÷ elapsed minutes.
- **Score:** WPM × (accuracy ÷ 100).

The animal is reassessed after every four correct non-space characters (including numbers and punctuation). Speed is measured over that group, including time spent correcting errors and excluding paused time. The animal stays the same when speed remains in the same band. Speed thresholds in WPM: Snail 0, Turtle 8, Elephant 14, Rabbit 20, Deer 28, Horse 36, Ostrich 45, Cheetah 55. Animals use natural-colored, side-view running poses. Choose Real World Animals (lifelike), Chibi Animals, Dinosaurs, or Famous Anime Characters in Setup. Every set has eight speed levels using the same thresholds. The animal sets retain the order above; dinosaur and anime order is a game progression, not a claim about real or canonical speeds. The selected set is saved locally. All characters share a square display box of 59.8–117 pixels, enlarged by 30%, with artwork scaled proportionally and aligned to the ground. Snails crawl and turtles walk naturally; other characters have running poses. Images are static running poses with gentle movement during play, not frame-by-frame run animations.

## Saved Data and Privacy

Preferences, player records, per-lesson bests, and recent results are stored in the browser's local storage under `animalTyping.v1`. **Reset Setup Defaults** restores the configured preferences while keeping records. **Reset All Saved Data** removes preferences and records after confirmation.

No analytics, ads, login, cloud sync, or required runtime network requests are used. Clearing Chrome's site data can remove saved progress.

## Limitations

- Tested in Chrome only.
- Persistence requires browser local storage.

## Project Files

- `index.html` — game screen and dialogs.
- `config/game-config.json` — lessons, keyboard, animal tiers, and defaults.
- `config/game-config.runtime.js` — matching configuration for opening the game directly from local files.
- `css/app.css` — layout and visual styles.
- `js/` — typing, lesson progression, animal behavior, storage, audio, keyboard, and UI code.
- `assets/` — local backgrounds, animals, icons, sounds, and Bootstrap files.
- `scripts/import-typing-lessons.js` — imports the 80-lesson Markdown course into both configuration files during development.

When editing lesson or animal configuration manually, keep the JSON and runtime JavaScript files synchronized.
