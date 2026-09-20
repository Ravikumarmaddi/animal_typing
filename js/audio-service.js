(function (AT) {
  AT.AudioService = function(config){
    let enabled = true;
    const cache = {};
    Object.entries(config.audio || {}).forEach(([name,path]) => {
      const a = new Audio(path); a.preload="auto"; cache[name]=a;
    });
    function setEnabled(v){ enabled=!!v; }
    function play(name){
      if(!enabled || !cache[name]) return;
      try { const a=cache[name]; a.currentTime=0; const p=a.play(); if(p && p.catch) p.catch(()=>{}); } catch{}
    }
    return {setEnabled,play};
  };
})(window.AnimalTyping);
