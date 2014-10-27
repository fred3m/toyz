"""
core.py
Core classes and functions for Toyz
Copyright 2014 by Fred Moolekamp
License: GPLv3
"""
from __future__ import division,print_function
import os
import sys
import traceback
import importlib
from multiprocessing import Process, Queue, current_process

from .errors import ToyzError, ToyzDbError, ToyzWebError, ToyzJobError, ToyzWarning

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__),os.pardir))
default_config_path = os.path.join(core.ROOT_DIR, 'config')
db_config = os.path.join(default_config_path, 'db.p')

active_users = {}

def check_instance(obj, instances):
    """
    Check if an object has alr
    """
    for i in instances:
        if obj is i:
            return False
    return True

def find_loops(obj, instances=[], dicts=(dict), sequences=(tuple, list, set, frozenset)):
    """
    Check for infinite loops in the structure of a sequence object
    
    Parameters
    ----------
    obj: dictionary or sequence
        - Object to check for infinite loops
    instances: list of dictionaries or sequences
        - List of objects already defined in the current branch of the larger object
    dicts: list of dictionary types
        - Objects with key:value pairs to search for loops. This defaults to [dict] but
        other objects like collections.OrderedDict can also be used
    sequences: list of sequence types
        - Sequences to search for loops. See the collections module for other available sequences
    """
    local_tree = list(instances)
    if not check_instance(obj, local_tree):
        return False
    local_tree.append(obj)
    if isinstance(obj, dicts):
        for key, val in obj.items():
            if not find_loops(val, local_tree, dicts, sequences):
                return False
    elif isinstance(obj, sequences):
        for val in obj:
            if not find_loops(val, local_tree, dicts, sequences):
                return False
    return True

def dict_2_obj(entries, check_recursive=True, check_sequences=(tuple, list, set, frozenset),
                    dicts=(dict), sequences=(tuple, list, set, frozenset)
    ):
    """
    Convert a dictionary into a class with the same structure.
    
    Parameters
    ----------
    entries: dict
        - Dictionary to convert into an object
    check_recursive: boolean, optional
        - If True, the function recursively searches the dictionary to check for any infinte loops.
    check_sequences: list of sequence types, optional
        - Types of sequences to iterate through and convert dictionaries to objects.
        If the list is empty, no sequences will be search for dictionaries to convert
    dicts: list of dictionary types, optional
        - Objects with key:value pairs to search for loops. This defaults to [dict] but
        other objects like collections.OrderedDict can also be used
    sequences: list of sequence types, optional
        - Sequences to search for loops. See the collections module for other available sequences
    """
    if not isinstance(entries, dicts):
        raise ToyzError("Class must be initialized from a dictionary")
    if check_recursive and not find_loops(entries, [], dicts, sequences):
        raise ToyzError("Inifinite loop found in dictionary")
    
    top = type('new', (object,), entries)
    for key, val in entries.items():
    	if isinstance(val, dicts):
    	    setattr(top, key, dict_2_obj(val, check_recursive, check_sequences, dicts, sequences))
    	elif isinstance(val, check_sequences):
    	    setattr(top, key, 
    		    type(val)(
                    dict_2_obj(val, check_recursive, check_squences, dicts, sequences)
                    if isinstance(elem, dicts) else elem for elem in val
                )
            )
        elif callable(val):
            # Callable objects are functions. Next we test if the function is a class method
            # or static method by looking for a `cls` or `self` as the first variable
            if 'cls' == val.func_code.co_varnames[0] or 'self' == val.func_code.co_varnames[0]:
                setattr(top, key, classmethod(val))
            else:
                setattr(top, key, staticmethod(val))
    	else:
    	    setattr(top, key, val)
    return top

def export_class_externals(obj):
    """
    Create a dictionary with only the external attributes of the class. Per PEP 8
    (http://www.python.org/dev/peps/pep-0008/): leading underscores and double underscores
    are only used for internal methods, so we remove all entries that begin with '_'.
    The difference between this and the built in '__dict__' method is that this function
    also writes the functions to the dictionary.
    """
    return {key: getattr(obj, key) for key in dir(obj) if key[0]!='_'}

def job_worker():
    pass

def first_time_setup():
    """
    Initial setup of the Toyz application and creation of files the first time it is run.
    
    Parameters
    ----------
    None
    
    Returns
    -------
    settings: dict
        - Dictionary with settings for the Toyz application
    """
    web_settings = default_config.web_settings
    web_settings['static_path'] = default_static_path
    web_settings['template_path'] = default_template_path
    
    # Create a database
    db_settings = default_config.db_settings
    db_settings['path'] = os.path.join(ROOT_DIR, 'config', db_settings['name'])
    db_file = open(db_config, 'wb')
    db = pickle.dump(db_settings)
    db_file.close()
    db_module = importlib.import_module(db['interface_name'])
    db_module.create_database(db_settings):
    db_module.create_table(
        db_settings, 
        table_name='users',
        columns = {
            'id': 'text',
            'settings': 'text'
        },
        keys=['id']
    )
    db_module.create_table(
        db_settings, 
        table_name='groups',
        columns = {
            'id'
        },
        keys=[]
    )
    db_module.create_table(
        db_settings, 
        table_name='web_settings',
        columns = {
            
        },
        keys=[]
    )
    
    settings = {
        'web_settings': web_settings,
        'db_settings': db_settings
    }
    save_settings(settings, file_path)
    return settings

def init_database():
    """
    Import and initialize the database used by the web application and job queue. The default is sqlite,
    which is package with Python for Python v2.5+
    
    Parameters
    ----------
    None
    
    Returns
    -------
    db: dict
        - Settings for the database that is currently used
    """
    if os.path.isfile(db_config):
        db_file = open(dbconfig, 'rb')
        db = pickle.load(db_file)
        db_file.close()
        db_module = importlib.import_module(db['interface_name'])
        db_module.init()
    else:
        settings = first_time_setup()
        db = settings['db_settings']
    return db

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
    except ToyzError as error:
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
        raise ToyzError("Missing parameters: "+error)

def respond(id,response):
    """
    respond
    
    send response from job server back to the client
    """
    user = active_users[id['userId']]
    websocket = user.openSessions[id['sessionId']]
    websocket.write_message(response)

def create_dirs(paths):
    """                                                                         
    createDirs                                                                  
                                                                                
    Search for paths on the server. If a path does not exist, create the necessary directories.                                                                
    For example, if paths=['~/Documents/images/2014-6-5_data/'] and only the path                                                                     
    '~/Documents' exists, both '~/Documents/images/' and '~/Documents/images/2014-6-5_data/'                                                 
    are created.
    
    Parameters                                                                  
    ----------                                                                  
    paths: string or list of strings                                            
        -If paths is a string, this is the path to search for and create. If paths is a list, each one                                                         
        is a path to search for and create                                      
                                                                                
    Returns                                                                     
    -------                                                                     
        -None                                                                   
    """
    if isinstance(paths,basestring):
            paths=[paths]
    for path in paths:
        try:
            os.makedirs(path)
        except OSError:
            if not os.path.isdir(path):
                raise ToyzError("Problem creating new directory, check user permissions")