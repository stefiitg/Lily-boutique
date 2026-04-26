const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); 

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Folderul ${folder} a fost creat.`);
    }
}

let obGlobal = {
    obErori: null
};

function initErori() {
    let caleJson = path.join(__dirname, "erori.json");
    if (fs.existsSync(caleJson)) {
        let dateJson = fs.readFileSync(caleJson, "utf8");
        obGlobal.obErori = JSON.parse(dateJson);

        obGlobal.obErori.info_erori.forEach(eroare => {
            eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
        });
        obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine);
    }
}
initErori(); 

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroareGasita = obGlobal.obErori.info_erori.find(err => err.identificator == identificator);
    if (!eroareGasita) {
        eroareGasita = obGlobal.obErori.eroare_default;
    }

    let dateEroare = {
        titlu: titlu || eroareGasita.titlu,
        text: text || eroareGasita.text,
        imagine: imagine || eroareGasita.imagine
    };

    if (eroareGasita.status) {
        res.status(identificator || 500); 
    }
    
    res.render("eroare", dateEroare);
}

app.use((req, res, next) => {
    res.locals.ipUtilizator = req.ip || req.socket.remoteAddress;
    next();
});

// AICI ESTE REZOLVAREA PENTRU EROAREA DE EXPRESS 5:
app.get(/\.ejs$/, (req, res) => {
    afisareEroare(res, 400);
});

app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});

app.use("/resurse", (req, res, next) => {
    if (req.url.endsWith("/")) {
        return afisareEroare(res, 403);
    }
    next();
});

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

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

// AICI ESTE REZOLVAREA PENTRU RUTA GENERALĂ ÎN EXPRESS 5:
app.get(/(.*)/, (req, res) => {
    let paginaCeruta = req.url.substring(1); 
    
    res.render('pagini/' + paginaCeruta, function(err, rezultatRandare) {
        if (err) {
            console.error(err);
            if (err.message.includes("Failed to lookup view")) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res, 500); 
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});

app.listen(8080, () => {
    console.log("Serverul a pornit pe portul 8080!");
});