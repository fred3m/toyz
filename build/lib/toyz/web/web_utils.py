from __future__ import division,print_function

import tornado.web
import os.path
import copy
import cPickle as pickle
import importlib

# astropyp modules
from ..config import default_config
from ..utils import core
from . import manage

def save_settings(settings, file_path):
    """
    Saves the default settings to the specified path. If the user does not have write access
    to the directory, an error is raised
    
    Parameters
    ----------
    settings: dict
        - Web Application settings
    file_path: string
        - Filename and path for saved settings
    
    Returns
    -------
    None
    """
    try:
        pickle.dump(settings, open(file_path, 'wb'))
    except IOError as e:
        if e.errno == 13:
            raise core.ToyzError('You must be logged in as an administrator to save setting in this directory')
    return settings

def get_settings():
    """
    Check to see if a settings file exists in the config directory. If not, this must be the first time
    setup, so load and save the default settings.
    
    Parameters
    ----------
    None
    
    Returns
    -------
    None
    """
    file_path = os.path.join(core.ROOT_DIR, 'config', 'settings.p')
    if os.path.isfile(file_path):
        settings = pickle.load(open(file_path, 'rb'))
    else:
        settings = default_config.settings
        save_settings(settings, file_path)
    return settings

def add_handler(toy_config):
    """
    Add static and template handlers for a given toy
    
    Parameters
    ----------
    toy_config: python module
        - Configuration file that contains (at a minimum) the following parameters:
            * static_paths: dict
                Dict with the format:
                    toy_name: path to static files
            * handlers: list of Tornado RequestHandler tuples
    
    Returns
    -------
    new_handlers: list of Tornado RequestHandler tuples
        - New handlers to be added to the web application
    """
    new_handlers = []
    
    # Add static file handlers
    for toy_name in toy_config.static_paths:
        static_url = '/'+toy_name+'/static/(.*)'
        new_handlers.append((
            static_url,
            tornado.web.StaticFileHandler,
            {'path': toy_config.static_paths[toy_name]}
        ))
    
    # Add template file handlers
    for handler in toy_config.handlers:
        new_handlers.append(handler)
    return new_handlers

def add_toyz(web_app, toys=[], paths=[]):
    """
    Add a toyz from a list of packages and/or a list of paths on the server
    
    Parameters
    ----------
    web_app: tornado.web.Application
        - Web application running on the server
    toys: list of packages
        - packages built on the toyz framework
    paths: list of strings
        - Paths to modules that have not been packaged but fit the toyz framework
    
    Returns
    -------
    None
    """
    new_handlers = []
    
    for toy in toys:
        module = importlib.import_module(toy)
        add_handler(module.toy_config)
        
    for path in paths:
        contents = os.listdir()
        if 'toy_config.py' in contents:
            sys.path.insert(0, path)
            # Load the config file for the current package
            try:
                reload(toy_config)
            except NameError:
                import toy_config
            new_handlers += add_handlers(toy_config)
    
    web_app.add_handlers('', new_handlers)

