window.addEventListener("DOMContentLoaded", function() {
    let btnTema = document.getElementById("schimba_tema");
    // Presupunem că în interiorul butonului ai un tag <i> pentru iconița FontAwesome
    let iconTema = document.getElementById("icon_tema"); 

    // 1. VERIFICAREA MEMORIEI LA ÎNCĂRCAREA PAGINII (Mecanismul lipsă)
    let temaCurenta = localStorage.getItem("tema");
    if (temaCurenta === "dark") {
        document.body.classList.add("dark");
        if (iconTema) {
            iconTema.classList.remove("fa-moon");
            iconTema.classList.add("fa-sun"); // Arătăm soarele pentru că suntem deja în dark mode
        }
    }

    // 2. LOGICA DE SCHIMBARE LA CLICK
    if (btnTema) {
        btnTema.onclick = function() {
            if (document.body.classList.contains("dark")) {
                // Trecem la Light Mode
                document.body.classList.remove("dark");
                localStorage.removeItem("tema");
                if (iconTema) {
                    iconTema.classList.remove("fa-sun");
                    iconTema.classList.add("fa-moon"); // Punem luna la loc
                }
            } else {
                // Trecem la Dark Mode
                document.body.classList.add("dark");
                localStorage.setItem("tema", "dark");
                if (iconTema) {
                    iconTema.classList.remove("fa-moon");
                    iconTema.classList.add("fa-sun"); // Punem soarele
                }
            }
        }
    }
});