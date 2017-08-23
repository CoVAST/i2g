define(function(require) {
    return function LabelList(arg){
        var list = {};
        list.refresh = (root) => {
            var options = arg || {},
            container = options.container || null,
            myId = arg.id || false;

            startX = container.getBoundingClientRect().left;
            startY = 15;
            console.log(container.getBoundingClientRect());

            let RemoveHandleChoices = ["{Abondon Further Explore}", "{Restore Removed Node}"]
            let DuplicateHandleChoices = ["{Merge nodes with the same name}", "{Rename the local node}"]

            if(root){
                $(".node.action." + myId).remove();
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
                conflictNum = 0;
                for(var i = 0; i < rstArray.length; i++){
                    let choiceArray = [];
                    curNode = rstArray[i];
                    let lbl = document.createElement('div');
                    lbl.className = "node action " + myId;
                    curNode.reason = curNode.reason || "Manage";
                    let tail = "...";
                    if(curNode.action === "Conflict"){ 
                        let uiForm = document.createElement('div');
                        uiForm.className = "ui form";
                        lbl.appendChild(uiForm);
                        let groupFields = document.createElement('div');
                        groupFields.className = "grouped fields";
                        uiForm.appendChild(groupFields);
                        if(curNode.reason.indexOf("[Node Removed]") > -1){
                            if(curNode.reason === "[Node Removed]"){
                                curNode.reason = curNode.reason + ": " + curNode.conflictDependency.trunk.node.nodename;
                                choiceArray = RemoveHandleChoices;
                            }else{
                                choiceArray = [];
                            }
                        }else if(curNode.reason.indexOf("[Name Duplicated]") > -1){
                            if(curNode.reason === "[Name Duplicated]"){
                                curNode.reason = curNode.reason + ": " + curNode.conflictDependency.dupNode;
                                choiceArray = DuplicateHandleChoices;
                            }else{
                                choiceArray = [];
                            }
                        }
                        if(curNode.hasHandled === true){
                            let field = document.createElement('i');
                            field.className = "green big check circle icon";
                            groupFields.appendChild(field);
                        }else for(var j = 0; j < choiceArray.length; j++){
                            let field = document.createElement('div');
                            field.className = "field";
                            groupFields.appendChild(field);
                            let radio = document.createElement('div');
                            radio.className = "ui radio checkbox";
                            field.appendChild(radio);
                            let input = document.createElement('input');
                            input.type = "radio";
                            input.name = "conflict" + conflictNum;
                            input.value = j;
                            radio.appendChild(input);
                            let label = document.createElement('label');
                            label.innerHTML = choiceArray[j];
                            radio.appendChild(label);
                        }
                    }else lbl.innerHTML = (curNode.action + ": " + curNode.nodename + " | " + curNode.reason).slice(0, textlength) + tail;
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
                    lbl.style.position = 'absolute';
                    if(curNode.action === "Conflict" && choiceArray.length != 0) lbl.style.top = (gapY * (i - 0.3) + startY) + "px";
                    else lbl.style.top = (gapY * i + startY) + "px";
                    lbl.style.left = startX;
                    $("#" + myId + "GITL" + curNode.nodeId)
                        .popup({
                            position : 'bottom center',
                            target   : "#" + myId + "GITL" + curNode.nodeId,
                            title    : curNode.action + ": " + curNode.nodename,
                            html  : curNode.reason? ("Reason:" + curNode.reason + "<br>Type: " + curNode.type) : "Root"
                        })
                    if(curNode.action === "Conflict"){
                        console.log($("#" + myId + "GITL" + curNode.nodeId))
                        $("input[type='radio'][name='conflict" + conflictNum + "']").on('click', ()=>{
                            let choice = $("input[type='radio'][name='conflict" + conflictNum + "']:checked").val();
                            console.log("Radio choice: " + choice);
                            if(list.onShowConflictChoice){
                                list.onShowConflictChoice(curNode, choiceArray[choice]);
                                curNode.hasHandled = true;
                                curNode.reason = choiceArray[choice];
                            }
                            else{
                                console.log("OnShowConflictChoice function not found.");
                            }
                        })
                        // $('#' + myId + 'GITL' + curNode.nodeId + " .ui.form .grouped.fields .field .checkbox").checkbox().first().checkbox({onChecked : (a, b, c)=> {console.log(a, b, c)}});
                    }
                }
            }

        }
        return list;
    }
})
