oer = if window? and window.oer? then window.oer else {}
window.oer = oer if window?

###
 Helper functions for DOM Selection
 (from proper.js but not used in their source)
###

# Returns the current selection as a dom range.
saveSelection = () ->
  if window.getSelection?
    sel = window.getSelection()
    if sel.rangeCount > 0
      return sel.getRangeAt(0)
  else if document.selection? and document.selection.createRange? # IE
    return document.selection.createRange()
  null

# Selects the given dom range.
restoreSelection = (range) ->
  if range?
    if window.getSelection?
      sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    else if document.selection? and range.select? # IE
      range.select()

# Selects the whole editing area.
selectAll = () ->
  el = $(activeElement)[0]
  
  if document.body.createTextRange? # IE < 9
    range = document.body.createTextRange()
    range.moveToElementText(el)
    range.select()
  else
    range = document.createRange()
    range.selectNodeContents(el)

  restoreSelection(range)

# Applies fn and tries to preserve the user's selection and cursor
# position.
doWithSelection = (fn) ->
  # Before
  sel = saveSelection()
  if sel
    startContainer = sel.startContainer
    startOffset    = sel.startOffset
    endContainer   = sel.endContainer
    endOffset      = sel.endOffset
  
  fn(sel)
  
  if sel
    # After
    isInDom = (node) ->
      if node
        return true if node == document.body
        return isInDom(node.parentNode) if node.parentNode

      return false

    if isInDom(startContainer)
      sel.setStart(startContainer, startOffset)
    if isInDom(endContainer)
      sel.setEnd(endContainer, endOffset)

    restoreSelection(sel)


###
 Logic for the oer-specific commands
###
oer.options =
  allowedTags: { span: ['class'] }
  commands:

    subscript:
      isActive: () ->
        document.queryCommandState('subscript', false, true)
      exec: () ->
        document.execCommand('subscript', false, true)


    term:
      isActive: () ->
        sel = saveSelection()
        start = sel.startContainer
        end = sel.endContainer
        
        $(start).parents('span.term').length + $(end).parents('span.term').length > 0

      toggleOff: () ->
        sel = saveSelection()
        $(sel.startContainer).parents('span.term').contents().first().unwrap()
        $(sel.endContainer).parents('span.term').contents().first().unwrap()
      
      toggleOn: () ->
        id = 'unique-id'
        # Get all of the text and elements that are hilighted
        # So we can re-insert them later
        sel = saveSelection()
            
        # There are several cases to consider:
        # - Start and End elements are the same
        # - Start and End Elements are different
        if sel.startContainer != sel.endContainer
          alert("Please select only plain text (not half-way between an emphasis and a new paragraph for example)")
          return # Don't proceed

        text = sel.startContainer.data.substring(sel.startOffset, sel.endOffset)
        
        # This command seems to nicely close all the orphaned elements properly
        # For example, if the user selects the text between [] below
        #  "here is some plain text a[nd a <strong>bold ta]g here</strong>"
        # The browser will correctly stitch up the <strong> tag resulting in
        #  "here is some plain text a<term>nd a bold ta</term><strong>g here</strong>"
        # instead of
        #  "here is some plain text a<term>nd a <strong>bold ta</strong></term><strong>g here</strong>"
        document.execCommand('inserthorizontalrule', false, id)
        hr = $('.content').find('#' + id)
        
        term = $('<span class="term"/>').text(text)
        hr.replaceWith(term)


oer.controls = [
  { title: 'Subscript', command: 'subscript', shortcut: 'ctrl+shift+down' }
  { title: 'Term',      command: 'term',      shortcut: 'ctrl+shift+t' }
]