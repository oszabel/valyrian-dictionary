const url = "https://valyrian-api.onrender.com/api/Words/";
const result = document.getElementById("result");
const sound = document.getElementById("sound");
const btn = document.getElementById("search-btn");

btn.addEventListener("click", () => {
    let inpWord = document.getElementById("inp-word").value;
    fetch(`${url}search/${inpWord}`)
        .then((response) => {
            if(!response.ok) throw new Error("Word not found!");
            return response.json();
        })
        .then((data) => {

            let firstMeaning = data.meanings && data.meanings.length > 0 ? data.meanings[0] : {};

            console.log(data);
            let html = `
                <div class="word">
                    <h3>${data.word}</h3>
                    <button onclick="playSound()"><i class="fas fa-volume-up"></i></button>
                </div>
                <div class="details">`;

            if (firstMeaning.class) html += `<p>${firstMeaning.class || ""}</p>`;
            if (firstMeaning.gender) html += `<p>${firstMeaning.gender || ""}</p>`;

            html += `
                    <p>${firstMeaning.partOfSpeech || ""}</p>
                    <p>${data.phoneticTranscript || ""}</p>
                </div>
                <p class="word-meaning">${firstMeaning.translation || ""}</p>
                <p class="word-etymology">${firstMeaning.dialect || ""}</p>
                <p class="word-example">${firstMeaning.example || ""}</p>
                <p class="word-etymology">more info <a href="${data.moreInfo}">here</a></p>`;

            result.innerHTML = html;
            // result.innerHTML = `
            // <div class="word">
            //     <h3>${data.word}</h3>
            //     <button onclick="playSound()"><i class="fas fa-volume-up"></i></button>
            // </div>
            // <div class="details">
            //     <p>${firstMeaning.class || ""}</p>
            //     <p>${firstMeaning.gender || ""}</p>
            //     <p>${firstMeaning.partOfSpeech || ""}</p>
            //     <p>${data.phoneticTranscript || ""}</p>
            // </div>
            // <p class="word-meaning">${firstMeaning.translation || ""}</p>
            // <p class="word-etymology">${firstMeaning.dialect || ""}</p>
            // <p class="word-example">${firstMeaning.example || ""}</p>
            // <p class="word-etymology">more info <a href="${data.moreInfo}">here</a></p>`;

            const isVerb = data.type === 1 || data.type === "verb";
            if (isVerb) {
                loadConjugation(data.id);
            } else {
                conjugationSection.style.display = "none";
                currentConjugation = null;
            }

            if (data.audioURL) {
                sound.setAttribute("src", `${data.audioURL}`);
            }
        })
        .catch((err) => {
            console.error("UI Rendering Error:", err);
            result.innerHTML = `<h3 class="error">Couldn't find the word</h3>`
        })
});
function playSound(){
    sound.play();
}

const inpWord = document.getElementById("inp-word");
const suggestionsList = document.getElementById("suggestions-list");

// 1. Listen for typing
inpWord.addEventListener("input", async () => {
    let term = inpWord.value.trim();
    
    // Clear the dropdown if the box is empty or only has 1 letter
    if (term.length < 2) {
        suggestionsList.innerHTML = "";
        return;
    }

    try {
        // Fetch the 5 strings from your new API endpoint
        let response = await fetch(`${url}suggestions/${term}`);
        if (!response.ok) throw new Error("Failed to fetch suggestions");
        let suggestions = await response.json();

        // Clear out the old list
        suggestionsList.innerHTML = "";

        // Build the new list items
        suggestions.forEach(word => {
            let li = document.createElement("li");
            li.textContent = word;
            
            // What happens when the user clicks a suggestion?
            li.addEventListener("click", () => {
                inpWord.value = word; // Fill the search bar with the clicked word
                suggestionsList.innerHTML = ""; // Hide the dropdown
                btn.click(); // Automatically trigger the main search button!
            });
            
            suggestionsList.appendChild(li);
        });
    } catch (error) {
        console.error("Suggestion error:", error);
    }
});

// 2. Hide suggestions if the user clicks anywhere else on the page
document.addEventListener("click", (e) => {
    if (!inpWord.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.innerHTML = "";
    }
});

