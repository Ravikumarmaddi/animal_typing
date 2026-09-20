(function (AT) {
  AT.KeyboardRenderer = function(config, container){
    let layout, allowTap = false, tapHandler = null;
    const fingerNames = {
      "left-pinky":"Left Little Finger","left-ring":"Left Ring Finger","left-middle":"Left Middle Finger","left-index":"Left Index Finger",
      "right-index":"Right Index Finger","right-middle":"Right Middle Finger","right-ring":"Right Ring Finger","right-pinky":"Right Little Finger","thumbs":"Thumb"
    };
    function displayLabel(k){
      if(k.code === "Space") return "SPACE";
      if(typeof k.label === "string" && /^[a-z]$/.test(k.label)) return k.label.toUpperCase();
      return k.label;
    }
    function setLayout(id){
      layout = config.keyboardLayoutDefinitions[id] || config.keyboardLayoutDefinitions["qwerty-us"];
      render();
    }
    function render(){
      container.innerHTML = "";
      layout.rows.forEach(row => {
        const rowEl = document.createElement("div"); rowEl.className = "key-row";
        row.forEach(k => {
          const b = document.createElement("button");
          b.type="button"; b.className="key finger-"+(k.finger||"");
          if(k.special) b.classList.add("special");
          if(k.anchor) b.classList.add("anchor");
          b.dataset.code=k.code; b.dataset.label=k.label; if(k.shift) b.dataset.shift=k.shift;
          b.style.setProperty("--wide", String(k.wide || 1));
          b.textContent=displayLabel(k);
          b.setAttribute("aria-label", displayLabel(k) + (k.finger ? ", " + fingerNames[k.finger] : ""));
          b.tabIndex = allowTap ? 0 : -1;
          b.addEventListener("click", () => {
            if(!allowTap || !tapHandler) return;
            const target = container.dataset.target || "";
            const produced = k.code === "Space" ? " " : (target === k.shift ? k.shift : k.label);
            if(produced.length === 1) tapHandler(produced, k.code);
          });
          rowEl.appendChild(b);
        });
        container.appendChild(rowEl);
      });
    }
    function keyForChar(ch){
      for(const row of layout.rows) for(const k of row){
        if(k.label === ch || k.shift === ch || (ch === " " && k.code === "Space")) return k;
      }
      return null;
    }
    function needsShift(ch, key){
      return !!key && key.shift === ch && key.label !== ch;
    }
    function fingerNameForChar(ch){
      const key=keyForChar(ch);
      return key && key.finger ? fingerNames[key.finger] : "";
    }
    function setTarget(ch){
      container.dataset.target = ch || "";
      container.querySelectorAll(".key").forEach(el => el.classList.remove("target","required-shift"));
      const key=keyForChar(ch);
      if(!key) return;
      const el=container.querySelector('[data-code="'+CSS.escape(key.code)+'"]');
      if(el) el.classList.add("target");
      if(needsShift(ch,key)){
        const opposite = (key.finger||"").startsWith("left") ? "ShiftRight" : "ShiftLeft";
        const s=container.querySelector('[data-code="'+opposite+'"]'); if(s) s.classList.add("required-shift");
      }
    }
    function press(code){
      const el=container.querySelector('[data-code="'+CSS.escape(code)+'"]');
      if(!el) return;
      el.classList.add("pressed"); setTimeout(()=>el.classList.remove("pressed"),90);
    }
    function configureTap(enabled, handler){
      allowTap=!!enabled; tapHandler=handler || null;
      container.querySelectorAll(".key").forEach(k => k.tabIndex = allowTap ? 0 : -1);
    }
    return {setLayout,setTarget,press,configureTap,keyForChar,fingerNameForChar};
  };
})(window.AnimalTyping);
