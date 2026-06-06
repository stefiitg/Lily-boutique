
let temaCurenta = localStorage.getItem("tema") || "light"; 

if (temaCurenta !== "light") {
    document.body.classList.add(temaCurenta);
}


window.addEventListener("DOMContentLoaded", function() {
    
    
    let radioBifat = document.querySelector(`input[name="radio_tema"][value="${temaCurenta}"]`);
    if (radioBifat) {
        radioBifat.checked = true;
    }                                                                                                                                     //bifam vizual elementul din radio cu value = tema curenta

    let radioButtons = document.querySelectorAll('input[name="radio_tema"]');
    
    for (let radio of radioButtons) {
        radio.addEventListener("change", function() {                                                                                     //ascultam schimbarile la fiecare buton
            
            //curatam
            document.body.classList.remove("dark", "pastel");
            
          
            let temaNoua = this.value;
            
            
            if (temaNoua !== "light") {
                document.body.classList.add(temaNoua);
            }
            
           
            localStorage.setItem("tema", temaNoua);
        });
    }
});