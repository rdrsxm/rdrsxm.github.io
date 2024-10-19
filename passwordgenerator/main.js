const rangeInput = document.getElementById('passwordLengthSelector');
const rangeValueDisplay = document.getElementById('passwordLengthNumber');

// Update the displayed value when the range input is modified
rangeInput.addEventListener('input', function() {
    rangeValueDisplay.textContent = rangeInput.value;
    generatePassword();
});

let useUppercaseLetters = true;
let useLowercaseLetters = true;
let useNumbers = true;
let useSymbols = true;
let isDarkModeOn = false;

generatePassword();

//crea password
function generatePassword() {

    //Formazione stringa
    let characters = "";
    if(useUppercaseLetters){characters = characters + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"};
    if(useLowercaseLetters){characters = characters + "abcdefghijklmnopqrstuvwxyz"};
    if(useNumbers){characters = characters + "0123456789"};
    if(useSymbols){characters = characters + "!@#$%^&*()_+[]{}|;:,.<>?"};
    
    let password = '';
    const stringLength = document.getElementById("passwordLengthSelector").value;

    // Cicla 16 volte per aggiungere caratteri casuali alla stringa
    for (let i = 0; i < stringLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters[randomIndex];
    }

    //hideNotification()
    document.getElementById("passwordOutput").value = password;
    
}

//impostare lunghezza casuale
function setRandomPasswordLength(){
    let random = Math.floor(Math.random() * (24 - 8 + 1)) + 8;
    document.getElementById("passwordLengthSelector").value = random;
    rangeValueDisplay.textContent = rangeInput.value;
    generatePassword();
}

//modificare le checkbox
function toggleUseUppercaseLetters(){
    if(useUppercaseLetters){
        if(!checkIfEverythingIsDisabled()){showNotification(2); return};
        useUppercaseLetters = false;
        document.getElementById("checkboxUppercaseLetters").style.opacity = "0.5";
        document.getElementById("labelUppercaseLetters").style.opacity = "0.5";
        document.getElementById("containerUpperscaleLetters").classList.add("checked");
        generatePassword();

    } else {
        useUppercaseLetters = true;
        document.getElementById("checkboxUppercaseLetters").style.opacity = "1";
        document.getElementById("labelUppercaseLetters").style.opacity = "1";
        document.getElementById("containerUpperscaleLetters").classList.remove("checked");
        generatePassword();
    }
}

function toggleUseLowercaseLetters(){
    if(useLowercaseLetters){
        if(!checkIfEverythingIsDisabled()){showNotification(2); return};
        useLowercaseLetters = false;
        document.getElementById("checkboxLowercaseLetters").style.opacity = "0.5";
        document.getElementById("labelLowercaseLetters").style.opacity = "0.5";
        document.getElementById("containerLowerscaleLetters").classList.add("checked");

        generatePassword();
    } else {
        useLowercaseLetters = true;
        document.getElementById("checkboxLowercaseLetters").style.opacity = "1";
        document.getElementById("labelLowercaseLetters").style.opacity = "1";
        document.getElementById("containerLowerscaleLetters").classList.remove("checked");

        generatePassword();
    }
}

function toggleUseNumbers(){
    if(useNumbers){
        if(!checkIfEverythingIsDisabled()){showNotification(2); return};
        useNumbers = false;
        document.getElementById("checkboxNumbers").style.opacity = "0.5";
        document.getElementById("labelNumbers").style.opacity = "0.5";
        document.getElementById("containerNumbers").classList.add("checked");

        generatePassword();
    } else {
        useNumbers = true;
        document.getElementById("checkboxNumbers").style.opacity = "1";
        document.getElementById("labelNumbers").style.opacity = "1";
        document.getElementById("containerNumbers").classList.remove("checked");

        generatePassword();
    }
}

function toggleUseSymbols(){
    if(useSymbols){
        if(!checkIfEverythingIsDisabled()){showNotification(2); return};
        useSymbols = false;
        document.getElementById("checkboxSymbols").style.opacity = "0.5";
        document.getElementById("labelSymbols").style.opacity = "0.5";
        document.getElementById("containerSymbols").classList.add("checked");

        generatePassword();
        
    } else {
        useSymbols = true;
        document.getElementById("checkboxSymbols").style.opacity = "1";
        document.getElementById("labelSymbols").style.opacity = "1";
        document.getElementById("containerSymbols").classList.remove("checked");

        generatePassword();
    }
}

function checkIfEverythingIsDisabled(){
    const trueCount = [useUppercaseLetters, useLowercaseLetters, useNumbers, useSymbols].filter(Boolean).length;
    // Restituisce vero se ci sono almeno due variabili vere
    return trueCount >= 2;
}

// Funzione per mostrare la notifica
function showNotification(codice) {

    clearTimeout();   
    const notification = document.getElementById("notification");

    if(codice == 1){
        notification.innerHTML = "<i class='fa-solid fa-circle-check'></i>&nbsp; password copied to clipboard";
    } else if (codice == 2){
        notification.innerHTML = "<i class='fa-solid fa-circle-xmark'></i>&nbsp; select at least one component";
    }

    notification.style.transform = "translateY(20px) translateX(-50%)";
    notification.style.animation = "slideIn 0.5s forwards";
    notification.style.visibility = "visible";

    hideNotification();
}

function hideNotification(){
    setTimeout(() => {
        notification.style.transform = "translateY(0px) translateX(-50%)";
        notification.style.animation = "slideOut 0.5s forwards";
        setTimeout(() => {
            notification.style.visibility = "hidden";
        }, 700);
    
    }, 3000);
}

function copyToClipboard(){
    navigator.clipboard.writeText(document.getElementById("passwordOutput").value);
    showNotification(1);
}

var r = document.querySelector(':root');

function toggleDarkMode(){
    if(isDarkModeOn){
        //toggle off

        document.getElementById("labelDarkMode").innerHTML = "dark mode"
        document.getElementById("checkBoxDarkMode").classList.add("animateDarkModeIcon");
        setTimeout(() => {
            document.getElementById("checkBoxDarkMode").innerHTML = "<i class='fa-solid fa-moon'></i>";
        }, 500);
        setTimeout(() => {
            document.getElementById("checkBoxDarkMode").classList.remove("animateDarkModeIcon");
        }, 1000);
        isDarkModeOn = false;


        r.style.setProperty('--bodyBackgroundColor', '#C5C3C6');
        r.style.setProperty('--mainContainerBackgroundColor', '#DCDCDD');
        r.style.setProperty('--textColor', '#46494C');
        r.style.setProperty('--accentColor', '#BCAC98');
        r.style.setProperty('--hoverTextColor', '#000000');
        r.style.setProperty('--accentColorHover', '#9d9180');




    } else {
        //toggle on
        
        document.getElementById("labelDarkMode").innerHTML = "light mode"
        document.getElementById("checkBoxDarkMode").classList.add("animateDarkModeIcon");

        setTimeout(() => {
            document.getElementById("checkBoxDarkMode").innerHTML = "<i class='fa-solid fa-sun'></i>";
        }, 300);
        setTimeout(() => {
            document.getElementById("checkBoxDarkMode").classList.remove("animateDarkModeIcon");
        }, 1000);
        isDarkModeOn = true;



        r.style.setProperty('--bodyBackgroundColor', '#121212');
        r.style.setProperty('--mainContainerBackgroundColor', '#1d1d1d');
        r.style.setProperty('--textColor', '#C5C3C6');
        r.style.setProperty('--accentColor', '#82776b');
        r.style.setProperty('--hoverTextColor', '#ffffff');
        r.style.setProperty('--accentColorHover', '#4d463f');





    }
}