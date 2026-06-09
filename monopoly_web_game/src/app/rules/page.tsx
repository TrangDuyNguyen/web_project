export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 prose prose-sm">
      <h1 className="text-2xl font-bold mb-4">Luật chơi</h1>
      <ul className="space-y-2 text-gray-700">
        <li>2–4 người chơi, mỗi người bắt đầu với <strong>$1,500</strong>.</li>
        <li>Đi qua XUẤT PHÁT nhận <strong>$200</strong>.</li>
        <li>Tung 2 xúc xắc, di chuyển và xử lý ô đất.</li>
        <li>Có thể mua đất chưa có chủ nếu đủ tiền.</li>
        <li>Đứng ô đất có chủ → trả tiền thuê.</li>
        <li>Tung đôi được đi thêm lượt; 3 đôi liên tiếp → vào tù.</li>
        <li>Nhà tù: trả $50, dùng thẻ ra tù, hoặc tung đôi để ra.</li>
        <li>Ô Cơ Hội / Quỹ Cộng Đồng: rút thẻ ngẫu nhiên.</li>
        <li>Phá sản (tiền &lt; 0) → bị loại.</li>
        <li>Thắng: người cuối cùng còn lại, hoặc giàu nhất khi hết vòng / host kết thúc.</li>
        <li>Mất kết nối: bot thay thế tạm trong 3 phút.</li>
      </ul>
    </div>
  );
}
