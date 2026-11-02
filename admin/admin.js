const url = "https://valyrian-api.onrender.com/api/Words/";

// Every entry is in High Valyrian, so the dialect is fixed.
const DIALECT = "High Valyrian";

// ENUM VALUES
const ENUM_VALUES = {
  type: { Noun: 0, Verb: 1, Adjective: 2, Adverb: 3, Pronoun: 4, Numeral: 5 },
    gender: { Lunar: 0, Solar: 1, Terrestrial: 2, Aquatic: 3 },
    stemClass: {
        LiquidStem: 0, VoicelessStopStem: 1, NasalStem: 2, VoicedStopStem: 3,
        FricativeOrClusterStem: 4, PalatalResonantStem: 5,
        AStem: 6, EStem: 7, IStem: 8, OStem: 9, UStem: 10, Irregular: 11
    }
}

// ELEMENT REFERENCES
const nextBtn = document.getElementById("next-btn");
const resetBtn = document.getElementById("reset-btn");
const postBtn = document.getElementById("post-btn");
const meanings = document.getElementById("meanings");
const post = document.getElementById("post");
// const next =  document.getElementById("next");
const topMessages = document.getElementById("messages");
const postMessages = document.getElementById("post-messages");
const adminKeyInput = document.getElementById("adminKey")

adminKeyInput.value = sessionStorage.getItem("adminKey") ?? "";

const POS_OPTIONS = ["noun", "verb", "adjective", "adverb", "pronoun", "numeral"]
  .map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

const CLASS_OPTIONS = [
  { value: "1st declension", label: "1st declension" },
  { value: "2nd declension", label: "2nd declension" },
  { value: "3rd declension", label: "3rd declension" },
  { value: "4th declension", label: "4th declension" },
  { value: "5th declension", label: "5th declension" },
  { value: "6th declension", label: "6th declension" },
  { value: "vowel-final", label: "V-final" },
  { value: "consonant-final", label: "C-final" },
  { value: "irregular", label: "Irregular" },
  { value: "class I", label: "Class I" },
  { value: "class II", label: "Class II" },
  { value: "class III", label: "Class III" }
];

const VOWEL_STEM_ENDINGS = { AStem: "agon", EStem: "egon", IStem: "igon", OStem: "ogon", UStem: "ugon"};

// SMALL HELPERS
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v-20) % 10] || s[v] || s[0]);
}

const text = (id) => document.getElementById(id).value.trim();

const checkedIn = (root, field) => root.querySelector(`[data-field="${field}"] input:checked`)?.value ?? null;

function checkboxGroup(field, options, idPrefix, selected) {
  const boxes = options.map((o, i) => `
    <input type="checkbox" value="${o.value}" id="${idPrefix}-${i}"${o.value === selected ? " checked" : ""}>
    <label for="${idPrefix}-${i}" class="checkbox-label">${o.label}</label>
  `).join("");
  return `<div class="checkbox-group" data-field="${field}">${boxes}</div>`;
}

// PRE-SELECTOR
function defaultsFor(w) {
  const pos = w.type ? w.type.toLowerCase() : null;
  let cls = null;
  if (w.type === "Verb" && w.stemClass) {
    if (w.stemClass === "Irregular") cls = "irregular";
    else cls = w.stemClass in VOWEL_STEM_ENDINGS ? "vowel-final" : "consonant-final";
  }
  return { pos, cls };
}

// NEW CODE
function meaningFormHTML(n, defaults) {
  return `
    <h2>${ordinal(n)} Meaning</h2>
    <form class="meaning-form">
        <fieldset class="meaning">
            <div class="input-group">
                <label for="m${n}-translation" class="input-label">Translation</label>
                <input type="text" class="f-translation" id="m${n}-translation" maxlength="222" size="20">
            </div>

            <div class="input-group">
                <span class="input-label">Part of speech</span>
                ${checkboxGroup("pos", POS_OPTIONS, `m${n}-pos`, defaults.pos)}
            </div>

            <div class="input-group">
                <span class="input-label">Class</span>
                ${checkboxGroup("class", CLASS_OPTIONS, `m${n}-class`, defaults.cls)}
            </div>
        </fieldset>
        <fieldset class="example">
            <label for="m${n}-example" class="input-label">Example</label>
            <textarea class="f-example" id="m${n}-example" maxlength="444"></textarea>

            <div class="input-group">
              <label for="m${n}-synonyms" class="input-label">Synonyms</label>
              <input type="text" class="f-synonyms" id="m${n}-synonyms" maxlength="222" size="20">
            </div>

            <div class="input-group">
              <label for="m${n}-antonyms" class="input-label">Antonyms</label>
              <input type="text" class="f-antonyms" id="m${n}-antonyms" maxlength="222" size="20">
            </div>
        </fieldset>
    </form>
  `;
}

