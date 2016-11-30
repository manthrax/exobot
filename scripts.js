function ScriptPanel() {
    ViewController.call(this, 'Scripts');
    this.pane.textarea.remove();
    this.addScriptButton = document.createElement('button');
    this.addScriptButton.innerText = '+';
    this.addScriptButton.onclick = function(scriptPanel) {
        return function(evt) {
            scriptPanel.addScript(puppeteer.timelinePanel);
        }
    }(this)
    this.pane.div.insertBefore(this.addScriptButton, this.pane.titleSpan.nextSibling);
}
ScriptPanel.prototype = Object.create(ViewController.prototype);

function copyKey(k){
    return {c:k.c,t:k.t,v:k.v};
}

function selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}


function scriptPanelClick(scriptPanel,script) {
    return function(evt) {
        scriptPanel.scriptSpan = evt.target;
        if(scriptPanel.scriptSpan.contentEditable=='true'){
            return;
        }
        scriptPanel.popupMenu = new PupMenu(evt,[
            'rename:rename',
            'delete:delete',
            'copy:copy from timeline',
            'paste:paste to timeline'],script,function(choice,target) {
            scriptPanel.popupMenu = undefined;
            
            if(choice=='rename'){
                scriptPanel.scriptSpan.spellcheck = false;
                scriptPanel.scriptSpan.contentEditable = 'true';
                selectElementContents(scriptPanel.scriptSpan);
                scriptPanel.scriptSpan.onkeyup=function(evt){
                    if(evt.key == 'Enter'){
                        scriptPanel.scriptSpan.contentEditable = 'inherit';
                        evt.preventDefault();
                        var newName = scriptPanel.scriptSpan.innerText;
                        newName=newName.replace(/[^A-Za-z0-9]/g, '');
                        newName=newName.replace(/(\r\n|\n|\r)/gm,'');
                        scriptPanel.scriptSpan.script.name = newName;
                        scriptPanel.rebuildFromModel();
                        return false;
                    }
                }
                scriptPanel.scriptSpan.focus();
            }else
            if(choice=='delete'){
                var id = scriptPanel.pane.model.scripts.indexOf(target);
                if(id>=0){
                    scriptPanel.pane.model.scripts.splice(id,1);
                    scriptPanel.rebuildFromModel();
                }
            }else
            if(choice=='copy'){
            }else
            if(choice=='paste'){
            }
        }
        );
    }
}
ScriptPanel.prototype.rebuildFromModel = function() {
    var br = this.addScriptButton.nextSibling;
    while (br && br.nextSibling)
        br.nextSibling.remove();
    this.model = this.pane.model;
    if (this.model.scripts) {
        for (var i = 0; i < this.model.scripts.length; i++) {
            var act = this.model.scripts[i];
            var span = document.createElement('span');
            span.className = 'menu-span';
            span.innerText = act.name;
            span.script = act;
            span.onclick = scriptPanelClick(this,act);
            this.pane.div.appendChild(span);
       //     this.pane.div.appendChild(document.createElement('br'));
        }
    }
}
ScriptPanel.prototype.addScript = function(timeline) {
    if (!this.model.scripts) {
        this.model.scripts = [];
    }
    var act = {
        name: 'Unnamed',
        keys:[]
    }
    this.model.scripts.push(act);
    this.rebuildFromModel();
}
