require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// Database pool
// ---------------------------------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }, // Aiven requires SSL
});

<<<<<<< HEAD
// Helper: run a plain SELECT/INSERT/UPDATE/DELETE and return rows
=======
// Helper: run a query and return rows
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

<<<<<<< HEAD
// Helper: run a CALL to a stored procedure and return just the first
// result set's rows. mysql2 returns CALL results as:
//   [ [ <rows of 1st result set>, ..., OkPacket ], fields ]
// so this needs one extra unwrap compared to a plain query.
async function callProcedure(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return result[0]; // rows of the first (and usually only) result set
}

=======
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
// Helper: send a friendly error message extracted from a MySQL error
function dbErrorMessage(err) {
  // SIGNAL SQLSTATE '45000' errors surface as err.sqlMessage
  return err.sqlMessage || err.message || "Lỗi cơ sở dữ liệu không xác định";
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, message: "Kết nối cơ sở dữ liệu thành công" });
  } catch (err) {
    res.status(500).json({ ok: false, message: dbErrorMessage(err) });
  }
});

// ===========================================================================
// PHÒNG KTX (PhongKTX)
// ===========================================================================

// Lấy danh sách tất cả phòng
app.get("/api/phong", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM PhongKTX ORDER BY MaPhong");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// Lấy 1 phòng theo mã
app.get("/api/phong/:maPhong", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM PhongKTX WHERE MaPhong = ?", [
      req.params.maPhong,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// Thêm phòng mới -> dùng sp_ThemPhongMoi (trigger trg_KiemTraSucChuaPhong sẽ chặn nếu > 10)
app.post("/api/phong", async (req, res) => {
  const { MaPhong, TenPhong, SoLuongToiDa, GiaPhong, KhuVuc } = req.body;
  if (!MaPhong || !TenPhong || !SoLuongToiDa || !GiaPhong || !KhuVuc) {
    return res.status(400).json({ message: "Thiếu thông tin phòng" });
  }
  try {
<<<<<<< HEAD
    const rows = await callProcedure("CALL sp_ThemPhongMoi(?, ?, ?, ?, ?)", [
=======
    const rows = await query("CALL sp_ThemPhongMoi(?, ?, ?, ?, ?)", [
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
      MaPhong,
      TenPhong,
      SoLuongToiDa,
      GiaPhong,
      KhuVuc,
    ]);
<<<<<<< HEAD
    const result = rows[0];
    // sp_ThemPhongMoi returns a plain "Mã phòng đã tồn tại!" message on conflict
    // instead of signaling an error, so detect that case and report it as a 400.
    if (
      result &&
      typeof result.Message === "string" &&
      result.Message.includes("đã tồn tại")
    ) {
      return res.status(400).json(result);
    }
    res.json(result);
=======
    res.json(rows[0][0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// Sửa giá phòng -> dùng sp_SuaGiaPhong
app.put("/api/phong/:maPhong/gia", async (req, res) => {
  const { GiaPhongMoi } = req.body;
<<<<<<< HEAD
  if (GiaPhongMoi === undefined || GiaPhongMoi === null || GiaPhongMoi === "") {
    return res.status(400).json({ message: "Thiếu giá phòng mới" });
  }
  try {
    const rows = await callProcedure("CALL sp_SuaGiaPhong(?, ?)", [
      req.params.maPhong,
      GiaPhongMoi,
    ]);
    const result = rows[0];
    if (
      result &&
      typeof result.Message === "string" &&
      result.Message.includes("Không tìm thấy")
    ) {
      return res.status(404).json(result);
    }
    res.json(result);
=======
  if (GiaPhongMoi === undefined)
    return res.status(400).json({ message: "Thiếu giá phòng mới" });
  try {
    const rows = await query("CALL sp_SuaGiaPhong(?, ?)", [
      req.params.maPhong,
      GiaPhongMoi,
    ]);
    res.json(rows[0][0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// Xóa phòng -> dùng sp_XoaPhongKTX (trigger trg_ChanXoaPhong_CoSinhVien sẽ chặn nếu còn SV)
app.delete("/api/phong/:maPhong", async (req, res) => {
  try {
<<<<<<< HEAD
    const rows = await callProcedure("CALL sp_XoaPhongKTX(?)", [
      req.params.maPhong,
    ]);
    res.json(rows[0]);
=======
    const rows = await query("CALL sp_XoaPhongKTX(?)", [req.params.maPhong]);
    res.json(rows[0][0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

<<<<<<< HEAD
// Tìm kiếm phòng theo mã hoặc tên phòng (LIKE search, vì SQL gốc không có
// procedure tìm phòng — chỉ có tìm sinh viên theo phòng)
app.get("/api/phong/tim-kiem/:tuKhoa", async (req, res) => {
  try {
    const tuKhoa = `%${req.params.tuKhoa}%`;
    const rows = await query(
      "SELECT * FROM PhongKTX WHERE MaPhong LIKE ? OR TenPhong LIKE ? ORDER BY MaPhong",
      [tuKhoa, tuKhoa],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

=======
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
// View: Thống kê phòng trống
app.get("/api/phong/thong-ke/trong", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM View_ThongKePhongTrong");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// View: Danh sách sinh viên theo phòng (tất cả phòng)
app.get("/api/phong/danh-sach-sinh-vien", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM View_DanhSachSinhVienTheoPhong");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// Procedure: Tìm sinh viên theo 1 phòng cụ thể
app.get("/api/phong/:maPhong/sinh-vien", async (req, res) => {
  try {
<<<<<<< HEAD
    const rows = await callProcedure("CALL TimSinhVienTheoPhong(?)", [
      req.params.maPhong,
    ]);
    res.json(rows);
=======
    const rows = await query("CALL TimSinhVienTheoPhong(?)", [
      req.params.maPhong,
    ]);
    res.json(rows[0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// ===========================================================================
// SINH VIÊN (SinhVien)
// ===========================================================================

// Danh sách tất cả sinh viên
app.get("/api/sinhvien", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM SinhVien ORDER BY MaSV");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// Tìm sinh viên theo mã -> dùng TimSinhVien
app.get("/api/sinhvien/:maSV", async (req, res) => {
  try {
<<<<<<< HEAD
    const rows = await callProcedure("CALL TimSinhVien(?)", [req.params.maSV]);
    if (rows.length === 1 && rows[0].ThongBao) {
      return res.status(404).json({ message: rows[0].ThongBao });
    }
    res.json(rows);
=======
    const rows = await query("CALL TimSinhVien(?)", [req.params.maSV]);
    res.json(rows[0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// Tìm sinh viên theo tên -> dùng TimSinhVienTheoTen
app.get("/api/sinhvien/tim-kiem/ten/:ten", async (req, res) => {
  try {
<<<<<<< HEAD
    const rows = await callProcedure("CALL TimSinhVienTheoTen(?)", [
      req.params.ten,
    ]);
    res.json(rows);
=======
    const rows = await query("CALL TimSinhVienTheoTen(?)", [req.params.ten]);
    res.json(rows[0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// Thêm sinh viên + hợp đồng + hóa đơn cùng lúc -> sp_ThemSinhVienVaHopDong
app.post("/api/sinhvien/full", async (req, res) => {
  const {
    MaSV,
    HoTen,
    NgaySinh,
    GioiTinh,
    DiaChi,
    SDT,
    MaPhong,
    MaHD,
    NgayBD,
    NgayKT,
    MaHoaDon,
    SoTien,
  } = req.body;

  const required = {
    MaSV,
    HoTen,
    NgaySinh,
    GioiTinh,
    DiaChi,
    SDT,
    MaPhong,
    MaHD,
    NgayBD,
    NgayKT,
    MaHoaDon,
    SoTien,
  };
  for (const [key, val] of Object.entries(required)) {
    if (val === undefined || val === null || val === "") {
      return res.status(400).json({ message: `Thiếu thông tin: ${key}` });
    }
  }

  try {
<<<<<<< HEAD
    const rows = await callProcedure(
=======
    const rows = await query(
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
      "CALL sp_ThemSinhVienVaHopDong(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        MaSV,
        HoTen,
        NgaySinh,
        GioiTinh,
        DiaChi,
        SDT,
        MaPhong,
        MaHD,
        NgayBD,
        NgayKT,
        MaHoaDon,
        SoTien,
      ],
    );
<<<<<<< HEAD
    const result = rows[0];
    if (
      result &&
      typeof result.Message === "string" &&
      result.Message.includes("thất bại")
    ) {
      return res.status(400).json(result);
    }
    res.json(result);
=======
    res.json(rows[0][0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// Sửa thông tin sinh viên -> sp_SuaThongTinSinhVien
app.put("/api/sinhvien/:maSV", async (req, res) => {
  const { HoVaTen, DiaChi, SoDienThoai } = req.body;
  if (!HoVaTen || !DiaChi || !SoDienThoai) {
    return res.status(400).json({ message: "Thiếu thông tin cần sửa" });
  }
  try {
<<<<<<< HEAD
    const rows = await callProcedure(
      "CALL sp_SuaThongTinSinhVien(?, ?, ?, ?)",
      [req.params.maSV, HoVaTen, DiaChi, SoDienThoai],
    );
    const result = rows[0];
    if (
      result &&
      typeof result.Message === "string" &&
      result.Message.includes("Không tìm thấy")
    ) {
      return res.status(404).json(result);
    }
    res.json(result);
=======
    const rows = await query("CALL sp_SuaThongTinSinhVien(?, ?, ?, ?)", [
      req.params.maSV,
      HoVaTen,
      DiaChi,
      SoDienThoai,
    ]);
    res.json(rows[0][0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// Xóa sinh viên -> sp_XoaSinhVien (xóa luôn hóa đơn/hợp đồng liên quan, trigger trừ sĩ số phòng)
app.delete("/api/sinhvien/:maSV", async (req, res) => {
  try {
<<<<<<< HEAD
    const rows = await callProcedure("CALL sp_XoaSinhVien(?)", [
      req.params.maSV,
    ]);
    res.json(rows[0]);
=======
    const rows = await query("CALL sp_XoaSinhVien(?)", [req.params.maSV]);
    res.json(rows[0][0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// View: Thống kê sinh viên theo khu vực
app.get("/api/sinhvien/thong-ke/khu-vuc", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM View_ThongKeSinhVienTheoKhu");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// ===========================================================================
// HỢP ĐỒNG (HopDong)
// ===========================================================================

// Danh sách tất cả hợp đồng (kèm tên SV và tên phòng cho dễ đọc)
app.get("/api/hopdong", async (req, res) => {
  try {
    const rows = await query(`
      SELECT hd.*, sv.HoVaTen, p.TenPhong
      FROM HopDong hd
      JOIN SinhVien sv ON hd.MaSV = sv.MaSV
      JOIN PhongKTX p ON hd.MaPhong = p.MaPhong
      ORDER BY hd.MaHopDong
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// Thống kê số lượng hợp đồng theo trạng thái -> sp_ThongKeHopDongTheoTrangThai
app.get("/api/hopdong/thong-ke", async (req, res) => {
  try {
    const trangThai = req.query.trangThai || null;
<<<<<<< HEAD
    const rows = await callProcedure("CALL sp_ThongKeHopDongTheoTrangThai(?)", [
      trangThai,
    ]);
    res.json(rows);
=======
    const rows = await query("CALL sp_ThongKeHopDongTheoTrangThai(?)", [
      trangThai,
    ]);
    res.json(rows[0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// Cập nhật trạng thái hợp đồng (CRUD đơn giản, không có sẵn procedure trong SQL gốc)
app.put("/api/hopdong/:maHopDong/trang-thai", async (req, res) => {
  const { TrangThai } = req.body;
  const valid = ["Hoạt động", "Hết hạn", "Hủy"];
  if (!valid.includes(TrangThai)) {
    return res
      .status(400)
      .json({ message: `Trạng thái phải là một trong: ${valid.join(", ")}` });
  }
  try {
    const result = await query(
      "UPDATE HopDong SET TrangThai = ? WHERE MaHopDong = ?",
      [TrangThai, req.params.maHopDong],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
    }
    res.json({
      Message: `Đã cập nhật trạng thái hợp đồng ${req.params.maHopDong} thành ${TrangThai}`,
    });
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// ===========================================================================
// HÓA ĐƠN (HoaDon)
// ===========================================================================

// Danh sách tất cả hóa đơn (kèm tên SV cho dễ đọc)
app.get("/api/hoadon", async (req, res) => {
  try {
    const rows = await query(`
      SELECT hdon.*, sv.HoVaTen
      FROM HoaDon hdon
      JOIN SinhVien sv ON hdon.MaSV = sv.MaSV
      ORDER BY hdon.MaHoaDon
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// View: Hóa đơn chưa thanh toán
app.get("/api/hoadon/chua-thanh-toan", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM View_HoaDonChuaThanhToan");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// Cập nhật trạng thái thanh toán hóa đơn -> sp_CapNhatTrangThaiHoaDon
app.put("/api/hoadon/:maHoaDon/trang-thai", async (req, res) => {
  const { TrangThai } = req.body;
  const valid = ["Đã thanh toán", "Chưa thanh toán"];
  if (!valid.includes(TrangThai)) {
    return res
      .status(400)
      .json({ message: `Trạng thái phải là một trong: ${valid.join(", ")}` });
  }
  try {
<<<<<<< HEAD
    const rows = await callProcedure("CALL sp_CapNhatTrangThaiHoaDon(?, ?)", [
      req.params.maHoaDon,
      TrangThai,
    ]);
    const result = rows[0];
    if (
      result &&
      typeof result.Message === "string" &&
      result.Message.includes("Không tìm thấy")
    ) {
      return res.status(404).json(result);
    }
    res.json(result);
=======
    const rows = await query("CALL sp_CapNhatTrangThaiHoaDon(?, ?)", [
      req.params.maHoaDon,
      TrangThai,
    ]);
    res.json(rows[0][0]);
>>>>>>> e5bfa817091ae8f8aaf4eaf204c1774eafd041b2
  } catch (err) {
    res.status(400).json({ message: dbErrorMessage(err) });
  }
});

// Function: Tổng doanh thu KTX -> fn_TinhTongDoanhThu
app.get("/api/hoadon/tong-doanh-thu", async (req, res) => {
  try {
    const rows = await query("SELECT fn_TinhTongDoanhThu() AS TongDoanhThu");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// ===========================================================================
// DASHBOARD SUMMARY (tổng hợp nhiều chỉ số cho trang chủ)
// ===========================================================================
app.get("/api/dashboard", async (req, res) => {
  try {
    const [phong] = await pool.query("SELECT COUNT(*) AS total FROM PhongKTX");
    const [sv] = await pool.query("SELECT COUNT(*) AS total FROM SinhVien");
    const [hd] = await pool.query("SELECT COUNT(*) AS total FROM HopDong");
    const [hoaDonChuaTT] = await pool.query(
      "SELECT COUNT(*) AS total FROM HoaDon WHERE TrangThai = 'Chưa thanh toán'",
    );
    const [doanhThu] = await pool.query(
      "SELECT fn_TinhTongDoanhThu() AS TongDoanhThu",
    );
    const [phongTrong] = await pool.query(
      "SELECT COUNT(*) AS total FROM View_ThongKePhongTrong",
    );

    res.json({
      soPhong: phong[0].total,
      soSinhVien: sv[0].total,
      soHopDong: hd[0].total,
      hoaDonChuaThanhToan: hoaDonChuaTT[0].total,
      tongDoanhThu: doanhThu[0].TongDoanhThu,
      soPhongTrong: phongTrong[0].total,
    });
  } catch (err) {
    res.status(500).json({ message: dbErrorMessage(err) });
  }
});

// ---------------------------------------------------------------------------
// Fallback: serve SPA index.html for any other GET (not /api)
// ---------------------------------------------------------------------------
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🏠 Quản lý KTX server đang chạy tại http://localhost:${PORT}`);
});
