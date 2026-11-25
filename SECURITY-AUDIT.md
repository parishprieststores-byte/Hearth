# Hearth security audit (v14 -> 2.0 P0)
Method: code and rules reading only. Nothing was executed against a live Firebase project. Status of every fix below: Untested until you publish and test it.

| # | Finding in v14 | Severity | P0 action |
|---|---|---|---|
| 1 | Any signed-in user could read every user doc, including email | High | Email no longer stored; each user's old email field is deleted at next sign-in. Rules still let signed-in users read name, photo, about, birthday (if shared), updates, last seen (needed for search, birthdays, Updates). Real privacy needs the contacts/privacy phase. |
| 2 | Any chat member could rewrite another member's reactions, stars, hidden flags, read marks | Medium | Rules now allow a member to change only their own uid entry (readBy, starredBy, hiddenFor, reactions). |
| 3 | Any member could set typing, delivered, pin, mute, archive, folder, names for other members | Low-Med | Per-user maps restricted to the caller's own uid. |
| 4 | Chat create only required the creator to be a member: forged chat ids, unlimited members | Medium | Direct chat id must equal the two sorted uids; saved chat id is uid_self; group needs 3+ members, max 256, creator recorded as sole admin. |
| 5 | Group rename, photo, members changeable by any member | Medium | New groups: admins only. Legacy groups (no admins list): every member stays admin so nothing breaks. Leaving a group is allowed for any member. |
| 6 | No limits on message text or fields | Low | Message keys whitelisted, text max 4000, timestamp must be server time. |
| 7 | User doc accepted any fields | Low | Field whitelist and size checks. Own-doc delete allowed (needed for account deletion later). |

Residual risks (not fixed in P0)
- Any member can change anyone's unread counter (nuisance only).
- Any signed-in user can start a chat with any other user. Blocking needs a later phase.
- No App Check, no rate limiting, no E2EE: messages are readable by Firebase/Google. Do not call Hearth end-to-end encrypted.
- Rules use get() on the chat for every message read or write; on the free plan this counts toward the 50,000 reads/day quota.
- Rules were written but NOT run in the Firebase emulator. Publish, then run the checklist in NOTES.md.

P1 addendum: chunk documents are readable only by chat members; only the uploader can create or delete them; size and naming are checked by the rules. Blocking of programs and scripts is done in the app only (a modified client could bypass it). Files are not scanned for malware and are not end-to-end encrypted.
