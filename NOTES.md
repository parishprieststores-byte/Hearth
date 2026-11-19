# Hearth notes
Setup: Firebase console > new project > add Web app (paste config into CFG in index.html) > Authentication: enable Email/Password > Firestore: create DB, paste firestore.rules > Authentication settings: add your GitHub Pages domain to authorized domains. Deploy all files in this folder to GitHub Pages.
Decisions: Firestore + Auth only (Storage needs a paid plan); photos are compressed to ~800px JPEG inside the message doc; ticks: 1 = sending, 2 grey = saved on server, 2 green = read.
Known issues: see delivery report.

v2: sound ping when a new message arrives (while app is open; Web Audio, mute button), voice notes (MediaRecorder, max 60 s, stored in message doc, 900k-char guard). Not built: push when app closed (needs Blaze plan), live calls.
Known issues: nothing runtime-tested; real-device checks pending.
