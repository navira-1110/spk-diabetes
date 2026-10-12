// ===================== DATA AWAL (sesuai soal) =====================
const DATA_AWAL = [
  { id: "P01", usia: 25, bmi: 21.5, glukosa: 90,  tensi: 110, riwayat: 0, kelas: 0 },
  { id: "P02", usia: 30, bmi: 23.1, glukosa: 95,  tensi: 115, riwayat: 0, kelas: 0 },
  { id: "P03", usia: 35, bmi: 25.0, glukosa: 105, tensi: 120, riwayat: 0, kelas: 0 },
  { id: "P04", usia: 40, bmi: 27.5, glukosa: 120, tensi: 125, riwayat: 1, kelas: 1 },
  { id: "P05", usia: 45, bmi: 30.2, glukosa: 140, tensi: 135, riwayat: 1, kelas: 1 },
  { id: "P06", usia: 50, bmi: 31.5, glukosa: 155, tensi: 140, riwayat: 1, kelas: 1 },
  { id: "P07", usia: 55, bmi: 33.0, glukosa: 165, tensi: 145, riwayat: 1, kelas: 1 },
  { id: "P08", usia: 28, bmi: 22.5, glukosa: 92,  tensi: 112, riwayat: 0, kelas: 0 },
  { id: "P09", usia: 38, bmi: 26.8, glukosa: 115, tensi: 122, riwayat: 0, kelas: 0 },
  { id: "P10", usia: 48, bmi: 29.5, glukosa: 145, tensi: 130, riwayat: 1, kelas: 1 },
];

const FITUR = ["usia", "bmi", "glukosa", "tensi", "riwayat"];
const LABEL = { usia: "Usia", bmi: "BMI", glukosa: "Glukosa", tensi: "Tensi", riwayat: "Riwayat" };
const NAMA_KELAS = { 0: "Rendah", 1: "Tinggi" };
const KUNCI = "spk-diabetes-data-v2";

// ===================== ALGORITMA KNN =====================
function hitungMinMax(data) {
  const mm = {};
  FITUR.forEach((f) => {
    const v = data.map((d) => d[f]);
    mm[f] = [Math.min(...v), Math.max(...v)];
  });
  return mm;
}

function hitungKNN(baru, data, k, normalisasi = false) {
  if (!data.length) throw new Error("Data latih kosong.");
  if (!(k >= 1 && k <= data.length)) throw new Error("K harus antara 1 dan " + data.length + ".");

  const mm = hitungMinMax(data);
  const nilai = (obj, f) => {
    if (!normalisasi) return obj[f];
    const [lo, hi] = mm[f];
    return hi === lo ? 0 : (obj[f] - lo) / (hi - lo);
  };

  const ranking = data.map((p, idx) => {
    const kuadrat = FITUR.map((f) => Math.pow(nilai(baru, f) - nilai(p, f), 2));
    const jumlah = kuadrat.reduce((a, b) => a + b, 0);
    return { ...p, urut: idx, kuadrat, jumlah, jarak: Math.sqrt(jumlah) };
  });

  ranking.sort((a, b) => a.jarak - b.jarak || a.urut - b.urut);
  ranking.forEach((r, i) => (r.peringkat = i + 1));

  const terdekat = ranking.slice(0, k);
  const suara = { 0: 0, 1: 0 };
  terdekat.forEach((t) => suara[t.kelas]++);

  let kelas;
  if (suara[1] > suara[0]) kelas = 1;
  else if (suara[0] > suara[1]) kelas = 0;
  else kelas = terdekat[0].kelas; // seri -> ikut tetangga terdekat

  return { ranking, terdekat, suara, kelas, mm };
}

if (typeof module !== "undefined") module.exports = { hitungKNN, DATA_AWAL };

