(function (AT) {
  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  }
  AT.StorageService = function(config){
    const prefix = config.storageNamespace + ".";
    const key = n => prefix + n;
    const read = (n, fallback) => safeParse(localStorage.getItem(key(n)), fallback);
    const write = (n, value) => { try { localStorage.setItem(key(n), JSON.stringify(value)); } catch(e){ console.warn("Storage write failed", e); } };
    const remove = n => { try { localStorage.removeItem(key(n)); } catch{} };
    function getSettings(){
      const saved = read("settings", {});
      return {...config.defaults, ...saved};
    }
    function saveSettings(settings){ write("settings", settings); }
    function getPlayer(name){
      const players = read("players", {});
      return players[name] || {name, lessonsCompleted:0, totalPracticeMs:0, highestWpm:0, bestAccuracy:0, bestScore:0};
    }
    function getLessonBest(player, lessonId){
      const map = read("lessonBests", {});
      return map[player + "::" + lessonId] || null;
    }
    function getHistory(){ return read("history", []); }
    function lastResult(){
      const h = getHistory();
      return h.length ? h[0] : null;
    }
    function completeSession(settings, lesson, metrics, finalTier){
      const playerName = settings.playerName || "Player 1";
      const players = read("players", {});
      const p = players[playerName] || {name:playerName, lessonsCompleted:0, totalPracticeMs:0, highestWpm:0, bestAccuracy:0, bestScore:0};
      p.lessonsCompleted += 1;
      p.totalPracticeMs += metrics.elapsedMs;
      p.highestWpm = Math.max(p.highestWpm || 0, metrics.wpm);
      p.bestAccuracy = Math.max(p.bestAccuracy || 0, metrics.accuracy);
      p.bestScore = Math.max(p.bestScore || 0, metrics.score);
      players[playerName] = p;
      write("players", players);

      const bests = read("lessonBests", {});
      const id = playerName + "::" + lesson.id;
      const old = bests[id] || {bestWpm:0,bestAccuracy:0,bestScore:0,bestElapsedMs:null,completionCount:0};
      const newBest = metrics.wpm > old.bestWpm || metrics.accuracy > old.bestAccuracy || metrics.score > old.bestScore;
      old.bestWpm = Math.max(old.bestWpm || 0, metrics.wpm);
      old.bestAccuracy = Math.max(old.bestAccuracy || 0, metrics.accuracy);
      old.bestScore = Math.max(old.bestScore || 0, metrics.score);
      old.bestElapsedMs = old.bestElapsedMs == null ? metrics.elapsedMs : Math.min(old.bestElapsedMs, metrics.elapsedMs);
      old.completionCount = (old.completionCount || 0) + 1;
      old.lastPlayed = new Date().toISOString();
      bests[id] = old;
      write("lessonBests", bests);

      const session = {
        dateTime:new Date().toISOString(), player:playerName, mode:settings.lessonSet,
        lessonId:lesson.id, lessonTitle:lesson.title, wpm:metrics.wpm, accuracy:metrics.accuracy,
        errors:metrics.errors, correctChars:metrics.correct, totalPresses:metrics.total,
        elapsedMs:metrics.elapsedMs, score:metrics.score, finalTier:finalTier.name
      };
      const history = read("history", []);
      history.unshift(session);
      write("history", history.slice(0, config.historyLimit || 100));
      return {newBest, best:old, player:p, session};
    }
    function resetSetup(){ remove("settings"); }
    function resetAll(){
      try {
        Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
      } catch(e){ console.warn("Reset failed", e); }
    }
    return {getSettings,saveSettings,getPlayer,getLessonBest,getHistory,lastResult,completeSession,resetSetup,resetAll};
  };
})(window.AnimalTyping);
