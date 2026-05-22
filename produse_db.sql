DROP TABLE IF EXISTS produse_vestimentare;
DROP TYPE IF EXISTS categ_vestimentara;
DROP TYPE IF EXISTS culoare_haina;
DROP TYPE IF EXISTS tip_ocazie;

CREATE TYPE categ_vestimentara AS ENUM('rochie', 'camasa', 'bluza', 'esarfa', 'pantalon');
CREATE TYPE culoare_haina AS ENUM('rosu', 'portocaliu', 'galben', 'verde', 'albastru','violet','roz','negru','alb','bej');
CREATE TYPE tip_ocazie AS ENUM('petrecere', 'nunta', 'casual', 'office');

-- Crearea tabelului
CREATE TABLE produse_vestimentare (
    id SERIAL PRIMARY KEY,
    nume VARCHAR(100) NOT NULL,
    descriere TEXT NOT NULL,
    imagine VARCHAR(200) NOT NULL,
    categorie categ_vestimentara DEFAULT 'rochie', 
    culoare culoare_haina[] DEFAULT ARRAY['bej']::culoare_haina[], -- Modificat aici în Array
    pret NUMERIC(8,2) NOT NULL CHECK (pret>=0),
    marime INT NOT NULL CHECK (marime>=0), 
    ocazie tip_ocazie DEFAULT 'casual',
    materiale VARCHAR[] NOT NULL, 
    editie_limitata BOOLEAN DEFAULT FALSE,
    data_adaugare DATE DEFAULT CURRENT_DATE
);

GRANT ALL PRIVILEGES ON TABLE produse_vestimentare TO stefiitg;
GRANT ALL PRIVILEGES ON SEQUENCE produse_vestimentare_id_seq TO stefiitg;
GRANT ALL PRIVILEGES ON TYPE categ_vestimentara TO stefiitg;
GRANT ALL PRIVILEGES ON TYPE culoare_haina TO stefiitg;
GRANT ALL PRIVILEGES ON TYPE tip_ocazie TO stefiitg;

INSERT INTO produse_vestimentare (nume, descriere, imagine, categorie, culoare, pret, marime, ocazie, materiale, editie_limitata, data_adaugare) VALUES
('Rochie roșie elegantă', 'Rochie lungă cu crăpătură pe picior.', 'rochie_rosie_mare.png', 'rochie', ARRAY['rosu']::culoare_haina[], 350.00, 38, 'petrecere', ARRAY['matase', 'poliester'], true, '2023-10-15'),
('Cămașă office', 'Cămașă albă clasică cu buline negre', 'camasa_alba.png', 'camasa', ARRAY['alb', 'negru']::culoare_haina[], 120.00, 40, 'office', ARRAY['bumbac', 'elastan'], false, '2024-01-10');

INSERT INTO produse_vestimentare (nume, descriere, imagine, categorie, culoare, pret, marime, ocazie, materiale, editie_limitata, data_adaugare) VALUES
-- Rochii
('Rochie de cocktail asimetrică', 'O rochie neagră clasică, tip Little Black Dress, cu detalii asimetrice.', 'rochie_neagra_petrecere.png', 'rochie', ARRAY['negru']::culoare_haina[], 280.00, 36, 'petrecere', ARRAY['vascoza', 'elastan'], false, '2024-04-20'),
('Rochie verde smarald fluidă', 'Rochie lungă de seară, perfectă pentru cununii și evenimente deosebite.', 'rochie_verde_nunta.png', 'rochie', ARRAY['verde']::culoare_haina[], 450.00, 42, 'nunta', ARRAY['matase'], true, '2024-03-05'),

-- Pantaloni
('Pantalon office cu pense', 'Pantalon clasic bej cu o croială dreaptă, ideal pentru un mediu corporate.', 'pantalon_bej_office.png', 'pantalon', ARRAY['bej']::culoare_haina[], 180.50, 38, 'office', ARRAY['lana', 'poliester'], false, '2024-02-20'),
('Pantalon lejer de vară', 'Pantalon lung, vaporos și foarte confortabil pentru uz zilnic.', 'pantalon_galben.png', 'pantalon', ARRAY['galben']::culoare_haina[], 145.00, 40, 'casual', ARRAY['in', 'bumbac'], false, '2024-05-15'),

-- Cămăși și Bluze
('Cămașă supradimensionată', 'Cămașă răcoroasă din in, croială oversize pentru zilele călduroase.', 'camasa_in_albastru.png', 'camasa', ARRAY['albastru', 'alb']::culoare_haina[], 160.00, 34, 'casual', ARRAY['in'], false, '2024-05-01'),
('Bluză vaporoasă cu volane', 'Bluză cu mâneci clopot și design minimalist, elegantă pentru birou.', 'bluza_office_roz.png', 'bluza', ARRAY['roz']::culoare_haina[], 135.00, 38, 'office', ARRAY['poliester', 'matase'], false, CURRENT_DATE),
('Bluză asimetrică neon', 'Bluză portocalie îndrăzneață, perfectă pentru ieșirile în club.', 'bluza_portocalie.png', 'bluza', ARRAY['portocaliu']::culoare_haina[], 110.00, 36, 'petrecere', ARRAY['bumbac', 'elastan'], true, '2024-05-10'),

-- Eșarfe
('Eșarfă florală de primăvară', 'Eșarfă delicată cu treceri subtile de nuanțe și print abstract.', 'esarfa_florala.png', 'esarfa', ARRAY['violet', 'roz', 'alb']::culoare_haina[], 90.00, 0, 'casual', ARRAY['matase'], false, '2024-04-12');

