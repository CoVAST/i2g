define(function(require) {
    return function LabelList(arg){
        var list = {};
        list.refresh = (root) => {
            var options = arg || {},
            container = options.container || null,
            myId = arg.id || false;
            if(root){
                $(".node.action." + myId).remove();
 
                // let save = $("#git-right").html()
                // console.log($("#git-right").html())
                // $("#git-right").empty();
                // console.log($("#git-right").html())
                // $("#git-right").html(save);
                // console.log($("#git-right").html())
                // console.log($("#git-right").innerHTML)
                let curNode = root;
                let todoQueue = [];
                let rstArray = [];
                if(!curNode) return;
                while(true){
                    rstArray.push(curNode)
                    todoQueue = todoQueue.concat(curNode.children);
                    if(todoQueue.length === 0) break;
                    curNode = todoQueue.splice(0, 1)[0];
                }
                let tempSet = new Set(rstArray);
                rstArray = Array.from(tempSet);
                rstArray.sort((a, b)=>{
                    return a.position.y - b.position.y;
                }) 
                totalY = rstArray[rstArray.length - 1].position.y + 20;
                gapY = totalY / rstArray.length;
                let textlength = 25;
                for(var i = 0; i < rstArray.length; i++){
                    curNode = rstArray[i];
                    let lbl = document.createElement('div');
                    lbl.className = "node action " + myId;
                    curNode.reason = curNode.reason || "Manage";
                    let tail = "...";
                    lbl.innerHTML = (curNode.action + ": " + curNode.nodename + " | " + curNode.reason).slice(0, textlength) + tail;
                    // let color = null;
                    // let type = null;
                    // if(!curNode.action) curNode.action = "Root";
                    // if(curNode.action.indexOf("Add") != -1){
                    //     color = "green";
                    // }else if(curNode.action.indexOf("Remove") != -1){
                    //     color = "red";
                    // }else{
                    //     color = "teal";
                    // }
                    // if(curNode.action.indexOf("node") != -1){
                    //     type = "Node";
                    // }else if(curNode.action.indexOf("link") != -1){
                    //     type = "Link"
                    // }else{
                    //     type = "Manage"
                    // }
                    // lbl.className = "ui " + color + " image label";
                    lbl.setAttribute('id', myId + "GITL" + curNode.nodeId);
                    // lbl.appendChild(document.createTextNode(curNode.nodename));
                    container.appendChild(lbl);
                    // let showName = document.createElement('div');
                    // showName.className = "detail";
                    // showName.appendChild(document.createTextNode(type));
                    // lbl.appendChild(showName);
                    lbl.style.marginRight = '0.5em';
                    lbl.style.position = 'absolute';
                    lbl.style.top = (gapY * i + 15) + "px";
                    lbl.style.left = '300px';
                    $("#" + myId + "GITL" + curNode.nodeId)
                        .popup({
                            position : 'bottom center',
                            target   : "#" + myId + "GITL" + curNode.nodeId,
                            title    : curNode.action + ": " + curNode.nodename,
                            content  : ("Type: " + curNode.type + " / Datetime: " + curNode.datetime + " / Reason:" + curNode.reason) || "Manage"
                        })
                }
            }

        }
        return list;
    }
})
