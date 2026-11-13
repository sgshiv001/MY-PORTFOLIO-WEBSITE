"use strict";
const byId = id => document.getElementById(id);
const {metrics, samples, timings, hardware} = JSON.parse(byId("dataset").textContent);
const percent = value => (100 * value).toFixed(2) + "%";
byId("svm-acc").textContent = percent(metrics.classical.accuracy);
byId("cnn-acc").textContent = percent(metrics.cnn.accuracy);
byId("parity").textContent = metrics.test_count + " / " + metrics.test_count;
byId("gpu").textContent = hardware.gpu.replace("GeForce ", "").replace(/ \(SM .*\)$/, "");
byId("method-data").textContent = metrics.train_count + " training images, " + metrics.test_count +
  " test images. The classical model uses 36 HOG features and " + metrics.pca_components +
  " learned principal components. The two-block CNN was trained for " + metrics.epochs + " epochs.";

const mistakes = samples.filter(s => s.svm !== s.label || s.cnn !== s.label);
let selected = 0, onlyErrors = false;
const pixels = Array.from({length:64}, () => document.createElement("i"));
byId("digit").append(...pixels);
function showSample() {
  const set = onlyErrors ? mistakes : samples, sample = set[selected];
  sample.pixels.forEach((p,i) => { pixels[i].style.backgroundColor = "rgb(" +
    [24 + Math.round(p * 9),32 + Math.round(p * 13),42 + Math.round(p * 8)].join(",") + ")"; });
  byId("digit").setAttribute("aria-label", "Handwritten digit " + sample.label);
  byId("label").textContent = sample.label;
  for (const key of ["svm", "cnn"]) {
    byId(key).textContent = sample[key];
    const correct = sample[key] === sample.label;
    byId(key + "-mark").textContent = correct ? "Correct" : "Incorrect";
    byId(key + "-mark").classList.toggle("wrong", !correct);
  }
  byId("sample-state").textContent = (selected + 1) + " of " + set.length + " · Dataset sample #" + sample.id;
  byId("previous").disabled = selected === 0;
  byId("next").disabled = selected + 1 === set.length;
}
byId("previous").onclick = () => { selected--; showSample(); };
byId("next").onclick = () => { selected++; showSample(); };
byId("errors").disabled = mistakes.length === 0;
byId("errors").onclick = () => {
  onlyErrors = !onlyErrors;
  selected = 0;
  byId("errors").setAttribute("aria-pressed", String(onlyErrors));
  showSample();
};
showSample();

const formats = [
  ["CPU · PyTorch", "cpu_ms", "var(--violet)"],
  ["CUDA · with copies", "fused_wall_ms", "var(--mint)"],
  ["CUDA · resident", "fused_gpu_ms", "var(--cyan)"]
];
function showBatch(row) {
  for (const button of byId("batches").children)
    button.setAttribute("aria-pressed", String(Number(button.dataset.batch) === row.batch));
  const scale = Math.max(...formats.map(([,key]) => row[key]));
  byId("bars").replaceChildren(...formats.map(([name,key,color]) => {
    const item = document.createElement("div"); item.className = "bar";
    const label = document.createElement("span"); label.textContent = name;
    const track = document.createElement("div"); track.className = "track"; track.setAttribute("aria-hidden","true");
    const fill = document.createElement("div"); fill.className = "fill";
    fill.style.width = (100 * row[key] / scale) + "%"; fill.style.background = color; track.append(fill);
    const val = document.createElement("span"); val.className = "value"; val.textContent = row[key].toFixed(3) + " ms";
    item.append(label, track, val); return item;
  }));
  const ratio = row.cpu_ms / row.fused_wall_ms;
  const kernel = row.direct_gpu_ms / row.fused_gpu_ms;
  byId("readout").textContent = (ratio >= 1
    ? "Including copies, fused CUDA was " + ratio.toFixed(2) + "× as fast as the CPU baseline."
    : "Including copies, the CPU baseline was " + (1/ratio).toFixed(2) + "× as fast as fused CUDA.") +
    " With inputs already on the GPU, direct CUDA took " + row.direct_gpu_ms.toFixed(3) + " ms (" +
    kernel.toFixed(2) + "× the fused time).";
}
for (const row of timings) {
  const button = document.createElement("button");
  button.type = "button"; button.textContent = row.batch; button.dataset.batch = row.batch;
  button.setAttribute("aria-label", row.batch + " images per batch");
  button.onclick = () => showBatch(row);
  byId("batches").append(button);
}
showBatch(timings[0]);
