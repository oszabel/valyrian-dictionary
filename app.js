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
            result.innerHTML = `
            <div class="word">
                <h3>${data.word}</h3>
                <button onclick="playSound()"><i class="fas fa-volume-up"></i></button>
            </div>
            <div class="details">
                <p>${firstMeaning.class || ""}</p>
                <p>${firstMeaning.gender || ""}</p>
                <p>${firstMeaning.partOfSpeech || ""}</p>
                <p>${data.phoneticTranscript || ""}</p>
            </div>
            <p class="word-meaning">${firstMeaning.translation || ""}</p>
            <p class="word-etymology">${firstMeaning.dialect || ""}</p>
            <p class="word-example">${firstMeaning.example || ""}</p>
            <p class="word-etymology">more info <a href="${data.moreInfo}">here</a></p>`;
            sound.setAttribute("src", `${data.audioURL}`);
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