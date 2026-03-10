/**
 * Shared dialogue/textbox system for all scenes.
 * API:
 *   Dialogue.show(speaker, text, portrait)
 *   Dialogue.start(entries, { onComplete })
 *   Dialogue.visible()
 *   Dialogue.hide()
 *
 * entries: [{ speaker, text, portrait, thought? }]
 * portrait: image path (e.g. "images/bigphilly.png") or short name (e.g. "bigphilly" -> "images/bigphilly.png")
 */
(function () {
  const dialogueBox = document.getElementById("dialogueBox");
  const dialogueSpeaker = document.getElementById("dialogueSpeaker");
  const dialogueText = document.getElementById("dialogueText");
  const dialoguePortrait = document.getElementById("dialoguePortrait");
  const statusEl = document.getElementById("statusText");

  const state = {
    visible: false,
    queue: [],
    onComplete: null,
    typewriterId: null,
    isTyping: false,
    currentLineText: "",
  };

  const TYPEWRITER_SPEED = 40;

  /** Phil audio: play phil_full whenever Red (Big Philly) speaks. */
  const philFullAudio = new Audio("sounds/phil_full.mp3");

  /** Returns true if the current speaker is Red (Big Philly). */
  function isRedSpeaking(speaker, portrait) {
    const s = String(speaker || "").toLowerCase();
    if (s === "red") return true;
    if (!portrait) return false;
    const p = String(portrait).toLowerCase();
    return p === "bigphilly" || p === "images/bigphilly.png";
  }

  /** Words that get the "slap" emphasis effect (red, punchy animation). Case-insensitive. */
  const EMPHASIS_WORDS = ["guilty", "murder", "life", "death", "sentence"];

  function portraitPath(portrait) {
    if (!portrait) return "images/bigphilly.png";
    if (portrait.includes("/") || portrait.includes(".")) return portrait;
    return "images/" + portrait + ".png";
  }

  function stopPhilAudio() {
    philFullAudio.pause();
    philFullAudio.currentTime = 0;
  }

  function show(speaker, text, portrait, thought) {
    if (!dialogueBox || !dialogueSpeaker || !dialogueText) return;
    stopPhilAudio(); // Cut Red's audio when speaker changes
    if (state.typewriterId) {
      clearInterval(state.typewriterId);
      state.typewriterId = null;
    }
    state.currentLineText = text;
    state.currentRedLine = isRedSpeaking(speaker, portrait) && !thought;
    const speakerLabel = thought ? (speaker ? speaker + " (thinking)" : "(thinking)") : (speaker || "");
    dialogueSpeaker.textContent = speakerLabel;
    dialogueSpeaker.dataset.speaker = (speaker || "").toLowerCase();
    dialogueSpeaker.dataset.thought = thought ? "1" : "0";
    if (dialoguePortrait) dialoguePortrait.src = portraitPath(portrait);
    dialogueBox.classList.add("visible");
    dialogueBox.setAttribute("aria-hidden", "false");
    state.visible = true;
    state.isTyping = true;
    document.body.classList.toggle("dialogue-active", true);
    if (statusEl) statusEl.textContent = thought ? "Read..." : "Listen...";
    dialogueText.innerHTML = "";
    if (state.currentRedLine) {
      philFullAudio.currentTime = 0;
      philFullAudio.play().catch(() => {});
    }

    const tokens = text.split(/(\s+)/);
    let tokenIdx = 0;
    let charIdx = 0;

    function tick() {
      if (tokenIdx >= tokens.length) {
        clearInterval(state.typewriterId);
        state.typewriterId = null;
        state.isTyping = false;
        return;
      }
      const token = tokens[tokenIdx];
      const isWord = /\S/.test(token);
      if (isWord) {
        if (charIdx === 0) {
          const span = document.createElement("span");
          span.className = "dialogue-word typing";
          span.dataset.emphasis = EMPHASIS_WORDS.includes(token.replace(/[^\w]/g, "").toLowerCase()) ? "1" : "0";
          span.textContent = "";
          dialogueText.appendChild(span);
          state.currentWordSpan = span;
        }
        state.currentWordSpan.textContent += token[charIdx];
        charIdx++;
        if (charIdx >= token.length) {
          state.currentWordSpan.classList.remove("typing");
          state.currentWordSpan.classList.add("complete");
          if (state.currentWordSpan.dataset.emphasis === "1") {
            state.currentWordSpan.classList.add("dialogue-emphasis");
          }
          tokenIdx++;
          charIdx = 0;
        }
      } else {
        dialogueText.appendChild(document.createTextNode(token));
        tokenIdx++;
      }
    }
    state.typewriterId = setInterval(tick, TYPEWRITER_SPEED);
  }

  function buildTextWithEmphasis(text) {
    const tokens = text.split(/(\s+)/);
    const parts = [];
    for (const token of tokens) {
      if (/\S/.test(token)) {
        const normalized = token.replace(/[^\w]/g, "").toLowerCase();
        const isEmphasis = EMPHASIS_WORDS.includes(normalized);
        parts.push(
          isEmphasis
            ? `<span class="dialogue-word dialogue-emphasis complete">${escapeHtml(token)}</span>`
            : `<span class="dialogue-word complete">${escapeHtml(token)}</span>`
        );
      } else {
        parts.push(escapeHtml(token));
      }
    }
    return parts.join("");
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function completeTypewriter() {
    if (!state.isTyping || !dialogueText) return false;
    if (state.typewriterId) {
      clearInterval(state.typewriterId);
      state.typewriterId = null;
    }
    state.isTyping = false;
    dialogueText.innerHTML = buildTextWithEmphasis(state.currentLineText);
    return true;
  }

  function hide() {
    if (!dialogueBox) return;
    stopPhilAudio(); // Cut Red's audio when dialogue closes
    dialogueBox.classList.remove("visible");
    dialogueBox.setAttribute("aria-hidden", "true");
    state.visible = false;
    document.body.classList.toggle("dialogue-active", false);
    if (state.onComplete) {
      state.onComplete();
      state.onComplete = null;
    }
  }

  function advance() {
    if (state.queue.length === 0) {
      hide();
      return;
    }
    const entry = state.queue.shift();
    show(entry.speaker, entry.text, entry.portrait, entry.thought);
  }

  function start(entries, options) {
    if (state.visible || state.queue.length > 0) return;
    state.queue = entries.map((e) => ({ ...e }));
    state.onComplete = options?.onComplete || null;
    advance();
  }

  window.addEventListener("keydown", (e) => {
    if (e.key !== " " || !state.visible) return;
    e.preventDefault();
    if (state.isTyping) completeTypewriter();
    else advance();
  });

  window.Dialogue = {
    show,
    hide,
    visible: () => state.visible,
    start,
    queue: (entries) => { state.queue.push(...entries.map((e) => ({ ...e }))); },
    /** Add or remove emphasis keywords (e.g. Dialogue.emphasisWords = ["guilty", "murder"]) */
    get emphasisWords() { return [...EMPHASIS_WORDS]; },
    set emphasisWords(words) {
      EMPHASIS_WORDS.length = 0;
      if (Array.isArray(words)) EMPHASIS_WORDS.push(...words.map((w) => String(w).toLowerCase()));
    },
  };
})();
