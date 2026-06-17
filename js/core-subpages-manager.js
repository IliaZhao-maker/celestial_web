// CORE Subpages Manager
// 管理 CORE 章节 4 个子页面的可见性
// 各模块懒初始化：首次激活时才创建 WebGL 上下文
MoonApp.CoreSubpages = (function() {
  var modules = [null, null, null, null];
  var activeIndex = -1;

  function _register(id, mod) {
    modules[id] = mod;
    mod._container = document.getElementById('core-subpage-' + id);
    if (mod._container) {
      mod._container.classList.add('inactive');
    }
  }

  function activate(id) {
    if (activeIndex === id) {
      var activeMod = modules[id];
      if (activeMod && typeof activeMod.start === 'function') activeMod.start();
      if (typeof MoonApp.applyConsoleVisibility === 'function') MoonApp.applyConsoleVisibility();
      return;
    }
    
    if (activeIndex >= 0 && modules[activeIndex] && modules[activeIndex]._container) {
      if (typeof modules[activeIndex].pause === 'function') modules[activeIndex].pause();
      modules[activeIndex]._container.classList.remove('active');
      modules[activeIndex]._container.classList.add('inactive');
    }

    activeIndex = id;
    var mod = modules[id];
    if (!mod) return;

    if (typeof mod.init === 'function') mod.init();

    if (mod._container) {
      mod._container.classList.remove('inactive');
      mod._container.classList.add('active');
    }
    if (typeof mod.start === 'function') mod.start();
    if (typeof MoonApp.applyConsoleVisibility === 'function') MoonApp.applyConsoleVisibility();
  }

  function pauseAll() {
    for (var i = 0; i < modules.length; i++) {
      if (modules[i] && typeof modules[i].pause === 'function') {
        modules[i].pause();
      }
      if (modules[i] && modules[i]._container) {
        modules[i]._container.classList.remove('active');
        modules[i]._container.classList.add('inactive');
      }
    }
    activeIndex = -1;
    if (typeof MoonApp.applyConsoleVisibility === 'function') MoonApp.applyConsoleVisibility();
  }

  return {
    _register: _register,
    activate: activate,
    pauseAll: pauseAll,
    setProgress: function(val, btn) {
      if (modules[2] && typeof modules[2].setProgress === 'function') {
        modules[2].setProgress(val, btn);
      }
    },
    triggerEclipse: function() {
      if (modules[0] && typeof modules[0].triggerEclipse === 'function') {
        modules[0].triggerEclipse();
      }
    },
    setMode: function(mode) {
      if (modules[1] && typeof modules[1].setMode === 'function') {
        modules[1].setMode(mode);
      }
    }
  };
})();
