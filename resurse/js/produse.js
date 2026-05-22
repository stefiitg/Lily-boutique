window.onload = function() {
    
    // Păstrăm o copie a produselor la început pentru resetare și sortare
    let gridProduse = document.getElementsByClassName("grid-produse")[0];
    let articoleOriginale = Array.from(document.getElementsByClassName("produs"));

    // Afișează valoarea pentru range în timp real
    document.getElementById("inp-pret").onchange = function() {
        document.getElementById("infoRange").innerHTML = "(" + this.value + ")";
    }

    // ============================================
    // 1. FILTRAREA
    // ============================================
    document.getElementById("filtrare").onclick = function() {
        
        // Preluăm valorile din input-uri
        let inpMaterial = document.getElementById("inp-materiale").value.trim().toLowerCase();
        let inpPret = parseFloat(document.getElementById("inp-pret").value);
        let inpNume = document.getElementById("inp-nume").value.trim().toLowerCase();
        let inpDescriere = document.getElementById("inp-descriere").value.trim().toLowerCase();
        let radioEditie = document.querySelector('input[name="gr_rad_editie"]:checked').value;
        let inpCategorie = document.getElementById("inp-categorie").value.toLowerCase();
        
        // Citim checkbox-urile pentru ocazie
        let checkboxOcazii = document.getElementsByClassName("chk-ocazie");
        let ocaziiBifate = [];
        for (let chk of checkboxOcazii) {
            if (chk.checked) {
                ocaziiBifate.push(chk.value.toLowerCase());
            }
        }

        // Citim selectul multiplu (culori nedorite)
        let selectMultiplu = document.getElementById("inp-culori-nedorite");
        let culoriNedorite = [];
        for (let opt of selectMultiplu.options) {
            if (opt.selected) {
                culoriNedorite.push(opt.value.toLowerCase());
            }
        }

        // --- VALIDĂRI ---
        document.getElementById("inp-materiale").style.border = "";
        if (/\d/.test(inpMaterial)) {
            alert("Eroare: Câmpul material nu trebuie să conțină cifre!");
            document.getElementById("inp-materiale").style.border = "2px solid red";
            return; // Oprește funcția
        }

       let inpDescriereObj = document.getElementById("inp-descriere");
        
        // Dacă este invalid, folosim clasa Bootstrap "is-invalid"
        if (inpDescriere.includes("<") || inpDescriere.includes(">")) {
            inpDescriereObj.classList.add("is-invalid");
            alert("Eroare: Descrierea conține caractere nepermise!");
            return;
        } else {
            inpDescriereObj.classList.remove("is-invalid");
        }

        if (ocaziiBifate.length === 0) {
            alert("Eroare: Bifează măcar o ocazie!");
            return;
        }

        // Corectare automată is-invalid pentru textarea
        document.getElementById("inp-descriere").oninput = function() {
        if (!this.value.includes("<") && !this.value.includes(">")) {
            this.classList.remove("is-invalid");
        }
    }
        // ----------------

        // Parcurgem produsele ca în codul profului
        let produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            prod.style.display = "none"; // Ascundem tot la început

            // Preluăm datele de pe cardul produsului
            let nume = prod.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase();
            let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
            let materiale = prod.getElementsByClassName("val-materiale")[0].innerHTML.toLowerCase();
            let editie = prod.getElementsByClassName("val-editie")[0].innerHTML.trim();
            let ocazie = prod.getElementsByClassName("val-ocazie")[0].innerHTML.trim().toLowerCase();
            let descriere = prod.getElementsByClassName("val-descriere")[0].innerHTML.toLowerCase();
            let categorie = prod.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase();
            let culori = prod.getElementsByClassName("val-culoare")[0].innerHTML.toLowerCase();

            // Construim condițiile
            let cond1 = (inpMaterial === "" || materiale.includes(inpMaterial));
            let cond2 = (pret <= inpPret);
            let cond3 = (inpNume === "" || nume.includes(inpNume));
            
            let cond4 = false;
            if (radioEditie === "toate") cond4 = true;
            else if (radioEditie === "da" && editie === "true") cond4 = true;
            else if (radioEditie === "nu" && editie === "false") cond4 = true;

            let cond5 = ocaziiBifate.includes(ocazie);
            let cond6 = (inpDescriere === "" || descriere.includes(inpDescriere));
            let cond7 = (inpCategorie === "toate" || categorie === inpCategorie);
            
            // Verificăm culorile nedorite (dacă produsul are o culoare pe care am bifat-o)
            let cond8 = true;
            let arrayCulori = culori.split(","); // spargem textul "alb, rosu" intr-un vector
            for (let cul of arrayCulori) {
                if (culoriNedorite.includes(cul.trim())) {
                    cond8 = false; // Dacă o găsim, pică testul
                }
            }

            // Dacă trece de toate filtrele, îl afișăm
            if (cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7 && cond8) {
                prod.style.display = "block";
            }
        }
    }

    // ============================================
    // 2. RESETAREA
    // ============================================
    document.getElementById("resetare").onclick = function() {
        if (confirm("Ești sigur că vrei să resetezi filtrele?")) {
            // Curățăm inputurile
            document.getElementById("inp-pret").value = 1000;
            document.getElementById("infoRange").innerHTML = "(1000)";
            document.getElementById("inp-materiale").value = "";
            document.getElementById("inp-materiale").style.border = "";
            document.getElementById("inp-pret").value = 1000;
            document.getElementById("infoRange").innerHTML = "(1000)";
            document.getElementById("inp-nume").value = "";
            document.getElementById("inp-descriere").value = "";
            document.getElementById("inp-categorie").value = "toate";
            
            document.querySelector('input[name="gr_rad_editie"][value="toate"]').checked = true;
            
            let checkboxOcazii = document.getElementsByClassName("chk-ocazie");
            for (let chk of checkboxOcazii) chk.checked = true;

            let selectMultiplu = document.getElementById("inp-culori-nedorite");
            for (let opt of selectMultiplu.options) opt.selected = false;
            let sliderPret = document.getElementById("inp-pret");
           sliderPret.value = sliderPret.max;
             document.getElementById("infoRange").innerHTML = "(" + sliderPret.max + ")";

            // Reafișăm produsele în ordinea inițială
            for (let prod of articoleOriginale) {
                prod.style.display = "block";
                gridProduse.appendChild(prod);
            }
        }
    }

    // ============================================
    // 3. SORTAREA
    // ============================================
    function sorteaza(semn) {
        let produse = document.getElementsByClassName("produs");
        let v_produse = Array.from(produse);

        v_produse.sort(function(a, b) {
            let ocazieA = a.getElementsByClassName("val-ocazie")[0].innerHTML.trim();
            let ocazieB = b.getElementsByClassName("val-ocazie")[0].innerHTML.trim();

            // Dacă ocaziile sunt diferite, le sortăm alfabetic după ocazie
            if (ocazieA !== ocazieB) {
                return semn * ocazieA.localeCompare(ocazieB);
            } 
            // Dacă au aceeași ocazie, le sortăm după preț
            else {
                let pretA = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML);
                let pretB = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML);
                return semn * (pretA - pretB);
            }
        });

        for (let prod of v_produse) {
            gridProduse.appendChild(prod);
        }
    }

    document.getElementById("sortCresc").onclick = function() { sorteaza(1); }
    document.getElementById("sortDescresc").onclick = function() { sorteaza(-1); }

    // ============================================
    // 4. CALCULAREA
    // ============================================
    document.getElementById("calcul").onclick = function() {
        let produse = document.getElementsByClassName("produs");
        let suma = 0;
        
        // Calculăm doar ce se vede pe ecran
        for (let prod of produse) {
            if (prod.style.display !== "none") { 
                let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
                suma += pret;
            }
        }

        // Creăm div-ul dinamic
        let divInfo = document.createElement("div");
        divInfo.innerHTML = "Suma produselor filtrate este: " + suma + " lei";
        
        // Îl stilizăm direct din JS
        divInfo.style.position = "fixed";
        divInfo.style.top = "50%";
        divInfo.style.left = "50%";
        divInfo.style.backgroundColor = "white";
        divInfo.style.border = "2px solid black";
        divInfo.style.padding = "20px";
        divInfo.style.zIndex = "100";

        document.body.appendChild(divInfo);

        // Îl ștergem după 2 secunde (2000 milisecunde)
        setTimeout(function() {
            divInfo.remove();
        }, 2000);
    }
}