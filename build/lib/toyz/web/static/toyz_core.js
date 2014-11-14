// Core for Toyz
// Copyright 2014 by Fred Moolekamp
// License: MIT

// Global Namespace for Toyz scripts
var Toyz=Toyz||{};
// Declare a namespace function to avoid namespace collisions
Toyz.namespace=function(namespace){
    var spaces=namespace.split('.');
    var parent=Toyz;
    if(spaces[0]=='Toyz'){
        spaces=spaces.slice(1);
    };
    for(var i=0;i<spaces.length;i++){
        var ns=spaces[i];
        parent[ns]=parent[ns]||{};
        parent=parent[ns];
    };
    return parent;
};

// Define the core objects that all Toyz modules will require
Toyz.namespace('Toyz.Core');

// Returns the object at the end of a namespace
// example: Toyz.Core.getNamespace('Mainviewer.loadFitsFile',window) returns the function loadFitsFile
// in the fitsviewer
Toyz.Core.getNamespace=function(functionName, context) {
    var namespaces=functionName.split(".");
    for(var i=0;i<namespaces.length;i++) {
        context=context[namespaces[i]];
    };
    return context;
};

// Maximum requestId of a request sent to the server during a single session 
// before looping back to zero
Toyz.Core.MAX_ID=Math.pow(2,40);
// Initialize websocket to connect with tornado webserver
Toyz.Core.jobsocketInit=function(options){
    var jobsocket=$.extend(true,{
        ws:null,
        sendTask:function(task,callback,passParams){
            if(jobsocket.ws.readyState==1 && jobsocket.sessionId!=-1){
                task.id={
                    user_id:jobsocket.userId,
                    session_id:jobsocket.sessionId,
                    request_id:jobsocket.currentRequest++
                };
                // In case there are multiple requestId increments before reaching this line
                // we make sure to reset the counter with enough space to avoid duplicate id's
                if(jobsocket.currentRequest>Toyz.Core.MAX_ID){
                    jobsocket.currentRequest=(currentRequest-Toyz.Core.xMAX_ID)*10;
                };
                if(typeof callback!='undefined'){
                    var params=passParams||{};
                    jobsocket.requests[task.id.requestId.toString()]={func:callback,params:params};
                };
                jobsocket.ws.send(JSON.stringify(task));
            }else if(jobsocket.ws.readyState>1){
                // Websocket is closed, warn user the first time
                if(!jobsocket.closeWarning){
                    jobsocket.closeWarning=true;
                    alert("Websocket to server was disconnected, could not send task");
                };
                if(jobsocket.logger){
                    jobsocket.logger.log("Attempted to send "+task.task+" but connection is closed",true);
                }
            }else{
                //The connection hasn't opened yet, add the task to the queue
                console.log('stored task in queue:', {task:task, callback:callback, passParams:passParams});
                jobsocket.queue.push({task:task, callback:callback, passParams:passParams});
            };
        },
        userId:'guest',
        sessionId:-1,
        queue:[],
        closeWarning:false,
        job_url:"/jobsocket",
        recieveAction:function(){},
        currentRequest:0,
        requests:{},
        rcvError:function(errorMsg){
            alert('ERROR: '+errorMsg.error);
            console.log('Error',errorMsg);
        }
    },options);
    var url="ws://"+location.host+jobsocket.job_url;
	jobsocket.ws=new WebSocket(url);
    
    if(jobsocket.hasOwnProperty('onopen')){
        jobsocket.ws.onopen=jobsocket.onopen;
    }else{
        jobsocket.ws.onopen=function(){
            if(jobsocket.logger){
                jobsocket.logger.log("Connected to server",true);
            };
        };
    };
    jobsocket.ws.onclose=function(){
        if(jobsocket.logger){
            jobsocket.logger.log("Connection to server lost",true);
        };
    };
	jobsocket.ws.onmessage=function(event){
		result=JSON.parse(event.data);
        if(result.id=='ERROR'){
            jobsocket.rcvError(result);
            return;
        }else if(result.id=='initialize'){
            jobsocket.userId=result.userId;
            jobsocket.sessionId=result.sessionId;
            console.log('session:',result);
            for(var i=0;i<jobsocket.queue.length;i++){
                var task = jobsocket.queue[i];
                jobsocket.sendTask(task.task, task.callback, task.passParams);
            };
        };
        if(result.hasOwnProperty('requestId') && jobsocket.requests.hasOwnProperty(result.requestId.toString())){
            var f=jobsocket.requests[result.requestId.toString()].func;
            var params=jobsocket.requests[result.requestId.toString()].params;
            delete jobsocket.requests[result.requestId.toString()];
            f(result,params);
        }else{
            jobsocket.receiveAction(result);
        };
	};
    return jobsocket;
};

