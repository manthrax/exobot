
function PupMenu(evt, choices, target,selectcb) {
    if (this.div) {
        this.div.remove();
    }
    this.div = document.createElement('div');
    this.div.className = 'menu-container';
    this.div.style.top = (evt.clientY - 8) + 'px';
    this.div.style.left = (evt.clientX - 8) + 'px';
    // this.div.style.width='50px';
    // this.div.style.height='50px';
    document.body.appendChild(this.div);

    function destroyMenu(pupmenu){
        pupmenu.div.remove();
        pupmenu.div = undefined;
        window.removeEventListener('mousedown', pupmenu.mouseListener);
        evt.preventDefault();
    }
   this.menuClickListener = function (evt) {
       if(evt.target.menu){
            destroyMenu(evt.target.menu);
            selectcb(evt.target.choice,target);
       }
    }
    for (var i in choices) {
        var c = choices[i].split(':');
        var cmd=c[0];
        var txt=c[1];
        var sp = document.createElement('span');
        sp.innerText = txt;
        sp.choice = cmd;
        sp.target = target;
        sp.menu = this;
        sp.className = 'menu-span';
        this.div.appendChild(sp);
    //    this.div.appendChild(document.createElement('br'));
        sp.onmouseenter = function(evt) {
            evt.target.style.color = 'white';
            evt.target.style.background = 'black';
        }
        sp.onmouseout = function(evt) {
            evt.target.style.color = 'black';
            evt.target.style.background = 'white';
        }
        sp.onclick = this.menuClickListener;
    }
    this.mouseListener = function(pupmenu) {
        return function(evt) {
            if(!evt.target.choice){
                selectcb();
                destroyMenu(pupmenu)
                return;
            }
            return true;
        }
    }(this);

    window.addEventListener('mousedown', this.mouseListener);
}

