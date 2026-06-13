# Phase 2 — Manual & Automated Test Cases

**Status:** ✅ Complete — automated 12/12 pass; manual OAuth flows verified on production  
**App:** https://monopolywebgame.vercel.app  
**PartyKit:** `monopoly-game.trangduynguyen.partykit.dev`  
**Date:** 2026-06-13

---

## Automated (script: `npm run verify:phase2`)

| ID | Mô tả | Cách kiểm tra | Kỳ vọng |
|----|--------|---------------|---------|
| A01 | Route bảo vệ | GET `/` không cookie → redirect | 307 → `/login` |
| A02 | OAuth providers | GET `/api/auth/providers` | JSON có google, github, facebook |
| A03 | Rooms API auth | POST `/api/rooms` không session | 401 |
| A04 | Game token auth | POST `/api/game-token` không session | 401 |
| A05 | WS reject no token | WS `/parties/game/TEST01` | Đóng / lỗi (không state_sync) |
| A06 | WS accept JWT | WS + JWT hợp lệ sau init room | OPEN + `state_sync` |
| A07 | Host authority | Guest token `isHost:false` init room | `ROOM_NOT_READY` hoặc không tạo state |
| A08 | 2 players join | Host + guest JWT cùng room | 2 players trong state |
| A09 | Start game | Host gửi `start_game` | `gameStatus: playing` |
| A10 | Roll dice | Host gửi `roll_dice` | `dice` có giá trị |
| A11 | Lobby WS | WS `/parties/lobby/lobby` | OPEN |
| A12 | Unit tests | `npm test` | 32/32 pass |

---

## Manual (cần browser + tài khoản OAuth)

| ID | Mô tả | Các bước | Kỳ vọng |
|----|--------|----------|---------|
| M01 | Google login | `/login` → Google → authorize | Redirect về `/`, header hiện avatar + tên |
| M02 | GitHub login | Incognito → GitHub login | Đăng nhập thành công |
| M03 | Facebook login | Incognito → Facebook login | Đăng nhập thành công (app Live hoặc Tester) |
| M04 | Logout | Bấm "Đăng xuất" | Redirect `/login`, `/` yêu cầu login lại |
| M05 | Tạo phòng | Login → Tạo phòng → vào waiting room | Host thấy phòng chờ, copy link |
| M06 | Join 2 OAuth | Browser A (Google) tạo phòng, B (GitHub) join link | 2 người trong phòng chờ |
| M07 | Start game | Host bấm "Bắt đầu game" | Cả 2 thấy bàn cờ, xúc xắc giữa bàn |
| M08 | Chơi 1 lượt | Tung xúc xắc → mua/bỏ qua | State cập nhật, lượt chuyển |
| M09 | Reconnect | Refresh tab giữa ván | Cùng userId, cùng slot, không mất chỗ |
| M10 | Public lobby | Tạo phòng công khai → `/lobby` | Phòng hiện trong danh sách |
| M11 | Token hết hạn | (Optional) Chờ >5 phút rồi reconnect | Tự lấy token mới, reconnect OK |
| M12 | UI login | `/login` | Chỉ hiện nút OAuth đã cấu hình |

---

## Ghi chú

- Automated script dùng JWT trực tiếp (bypass OAuth) — giống E2E smoke.
- Manual M01–M04 cần credentials OAuth thật trên Vercel.
- Facebook Development mode: chỉ Tester/Developer login được.
