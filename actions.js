function ActionPanel() {
    ViewController.call(this, 'Actions');
    this.pane.textarea.remove();
    this.addActionButton = document.createElement('button');
    this.addActionButton.innerText = '+';
    this.addActionButton.onclick = function(actionPanel) {
        return function(evt) {
            actionPanel.addAction(puppeteer.timelinePanel);
        }
    }(this)
    this.pane.div.insertBefore(this.addActionButton, this.pane.titleSpan.nextSibling);
}
ActionPanel.prototype = Object.create(ViewController.prototype);

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


function actionPanelClick(actionPanel,action) {
    return function(evt) {
        actionPanel.actionSpan = evt.target;
        if(actionPanel.actionSpan.contentEditable=='true'){
            return;
        }
        actionPanel.popupMenu = new PupMenu(evt,[
            'rename:rename',
            'delete:delete',
            'copy:copy from timeline',
            'paste:paste to timeline'],action,function(choice,target) {
            actionPanel.popupMenu = undefined;
            
            if(choice=='rename'){
                actionPanel.actionSpan.spellcheck = false;
                actionPanel.actionSpan.contentEditable = 'true';
                selectElementContents(actionPanel.actionSpan);
                actionPanel.actionSpan.onkeyup=function(evt){
                    if(evt.key == 'Enter'){
                        actionPanel.actionSpan.contentEditable = 'inherit';
                        evt.preventDefault();
                        var newName = actionPanel.actionSpan.innerText;
                        newName=newName.replace(/[^A-Za-z0-9]/g, '');
                        newName=newName.replace(/(\r\n|\n|\r)/gm,'');
                        actionPanel.actionSpan.action.name = newName;
                        actionPanel.rebuildFromModel();
                        return false;
                    }
                }
                actionPanel.actionSpan.focus();
            }else
            if(choice=='delete'){
                var id = actionPanel.pane.model.actions.indexOf(target);
                if(id>=0){
                    actionPanel.pane.model.actions.splice(id,1);
                    actionPanel.rebuildFromModel();
                }
            }else
            if(choice=='copy'){
                var tpmodel = puppeteer.timelinePanel.pane.model;
                var start = puppeteer.timelinePanel.playStartFrame|0;
                var end = puppeteer.timelinePanel.playEndFrame|0;
                if(start!=end){
                    if(end<start){var swp=start;start=end;end=swp;}
                    target.keys.length=0;
                    for(var i=0;i<tpmodel.keys.length;i++){
                        var k = tpmodel.keys[i];
                        if(k.t>=start && k.t<=end){
                            var nk = copyKey(k)
                            nk.t-=start;
                            target.keys.push(nk);
                        }
                    }
                }
            }else
            if(choice=='paste'){
                var tpmodel = puppeteer.timelinePanel.pane.model;
                var start = puppeteer.timelinePanel.playStartFrame|0;
                var maxT = start;
                for(var i=0;i<target.keys.length;i++){
                    var nk = copyKey(target.keys[i]);
                    nk.t+=start;
                    puppeteer.timelinePanel.insertKey(nk);
                    if(maxT<nk.t)maxT=nk.t;
                }
                
                puppeteer.timelinePanel.rebuildFromModel();
            }
        }
        );
    }
}
ActionPanel.prototype.rebuildFromModel = function() {
    var br = this.addActionButton.nextSibling;
    while (br && br.nextSibling)
        br.nextSibling.remove();
    this.model = this.pane.model;
    if (this.model.actions) {
        for (var i = 0; i < this.model.actions.length; i++) {
            var act = this.model.actions[i];
            var span = document.createElement('span');
            span.className = 'menu-span';
            span.innerText = act.name;
            span.action = act;
            span.onclick = actionPanelClick(this,act);
            this.pane.div.appendChild(span);
       //     this.pane.div.appendChild(document.createElement('br'));
        }
    }
}
ActionPanel.prototype.addAction = function(timeline) {
    if (!this.model.actions) {
        this.model.actions = [];
    }
    var act = {
        name: 'Unnamed',
        keys:[]
    }
    this.model.actions.push(act);
    this.rebuildFromModel();
}
