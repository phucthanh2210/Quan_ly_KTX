document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/sinhvien")
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.querySelector("#svTable tbody");
      tbody.innerHTML = data
        .map(
          (sv) => `
                <tr>
                    <td>${sv.MaSV}</td>
                    <td>${sv.HoVaTen}</td>
                    <td>${sv.MaPhong}</td>
                </tr>
            `,
        )
        .join("");
    })
    .catch((err) => console.error("Lỗi tải dữ liệu:", err));
});
