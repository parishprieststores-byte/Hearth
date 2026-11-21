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

v7: message actions (react, star, edit, delete, hide) now show a clear message when the database refuses the change (usually firestore.rules not republished) instead of failing silently. Reported symptom: reactions vanish right after tapping (cause not confirmed; most likely v5 rules not published, because the app shows the write locally and the server then rejects it).

v8: Enter inserts a new line (send button or Ctrl/Cmd+Enter sends); composer fixed to the bottom (scroll areas get min-height:0, viewport interactive-widget=resizes-content); swipe right on a message to reply; message menu on long press (tap does nothing); Nunito font via Google Fonts (cached by the service worker after first load, system fallback) and WhatsApp-style *bold* _italic_ ~strike~ `mono` in messages; modals join the history stack so the Android back gesture closes the open sheet first; ticks: one = sending, two grey = saved on server (NOT device delivery), green = every other member has opened the chat.

v9: Profile tab shows 'Version 9' and an 'Update app' button (unregisters this app's service worker, deletes hearth-* caches only, reloads; other sites and saved data untouched). Service worker cache name is hearth-v10 so the worker file changes and installs. To check what is deployed, open <site>/sw.js and read the first line.

v10: service worker rewritten from Canon's pattern: network-first shell with 6 s timeout and one canonical saved index.html, SHA-256 compare + 'update ready' banner, per-file precache (Firebase 10.12.2 and font CSS included), cache-first for pinned vendor files. FIXES: older Hearth workers deleted EVERY cache not named after Hearth, which could wipe other apps' offline caches on the same address; v9's 'Update app' unregistered EVERY service worker on the address. Both now only touch Hearth's own ('hearth-' caches, current scope). Cache name hearth-shell-v1: bump only when the precache list changes.