// Object to log server data to the user
// element: an HTML textarea element on the webpage
Toyz.Core.Logger=function(element){
    this.element=element;
    this.log=function(text,useTimestamp){
        if(useTimestamp){
            var timestamp=new Date()
            element.value=element.value+timestamp+"\n";
        };
        element.value=element.value+text+"\n\n";
        $(element).scrollTop(element.scrollHeight);
    };
};

// Keep track of which scripts have been dynamically loaded
Toyz.Core.loadedScripts={};

// Load js and css dependencies in order
Toyz.Core.loadDependencies=function(dependencies,callback,params){
    //console.log('dependencies',dependencies);
    for(d in dependencies){
        if(dependencies[d].wait){
            Toyz.Core.loadedScripts[d]=false;
        }
    };
    for(d in dependencies){
        var dependency=dependencies[d];
        //console.log('dependency',dependency);
        var ext=dependency.url.split('.').pop();
        if(ext=='js'){
            if(!window[dependency.isloaded]){
                var script=document.createElement('script');
                script.src=dependency.url;
                script.async=false;
                script.addEventListener('load', function(d,dependencies,callback,params) {
                    return function(){
                        //console.log('dependencies',dependencies);
                        Toyz.Core.loadedScripts[d]=true;
                        var all_loaded=true;
                        for(dep in dependencies){
                            if(Toyz.Core.loadedScripts[dep]==false){
                                all_loaded=false;
                                break;
                            }
                        };
                        //console.log('loaded:',Toyz.Core.loadedScripts);
                        if(all_loaded){
                            //console.log('all loaded');
                            return callback(params);
                        }
                    }
                }(d,dependencies,callback,params), false);
                document.head.appendChild(script);
            }
        }else if(ext=='css'){
            $('<link>')
                .appendTo('head')
                .attr({type:'text/css',rel:'stylesheet'})
                .attr('href',dependency.url);
        }
    };
    //return callback(params);
};

// Makes a deep copy of a JSON object
// Note: this does not work with a date type!
Toyz.Core.deepCopy=function(obj){
    return JSON.parse(JSON.stringify(obj));
};

// Base 10 logarithm
Toyz.Core.log10=function(x){
    return Math.log(x)/Math.log(10);
};
// Gaussian function
Toyz.Core.gaussian=function(x,amplitude,mean,stdDev){
    var gaussian=amplitude*Math.exp(-Math.pow((x-mean)/(2*stdDev),2));
    //console.log("gaussian:",x,amplitude,mean,stdDev,gaussian);
    return gaussian
};

// Check to see if required keys are present in an object
Toyz.Core.check4key=function(obj,keys,errorMsg){
    var msg=errorMsg||"Missing parameter ";
    for(i=0;i<keys.length;i++){
        if(!obj.hasOwnProperty(keys[i])){
            alert(msg+keys[i]);
            return false;
        }
    };
    return true;
};

// Build Interactive table
// Numbers, strings, etc will be entered into the table
// If an array is contained as a datapoint:
//     dataPoint[0] is the text added to the cell
//     dataPoint[1] is the function
//     dataPoint[2] is the parameter passed to the function
Toyz.Core.buildInteractiveTable=function(dataArray,table){
    var rows=dataArray.length;
    var columns=dataArray[0].length;
    for(var i=0;i<rows;i++){
        var row=table.insertRow(i);
        for(var j=0;j<columns;j++){
            var cell=row.insertCell(j);
            var dataPoint=dataArray[i][j];
            if(Array.isArray(dataPoint)){
                cell.innerHTML=dataPoint[0];
                cell.onclick=function(){
                    dataPoint[1](dataPoint[2]);
                }
            }else{
                cell.innerHTML=dataPoint;
            }
        }
    }
};

console.log('toyz_core.js loaded');