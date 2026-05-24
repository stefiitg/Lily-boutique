const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass"); // Am importat pachetul sass
const sharp = require("sharp"); // Am importat pachetul sharp pentru procesare imagini
const app = express();
const pg = require("pg");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); 

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);
// Aici lăsăm expunerea folderului resurse (pentru a putea încărca CSS, imagini etc.)
app.use("/resurse", express.static(path.join(__dirname, "/resurse")));
app.use("/dist", express.static(path.join(__dirname, "/node_modules/bootstrap/dist"))); 

global.obGlobal = {
    obImagini: null
};

client=new pg.Client({
    database:"tehniciweb",
    user:"stefiitg",
    password:"stefiitg",
    host:"localhost",
    port:5432
})
//parola postgre: stefiitg

client.connect().then(() => {
    // Extragem valorile enum-ului pentru a le trimite automat în meniu (Cerința 4)
    client.query("SELECT unnest(enum_range(NULL::categ_vestimentara))", (err, res) => {
        if (!err) {
            obGlobal.optiuniMeniu = res.rows.map(rand => rand.unnest);
        }
    });
}).catch(err => console.error("Eroare conexiune DB", err));
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

function initImagini(){
    // Calea corectă indicată de tine către resurse/json
    var continut = fs.readFileSync(path.join(__dirname, "resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;
    let caleGalerie = obGlobal.obImagini.cale_galerie;

    let caleAbs = path.join(__dirname, caleGalerie);
    let caleAbsMediu = path.join(caleAbs, "mediu");
    let caleAbsMic = path.join(caleAbs, "mic");

    // Creăm directoarele dacă nu există
    if (!fs.existsSync(caleAbsMediu)) fs.mkdirSync(caleAbsMediu);
    if (!fs.existsSync(caleAbsMic)) fs.mkdirSync(caleAbsMic);
    
    for (let imag of vImagini){
        // Securizare: Luăm proprietatea corectă, indiferent cum e scrisă în JSON
        let numeFisierSursa = imag.cale_relativa || imag.fisier;
        
        if (!numeFisierSursa) {
            console.log("Avertisment: Imaginea nu are definită calea în JSON!");
            continue; // Trece la următoarea imagine fără să crape serverul
        }

        let [numeFis, ext] = numeFisierSursa.split("."); 
        let caleFisAbs = path.join(caleAbs, numeFisierSursa);
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        let caleFisMicAbs = path.join(caleAbsMic, numeFis + ".webp");

        // Procesare Sharp
        if (!fs.existsSync(caleFisMediuAbs)) {
            sharp(caleFisAbs).resize(500).webp().toFile(caleFisMediuAbs);
        }
        if (!fs.existsSync(caleFisMicAbs)) {
            sharp(caleFisAbs).resize(300).webp().toFile(caleFisMicAbs);
        }

        // Mapăm dinamic proprietățile pe obiect pentru a nu strica EJS-ul
        imag.fisier_mediu = path.join("/", caleGalerie, "mediu", numeFis + ".webp").replace(/\\/g, "/");
        imag.fisier_mic = path.join("/", caleGalerie, "mic", numeFis + ".webp").replace(/\\/g, "/");
        imag.fisier_mare = path.join("/", caleGalerie, numeFisierSursa).replace(/\\/g, "/");
    }
}

// Apelăm funcția după ce totul este configurat securizat
initImagini();

// ---------------------------------------------------------
// 3. FUNCȚIE COMPILARE SCSS -> CSS + BACKUP AUTOMAT
// ---------------------------------------------------------

function compileazaScss(caleScss, caleCss){
    if(!caleCss){

        let numeFisExt=path.basename(caleScss); // "folder1/folder2/a.scss" -> "a.scss"
        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css"; // output: a.css
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )
    
    let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }
    
    // la acest punct avem cai absolute in caleScss si  caleCss

    let numeFisCss=path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css",numeFisCss ))// +(new Date()).getTime()
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    
}


//la pornirea serverului
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}


fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})
// ---------------------------------------------------------
// 4. MIDDLEWARE-URI ȘI RUTE EXPRESS
// ---------------------------------------------------------

app.use((req, res, next) => {
    res.locals.ipUtilizator = req.ip || req.socket.remoteAddress;   
    res.locals.optiuniMeniu = obGlobal.optiuniMeniu || [];
    next();
});

app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});



// Tratarea explicită a paginii de start
app.get(["/", "/index", "/acasa"], function(req, res) {
    let ora = new Date().getHours();
    let timpCurent;
    
    if (ora >= 5 && ora < 12) timpCurent = "dimineata";
    else if (ora >= 12 && ora < 20) timpCurent = "zi";
    else timpCurent = "noapte";

    let imaginiFiltrate = obGlobal.obImagini.imagini.filter(img => img.timp === timpCurent);
    let numarImagini = imaginiFiltrate.length;
    let trunchiat = numarImagini - (numarImagini % 3);
    imaginiFiltrate = imaginiFiltrate.slice(0, trunchiat);

    res.render("pagini/index", { imaginiGalerie: imaginiFiltrate });
});

app.get ("/produse", function(req, res) {
    let clauzaWhere="";
    // Aici filtram pe coloana "categorie"
    if(req.query.tip){
        clauzaWhere=`WHERE categorie='${req.query.tip}'`;//facem astfel incat sa ramana doar prod din categ<tip mare > cand dam click in meniu
    }
    
   client.query(`SELECT * FROM produse_vestimentare ${clauzaWhere}`, function(err, rez){
        if (err){
            console.log("Eroare", err);
            afisareEroare(res, 500);
        } else {   
            let produse = rez.rows;

            // --- CALCUL PENTRU BONUS ---
            // Extragem prețul minim și maxim din baza de date
            let minPret = produse.length > 0 ? Math.min(...produse.map(p => parseFloat(p.pret))) : 0;
            let maxPret = produse.length > 0 ? Math.max(...produse.map(p => parseFloat(p.pret))) : 1000;
            
            // Extragem o singură dată culorile și ocaziile care există efectiv în DB
            let culoriUnice = [...new Set(produse.flatMap(p => p.culoare))];
            let ocaziiUnice = [...new Set(produse.map(p => p.ocazie))];
            // ---------------------------

            res.render("pagini/produse", { 
                produse: produse,
                minPret: minPret,
                maxPret: maxPret,
                culori: culoriUnice,
                ocazii: ocaziiUnice
            });
        }
    });
});

// Ruta pentru un singur produs
app.get ("/produs/:id", function(req, res) {
    client.query(`SELECT * FROM produse_vestimentare WHERE id=${req.params.id}`, function(err, rez){
        if (err){
            console.log("Eroare", err);
            afisareEroare(res, 500);
        } else {   
            if (rez.rowCount==0){
                afisareEroare(res, 404, "Produs inexistent");
                return;
            }
            res.render("pagini/produs", { prod: rez.rows[0] });
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