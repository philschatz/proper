(function() {
  var doWithSelection, oer, restoreSelection, saveSelection, selectAll;

  oer = (typeof window !== "undefined" && window !== null) && (window.oer != null) ? window.oer : {};

  if (typeof window !== "undefined" && window !== null) window.oer = oer;

  /*
   Helper functions for DOM Selection
   (from proper.js but not used in their source)
  */

  saveSelection = function() {
    var sel;
    if (window.getSelection != null) {
      sel = window.getSelection();
      if (sel.rangeCount > 0) return sel.getRangeAt(0);
    } else if ((document.selection != null) && (document.selection.createRange != null)) {
      return document.selection.createRange();
    }
    return null;
  };

  restoreSelection = function(range) {
    var sel;
    if (range != null) {
      if (window.getSelection != null) {
        sel = window.getSelection();
        sel.removeAllRanges();
        return sel.addRange(range);
      } else if ((document.selection != null) && (range.select != null)) {
        return range.select();
      }
    }
  };

  selectAll = function() {
    var el, range;
    el = $(activeElement)[0];
    if (document.body.createTextRange != null) {
      range = document.body.createTextRange();
      range.moveToElementText(el);
      range.select();
    } else {
      range = document.createRange();
      range.selectNodeContents(el);
    }
    return restoreSelection(range);
  };

  doWithSelection = function(fn) {
    var endContainer, endOffset, isInDom, sel, startContainer, startOffset;
    sel = saveSelection();
    if (sel) {
      startContainer = sel.startContainer;
      startOffset = sel.startOffset;
      endContainer = sel.endContainer;
      endOffset = sel.endOffset;
    }
    fn(sel);
    if (sel) {
      isInDom = function(node) {
        if (node) {
          if (node === document.body) return true;
          if (node.parentNode) return isInDom(node.parentNode);
        }
        return false;
      };
      if (isInDom(startContainer)) sel.setStart(startContainer, startOffset);
      if (isInDom(endContainer)) sel.setEnd(endContainer, endOffset);
      return restoreSelection(sel);
    }
  };

  /*
   Logic for the oer-specific commands
  */

  oer.options = {
    allowedTags: {
      span: ['class']
    },
    commands: {
      subscript: {
        isActive: function() {
          return document.queryCommandState('subscript', false, true);
        },
        exec: function() {
          return document.execCommand('subscript', false, true);
        }
      },
      term: {
        isActive: function() {
          var end, sel, start;
          sel = saveSelection();
          start = sel.startContainer;
          end = sel.endContainer;
          return $(start).parents('span.term').length + $(end).parents('span.term').length > 0;
        },
        toggleOff: function() {
          var sel;
          sel = saveSelection();
          $(sel.startContainer).parents('span.term').contents().first().unwrap();
          return $(sel.endContainer).parents('span.term').contents().first().unwrap();
        },
        toggleOn: function() {
          var hr, id, sel, term, text;
          id = 'unique-id';
          sel = saveSelection();
          if (sel.startContainer !== sel.endContainer) {
            alert("Please select only plain text (not half-way between an emphasis and a new paragraph for example)");
            return;
          }
          text = sel.startContainer.data.substring(sel.startOffset, sel.endOffset);
          document.execCommand('inserthorizontalrule', false, id);
          hr = $('.content').find('#' + id);
          term = $('<span class="term"/>').text(text);
          return hr.replaceWith(term);
        }
      }
    }
  };

  oer.controls = [
    {
      title: 'Subscript',
      command: 'subscript',
      shortcut: 'ctrl+shift+down'
    }, {
      title: 'Term',
      command: 'term',
      shortcut: 'ctrl+shift+t'
    }
  ];

}).call(this);
