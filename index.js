const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass"); // Am importat pachetul sass
const sharp = require("sharp"); // Am importat pachetul sharp pentru procesare imagini
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); 

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

// ---------------------------------------------------------
// 1. CREARE FOLDERE AUTOMAT
// ---------------------------------------------------------
const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Folderul ${folder} a fost creat.`);
    }
}

// ---------------------------------------------------------
// 2. VARIABILE GLOBALE ȘI ERORI
// ---------------------------------------------------------
let obGlobal = {
    obErori: null,
    // Am definit folderele pentru scss, css si backup
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup")
};

function initErori() {
    let caleJson = path.join(__dirname, "erori.json");
    if (fs.existsSync(caleJson)) {
        let dateJson = fs.readFileSync(caleJson, "utf8");
        obGlobal.obErori = JSON.parse(dateJson);

       obGlobal.obErori.info_erori.forEach(eroare => {
            eroare.imagine = obGlobal.obErori.cale_baza + eroare.imagine; 
        });

        obGlobal.obErori.eroare_default.imagine = obGlobal.obErori.cale_baza + obGlobal.obErori.eroare_default.imagine;// manual pt eroarea generica
    }
}
initErori(); 

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroareGasita = obGlobal.obErori.info_erori.find(err => err.identificator == identificator);
    if (!eroareGasita) {
        eroareGasita = obGlobal.obErori.eroare_default;
    }

    let dateEroare = {
        titlu: titlu || eroareGasita?.titlu,
        text: text || eroareGasita?.text,
        imagine: imagine || eroareGasita?.imagine
    };

    if (eroareGasita.status) {
        res.status(identificator || 500); 
    }
    
   res.render("pagini/eroare", dateEroare);
}

// ---------------------------------------------------------
// 3. FUNCȚIE COMPILARE SCSS -> CSS + BACKUP AUTOMAT
// ---------------------------------------------------------
function compileazaScss(caleScss, caleCss) {
    try {
        // Stabilim caile absolute pentru input
        let caleScssAbs = path.isAbsolute(caleScss) ? caleScss : path.join(obGlobal.folderScss, caleScss);

        // Numele fisierului CSS rezultat
        let numeFisierCss = caleCss ? path.basename(caleCss) : path.basename(caleScssAbs, ".scss") + ".css";
        
        // Stabilim calea absoluta pentru output
        let caleCssAbs = caleCss ? (path.isAbsolute(caleCss) ? caleCss : path.join(obGlobal.folderCss, caleCss)) : path.join(obGlobal.folderCss, numeFisierCss);

        // Daca fisierul SCSS efectiv nu exista, ne oprim (evitam erori de stergere accidentala)
        if (!fs.existsSync(caleScssAbs)) return;

        // --- BACKUP ---
        let caleBackupDir = path.join(obGlobal.folderBackup, "resurse/css");
        if (!fs.existsSync(caleBackupDir)) {
            fs.mkdirSync(caleBackupDir, { recursive: true }); // cream structura de backup daca nu exista
        }

        let caleBackupFisier = path.join(caleBackupDir, numeFisierCss);
        if (fs.existsSync(caleCssAbs)) {
            // Copiem fisierul vechi in backup inainte sa-l suprascriem
            fs.copyFileSync(caleCssAbs, caleBackupFisier);
        }

        // --- COMPILARE ---
        let rezultat = sass.compile(caleScssAbs);
        fs.writeFileSync(caleCssAbs, rezultat.css);
        console.log(`Fisierul ${numeFisierCss} a fost compilat si actualizat cu succes.`);
    } catch (err) {
        console.error("Eroare la compilare SCSS:", err.message);
    }
}

// Ne asiguram ca folderele SCSS si CSS exista la pornire
if (!fs.existsSync(obGlobal.folderScss)) {
    fs.mkdirSync(obGlobal.folderScss, { recursive: true });
}
if (!fs.existsSync(obGlobal.folderCss)) {
    fs.mkdirSync(obGlobal.folderCss, { recursive: true });
}

// Compilare initiala la pornirea serverului (parcurgem folderul SCSS)
fs.readdirSync(obGlobal.folderScss).forEach(fisier => {
    if (fisier.endsWith(".scss")) {
        compileazaScss(fisier);
    }
});

// Pândire modificari pe parcurs (Watch)
fs.watch(obGlobal.folderScss, (eveniment, fisier) => {
    if (fisier && fisier.endsWith(".scss")) {
        console.log(`S-a modificat ${fisier}, se recompileaza...`);
        compileazaScss(fisier);
    }
});

// ---------------------------------------------------------
// 4. MIDDLEWARE-URI ȘI RUTE EXPRESS
// ---------------------------------------------------------

app.use((req, res, next) => {
    res.locals.ipUtilizator = req.ip || req.socket.remoteAddress;   //afisarea adresei IP a utilizatorului in template-uri
    next();
});

app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});

// Aici lăsăm expunerea folderului resurse (pentru a putea încărca CSS, imagini etc.)
app.use("/resurse", express.static(path.join(__dirname, "resurse")));

// Tratarea explicită a paginii de start
app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index', function(err, rezultatRandare) {
        if(err) {
            console.error(err);
            if(err.message.includes("Failed to lookup view")) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res, 500); 
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});

// ---------------------------------------------------------
// FUNCȚIA CENTRALIZATĂ A PROFESORULUI (Catch-All)
// ---------------------------------------------------------
app.get("/*pagina", function(req, res){
    console.log("Cale pagina", req.url);
    
    // Eroare 403 pentru directoare din resurse
    if (req.url.startsWith("/resurse") && path.extname(req.url)==""){
        afisareEroare(res,403);
        return;
    }
    
    // Eroare 400 pentru fisiere .ejs cerute direct in browser
    if (path.extname(req.url)==".ejs"){
        afisareEroare(res,400);
        return;
    }
    
    // Randarea dinamica a oricarei alte pagini
    try{
        res.render("pagini"+req.url, function(err, rezRandare){
            if (err){
                if (err.message.includes("Failed to lookup view")){
                    afisareEroare(res,404)
                }
                else{
                    afisareEroare(res);
                }
            }
            else{
                res.send(rezRandare);
                //console.log("Rezultat randare", rezRandare);
            }
        });
    }
    catch(err){
        if (err.message.includes("Cannot find module")){
            afisareEroare(res,404)
        }
        else{
            afisareEroare(res);
        }
    }
});

// ---------------------------------------------------------
// PORNIRE SERVER
// ---------------------------------------------------------
app.listen(8080, () => {
    console.log("Serverul a pornit pe portul 8080!");
});