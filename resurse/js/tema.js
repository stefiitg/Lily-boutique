
    
    if (localStorage.getItem("tema") === "dark") {
        document.body.classList.add("dark");
    }

    
    window.addEventListener("DOMContentLoaded", function() {
        const btnTema = document.getElementById("btn-tema");
        const iconTema = document.getElementById("icon-tema");


        function actualizeazaIconita() {
            if (document.body.classList.contains("dark")) {
                iconTema.classList.remove("fa-sun");
                iconTema.classList.add("fa-moon");
            } else {
                iconTema.classList.remove("fa-moon");
                iconTema.classList.add("fa-sun");
            }
        }

        
        actualizeazaIconita();

        
        btnTema.onclick = function() {
        
            document.body.classList.toggle("dark");

            
            if (document.body.classList.contains("dark")) {
                localStorage.setItem("tema", "dark");
            } else {
                localStorage.setItem("tema", "light");
            }

            // Actualizăm și iconița vizuală de pe buton
            actualizeazaIconita();
        };
    });