function showMessages(box, lines, kind) {
  box.className = `messages ${kind}`;
  box.replaceChildren(...lines.map(line => {
    const p = document.createElement("p");
    p.textContent = line;
    
    return p;
  }));
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearMessages() {
  for (const box of [topMessages, postMessages]) {
    box.className = "messages";
    box.replaceChildren();
  }
}

function readWord() {
  const word = text("word");
  return {
    word,
    phoneticTranscript: text("phoneticTranscript") || null,
    audioURL: text("audioURL") || null,
    moreInfo: word ? `https://wiki.languageinvention.com/index.php?title=${encodeURIComponent(word)}` : null,
    type: checkedIn(document, "type"),
    gender: checkedIn(document, "gender"),
    stemClass: checkedIn(document, "stemClass"),
    perfectStem: text("perfectStem") || null,
    meaningCount: parseInt(text("numberOfMeanings"), 10) || 0
  };
}

function validateWord(w) {
  const errors = [];

  if (!w.word) errors.push("Enter the word!");
  if (!w.type) errors.push("Select a word type!");
  if (!(w.meaningCount >= 1 && w.meaningCount <= 12)) errors.push("Enter between 1 and 12 meanings!");

  if (w.type === "Noun") {
    if (!w.gender) errors.push("Nouns must have a gender!");
    if (w.stemClass || w.perfectStem) errors.push("Nouns have no stem classes or perfect stems. Clear those fields!");
  }
  else if (w.type === "Verb") {
    if (w.gender) errors.push("Verbs have no genders. Clear that field!");
    if (!w.stemClass) {
      errors.push("Verbs must have a stem class!");
    } else if (w.stemClass !== "Irregular") {
      const ending = VOWEL_STEM_ENDINGS[w.stemClass] ?? "agon";
      if (w.word && !w.word.toLowerCase().endsWith(ending)) {
        errors.push(`With this stem class the infinitive should end in -${ending}!`);
      }

      if (!w.perfectStem) {
        errors.push("A regular verb needs a perfect stem!");
      } else if (!/[td]$/i.test(w.perfectStem)) {
        errors.push("The perfect stem is the 1st person singular perfect without -an, so it ends in t or d (zāltan → zālt).");
      }
    }
  }
  else if (w.type) {
    if (w.gender || w.stemClass || w.perfectStem) {
      errors.push("Only nouns and verbs use gender, stem class and perfect stem. Clear those fields.");
    }
  }

  return errors;
}

function readMeanings(wordGender) {
  return [...meanings.querySelectorAll(".meaning-form")].map(form => ({
    translation: form.querySelector(".f-translation").value.trim(),
    partOfSpeech: checkedIn(form, "pos"),
    class: checkedIn(form, "class"),

    gender: wordGender ? wordGender.toLowerCase() : null,
    example: form.querySelector(".f-example").value.trim() || null,
    synonyms: form.querySelector(".f-synonyms").value.trim() || null,
    antonyms: form.querySelector(".f-antonyms").value.trim() || null,
    dialect: DIALECT
  }));
}

function resetForm() {
  document.querySelectorAll("form").forEach(f => f.reset());
  meanings.innerHTML = "";
  post.classList.remove("visible");
  clearMessages();
}

resetBtn.addEventListener("click", () =>{
  if (meanings.children.length && !confirm("Clear everything you entered?")) return;
  resetForm();
});

// BUILD THE NEXT MEANINGS FORM
nextBtn.addEventListener("click", () => {
  clearMessages();
  const word = readWord();
  const errors = validateWord(word);
  if (errors.length) {
    showMessages(topMessages, errors, "err");
    return;
  }

  const typedSomething = [...meanings.querySelectorAll(".f-translation")].some(i => i.value.trim());
  if(typedSomething && !confirm("This rebuilds the meaning forms and clears what you typed. Continue?"))
    return;

  const defaults = defaultsFor(word);
  meanings.innerHTML = Array.from({ length: word.meaningCount }, (_, i) => meaningFormHTML(i + 1, defaults)).join("");
  post.classList.add("visible");
  meanings.scrollIntoView({ behavior: "smooth", block: "start" });
});

// POST: save to the database via the API
async function postWord(){
  clearMessages();

  const word = readWord();
  const meanings = readMeanings(word.gender);
  const errors = validateWord(word);

  if(!meanings.length) errors.push("Click NEXT to create the meaning forms first!");
  meanings.forEach((m, i) => {
    if(!m.translation) errors.push(`The ${ordinal(i+1)} meaning needs a translation!`);
  });

  const adminKey = adminKeyInput.value.trim();
  if(!adminKey) errors.push("Enter the admin key!");
  if(errors.length) {
    showMessages(postMessages, errors, "err");
    return;
  }

  // The server builds SearchKey itself, and meaningCount is only for this page.
  const {meaningCount, ...fields} = word;
  const typeValue = ENUM_VALUES.type[fields.type];
  const genderValue = fields.gender === null ? null : ENUM_VALUES.gender[fields.gender];
  const stemClassValue = fields.stemClass === null ? null : ENUM_VALUES.stemClass[fields.stemClass];
  if ([typeValue, genderValue, stemClassValue].includes(undefined)) {
    showMessages(postMessages, ["A selected option has no number in ENUM_VALUES at the top of admin.js. Add it there."], "err");
    return;
  }

  const body = { ...fields, type: typeValue, gender: genderValue, stemClass: stemClassValue, meanings };

  postBtn.disabled = true;
  postBtn.textContent = "Posting...";
  showMessages(postMessages, ["Sending. If the server was asleep, this can take up to a minute."], "info");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
      body: JSON.stringify(body)
    });

    if(!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new Error(res.status === 401 ? "The admin key was rejected" : `The server replied ${res.status}. ${detail}`);
    }

    const saved = await res.json();
    sessionStorage.setItem("adminKey", adminKey);
    resetForm();
    showMessages(topMessages, [`Saved “${saved.word}” (id ${saved.id}).`], "ok");
  } catch (err) {
    const reason = err instanceof TypeError 
            ? "Could not reach the server. Check your connection and that the API’s CORS policy allows the X-Admin-Key header."
            : err.message;
    showMessages(postMessages, [`Not saved. ${reason}`], "err");
  } finally {
    postBtn.disabled = false;
    postBtn.textContent = "POST";
  }
}

