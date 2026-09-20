(function (AT) {
  AT.LessonService = function(config){
    function bySet(setId){ return config.lessons.filter(l => l.lessonSet === setId); }
    function get(id){ return config.lessons.find(l => l.id === id) || null; }
    function first(setId){ return bySet(setId)[0] || config.lessons[0]; }
    function next(current){
      const list = bySet(current.lessonSet);
      const i = list.findIndex(l => l.id === current.id);
      return i >= 0 && i < list.length - 1 ? list[i+1] : null;
    }
    function sets(){ return config.lessonSets.slice(); }
    return {bySet,get,first,next,sets};
  };
})(window.AnimalTyping);