const TENSES = [
    { key: "present", label: "Present" },
    { key: "aorist", label: "Aorist" },
    { key: "future", label: "Future" },
    { key: "imperfect", label: "Imperfect" },
    { key: "perfect", label: "Perfect" },
    { key: "pluperfect", label: "Pluperfect" },
    { key: "pastHabitual", label: "Past Habitual" }
];

const conjugationSection = document.getElementById("conjugation-section");
const tenseButtons = document.getElementById("tense-buttons");
const tenseDisplay = document.getElementById("tense-display");

let currentConjugation = null;

async function loadConjugation(wordId) {
    try {
        const response = await fetch(`${url}${wordId}/conjugate`);
        if (!response.ok) throw new Error("Could not load conjugation");
        currentConjugation = await response.json();

        tenseButtons.innerHTML = "";
        TENSES.forEach((tense, i) => {
            const btn = document.createElement("button");
            btn.textContent = tense.label;
            btn.className = "tense-btn";
            btn.addEventListener("click", () => {
                document.querySelectorAll(".tense-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                renderTense(tense.key);
            });
            tenseButtons.appendChild(btn);
            if (i === 0) btn.click(); // show Present by default
        });

        conjugationSection.style.display = "block";
    } catch (error) {
        console.error("Conjugation error:", error);
        conjugationSection.style.display = "none";
        currentConjugation = null;
    }
}

function renderTense(key) {
    const paradigm = currentConjugation[key];
    if (!paradigm) {
        tenseDisplay.innerHTML = `<p class="error">No data for this tense.</p>`;
        return;
    }

    let html = `<div class="voice-block"><h4>Active</h4>`;
    html += renderFiniteForms("Indicative", paradigm.active.indicative);
    html += renderFiniteForms("Subjunctive", paradigm.active.subjunctive);
    html += renderImperativeObject(paradigm.active.imperative);
    html += renderParticiple(paradigm.active.participle);
    html += renderInfinitive(paradigm.active.infinitive);
    html += `</div>`;

    if (paradigm.passive) {
        html += `<div class="voice-block"><h4>Passive</h4>`;
        html += renderFiniteForms("Indicative", paradigm.passive.indicative);
        html += renderFiniteForms("Subjunctive", paradigm.passive.subjunctive);
        html += renderImperativeString(paradigm.passive.imperative);
        html += renderParticiple(paradigm.passive.participle);
        html += renderInfinitive(paradigm.passive.infinitive);
        html += `</div>`;
    }

    tenseDisplay.innerHTML = html;
}

function renderFiniteForms(title, forms) {
    if (!forms) return "";
    return `
        <table class="conj-table">
            <caption>${title}</caption>
            <tr><th></th><td>Singular</td><td>Plural</td></tr>
            <tr><td>1st</td><td class="conj-word">${forms.firstSingular}</td><td class="conj-word">${forms.firstPlural}</td></tr>
            <tr><td>2nd</td><td class="conj-word">${forms.secondSingular}</td><td class="conj-word">${forms.secondPlural}</td></tr>
            <tr><td>3rd</td><td class="conj-word">${forms.thirdSingular}</td><td class="conj-word">${forms.thirdPlural}</td></tr>
        </table>`;
}

function renderImperativeObject(imp) {
    if (!imp) return "";
    return `<p class="conj-line"><strong>Imperative:</strong> <span class="conj-word">${imp.singular}</span> (sg.) / <span class="conj-word">${imp.plural}</span> (pl.)</p>`;
}

function renderImperativeString(imp) {
    if (!imp) return "";
    return `<p class="conj-line"><strong>Imperative:</strong> <span class="conj-word">${imp}</span></p>`;
}

function renderParticiple(participle) {
    if (!participle) return "";
    if (typeof participle === "string") {
        return `<p class="conj-line"><strong>Participle:</strong> <span class="conj-word">${participle}</span></p>`;
    }
    return `<p class="conj-line"><strong>Participle:</strong>
        <span class="conj-word">${participle.lunar}</span> (Lunar) / <span class="conj-word">${participle.solar}</span> (Solar) /
        <span class="conj-word">${participle.terrestrial}</span> (Terrestrial) / <span class="conj-word">${participle.aquatic}</span> (Aquatic)</p>`;
}

function renderInfinitive(inf) {
    if (!inf) return "";
    return `<p class="conj-line"><strong>Infinitive:</strong> <span class="conj-word">${inf}</span></p>`;
}