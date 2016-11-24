

function ViewController(id) {
    this.pane = new Pane(id);
    this.panels.push(this.pane);
}
ViewController.prototype.panels = [];



ViewController.prototype.rebuildFromModel = function(){
}

ViewController.prototype.animate=function(){};
