(function (AT) {
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function deepMerge(base, extra){
    if (!extra || typeof extra !== "object") return clone(base);
    const out = Array.isArray(base) ? clone(extra) : {...base};
    Object.keys(extra).forEach(k => {
      if (base && typeof base[k] === "object" && !Array.isArray(base[k]) && typeof extra[k] === "object" && !Array.isArray(extra[k])) {
        out[k] = deepMerge(base[k], extra[k]);
      } else out[k] = clone(extra[k]);
    });
    return out;
  }
  AT.ConfigService = {
    async load(){
      const fallback = window.AnimalTypingRuntimeConfig;
      if (!fallback) throw new Error("Runtime configuration is missing.");
      if (location.protocol === "file:") return clone(fallback);
      try {
        const r = await fetch("config/game-config.json", {cache:"no-store"});
        if (!r.ok) throw new Error("Config HTTP " + r.status);
        const loaded = await r.json();
        return deepMerge(fallback, loaded);
      } catch (err) {
        console.warn("Using runtime config fallback:", err);
        return clone(fallback);
      }
    }
  };
})(window.AnimalTyping);
