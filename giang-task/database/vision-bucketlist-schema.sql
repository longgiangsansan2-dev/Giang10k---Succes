-- =============================================
-- VISION BOARD & BUCKETLIST SCHEMA
-- Chạy script này trong Supabase SQL Editor
-- =============================================

-- 1. Bảng Vision Goals (Mục tiêu theo 6 category)
CREATE TABLE IF NOT EXISTS vision_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('finance', 'work', 'personal_development', 'health', 'relationships', 'experiences')),
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Vision Statement (Tuyên bố cá nhân)
CREATE TABLE IF NOT EXISTS vision_statement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Bucketlist Items
CREATE TABLE IF NOT EXISTS bucketlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_base64 TEXT, -- Lưu hình ảnh dạng base64
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE vision_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_statement ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucketlist_items ENABLE ROW LEVEL SECURITY;

-- Policies cho vision_goals
CREATE POLICY "Users can view own vision goals" ON vision_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vision goals" ON vision_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vision goals" ON vision_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vision goals" ON vision_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Policies cho vision_statement
CREATE POLICY "Users can view own vision statement" ON vision_statement
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vision statement" ON vision_statement
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vision statement" ON vision_statement
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vision statement" ON vision_statement
  FOR DELETE USING (auth.uid() = user_id);

-- Policies cho bucketlist_items
CREATE POLICY "Users can view own bucketlist items" ON bucketlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bucketlist items" ON bucketlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bucketlist items" ON bucketlist_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bucketlist items" ON bucketlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_vision_goals_user_category ON vision_goals(user_id, category);
CREATE INDEX IF NOT EXISTS idx_vision_goals_order ON vision_goals(order_index);
CREATE INDEX IF NOT EXISTS idx_bucketlist_user ON bucketlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_bucketlist_order ON bucketlist_items(order_index);

-- =============================================
-- SAMPLE DATA (Tùy chọn - Dựa trên Vision Board của Giang)
-- Chạy sau khi đã đăng nhập để lấy user_id
-- =============================================

