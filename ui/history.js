define(function(require){
	var historyRecord = [];
	return function histRec(){
		this.addRecord = function(timestamp, hist){
			if(hist.action == "Add link"){
				revAction = "Remove link";
			}else if(hist.action == "Add node"){
				revAction = "Remove node";
			}else if(hist.action == "Remove link"){
				revAction = "Add link";
			}else if(hist.action == "Remove node"){
				revAction = "Add node";
			}else{
				console.log("Unexpected hist action");
			}
			if(!historyRecord[timestamp]) historyRecord[timestamp] = {hist:hist, revAction:revAction};
			else console.log("Duplicated item is being added to record.");
		},
		this.fetchRecord = function(clickTimetamp, curTimestamp){
			if(!historyRecord[clickTimetamp] || !historyRecord[curTimestamp]){
				console.log("No corresponding history has been found.");
				return null;
			}
			if(clickTimetamp < curTimestamp){	//If it's an undo
				var ret = "undo";
				var histLine = historyRecord.slice(clickTimetamp + 1, curTimestamp + 1);	//Including timestamp node
			}else{	//If it's an redo
				var ret = "redo";
				var histLine = historyRecord.slice(curTimestamp + 1, clickTimetamp + 1)
			}
			return {choice: ret, histline: histLine};
		}
		this.reviseRecToCurrent = function(curTimestamp){
			if(curTimestamp>historyRecord.length){
				console.log("curTimestamp shouldn't be greater than the length of historyRecord");
			}
			if(historyRecord.length == 0)return;
			historyRecord.length = curTimestamp + 1;
		}
		this.updateHistory = function(nodeId, nodeX, nodeY){
			//Perhaps, an index here in the future
			for(var i = 0; !!historyRecord[i]; i++){
				let hist = historyRecord[i].hist;
				if(hist.action === "Add node" || hist.action === "Remove node"){
					if(hist.data.id == nodeId){
						hist.data.x = nodeX;
						hist.data.y = nodeY;
						// console.log("Node " + nodeId + ": "+ nodeX + "," + nodeY);
					}
				}else if(hist.action === "Add link" || hist.action === "Remove link"){
					if(hist.data.source.id == nodeId){
						hist.data.source.x = nodeX;
						hist.data.source.y = nodeY;
						// console.log("Link Source Node " + nodeId + ": "+ nodeX + "," + nodeY);
					}else if(hist.data.target.id == nodeId){
						hist.data.target.x = nodeX;
						hist.data.target.y = nodeY;
						// console.log("Link Target Node " + nodeId + ": "+ nodeX + "," + nodeY);
					}
				}
			}
		}
		this.fetchAllRecords = function(){
			return historyRecord.slice(0);
		}
		this.fetchSpecificRecord = function(timestamp){
			if(historyRecord.length === 0) return null;
			if(timestamp === -1){
				timestamp = historyRecord.length - 1; 
			}
			return historyRecord[timestamp].hist.data;
		}
		this.clear = function(){
			historyRecord.length = [];
		}
	};
	return histRec;
})