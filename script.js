const url = "https://oszabel.github.io/valyriandictionary-api/";
const result = document.getElementById("result");
const sound = document.getElementById("sound");
const btn = document.getElementById("search-btn");

btn.addEventListener("click", () => {
    let inpWord = document.getElementById("inp-word").value;
    fetch(`${url}${inpWord}.json`)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            result.innerHTML = `
            <div class="word">
                <h3>${data[0].word}</h3>
                <button onclick="playSound()"><i class="fas fa-volume-up"></i></button>
            </div>
            <div class="details">
                <p>${data[0].meanings[0].partOfSpeech}</p>
                <p>${data[0].phonetics[0].text}</p>
            </div>
            <p class="word-meaning">${data[0].meanings[0].definitions[0].definition}</p>
            <p class="word-etymology">${data[0].meanings[0].definitions[0].etymology}</p>
            <p class="word-example">${data[0].meanings[0].definitions[0].example || ""}</p>
            <p class="word-etymology">more info <a href="${data[0].moreinfo}">here</a></p>`;
            sound.setAttribute("src", `https:${data[0].phonetics[0].audio}`);
        })
        .catch( () => {
            result.innerHTML = `<h3 class="error">Couldn't find the word</h3>`
        })
});
function playSound(){
    sound.play();
}