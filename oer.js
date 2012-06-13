$(function() {

var oer = window.oer || {};
window.oer = oer;


/* -----------------------------------
 * Helper functions for DOM Selection
 * (from proper.js but not used in their source)
 * -----------------------------------
 */

// Returns the current selection as a dom range.
function saveSelection() {
  if (window.getSelection) {
    var sel = window.getSelection();
    if (sel.rangeCount > 0) {
      return sel.getRangeAt(0);
    }
  } else if (document.selection && document.selection.createRange) { // IE
    return document.selection.createRange();
  }
  return null;
}

// Selects the given dom range.
function restoreSelection(range) {
  if (range) {
    if (window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (document.selection && range.select) { // IE
      range.select();
    }
  }
}

// Selects the whole editing area.
function selectAll() {
  var el = $(activeElement)[0],
    range;
  
  if (document.body.createTextRange) { // IE < 9
    range = document.body.createTextRange();
    range.moveToElementText(el);
    range.select();
  } else {
    range = document.createRange();
    range.selectNodeContents(el);
  }

  restoreSelection(range);
}

// Applies fn and tries to preserve the user's selection and cursor
// position.
function doWithSelection (fn) {
  // Before
  var sel = saveSelection()
  if (sel) {
    var startContainer = sel.startContainer
    ,   startOffset    = sel.startOffset
    ,   endContainer   = sel.endContainer
    ,   endOffset      = sel.endOffset;
  }
  
  fn();
  
  if (sel) {
    // After
    function isInDom(node) {
      if (node) {
        if (node === document.body) return true;
        if (node.parentNode) return isInDom(node.parentNode);
      }
      return false;
    }
    if (isInDom(startContainer)) {
      sel.setStart(startContainer, startOffset);
    }
    if (isInDom(endContainer)) {
      sel.setEnd(endContainer, endOffset);
    }
    restoreSelection(sel);
  }
}


/* -----------------------------------
 * Logic for the oer-specific commands
 * -----------------------------------
 */
oer.options = {
  allowedTags: { span: ['class'] },
  commands: {

    subscript: {
      isActive: function() {
        return document.queryCommandState('subscript', false, true);
      },
      exec: function() {
        document.execCommand('subscript', false, true);
      }
    },

    term: {
      isActive: function() {
        var sel = saveSelection();
        var start = sel.startContainer;
        var end = sel.endContainer;
        
        return $(start).parents('span.term').length + $(end).parents('span.term').length > 0;
      },
      toggleOff: function() {
        var sel = saveSelection();
        $(sel.startContainer).parents('span.term').contents().first().unwrap();
        $(sel.endContainer).parents('span.term').contents().first().unwrap();
      
      },
      toggleOn: function() {
        var id = 'unique-id';
        // Get all of the text and elements that are hilighted
        // So we can re-insert them later
        var sel = saveSelection();
            
        // There are several cases to consider:
        // - Start and End elements are the same
        // - Start and End Elements are different
        if (sel.startContainer != sel.endContainer) {
          alert("Please select only plain text (not half-way between an emphasis and a new paragraph for example)");
          return;
        }

        var text = sel.startContainer.data.substring(sel.startOffset, sel.endOffset);
        
        // This command seems to nicely close all the orphaned elements properly
        // For example, if the user selects the text between [] below
        //  "here is some plain text a[nd a <strong>bold ta]g here</strong>"
        // The browser will correctly stitch up the <strong> tag resulting in
        //  "here is some plain text a<term>nd a bold ta</term><strong>g here</strong>"
        // instead of
        //  "here is some plain text a<term>nd a <strong>bold ta</strong></term><strong>g here</strong>"
        document.execCommand('inserthorizontalrule', false, id);
        var hr = $('.content').find('#' + id);
        
        var term = $('<span class="term"/>').text(text);
        hr.replaceWith(term);
        
      }
    },
      
  } // End Commands
}; // End options


/* -----------------------------------
 * Toolbar buttons and their shortcuts
 * -----------------------------------
 */
oer.controls = [
  { title: 'Subscript', command: 'subscript', shortcut: 'ctrl+shift+down' },
  { title: 'Term',      command: 'term',      shortcut: 'ctrl+shift+t' },
];


});