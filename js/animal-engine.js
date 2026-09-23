(function (AT) {
  AT.AnimalEngine = function(config, setId = config.defaults.animalSet){
    const set = config.animalSets.find(s=>s.id===setId) || config.animalSets[0];
    const tiers = config.animalTiers.map((tier,index)=>({...tier, name:set.characters[index], asset:set.asset, spriteIndex:index, setId:set.id, frame:set.frames[index], imageWidth:set.imageWidth, imageHeight:set.imageHeight}));
    const blockSize = config.animalLettersPerUpdate || 4;
    let current = tiers[0], lastLetters = 0, lastElapsed = 0;
    function reset(){ current = tiers[0]; lastLetters = 0; lastElapsed = 0; return current; }
    function update(metrics){
      if(metrics.paused || metrics.correctLetters - lastLetters < blockSize) return {tier:current,changed:false};
      // Active lesson time includes thinking/errors but excludes pauses.
      const letters = metrics.correctLetters - lastLetters;
      const duration = Math.max(1, metrics.elapsedMs - lastElapsed);
      const wpm = (letters / 5) / (duration / 60000);
      const wanted = tiers.reduce((chosen,tier)=>wpm >= tier.minEffectiveWpm ? tier : chosen,tiers[0]);
      const changed = wanted.id !== current.id;
      current = wanted; lastLetters = metrics.correctLetters; lastElapsed = metrics.elapsedMs;
      return {tier:current,changed};
    }
    function get(){ return current; }
    return {reset,update,get};
  };
})(window.AnimalTyping);
