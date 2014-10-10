from __future__ import division,print_function
import os
import sys
import traceback
import importlib
from multiprocessing import Process, Queue, current_process

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__),os.pardir))

# Add directories to python path
#sys.path.insert(0,os.path.join(ROOT_DIR,'web_server'))
#sys.path.insert(0,os.path.join(ROOT_DIR,'job_server'))

# Import pypeline directories into system path
# TODO: Change this to look for the directory where the users settings are stored
#for dir_name in os.listdir(os.path.join(ROOT_DIR,'pypelines')):
#    sys.path.insert(0,os.path.join(ROOT_DIR,'pypelines',dir_name))

active_users = {}

class Error(Exception):
    """
    Error
    
    Base class for custom errors related to the running of Astropyp
    """
    pass

class AstropypError(Error):
    """
    AstropypError
    
    Class for custom errors related to the running of Astropyp
    """
    def __init__(self,msg):
        self.msg=msg
        self.traceback=traceback.format_exc()
    def __str__(self):
        return self.msg+"\n"+self.traceback

def job_worker():
    pass

def run_job(job):
    """
    run_job
    
    Loads modules and runs a job (function) sent from a client. Any errors will be trapped and flagged as 
    an AstopypError and sent back to the client who initiated the job. All job functions will take exactly 3
    parameters: id,params,websocket. The id is the user, session, and request id information (see below), params
    is a dictionary of parameters sent by the client, and websocket is the current websocket processing the job.
    
    Parameters
    ----------
    job: dictionary
        - The job received from the user. The following keys are required:
            id: dictionary
                - dictionary that contains the following keys:
                    userId: string
                        - Unique identifier of the current user
                    sessionId: string
                        -Unique identifier of the current session
                    requestId: string
                        -Unique identifier for the current request sent by the client
            module: string
                - Python module that contains the function called by the client
            task: string
                - Function called by the client
            parameters: dictionary
                - Dictionary of required and optional parameters passed to the function
            }
    
    Returns
    -------
    There are no returns from the function but a dictionary is sent to the client.
    response: dictionary
        - Response is either an empty dictionary or one that contains (at a minimum) the key 'id', which is
        used by the client to identify the type of response it is receiving.
    
    Example
    -------
    A client might send the following job to the server:
        job = {
            id : {
                userId : 'Fred',
                sessionId : '12',
                requestId : 305
            },
            module : 'fitsviewer',
            task : 'loadHeader',
            parameters : {
                fileId : 'fhv66yugjgvj*^&^$vjkvkfhfct%^%##$f$hgkjh',
                frame : 0
            }
        }
    
    In this case, after receiving the job, this function will import the 'fitsviewer' module (if it has not been
    imported already) and run the function 'loadHeader(job['id'],job['parameters'],self)'. If there are any
    errors in loading the header, a response of the form
        response = {
            'id' : 'ERROR',
            'error' : 'Error message here for unable to lead header',
            'traceback' : traceback.format_exec()
        }
    is sent. If the header is loaded correctly a rsponse of the form
        response = {
            'id' : 'fitsHeader',
            'fileId' : 'fhv66yugjgvj*^&^$vjkvkfhfct%^%##$f$hgkjh',
            'frame' : 0,
            'header' : python_list
        }
    is sent to the client.
    """
    # TODO: Eventually a job should be added to the jobs dictionary and removed after the response has been sent
    import astro_pypelines
    response={}
    try:
        module = job["module"]
        base_module = module.split('.')[0]
        if module == 'web_utils':
            module = 'astropyp.web_server.web_utils'
        elif base_module in dir(astro_pypelines.pypelines):
            module = 'astro_pypelines.pypelines.' + module
        elif base_module in dir(astro_pypelines.utils):
            module = 'astro_pypelines.utils.' + module
        pyp_module = importlib.import_module(module)
        task = getattr(pyp_module, job["task"])
        #print("Running task",task)
        response = task(job['id'],job['parameters'])
    except AstropypError as error:
        response = {
            'id':"ERROR",
            'error':error.msg,
            'traceback':traceback.format_exc()
        }
    except Exception as error:
        response = {
            'id':"ERROR",
            'error':"PYTHON ERROR:"+type(error).__name__+str(error.args),
            'traceback':traceback.format_exc()
        }
        print(traceback.format_exc())
    if response != {}:
        response['requestId'] = job['id']['requestId']
        #self.write_message(response)
        respond(job['id'],response)
    # print("finished task")
    #logging.info("sent message:%r",response['id'])

def progress_log(text,id):
    """
    progressLog
    
    Create a dictionary that can be sent to the clients logger to display the progress of a job running on the server.
    
    Parameters
    ----------
    text: string
        - Text to be sent to be displayed on the clients logger
    
    Returns
    -------
    response: dictionary
        - The response has the format of an astropyp websocket response, namely an id that identifies the type
        of response being sent to the client and then any fields specific to the response (in this case 'log').
        
        Example:
            response={
                'id':'progress log',
                'log':'Detecting source objects'
            }
        
        The clients logger will display the 'log' field of the dictionary.
    """
    log = {'id':"progress log",'log':text}
    respond(id, log)

def check4key(myDict,keys):
    """
    check4key
    
    Checks a dictionary for a set of required keys
    
    Parameters
    ---------
    myDict: dictionary
        -Dictionary to be searched
    keys: list
        -List of keys to search for in the dictionary
    Returns
    -------
    No returns but the function raises a JobError and lists all required keys missing from the dictionary
    """
    error=""
    if any(key not in myDict for key in keys):
        for key in keys:
            if key not in myDict:
                error=error+key+", "
    if error!="":
        raise AstropypError("Missing parameters: "+error)

def respond(id,response):
    """
    respond
    
    send response from job server back to the client
    """
    user = active_users[id['userId']]
    websocket = user.openSessions[id['sessionId']]
    websocket.write_message(response)