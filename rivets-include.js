/* global define: true */
(function(root, factory) {
  'use strict';
  if (typeof exports === 'object') {
    // CommonJS
    factory(require('rivets'), require('superagent'), jQuery);
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['rivets', 'superagent'], factory);
  } else {
    // Browser globals
    factory(root.rivets, root.request, jQuery);
  }
})(this, function(rivets, request, $) {
  rivets.binders.include = {
    engines: {},
    cache: {},
    bind: function(el) {
      var self = this;
      var cache = rivets.binders.include.cache;

      this.engine = el.getAttribute('engine') || null;

      this.clear = function() {
        if (this.nested) {
          this.nested.unbind();
        }

        el.innerHTML = '';
      };

      this.load = function(path) {
        this.clear();

        if (typeof path === 'function') path = path();

        if (!path) {
          return;
        }

        if (cache[path]) {
          include(cache[path]);
          return;
        }

        $.get(path)
        .done(function(body) {
          include(body);
          cache[path] = body;
        })
        .fail(function(err) {
          self.clear();
          if (console) console.error(err);
          return;
        });

        function transformWithEngine(html, engine, models) {
          var engines = rivets.binders.include.engines;
          if (engine && engines[engine] && typeof engines[engine] === 'function') {
            return engines[engine](html, models, path);
          }

          return html;
        }

        function include(html) {
          // copy models into new view
          var models = {};
          Object.keys(self.view.models).forEach(function(key) {
            models[key] = self.view.models[key];
          });

          // transform html with engine if any
          el.innerHTML = transformWithEngine(html, self.engine, models);

          var options = {};
          if (typeof self.view['options'] === 'function') {
            options = self.view.options();
          }
          var els = Array.prototype.slice.call(el.childNodes);
          self.nested = rivets.bind(els, models, options);

          // dispatch include event
          $(el).trigger('include', {
            detail: {
              path: path
            },
            bubbles: true,
            cancelable: true
          })
        }
      };
    },
    unbind: function(el) {
      if (this.clear) this.clear();
    },
    routine: function(el, value) {
      var path = el.getAttribute('rv-include')
      this.load(path);
    }
  };
});
