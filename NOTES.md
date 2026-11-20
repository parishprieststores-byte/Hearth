# Hearth notes
Setup: Firebase console > new project > add Web app (paste config into CFG in index.html) > Authentication: enable Email/Password > Firestore: create DB, paste firestore.rules > Authentication settings: add your GitHub Pages domain to authorized domains. Deploy all files in this folder to GitHub Pages.
Decisions: Firestore + Auth only (Storage needs a paid plan); photos are compressed to ~800px JPEG inside the message doc; ticks: 1 = sending, 2 grey = saved on server, 2 green = read.
Known issues: see delivery report.

v2: sound ping when a new message arrives (while app is open; Web Audio, mute button), voice notes (MediaRecorder, max 60 s, stored in message doc, 900k-char guard). Not built: push when app closed (needs Blaze plan), live calls.
Known issues: nothing runtime-tested; real-device checks pending.

v3: service worker now revalidates own files with the server (cache:no-cache), installs with cache:reload, registers with updateViaCache:none, and the page reloads itself once when a new worker takes over. Fixes updates not showing in normal Chrome.

v4: show/hide password eye; pinch-zoom and long-press selection disabled (inputs still selectable); scrollbars hidden; names accept any Unicode (styled text, emoji), search normalised with NFKC, avatar = first grapheme with per-name colour; chat rows show 'You:' prefix and bold unread state.
Trade-off: zoom disabled hurts low-vision users; message text cannot be copied until a Copy action exists (planned Phase 1 long-press menu).

v5 (Phase 1 + part of Phase 2): tap a message for reply/react/copy/forward/star/edit/delete; quoted replies; reactions; day separators; unread divider; in-chat search and starred filter; chat list chips (All/Unread/Groups/Archived); pin/mute/archive (long-press a chat or use chat options); Saved messages chat; group 'who has read'; wallpaper.
Republish firestore.rules (changed: members may update readBy/reactions/starredBy/hiddenFor; sender may edit/delete own).
Residual risk: any member can alter another member's reaction/hide/star entries (rules cannot restrict per-user map keys cheaply).
NOT built yet: profile photo/about, online/last seen, group admin tools (add/remove/rename, group photo). Nothing runtime-tested.

v6: bottom tabs (Chats/Updates/Birthdays/Profile); profile (photo, about, birthday + sharing switch); Birthdays tab (today/7/30 days, send greeting, once-a-day toast); Updates tab (24h text/photo updates stored on the poster's users doc, max 6, reply via chat). firestore.rules UNCHANGED from v5 (keep v5 rules).
Privacy: everything in users docs (name, email, about, photo, birthday if shared, updates) is readable by every signed-in user. Birthday sharing off = nothing stored, so the month/day are not remembered.
Not built: channels, view counts, reactions on updates (need rules), Telegram-style shell, online/last seen, group admin. Nothing runtime-tested.
