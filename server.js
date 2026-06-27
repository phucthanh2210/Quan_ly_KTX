require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("Lỗi kết nối DB:", err);
  else console.log("Đã kết nối MySQL tại cổng 3306");
});

// Route lấy danh sách sinh viên
app.get("/api/sinhvien", (req, res) => {
  db.query("SELECT * FROM SinhVien", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.listen(process.env.PORT, () =>
  console.log("Server chạy tại http://localhost:3000"),
);
