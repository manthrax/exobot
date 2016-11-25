

function ViewController(id) {
    this.pane = new Pane(id);
    this.panels.push(this.pane);
    this.pane.controller = this;
}
ViewController.prototype.panels = [];



ViewController.prototype.rebuildFromModel = function(){
}

ViewController.prototype.animate=function(){};