// ===================== TAMPILAN (browser saja) =====================
if (typeof document !== "undefined") {
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => (Math.round(n * 100) / 100).toString().replace(".", ",");
  const fmt4 = (n) => (Math.round(n * 10000) / 10000).toString().replace(".", ",");

  let data = muatData();

  function muatData() {
    try {
      const s = JSON.parse(localStorage.getItem(KUNCI));
      if (Array.isArray(s)) return s;
    } catch (e) {}
    return DATA_AWAL.map((d) => ({ ...d }));
  }
  function simpanData() {
    try { localStorage.setItem(KUNCI, JSON.stringify(data)); } catch (e) {}
  }

  // ---------- Tab ----------
  function bukaTab(target) {
    document.querySelectorAll(".tab").forEach((b) => {
      const aktif = b.dataset.target === target;
      b.classList.toggle("aktif", aktif);
      b.setAttribute("aria-selected", aktif);
    });
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("aktif", p.id === target));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => bukaTab(b.dataset.target)));
  $("ke-data").addEventListener("click", () => bukaTab("panel-data"));

  // ---------- Tabel data ----------
  function badge(kelas) {
    return `<span class="badge ${kelas ? "tinggi" : "rendah"}">${NAMA_KELAS[kelas]}</span>`;
  }

  function gambarData() {
    const baris = (d, denganHapus, i) =>
      `<tr><td><b>${esc(d.id)}</b></td><td>${fmt(d.usia)}</td><td>${fmt(d.bmi)}</td><td>${fmt(d.glukosa)}</td>` +
      `<td>${fmt(d.tensi)}</td><td>${d.riwayat}</td><td>${badge(d.kelas)}</td>` +
      (denganHapus ? `<td><button class="hapus" data-i="${i}" aria-label="Hapus ${esc(d.id)}">Hapus</button></td>` : "") +
      `</tr>`;

    $("isi-ringkas").innerHTML = data.map((d, i) => baris(d, false, i)).join("");
    $("isi-data").innerHTML = data.length
      ? data.map((d, i) => baris(d, true, i)).join("")
      : `<tr><td colspan="8" class="kosong">Belum ada data.</td></tr>`;
    document.querySelectorAll(".jumlah-data").forEach((el) => (el.textContent = data.length));
    $("k").max = Math.max(1, data.length);
    if (+$("k").value > data.length) $("k").value = Math.max(1, data.length);
  }

  $("isi-data").addEventListener("click", (e) => {
    const btn = e.target.closest(".hapus");
    if (!btn) return;
    const d = data[+btn.dataset.i];
    if (confirm("Hapus pasien " + d.id + "?")) {
      data.splice(+btn.dataset.i, 1);
      simpanData();
      gambarData();
      toast("Data " + d.id + " dihapus");
    }
  });

  function idBaru() {
    const n = Math.max(0, ...data.map((d) => parseInt(String(d.id).replace(/\D/g, ""), 10) || 0)) + 1;
    return "P" + String(n).padStart(2, "0");
  }

  $("form-data").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = {
      id: idBaru(),
      usia: parseFloat($("d-usia").value),
      bmi: parseFloat($("d-bmi").value),
      glukosa: parseFloat($("d-glukosa").value),
      tensi: parseFloat($("d-tensi").value),
      riwayat: parseInt($("d-riwayat").value, 10),
      kelas: parseInt($("d-kelas").value, 10),
    };
    if ([d.usia, d.bmi, d.glukosa, d.tensi, d.riwayat, d.kelas].some(Number.isNaN)) {
      toast("Semua kolom harus diisi");
      return;
    }
    data.push(d);
    simpanData();
    gambarData();
    e.target.reset();
    toast("Data " + d.id + " ditambahkan");
  });

  $("reset-data").addEventListener("click", () => {
    if (confirm("Kembalikan ke 10 data awal? Data tambahanmu akan hilang.")) {
      data = DATA_AWAL.map((d) => ({ ...d }));
      simpanData();
      gambarData();
      toast("Data dikembalikan ke awal");
    }
  });

  // ---------- Toast ----------
  let tToast;
  function toast(teks) {
    const el = $("toast");
    el.textContent = teks;
    el.classList.add("tampil");
    clearTimeout(tToast);
    tToast = setTimeout(() => el.classList.remove("tampil"), 2200);
  }

  // ---------- Prediksi ----------
  $("form-prediksi").addEventListener("submit", (e) => {
    e.preventDefault();
    const baru = {
      usia: parseFloat($("usia").value),
      bmi: parseFloat($("bmi").value),
      glukosa: parseFloat($("glukosa").value),
      tensi: parseFloat($("tensi").value),
      riwayat: parseInt($("riwayat").value, 10),
    };
    const k = parseInt($("k").value, 10);

    if ([baru.usia, baru.bmi, baru.glukosa, baru.tensi, baru.riwayat, k].some(Number.isNaN)) {
      toast("Semua kolom harus diisi");
      return;
    }
    if (!data.length) { toast("Data latih kosong, tambahkan dulu"); return; }
    if (k < 1 || k > data.length) { toast("K harus 1 sampai " + data.length); return; }

    const norm = $("normalisasi").checked;
    tampilkanHasil(baru, hitungKNN(baru, data, k, norm), k, norm);
  });

  function tabel(kepala, baris, kelasTabel = "") {
    return `<div class="scroll"><table class="${kelasTabel}"><thead><tr>${kepala.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` +
      `<tbody>${baris.join("")}</tbody></table></div>`;
  }

  function tampilkanHasil(baru, h, k, norm) {
    const tinggi = h.kelas === 1;
    let html = `<div class="judul-bagian"><span></span><h2>Proses Perhitungan</h2></div>`;

    // 1. Data pasien baru
    html += `<section class="kartu langkah"><h3><i>1</i> Data pasien baru</h3>
      <div class="chip-baris">
        <span class="chip">Usia <b>${fmt(baru.usia)}</b></span>
        <span class="chip">BMI <b>${fmt(baru.bmi)}</b></span>
        <span class="chip">Glukosa <b>${fmt(baru.glukosa)}</b></span>
        <span class="chip">Tensi <b>${fmt(baru.tensi)}</b></span>
        <span class="chip">Riwayat <b>${baru.riwayat ? "Ada" : "Tidak ada"}</b></span>
        <span class="chip">K <b>${k}</b></span>
      </div></section>`;

    // 2. Normalisasi (opsional)
    if (norm) {
      html += `<section class="kartu langkah"><h3><i>2</i> Normalisasi Min-Max</h3>
        <p class="rumus">x' = (x − min) / (max − min)</p>` +
        tabel(["Fitur", "Min", "Max"], FITUR.map((f) => `<tr><td>${LABEL[f]}</td><td>${fmt(h.mm[f][0])}</td><td>${fmt(h.mm[f][1])}</td></tr>`)) +
        `</section>`;
    }

    // 3. Kuadrat selisih
    const nomor = norm ? 3 : 2;
    const urutAsli = [...h.ranking].sort((a, b) => a.urut - b.urut);
    html += `<section class="kartu langkah"><h3><i>${nomor}</i> Hitung jarak Euclidean</h3>
      <p class="rumus">d = √[ (x₁−y₁)² + (x₂−y₂)² + … + (x₅−y₅)² ]</p>
      <p class="catatan">Selisih tiap atribut pasien baru dengan pasien latih, lalu dikuadratkan.</p>` +
      tabel(
        ["Pasien", ...FITUR.map((f) => LABEL[f]), "Jumlah"],
        urutAsli.map((r) => `<tr><td><b>${esc(r.id)}</b></td>${r.kuadrat.map((x) => `<td>${fmt4(x)}</td>`).join("")}<td><b>${fmt4(r.jumlah)}</b></td></tr>`)
      ) + `</section>`;

    // 4. Peringkat
    html += `<section class="kartu langkah"><h3><i>${nomor + 1}</i> Urutkan dari jarak terdekat</h3>
      <p class="catatan">Baris biru = ${k} tetangga terdekat yang dipakai untuk voting.</p>` +
      tabel(
        ["#", "Pasien", "Nilai Akar", "Jarak", "Kelas"],
        h.ranking.map((r) =>
          `<tr class="${r.peringkat <= k ? "dekat" : ""}"><td>${r.peringkat}</td><td><b>${esc(r.id)}</b></td>` +
          `<td>√${fmt4(r.jumlah)}</td><td><b>${fmt(r.jarak)}</b></td><td>${badge(r.kelas)}</td></tr>`
        )
      ) + `</section>`;

    // 5. Voting
    html += `<section class="kartu langkah"><h3><i>${nomor + 2}</i> Voting ${k} tetangga terdekat</h3>
      <p class="catatan">${h.terdekat.map((t) => esc(t.id) + " (" + NAMA_KELAS[t.kelas] + ")").join(", ")}</p>
      <div class="suara">
        <div class="suara-kotak rendah ${!tinggi ? "menang" : ""}"><small>Risiko Rendah</small><strong>${h.suara[0]}</strong><span>suara</span></div>
        <div class="suara-kotak tinggi ${tinggi ? "menang" : ""}"><small>Risiko Tinggi</small><strong>${h.suara[1]}</strong><span>suara</span></div>
      </div></section>`;

    // Kesimpulan
    html += `<section class="kartu kesimpulan ${tinggi ? "tinggi" : "rendah"}" id="kesimpulan">
      <div class="ikon">${tinggi ? "!" : "✓"}</div>
      <h2>Kesimpulan</h2>
      <p>Berdasarkan K-Nearest Neighbors (K = ${k}), pasien baru diprediksi memiliki</p>
      <p class="besar">Risiko Diabetes ${NAMA_KELAS[h.kelas]}</p>
      <p class="catatan">${h.suara[h.kelas]} dari ${k} tetangga terdekat termasuk kelas Risiko ${NAMA_KELAS[h.kelas]}.</p>
      <p class="catatan">Hasil ini hanya alat bantu keputusan, bukan diagnosis medis.</p>
    </section>`;

    $("hasil").innerHTML = html;
    $("hasil").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  gambarData();
}
