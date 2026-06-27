// =============================================================================
// Quản Lý KTX — frontend logic
// =============================================================================

const API = "/api";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function formatCurrency(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("vi-VN") + " đ";
}

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString("vi-VN");
}

function toInputDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return "";
  return date.toISOString().slice(0, 10);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

let toastTimer = null;
function showToast(message, type = "default") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className =
    "toast is-visible" +
    (type === "error" ? " is-error" : type === "success" ? " is-success" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3500);
}

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = (data && (data.message || data.Message)) || "Đã xảy ra lỗi";
    throw new Error(message);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
const viewMeta = {
  dashboard: {
    title: "Tổng quan",
    subtitle: "Toàn bộ tình hình ký túc xá trong một góc nhìn.",
  },
  phong: {
    title: "Phòng KTX",
    subtitle: "Quản lý sức chứa, giá thuê và khu vực của từng phòng.",
  },
  sinhvien: {
    title: "Sinh viên",
    subtitle: "Hồ sơ cư trú và thông tin liên hệ của sinh viên.",
  },
  hopdong: {
    title: "Hợp đồng",
    subtitle: "Thời hạn lưu trú và trạng thái hợp đồng theo từng sinh viên.",
  },
  hoadon: {
    title: "Hóa đơn",
    subtitle: "Theo dõi các khoản thu và trạng thái thanh toán.",
  },
};

function switchView(view) {
  document
    .querySelectorAll(".nav-item")
    .forEach((el) =>
      el.classList.toggle("is-active", el.dataset.view === view),
    );
  document
    .querySelectorAll(".view")
    .forEach((el) =>
      el.classList.toggle("is-active", el.id === `view-${view}`),
    );
  document.getElementById("viewTitle").textContent = viewMeta[view].title;
  document.getElementById("viewSubtitle").textContent = viewMeta[view].subtitle;

  if (view === "dashboard") loadDashboard();
  if (view === "phong") loadPhong();
  if (view === "sinhvien") loadSinhVien();
  if (view === "hopdong") loadHopDong();
  if (view === "hoadon") loadHoaDon();
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

// ---------------------------------------------------------------------------
// Modal helpers
// ---------------------------------------------------------------------------
function openModal(id) {
  document.getElementById(id).classList.add("is-open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("is-open");
}

document.querySelectorAll("[data-close]").forEach((el) => {
  el.addEventListener("click", () =>
    el.closest(".modal-backdrop").classList.remove("is-open"),
  );
});
document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.remove("is-open");
  });
});

