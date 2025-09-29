async function loadView(view) {
  const res = await fetch(`views/${view}.html`);
  const html = await res.text();
  document.getElementById("content").innerHTML = html;
}

document.getElementById("btn-dashboard").addEventListener("click", () => loadView("dashboard"));
document.getElementById("btn-infos").addEventListener("click", () => loadView("informacoes"));

loadView("dashboard");