/*
-- Uncomment và chạy sau khi có user_id

-- Vision Goals - Tài chính
INSERT INTO vision_goals (user_id, category, title, description, order_index) VALUES
('YOUR_USER_ID', 'finance', 'KPI 14,5 tỷ/năm mảng đào tạo', 'All-in vào Sansan Academy', 0),
('YOUR_USER_ID', 'finance', 'Tài khoản vợ (San San): +8 tỷ', NULL, 1),
('YOUR_USER_ID', 'finance', 'Ảnh + TMĐT: 180 triệu/tháng thụ động', '80tr sinh hoạt + 100tr dự phòng/đầu tư', 2),
('YOUR_USER_ID', 'finance', 'Đầu tư: +20%/năm portfolio', NULL, 3),
('YOUR_USER_ID', 'finance', 'Thoát vị thế crypto', NULL, 4),
('YOUR_USER_ID', 'finance', 'Vận hành xong 1 BĐS dòng tiền', NULL, 5),
('YOUR_USER_ID', 'finance', 'Lên kế hoạch BĐS thứ 2', NULL, 6),
('YOUR_USER_ID', 'finance', 'Thêm 1 loại tài sản mới vào portfolio', NULL, 7),
('YOUR_USER_ID', 'finance', 'Setup hệ thống tài chính gia đình', 'Quỹ khẩn cấp, đầu tư, du lịch', 8),
('YOUR_USER_ID', 'finance', 'Tạo dashboard theo dõi tài chính cá nhân', NULL, 9),
('YOUR_USER_ID', 'finance', 'Mua xe 7 chỗ cũ ~500 triệu', NULL, 10);

-- Vision Goals - Công việc
INSERT INTO vision_goals (user_id, category, title, description, order_index) VALUES
('YOUR_USER_ID', 'work', 'All-in mảng đào tạo', NULL, 0),
('YOUR_USER_ID', 'work', 'Kiến trúc sư phía sau - support vợ tỏa sáng', NULL, 1),
('YOUR_USER_ID', 'work', 'Build team 15 người Sale + Marketing', 'Cho mảng đào tạo', 2),
('YOUR_USER_ID', 'work', '1 cuộc họp chiến lược/tháng (Media + TMĐT)', NULL, 3),
('YOUR_USER_ID', 'work', 'Chuẩn hóa hệ thống, sàng lọc thuế', NULL, 4);

-- Vision Goals - Phát triển bản thân
INSERT INTO vision_goals (user_id, category, title, description, order_index) VALUES
('YOUR_USER_ID', 'personal_development', 'Trầm tính hơn, suy nghĩ sâu hơn', NULL, 0),
('YOUR_USER_ID', 'personal_development', 'Đọc 100 cuốn sách', NULL, 1),
('YOUR_USER_ID', 'personal_development', 'Số hóa 100 cuốn sách → xây kênh MXH về sách', NULL, 2),
('YOUR_USER_ID', 'personal_development', 'Học từ 1 guru quốc tế', NULL, 3),
('YOUR_USER_ID', 'personal_development', 'Học tài chính SMC', NULL, 4),
('YOUR_USER_ID', 'personal_development', 'Học BĐS dòng tiền', NULL, 5),
('YOUR_USER_ID', 'personal_development', 'Học chiến lược đầu tư bền vững', NULL, 6),
('YOUR_USER_ID', 'personal_development', 'Học Content + AI + Automation', NULL, 7),
('YOUR_USER_ID', 'personal_development', 'Học quản trị đội nhóm 15 người', NULL, 8),
('YOUR_USER_ID', 'personal_development', 'Ngủ 11h – Dậy 5h', NULL, 9),
('YOUR_USER_ID', 'personal_development', 'Thiền định mỗi sáng', NULL, 10),
('YOUR_USER_ID', 'personal_development', '1h/ngày quay vào bên trong', NULL, 11),
('YOUR_USER_ID', 'personal_development', 'Duy trì bảng DMO hàng ngày', NULL, 12),
('YOUR_USER_ID', 'personal_development', 'Ghi chú mọi thứ trong công việc', NULL, 13);

-- Vision Goals - Sức khỏe
INSERT INTO vision_goals (user_id, category, title, description, order_index) VALUES
('YOUR_USER_ID', 'health', 'Giảm cân về 70kg', NULL, 0),
('YOUR_USER_ID', 'health', 'Tuổi cơ thể về 30', NULL, 1),
('YOUR_USER_ID', 'health', 'Giảm mỡ nội tạng', NULL, 2),
('YOUR_USER_ID', 'health', 'Chạy bộ 5 buổi/tuần', NULL, 3),
('YOUR_USER_ID', 'health', 'Chạy 1000km trong năm', NULL, 4),
('YOUR_USER_ID', 'health', '2 huy chương Half Marathon (21km)', NULL, 5),
('YOUR_USER_ID', 'health', '1 huy chương Full Marathon (42km)', NULL, 6),
('YOUR_USER_ID', 'health', '1 giải chạy trail', NULL, 7),
('YOUR_USER_ID', 'health', 'Gym giai đoạn đầu', NULL, 8),
('YOUR_USER_ID', 'health', 'Ăn thanh đạm, nhịn ăn gián đoạn 16:8', NULL, 9),
('YOUR_USER_ID', 'health', 'Khám sức khỏe tổng quát 1 lần/năm', NULL, 10);

-- Vision Goals - Mối quan hệ
INSERT INTO vision_goals (user_id, category, title, description, order_index) VALUES
('YOUR_USER_ID', 'relationships', 'Dành thời gian cho vợ và 2 con', 'Vừng & Mè', 0),
('YOUR_USER_ID', 'relationships', 'Xây Elite 10 người tinh hoa', 'Ít nhưng chất, chậm mà chắc', 1),
('YOUR_USER_ID', 'relationships', 'Phát triển cộng đồng AI + Automation', NULL, 2),
('YOUR_USER_ID', 'relationships', 'Tham gia cộng đồng offline mới', NULL, 3),
('YOUR_USER_ID', 'relationships', 'Cho đi giá trị, kết nối', NULL, 4);

-- Vision Goals - Trải nghiệm
INSERT INTO vision_goals (user_id, category, title, description, order_index) VALUES
('YOUR_USER_ID', 'experiences', '30 ngày du lịch/năm', 'TQ, Sapa, SG/Indo, Măng Đen', 0),
('YOUR_USER_ID', 'experiences', 'Vipassana 7 ngày', NULL, 1),
('YOUR_USER_ID', 'experiences', 'Lặn biển tại Indo', NULL, 2),
('YOUR_USER_ID', 'experiences', 'Leo Fansipan', NULL, 3),
('YOUR_USER_ID', 'experiences', 'Xe máy xuyên Hà Giang', NULL, 4),
('YOUR_USER_ID', 'experiences', 'Cắm trại qua đêm cùng gia đình', NULL, 5),
('YOUR_USER_ID', 'experiences', '1 ngày digital detox', NULL, 6),
('YOUR_USER_ID', 'experiences', 'Đám cưới + Thôi nôi Mè: 16/12/2026', NULL, 7),
('YOUR_USER_ID', 'experiences', 'Vừng vào lớp 1 trường quốc tế', NULL, 8),
('YOUR_USER_ID', 'experiences', 'Vừng chạy giải 5km', NULL, 9);

-- Bucketlist Items
INSERT INTO bucketlist_items (user_id, title, description, order_index) VALUES
('YOUR_USER_ID', 'Vipassana 7 ngày', 'Thiền Vipassana im lặng 7 ngày', 0),
('YOUR_USER_ID', 'Lặn biển tại Indo', 'Scuba diving ở Indonesia', 1),
('YOUR_USER_ID', 'Leo Fansipan', 'Chinh phục đỉnh Fansipan', 2),
('YOUR_USER_ID', 'Xe máy xuyên Hà Giang', 'Road trip xuyên Hà Giang', 3),
('YOUR_USER_ID', 'Cắm trại qua đêm cùng gia đình', NULL, 4),
('YOUR_USER_ID', '1 ngày digital detox', 'Không điện thoại, laptop', 5),
('YOUR_USER_ID', '2 giải Half Marathon (21km)', NULL, 6),
('YOUR_USER_ID', '1 giải Full Marathon (42km)', NULL, 7),
('YOUR_USER_ID', '1 giải chạy trail', NULL, 8),
('YOUR_USER_ID', 'Chạy tổng 1000km trong năm', NULL, 9),
('YOUR_USER_ID', 'Vừng hoàn thành giải 5km', NULL, 10),
('YOUR_USER_ID', 'Đọc 100 cuốn sách', NULL, 11),
('YOUR_USER_ID', 'Số hóa & xây kênh MXH về sách', NULL, 12),
('YOUR_USER_ID', 'Học từ 1 guru quốc tế', NULL, 13),
('YOUR_USER_ID', 'Vận hành xong 1 BĐS dòng tiền', NULL, 14),
('YOUR_USER_ID', 'Lên kế hoạch BĐS thứ 2', NULL, 15),
('YOUR_USER_ID', 'Thoát vị thế crypto', NULL, 16),
('YOUR_USER_ID', 'Thêm 1 loại tài sản mới', NULL, 17),
('YOUR_USER_ID', 'Setup hệ thống tài chính gia đình', NULL, 18),
('YOUR_USER_ID', 'Tạo dashboard tài chính cá nhân', NULL, 19),
('YOUR_USER_ID', 'Mua xe 7 chỗ ~500 triệu', NULL, 20),
('YOUR_USER_ID', 'Đám cưới + Thôi nôi Mè: 16/12/2026', NULL, 21),
('YOUR_USER_ID', 'Vừng vào lớp 1 trường quốc tế', NULL, 22),
('YOUR_USER_ID', 'Từ thiện', NULL, 23),
('YOUR_USER_ID', 'Hỗ trợ cộng đồng học viên', NULL, 24);

-- Vision Statement
INSERT INTO vision_statement (user_id, content) VALUES
('YOUR_USER_ID', 'Năm 2026, tôi chọn sống có chủ đích.

Tôi là kiến trúc sư phía sau – xây hệ thống, support vợ tỏa sáng, để Sansan Academy đạt 14,5 tỷ và vợ tôi +8 tỷ trong năm nay.

Tôi cam kết build đội ngũ 15 người Sale + Marketing – không chỉ là con số, mà là những con người kỷ luật, trưởng thành mỗi ngày.

Tôi giữ mảng Media và TMĐT chạy thụ động 180 triệu/tháng – để tôi có thời gian cho những việc tạo đột phá.

Tôi đầu tư thông minh, tăng trưởng bền vững 20%/năm – bằng tư duy dài hạn và kỷ luật cảm xúc.

Tôi đọc 100 cuốn sách, số hóa và chia sẻ cho cộng đồng – vì người muốn cho đi phải luôn nạp vào trước.

Tôi học từ guru quốc tế, học tài chính SMC, học BĐS dòng tiền – vì người muốn dẫn đầu phải luôn là người học trước.

Tôi chinh phục 2 Half Marathon, 1 Full Marathon, 1 Trail và chạy 1000km trong năm – không phải vì huy chương, mà vì tôi muốn nhắc mình rằng: giới hạn chỉ tồn tại khi ta cho phép nó tồn tại.

Tôi về 70kg, tuổi cơ thể 30 – vì tôi muốn sống khỏe để tận hưởng thành quả.

Tôi dậy 5h, thiền định mỗi sáng, dành 1h/ngày quay vào bên trong – vì tôi muốn trầm tính hơn, suy nghĩ sâu hơn.

Tôi sẽ đi 1 chuyến Vipassana 7 ngày, leo Fansipan, lặn biển tại Indo, xuyên xe máy Hà Giang – vì cuộc sống cần những trải nghiệm đáng nhớ.

Tôi dành 30 ngày trong năm để du lịch cùng vợ con – vì tiền tôi kiếm là để mua lại thời gian cho gia đình.

Tôi tổ chức đám cưới với vợ vào ngày 16/12/2026 – ngày thôi nôi của Mè – một cột mốc trọn vẹn cho gia đình 4 người.

Tôi xây 1 cộng đồng riêng Elite 10 người tinh hoa – ít nhưng chất, chậm mà chắc, đi cùng nhau nhưng đi rất xa, phát triển đa lĩnh vực về tài chính, đầu tư, sức khỏe, mối quan hệ.

Tôi cho đi giá trị, tôi kết nối, tôi từ thiện – vì thành công chỉ có ý nghĩa khi được chia sẻ.

Đây là cam kết của tôi với chính mình.

Năm 2026, tôi đã chọn như vậy.');

*/