let confirmHandler = null;
function askConfirm(title, message, actionLabel, onConfirm) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  const btn = document.getElementById("btnConfirmAction");
  btn.textContent = actionLabel;
  confirmHandler = onConfirm;
  openModal("modalConfirm");
}
document
  .getElementById("btnConfirmAction")
  .addEventListener("click", async () => {
    if (confirmHandler) await confirmHandler();
    closeModal("modalConfirm");
  });

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
async function checkHealth() {
  const dot = document.getElementById("dbStatusDot");
  const text = document.getElementById("dbStatusText");
  try {
    await api("GET", "/health");
    dot.className = "dot dot--ok";
    text.textContent = "Đã kết nối cơ sở dữ liệu";
  } catch (err) {
    dot.className = "dot dot--err";
    text.textContent = "Mất kết nối cơ sở dữ liệu";
  }
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------
async function loadDashboard() {
  try {
    const data = await api("GET", "/dashboard");
    document.getElementById("statPhong").textContent = data.soPhong;
    document.getElementById("statSV").textContent = data.soSinhVien;
    document.getElementById("statHD").textContent = data.soHopDong;
    document.getElementById("statPhongTrong").textContent = data.soPhongTrong;
    document.getElementById("statHDChuaTT").textContent =
      data.hoaDonChuaThanhToan;
    document.getElementById("statDoanhThu").textContent = formatCurrency(
      data.tongDoanhThu,
    );

    const rows = await api("GET", "/phong/thong-ke/trong");
    const tbody = document.querySelector("#tablePhongTrong tbody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Hiện không còn phòng trống.</td></tr>`;
    } else {
      tbody.innerHTML = rows
        .map(
          (r) => `
        <tr>
          <td class="mono">${escapeHtml(r.MaPhong)}</td>
          <td>${escapeHtml(r.TenPhong)}</td>
          <td>${r.SoLuongToiDa}</td>
          <td>${r.SoLuongHienTai}</td>
          <td><span class="badge badge--good">${r.SoChoTrong} chỗ</span></td>
        </tr>
      `,
        )
        .join("");
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---------------------------------------------------------------------------
// PHÒNG KTX
// ---------------------------------------------------------------------------
async function loadPhong() {
  try {
    const rows = await api("GET", "/phong");
    const tbody = document.querySelector("#tablePhong tbody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Chưa có phòng nào.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td class="mono">${escapeHtml(r.MaPhong)}</td>
        <td>${escapeHtml(r.TenPhong)}</td>
        <td><span class="badge badge--neutral">${escapeHtml(r.KhuVuc)}</span></td>
        <td>${r.SoLuongToiDa}</td>
        <td>${r.SoLuongHienTai}</td>
        <td>${formatCurrency(r.GiaPhong)}</td>
        <td class="cell-actions">
          <button class="btn--text" data-action="edit-gia" data-ma="${escapeHtml(r.MaPhong)}">Sửa giá</button>
          <button class="btn--text is-danger" data-action="delete-phong" data-ma="${escapeHtml(r.MaPhong)}">Xóa</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.querySelector("#tablePhong tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const ma = btn.dataset.ma;

  if (btn.dataset.action === "edit-gia") {
    const form = document.getElementById("formGiaPhong");
    form.elements.MaPhong.value = ma;
    form.querySelector(".readonly-display").value = ma;
    form.elements.GiaPhongMoi.value = "";
    openModal("modalGiaPhong");
  }

  if (btn.dataset.action === "delete-phong") {
    askConfirm(
      "Xóa phòng",
      `Bạn có chắc muốn xóa phòng ${ma}? Hành động này không thể hoàn tác. Phòng còn sinh viên sẽ không thể xóa.`,
      "Xóa phòng",
      async () => {
        try {
          const result = await api(
            "DELETE",
            `/phong/${encodeURIComponent(ma)}`,
          );
          showToast(result.Message, "success");
          loadPhong();
        } catch (err) {
          showToast(err.message, "error");
        }
      },
    );
  }
});

document.getElementById("btnNewPhong").addEventListener("click", () => {
  document.getElementById("formPhong").reset();
  openModal("modalPhong");
});

document.getElementById("formPhong").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  try {
    const result = await api("POST", "/phong", payload);
    showToast(result.Message, "success");
    closeModal("modalPhong");
    loadPhong();
  } catch (err) {
    showToast(err.message, "error");
  }
});

document
  .getElementById("formGiaPhong")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const maPhong = fd.get("MaPhong");
    try {
      const result = await api(
        "PUT",
        `/phong/${encodeURIComponent(maPhong)}/gia`,
        {
          GiaPhongMoi: fd.get("GiaPhongMoi"),
        },
      );
      showToast(result.Message, "success");
      closeModal("modalGiaPhong");
      loadPhong();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

// ---------------------------------------------------------------------------
// SINH VIÊN
// ---------------------------------------------------------------------------
let allRooms = [];

async function loadRoomOptions() {
  try {
    allRooms = await api("GET", "/phong");
    const select = document.getElementById("selectMaPhongSV");
    select.innerHTML = allRooms
      .map(
        (r) =>
          `<option value="${escapeHtml(r.MaPhong)}">${escapeHtml(r.MaPhong)} — ${escapeHtml(r.TenPhong)} (${r.SoLuongHienTai}/${r.SoLuongToiDa})</option>`,
      )
      .join("");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderSVRows(rows) {
  const tbody = document.querySelector("#tableSV tbody");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Không có sinh viên nào.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td class="mono">${escapeHtml(r.MaSV)}</td>
      <td>${escapeHtml(r.HoVaTen)}</td>
      <td><span class="badge badge--neutral">${escapeHtml(r.GioiTinh)}</span></td>
      <td>${formatDate(r.NgaySinh)}</td>
      <td class="mono">${escapeHtml(r.SoDienThoai)}</td>
      <td class="mono">${escapeHtml(r.MaPhong)}</td>
      <td class="cell-actions">
        <button class="btn--text" data-action="edit-sv" data-ma="${escapeHtml(r.MaSV)}">Sửa</button>
        <button class="btn--text is-danger" data-action="delete-sv" data-ma="${escapeHtml(r.MaSV)}">Xóa</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

async function loadSinhVien() {
  try {
    const rows = await api("GET", "/sinhvien");
    window._svCache = rows;
    renderSVRows(rows);
    loadRoomOptions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.querySelector("#tableSV tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const ma = btn.dataset.ma;

  if (btn.dataset.action === "edit-sv") {
    const sv = (window._svCache || []).find((s) => s.MaSV === ma);
    if (!sv) return;
    const form = document.getElementById("formSuaSV");
    form.elements.MaSV.value = sv.MaSV;
    form.querySelector(".readonly-display").value = sv.MaSV;
    form.elements.HoVaTen.value = sv.HoVaTen;
    form.elements.DiaChi.value = sv.DiaChi;
    form.elements.SoDienThoai.value = sv.SoDienThoai;
    openModal("modalSuaSV");
  }

  if (btn.dataset.action === "delete-sv") {
    askConfirm(
      "Xóa sinh viên",
      `Bạn có chắc muốn xóa sinh viên ${ma}? Hóa đơn và hợp đồng liên quan cũng sẽ bị xóa.`,
      "Xóa sinh viên",
      async () => {
        try {
          const result = await api(
            "DELETE",
            `/sinhvien/${encodeURIComponent(ma)}`,
          );
          showToast(result.Message, "success");
          loadSinhVien();
        } catch (err) {
          showToast(err.message, "error");
        }
      },
    );
  }
});

document.getElementById("btnNewSV").addEventListener("click", () => {
  document.getElementById("formSV").reset();
  loadRoomOptions();
  openModal("modalSV");
});

document.getElementById("formSV").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  try {
    const result = await api("POST", "/sinhvien/full", payload);
    showToast(result.Message, "success");
    closeModal("modalSV");
    loadSinhVien();
  } catch (err) {
    showToast(err.message, "error");
  }
});

document.getElementById("formSuaSV").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const maSV = fd.get("MaSV");
  try {
    const result = await api("PUT", `/sinhvien/${encodeURIComponent(maSV)}`, {
      HoVaTen: fd.get("HoVaTen"),
      DiaChi: fd.get("DiaChi"),
      SoDienThoai: fd.get("SoDienThoai"),
    });
    showToast(result.Message, "success");
    closeModal("modalSuaSV");
    loadSinhVien();
  } catch (err) {
    showToast(err.message, "error");
  }
});

let searchDebounce = null;
document.getElementById("searchSV").addEventListener("input", (e) => {
  clearTimeout(searchDebounce);
  const term = e.target.value.trim();
  searchDebounce = setTimeout(async () => {
    try {
      if (!term) {
        loadSinhVien();
        return;
      }
      const result = await api(
        "GET",
        `/sinhvien/tim-kiem/ten/${encodeURIComponent(term)}`,
      );
      if (result[0] && result[0].ThongBao) {
        renderSVRows([]);
      } else {
        window._svCache = result;
        renderSVRows(result);
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  }, 300);
});

// ---------------------------------------------------------------------------
// HỢP ĐỒNG
// ---------------------------------------------------------------------------
function statusBadgeHopDong(status) {
  if (status === "Hoạt động")
    return `<span class="badge badge--good">${status}</span>`;
  if (status === "Hết hạn")
    return `<span class="badge badge--warn">${status}</span>`;
  return `<span class="badge badge--bad">${status}</span>`;
}

async function loadHopDong() {
  try {
    const rows = await api("GET", "/hopdong");
    const tbody = document.querySelector("#tableHopDong tbody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Chưa có hợp đồng nào.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td class="mono">${escapeHtml(r.MaHopDong)}</td>
        <td>${escapeHtml(r.HoVaTen)} <span class="mono">(${escapeHtml(r.MaSV)})</span></td>
        <td class="mono">${escapeHtml(r.MaPhong)}</td>
        <td>${formatDate(r.NgayBatDau)}</td>
        <td>${formatDate(r.NgayKetThuc)}</td>
        <td>${statusBadgeHopDong(r.TrangThai)}</td>
        <td class="cell-actions">
          <select class="input" data-action="change-status" data-ma="${escapeHtml(r.MaHopDong)}" style="width:auto; padding:5px 8px; font-size:12.5px;">
            <option value="">Đổi trạng thái…</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Hết hạn">Hết hạn</option>
            <option value="Hủy">Hủy</option>
          </select>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (err) {
    showToast(err.message, "error");
  }
}

document
  .querySelector("#tableHopDong tbody")
  .addEventListener("change", async (e) => {
    const select = e.target.closest('select[data-action="change-status"]');
    if (!select || !select.value) return;
    const ma = select.dataset.ma;
    const newStatus = select.value;
    try {
      const result = await api(
        "PUT",
        `/hopdong/${encodeURIComponent(ma)}/trang-thai`,
        { TrangThai: newStatus },
      );
      showToast(result.Message, "success");
      loadHopDong();
    } catch (err) {
      showToast(err.message, "error");
      select.value = "";
    }
  });

// ---------------------------------------------------------------------------
// HÓA ĐƠN
// ---------------------------------------------------------------------------
async function loadHoaDon() {
  try {
    const rows = await api("GET", "/hoadon");
    const tbody = document.querySelector("#tableHoaDon tbody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Chưa có hóa đơn nào.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td class="mono">${escapeHtml(r.MaHoaDon)}</td>
        <td class="mono">${escapeHtml(r.MaHopDong)}</td>
        <td>${escapeHtml(r.HoVaTen)} <span class="mono">(${escapeHtml(r.MaSV)})</span></td>
        <td>${formatCurrency(r.SoTien)}</td>
        <td>${formatDate(r.NgayLap)}</td>
        <td>${
          r.TrangThai === "Đã thanh toán"
            ? `<span class="badge badge--good">${r.TrangThai}</span>`
            : `<span class="badge badge--bad">${r.TrangThai}</span>`
        }</td>
        <td class="cell-actions">
          ${
            r.TrangThai === "Chưa thanh toán"
              ? `<button class="btn--text" data-action="mark-paid" data-ma="${escapeHtml(r.MaHoaDon)}">Đánh dấu đã thanh toán</button>`
              : `<button class="btn--text" data-action="mark-unpaid" data-ma="${escapeHtml(r.MaHoaDon)}">Hoàn tác</button>`
          }
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (err) {
    showToast(err.message, "error");
  }
}

document
  .querySelector("#tableHoaDon tbody")
  .addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const ma = btn.dataset.ma;
    const newStatus =
      btn.dataset.action === "mark-paid" ? "Đã thanh toán" : "Chưa thanh toán";
    try {
      const result = await api(
        "PUT",
        `/hoadon/${encodeURIComponent(ma)}/trang-thai`,
        { TrangThai: newStatus },
      );
      showToast(result.Message, "success");
      loadHoaDon();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
checkHealth();
loadDashboard();
setInterval(checkHealth, 30000);
