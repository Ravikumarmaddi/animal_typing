(function (AT) {
  AT.AnimalEngine = function(config){
    const tiers = config.animalTiers;
    let current = tiers[0], pending = null, pendingSince = 0;
    function reset(){ current = tiers[0]; pending = null; pendingSince = 0; return current; }
    function candidate(metrics){
      const effective = metrics.rollingWpm * (metrics.rollingAccuracy / 100);
      let chosen = tiers[0];
      for (const tier of tiers) {
        if (effective >= tier.minEffectiveWpm && metrics.rollingAccuracy >= tier.minAccuracy) chosen = tier;
      }
      return chosen;
    }
    function update(metrics, now = performance.now()){
      const wanted = candidate(metrics);
      if (wanted.id === current.id) { pending = null; pendingSince = 0; return {tier:current,changed:false}; }
      if (!pending || pending.id !== wanted.id) { pending = wanted; pendingSince = now; return {tier:current,changed:false}; }
      if (now - pendingSince >= (config.animalTierStabilitySeconds || 3) * 1000) {
        current = pending; pending = null; pendingSince = 0; return {tier:current,changed:true};
      }
      return {tier:current,changed:false};
    }
    function get(){ return current; }
    return {reset,update,get};
  };
})(window.AnimalTyping);