class WebUser:
    """
    WebUser
    
    Class that contains properties for a user logged into the system
    
    Attributes
    ----------
    userId: string
        Unique ID for the user logged onto the server
    user_settings: 
    """
    # Web interface user class
    def __init__(self, userId, user_settings, **kwargs):
        self.userId=userId
        for key,value in kwargs:
            setattr(self,key,value)
        if 'openSessions' not in kwargs:
            self.openSessions = {}
        
        if 'stored_dirs' not in kwargs:
            user_dir=os.path.join(core.ROOT_DIR,'static','users',userId)
            self.stored_dirs = {
                'project': os.path.join(user_dir,'projects'),
                'temp': os.path.join(user_dir,'temp'),
                'backup': os.path.join(user_dir,'backup')
            }
        if 'groups' not in kwargs:
            self.groups = []
        self.update_account_settings(user_settings)
        if 'session' not in self.stored_dirs:
            self.stored_dirs['session']={}
        web_utils.create_dirs([path for key, path in self.stored_dirs.items() if not key.startswith('session')])
        
        if 'account_settings' in user_settings:
            self.account_settings = user_settings['account_settings']
        else:
            stored_dirs = []
            for key in self.stored_dirs:
                if key != 'session':
                    stored_dirs.append({
                        'path_name': key,
                        'path':self.stored_dirs[key]
                    })
            self.account_settings = {
                'stored_dirs': stored_dirs
            }
    
    def get_session_id(self, websocket):
        for sessionId in self.openSessions:
            if self.openSessions[sessionId]==websocket:
                return sessionId
        return None
    
    def add_session(self, websocket, sessionId=None):
        if sessionId is None:
            sessionId = str(datetime.datetime.now()).replace(' ','__').replace('.','_').replace(':','-')
        self.openSessions[sessionId] = websocket
        self.stored_dirs['session'][sessionId] = os.path.join(self.stored_dirs['temp'], sessionId)
        web_utils.create_dir(id={}, params={'path': self.stored_dirs['session'][sessionId]})
        websocket.write_message({
            'id': 'initialize',
            'userId': self.userId,
            'sessionId': sessionId
        })
        websocket.session = {
            'userId': self.userId,
            'sessionId': sessionId
        }
    
    def update_account_settings(self, account_settings):
        if 'stored_dirs' in account_settings:
            if 'session' in self.stored_dirs:
                self.stored_dirs = {
                    'session': self.stored_dirs['session']
                }
            else:
                self.stored_dirs = {}
            for stored_dir in account_settings['stored_dirs']:
                self.stored_dirs[stored_dir['path_name']] = stored_dir['path']
        if 'groups' in account_settings:
            self.groups = account_settings.groups
    
    def __str__(self):
        """
        __str__
        String representation of the class
        Parameters
        ----------
        None
        
        Returns
        -------
        myStr: string
            -String with each attribute and its value
        """
        myStr=''
        for attr,value in self.__dict__.iteritems():
            myStr += attr+':'+str(value)+'\n'
        return myStr

class BaseHandler(tornado.web.RequestHandler):
    """
    Base Class for all Web Handlers. This handles the security information and
    the path to the template on the server
    """
    def initialize(self, template_name, template_path, options={}):
        """
        Set the path, name of the template, and any options needed when a client loads a template
        
        Parameters
        ----------
        template_name: string
            - Name of the template
        template path: string
            - Path on the server where the template html or js file is being stored
        """
        self.template_path=os.path.join(*template_path)
        self.template_name=template_name
        self.options=options
    
    @tornado.web.authenticated
    @tornado.web.asynchronous
    def get(self):
        """
        Send the template page to the client
        """
        self.application.settings['template_path'] = self.template_path
        self.render(self.template_name, **self.options)
    
    def get_current_user(self):
        """
        Load the name of the current user
        """
        return self.get_secure_cookie("user")

def update_users(userId, websocket):
    """
    Updates users on the server when a new websocket connection is established. If this is the
    first connection established by the user, the users settings are loaded and a new
    Webuser is created.
    
    Parameters
    ----------
    userId: str
        User id connecting to a new websocket
    websocket: tornado.websocket
        New websocket
    """
    if userId not in core.active_users:
        print('User was not logged in')
        try:
            user_settings = load_all_users_settings()[userId]
        except KeyError:
            save_user_settings(userId,{})
            user_settings = {}
        core.active_users[userId] = WebUser(userId, user_settings)
        print('Users logged in:')
        for user_name, user in core.active_users.iteritems():
            print(user.userId)
    websocket.user = core.active_users[userId]
    core.active_users[userId].add_session(websocket)

def load_all_users_settings():
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        user_file = open(web_settings.USER_SETTINGS, 'rb')
        users = pickle.load(user_file)
        user_file.close()
    return users

def load_groups():
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        group_file = open(web_settings.GROUPS_TABLE, 'rb')
        groups = pickle.load(group_file)
        group_file.close()
    return groups

def load_user_settings(id, params):
    user = core.active_users[id['userId']]
    account_settings = manage.get_default_account_settings({'id': id})
    for setting in user.account_settings:
        account_settings[setting] = user.account_settings[setting]
    
    response = {
        'id': 'user settings',
        'account_settings': account_settings
    }
    
    if id['userId'] == 'admin':
        users = load_all_users_settings()
        groups = load_groups()
        response['admin_settings'] = {
            'users': users,
            'groups': groups
        }
    return response

def save_user_settings(userId, settings):
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        users = load_all_users_settings()
        users[userId] = settings
        user_file = open(web_settings.USER_SETTINGS, 'wb')
        pickle.dump(users, user_file)
        user_file.close()
        f = open(web_settings.USER_SETTINGS, 'rb')
        test=pickle.load(f)

