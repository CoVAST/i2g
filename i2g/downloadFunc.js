/** Export graph to a local json file (test function) */

define(function(require){
	return function(jsonData, fileName) {
        var dataStr = JSON.stringify(jsonData, null, 4);
        var dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        var linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', fileName);
        linkElement.click();
    }
})