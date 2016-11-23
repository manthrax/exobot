function Pane(id) {
    this.div = document.createElement('div');
    this.div.class = 'pane-div';
    this.titleSpan = document.createElement('span');
    this.textarea = document.createElement('textarea');
    this.div.id = id;
    this.state = Pane.prototype.state.panes[id];
    this.model={};
    if (!this.state) {
        this.state = {};
        Pane.prototype.state.panes[id] = this.state;
    }
    this.model = this.state.model?this.state.model:{};
    this.state.model = this.model;
    this.titleSpan.innerHTML = id;
    this.div.pane = this;
    window.onmousedown = Pane.prototype.onmousedownhandler;
    window.onmouseup = Pane.prototype.onmouseuphandler;
    window.onmouseout = Pane.prototype.onmouseouthandler;

    this.textarea.onmousedown = Pane.prototype.onmousedownhandler;
    this.textarea.onkeyup = Pane.prototype.textareakeyuphandler;
    this.textarea.spellcheck = false;
    if (this.state.ox) {
        var st = this.state;
        this.div.style.left = st.ox + 'px';
        this.div.style.top = st.oy + 'px';
        this.textarea.style.width = st.width + 'px';
        this.textarea.style.height = st.height + 'px';
        this.textarea.value = st.text;
    }
    window.onmousemove = Pane.prototype.onmousemovehandler;
    this.div.appendChild(this.titleSpan);
    this.div.appendChild(document.createElement('br'));
    this.div.appendChild(this.textarea);
    document.body.appendChild(this.div);
    Pane.prototype.elements.push(this);
}

Pane.prototype.onmousemovehandler = function(evt) {
    if (!this.mdown)
        return false;
    if (Pane.prototype.focus.id == 'canv')
        return false;
    var pane = Pane.prototype.focus.pane;
    if (!pane)
        return true;
    var div = pane.div;
    var textarea = pane.textarea;
    if(pane.inResizeHandle==true){
        evt.preventDefault();

        textarea.sx = (textarea.sx ? textarea.sx : (parseInt(textarea.style.width) | 0)) + evt.movementX;
        textarea.sy = (textarea.sy ? textarea.sy : (parseInt(textarea.style.height) | 0)) + evt.movementY;
            textarea.style.width = textarea.sx + 'px';
            textarea.style.height = textarea.sy + 'px';
            return false;
    }
    if(pane.inDragArea==true){
        div.ox = (div.ox ? div.ox : pane.div.offsetLeft | 0) + evt.movementX;
        div.oy = (div.oy ? div.oy : pane.div.offsetTop | 0) + evt.movementY;
        pane.div.style.left = div.ox + 'px';
        pane.div.style.top = div.oy + 'px';
        pane.state.ox = div.ox;
        pane.state.oy = div.oy;
        pane.state.width = textarea.clientWidth;
        pane.state.height = textarea.clientHeight;
    }
    return false;
}
Pane.prototype.onmouseuphandler = function() {
    Pane.prototype.focus = null ;
    this.mdown = false;
}
Pane.prototype.onmouseouthandler = function(evt) {//     this.mdown = false;
}
Pane.prototype.onmousedownhandler = function(evt) {
    var rootNode = evt.target;
    while (rootNode&&rootNode.parentNode != document.body) {
        rootNode = rootNode.parentNode;
    }
    if(rootNode==null)return;
    if (rootNode.pane) {
        var elems = Pane.prototype.elements;
        var depth = elems.indexOf(rootNode.pane);
        if (depth < elems.length - 1) {
            var swp = elems[elems.length - 1];
            elems[elems.length - 1] = rootNode.pane;
            elems[depth] = swp;
        }
        for (var i = 0; i < elems.length; i++) {
            elems[i].div.style['z-index'] = 10 + i;
            elems[i].div.style.background = 'rgba(255,255,255,1)';
            elems[i].textarea.style.background = 'rgba(255,255,255,1)';
        }
        Pane.prototype.focus = rootNode;

        rootNode.pane.inResizeHandle = false;
        rootNode.pane.inDragArea = false;
///        if(evt.target.type == rootNode.pane.textarea'textarea'||evt.target.type == 'div'){
        if(evt.target == rootNode.pane.textarea||
            evt.target == rootNode.pane.div){
            if(evt.offsetX > evt.target.offsetWidth-10  && evt.offsetY > evt.target.offsetHeight-10){
                rootNode.pane.inResizeHandle = true;
            }
        }
        if(evt.target==rootNode.pane.div||evt.target==rootNode.pane.titleSpane)
        {
            rootNode.pane.inDragArea = true;
        }
    } else {
        var elems = Pane.prototype.elements;
        for (var i = 0; i < elems.length; i++) {
            elems[i].div.style.background = 'rgba(255,255,255,0.1)';
            elems[i].textarea.style.background = 'rgba(255,255,255,0.1)';
        }
        Pane.prototype.focus = evt.target;
    }
    this.mdown = true;
}
Pane.prototype.state = {
    panes: {}
};
Pane.prototype.elements = [];
if (localStorage.editorState) {
    Pane.prototype.state = JSON.parse(localStorage.editorState);
}

Pane.prototype.saveState = function() {
    for (var i = 0; i < Pane.prototype.elements.length; i++) {
        var pane = Pane.prototype.elements[i];
        var div = pane.div;
        pane.state={};
        if(pane.textarea){
            var textarea = pane.textarea;
            pane.state.width = textarea.clientWidth;
            pane.state.height = textarea.clientHeight;
            pane.state.text = textarea.value;
        }
        if(pane.model)pane.state.model = pane.model;
    }
    for (var i in Pane.prototype.state.panes) {
        var st = Pane.prototype.state.panes[i];

    }
    localStorage.editorState = JSON.stringify(Pane.prototype.state);
}