def update_account_settings(id, params):
    save_user_settings(id['userId'], params)
    user = core.active_users[id['userId']]
    user.update_account_settings(params)
    
    response = {
        'id': 'update account settings',
        'status': 'success'
    }
    return response

def load_users():
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        user_file = open(web_settings.USER_TABLE, 'rb')
        users = pickle.load(user_file)
        user_file.close()
    return users

def update_user(userId, field, value):
    import web_settings
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        users = load_users()
        if field == 'pwd':
            users[userId]['pwd'] = web_settings.pwd_context.encrypt(value)
        else:
            users[userId][field] = value
        user_file = open(web_settings.USER_TABLE, 'wb')
        pickle.dump(users, user_file)
        user_file.close()

def load_user(userId):
    return load_users()[userId]

def add_new_user(id, params):
    import web_settings
    user_pwd = load_users()
    user_settings = load_all_users_settings()
    if params['userId'] in user_pwd and params['userId'] in user_settings:
        raise core.AstropypError('User name already exists')
    
    if web_settings.USE_DATABASE:
        # TODO: Insert code here to send job to database for processing
        pass
    else:
        if params['userId'] not in user_pwd:
            user_pwd[params['userId']] = {}
            f = open(web_settings.USER_TABLE, 'wb')
            pickle.dump(user_pwd, f)
            f.close()
            update_user(params['userId'], 'pwd', value=params['userId'])
        if params['userId'] not in user_settings:
            user_settings[params['userId']] = {}
            f = open(web_settings.USER_SETTINGS, 'wb')
            pickle.dump(user_settings, f)
            f.close()
    
    response = {
        'id': 'new user',
        'status': 'success'
    }
    return response

def check_pwd(userId, pwd):
    import web_settings
    try:
        user = load_user(userId)
    except KeyError:
        return False
    user_hash = user['pwd']
    return web_settings.pwd_context.verify(pwd, user_hash)

def change_pwd(id, params):
    import web_settings
    core.check4key(params,['current_pwd','new_pwd','confirm_pwd'])
    if check_pwd(id['userId'],params['current_pwd']):
        if params['new_pwd'] == params['confirm_pwd']:
            update_user(id['userId'], 'pwd', params['new_pwd'])
        else:
            raise core.AstropypError('New passwords must match')
    else:
        raise core.AstropypError('Invalid password')
    response = {
        'id': 'change pwd',
        'status': 'success'
    }
    return response

def reset_pwd(id, params):
    import web_settings
    core.check4key(params,['userId'])
    update_user(params['userId'], 'pwd', params['userId'])
    response = {
        'id': 'change pwd',
        'status': 'success'
    }
    return response

def check_img_file(filename, starts_with=None, ends_with=None, contains=None,
                    extensions=None):
    if starts_with is not None:
        if not filename.startswith(starts_with):
            return False
    if ends_with is not None:
        if not filename.endswith(ends_with):
            return False
    if contains is not None:
        if not contains in filename:
            return False
    if extensions is not None:
        is_valid = False
        for ext in extensions:
            if filename.endswith(ext):
                is_valid = True
        if not is_valid:
            return False
    return True

def load_img_dir(id, params):
    if not os.path.isdir(params['directory']):
        response = {
            'id': 'ERROR',
            'error': 'You must choose a valid directory'
        }
        return response
    img_files = {}
    if params['recursive']:
        for root, dirs, files in os.walk(params['directory']):
            for file in files:
                if check_img_file(file, **params['checks']):
                    img_files[file] = os.path.join(root, file)
    else:
        for file in os.listdir(params['directory']):
            if check_img_file(file, **params['checks']):
                img_files[file] = os.path.join(params['directory'], file)
    
    response = {
        'id': 'img files',
        'path': params['directory'],
        'files': img_files
    }
    return response

def copy_img2temp(id, params):
    import shutil
    user = core.active_users[id['userId']]
    path, filename = os.path.split(params['filename'])
    print('filename:', filename)
    temp_path = os.path.join(user.stored_dirs['temp'], filename)

    shutil.copyfile(params['filename'], temp_path)
    response = {
        'id': 'img location',
        'imgId': filename,
        'img_src': os.path.relpath(temp_path,core.ROOT_DIR)
    }
    return response