postBtn.addEventListener("click", postWord);

// ---------- one-at-a-time checkboxes ----------
// Delegated on the document, so it also covers meaning forms created later.
// Each group (.checkbox-group) is exclusive on its own, so meanings don't affect each other.
document.addEventListener("change", (e) => {
  const box = e.target;
  if (!box.matches('.checkbox-group input[type="checkbox"]') || !box.checked) return;

  box.closest(".checkbox-group").querySelectorAll('input[type="checkbox"]').forEach(other => {
    if (other !== box) other.checked = false;
  });
});

// Never let Enter inside a text field submit a form and reload the page.
document.addEventListener("submit", (e) => e.preventDefault());

// CSS SQUIRCLE
// if (!CSS.supports("corner-shape", "squircle")) {
//   const n = 4;
//   const path = (w, h, steps = 120) => {
//     const pts = [];
//     for (let i = 0; i < steps; i++) {
//       const t = (i / steps) * 2 * Math.PI
//       const c = Math.cos(t), s = Math.sin(t);
//       const x = w / 2 + (w / 2) * Math.sign(c) * Math.abs(c) ** (2 / n);     
//       const y = h / 2 + (h / 2) * Math.sign(s) * Math.abs(s) ** (2 / n);
//       pts.push(`${x.toFixed(2)}px ${y.toFixed(2)}px`);
//     }
//     return `polygon(${pts.join(",")})`;
//   };

//   const ro = new ResizeObserver(entries => {
//     for (const { target, contentRect: r } of entries) {
//       //target.style.borderRadius = "0";
//       target.style.clipPath = path(r.width, r.height);
//     }
//   });
//   const elements = [".container", ".input-group input", ".input-group input:focus", ".checkbox-label", ".post.visible .btn", ".next .btn", "textarea", "textarea:focus"]
  
//   for (let i = 0; i < elements.length; i++) {
//     document.querySelectorAll(elements[i]).forEach(el => ro.observe(el));
//   }
// }