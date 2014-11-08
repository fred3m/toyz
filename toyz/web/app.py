"""
web_app.py
Runs the webserver for Toyz
Copyright 2014 by Fred Moolekamp
License: GPLv3
"""

from __future__ import division,print_function
import sys
import os.path
import shutil
import cPickle as pickle

import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import tornado.escape
from tornado.options import options

# Imports from Toyz package
from toyz.utils import core
from toyz.utils import file_access
from toyz import utils.web
from toyz.config import default_config
from toyz.errors import ToyzError

class AuthLoginHandler(utils.web.BaseHandler):
    def initialize(self):
        """
        When the handler is initialized, set the path to the template that needs to be rendered
        """
        self.template_path = os.path.join(core.ROOT_DIR,'web', 'templates')
        
    def get(self):
        """
        Send the login.html page to the client
        """
        try:
            err_msg = self.get_argument('error')
        except:
            err_msg = ''
        self.application.settings['template_path'] = self.template_path
        self.render('login.html', err_msg=err_msg, next=self.get_argument('next'))
    
    def set_current_user(self,userId):
        """
        Send a secure cookie to the client to keep the user logged into the system
        
        Parameters
        ----------
        userId: string
            - User id of the current user
        
        Returns
        -------
        None
        """
        if userId:
            self.set_secure_cookie('user',tornado.escape.json_encode(userId))
        else:
            self.clear_cookie('user')
    
    def post(self):
        """
        Load the userId and password passed to the server from the client and check authentication
        """
        userId = self.get_argument('userId',default='')
        pwd = self.get_argument('pwd',default='')
        if web_utils.check_pwd(userId,pwd):
            if userId not in core.active_users:
                try:
                    user_settings = web_utils.load_all_users_settings()[userId]
                except KeyError:
                    web_utils.save_user_settings(userId,{})
                    user_settings = {}
                core.active_users[userId] = WebUser(userId, user_settings)
                print('Users logged in:')
                for user_name, user in core.active_users.iteritems():
                    print(user.userId)
            self.set_current_user(userId)
            self.redirect( self.get_argument('next',u'/'))
        else:
            redirect = u'/auth/login/?error='
            redirect += tornado.escape.url_escape('Invalid username or password')
            redirect += u'&next='+self.get_argument('next',u'/')
            self.redirect(redirect)


class AuthLogoutHandler(tornado.web.RequestHandler):
    def get(self):
        """
        Clear the users cookie and log them out
        """
        self.clear_cookie("user")
        self.redirect(self.get_argument("next", "/"))

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    """
    WebSocketHandler
    
    Websocket that handles jobs sent to the server from clients
    """
    
    def open(self, *args):
        """
        Called when a new websocket is opened
        
        Parameters
        ----------
        *args:
            Currently I don't pass any arguments to this function
        
        Returns
        -------
        None
        """
        userId=self.get_secure_cookie('user').strip('"')
        web_utils.update_users(userId, websocket=self)
        #self.user = core.active_users[userId]
        #core.active_users[userId].add_session(websocket=self)

    def on_close(self):
        """
        on_close
        
        on_close is called when the websocket is closed. Eventually this function will delete all temporary
        files being used by the users current session and delete entries in global variables such as
        openSessions, openFits, etc
        
        Parameters
        ----------
        None
        
        Returns
        -------
        None
        """
        user=core.active_users[self.session['userId']]
        del user.openSessions[self.session['sessionId']]
        shutil.rmtree(user.stored_dirs['session'][self.session['sessionId']])
        if len(user.openSessions)==0:
            shutil.rmtree(user.stored_dirs['temp'])
            del core.active_users[self.session['userId']]
        
        print('active users remaining:',core.active_users)
    
    def on_message(self, message):
        """
        on_message
        
        on_message is called when the websocket recieves a message from the client. The user and session information
        is then extracted and processed before running the job initiated by the client.
        
        Parameters
        ----------
        message: JSON unicode string
            - Websockets pass json objects from a client to the server. The input message is the json unicode string
            received by the server from the client that has not yet been decoded.
            - The server expects all messages (after decoding from JSON) to be a dictionary with the following keys:
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
        None
        """
        #logging.info("message recieved: %r",message)
        decoded=tornado.escape.json_decode(message)
        userId=decoded['id']['userId']
        sessionId=decoded['id']['sessionId']
        
        process_job(decoded)

class MainHandler(utils.web.BaseHandler):
    """
    Main Handler when user connects to `localhost:8888/`
    """
    pass

class Application(tornado.web.Application):
    def __init__(self, app_settings):
        self.app_settings = app_settings
        
        handlers = [
            (r"/", MainHandler, {
                'template_name': 'home.html',
                'template_path': [core.ROOT_DIR, 'web', 'templates']
            }),
            (r"/auth/login/", AuthLoginHandler),
            (r"/auth/logout/", AuthLogoutHandler),
            (r"/static/(.*)", utils.web.AuthStaticFileHandler, {
                'path': self.app_settings['static_path']
            }),
            (r"/users/(.*)", UserHandler),
            (r"/toyz/(*.)", ToyzHandler),
            (r"/job", WebSocketHandler),
            # TODO: Remove the next two handlers and load them with global toyz
            (r"/scrollTable", utils.web.BaseHandler, {
                'template_name': 'scrollTable.html',
                'template_path': web_settings['template_path']
            }),
            (r"/viewer", utils.web.BaseHandler, {
                'template_name': 'image-viewer.html',
                'template_path': self.app_settings['template_path']
            }),
        ]
        
        settings={
            'static_path': self.app_settings['static_path'],
            'cookie_secret': self.app_settings['cookie_secret'],
            'login_url':'/auth/login/'
        }
        tornado.web.Application.__init__(self, handlers, **settings)

def first_time_setup(config_path):
    """
    Initial setup of the Toyz application and creation of files the first time it is run.
    
    Parameters
    ----------
    None
    
    Returns
    -------
    app_settings: dict
        - Dictionary with settings for the Toyz application
    """
    import getpass
    
    app_settings = default_config.app_settings
    
    # Create users
    admin_pwd = 'admin'
    if core.get_bool(
            "The default admin password is 'admin'. It is recommended that you change this "
            "if multiple users will be accessing the web application.\n\n"
            "change password? "):
        admin_pwd = getpass.getpass("new password: ")
    
    users = {
        'admin':{
            utils.web.ToyzUser(
                web_settings=app_settings['web'], 
                user_id='admin', 
                pwd=admin_pwd, 
                groups=['admin'])}}
    save_users(users)
    
    # Create a database and folder permissions table
    app_settings['db']['name'] = os.path.basename(app_settings['db']['path'])
    db_module = importlib.import_module(app_settings['db']['interface_name'])
    db_module.create_database(app_settings['db'])
    db_module.create_table(
        db_settings=app_settings['db'],
        user=users['admin'],
        table_name='tbl_permissions',
        columns=OrderedDict([
            ('table_name', ['VARCHAR']),
            ('permissions', ['VARCHAR'])
        ]),
        indices={'tbl_idx':('table_name')},
        users={'*','', 'admin':'frw'}
    )
    db_module.create_table(
        db_settings=app_settings['db'],
        user=users['admin'],
        table_name='paths',
        columns=OrderedDict([
            ('path_id', ['PRIMARY','KEY','AUTOINCREMENT']),
            ('path', ['VARCHAR']),
            ('owner', ['VARCHAR']),
        ]),
        indices={'path_idx':('path')},
        users={'*','frw', 'admin':'frw'}
    )
    db_module.create_table(
        db_settings=app_settings['db'],
        user=users['admin'],
        table_name='user_paths',
        columns=OrderedDict([
            ('user_id', ['VARCHAR']),
            ('path_id', ['INTEGER']),
            ('permissions', ['VARCHAR']),
        ]),
        indices={'user_idx':('user_id')},
        users={'*','frw', 'admin':'frw'}
    )
    db_module.create_table(
        db_settings=app_settings['db'],
        user=users['admin'],
        table_name='group_paths',
        columns=OrderedDict([
            ('group_id', ['VARCHAR']),
            ('path_id', ['INTEGER']),
            ('permissions', ['VARCHAR']),
        ]),
        indices={'path_idx':('path')},
        users={'*','frw', 'admin':'frw'}
    )
    
    file_access.update_file_permissions(db_settings, users['admin'], {
        core.ROOT_DIR: {
            'users': {
                '*': ''
            }
        }
    })
    
    save_settings(app_settings)
    return app_settings

def web_app_login(user_id, pwd, app_settings):
    pwd_context = CryptContext(app_settings.pwd_context)
    if user_id not in app_settings.users:
        # Dummy verify to prevent a timing attack (https://crackstation.net/hashing-security.htm)
        pwd_context.verify('dummy pwd', 'dummy pwd')
        raise errors.ToyzWebError("Invalid username/password")
    if not pwd_context.verify(pwd, users['users'][user_id]['pwd']):
        raise errors.ToyzWebError("Invalid username/password")
    
    return users[user_id]

def find_open_port(port):
    open_port = port
    try:
        self.listen(port)
    except: socket.error:
        open_port = find_port(port+1)
    return open_port

def init():
    """
    Run the web application on the server
    """
    print("Server root directory:", core.ROOT_DIR)
    
    # Check the current working directory and its 'config' subdirectory for a config file
    # This allows users to have a custom Toyz directory with their own configuration
    # separate from the master install in the python directory
    config_name = default_config.app_settings['web']['config_name']
    config_path = default_config.app_settings['web']['config_path']
    if os.path.isfile(os.path.join(os.getcwd(), config_name)):
        config_path = os.isfile(os.path.join(os.getcwd(), config_name))
    elif os.path.isfile(os.path.join(os.getcwd(), 'config', config_name)):
        config_path = os.isfile(os.path.join(os.getcwd(), 'config', config_name))
    else:
        if not os.path.isfile(config_path):
            first_time_setup(config_path)
    
    app_settings = pickle.load(open(config_path, 'rb'))
    
    # Decrypt the config file if it is encrypted
    if core.str_2_bool(app_settings['config_encrypted']):
        import getpass
        from toyz.utils.security import decrypt_config
        decrypt_config(app_settings, getpass.getpass('key: '))
    
    tornado.options.define("port", default=default_config['port'], help="run on the given port", type=int)
    tornado.options.define("new_path", default=None, help="create a new directory structure in the current path")
    tornado.options.parse_command_line()
    
    # Create a new file structure if the user wants to create a new working directory
    if options.new_path is not None:
        if os.path.isdir(options.new_path):
            new_path = options.new_path
        elif (core.str_2_bool(raw_input(
            "Create a new toyz instance in '{0}'? ".format(os.getcwd())))
        ):
            new_path = os.getcwd()
        create_new_instance(new_path, app_settings)
    
    # Apply settings entered at the command line
    app_settings['port'] = options.port
    
    # Initialize the tornado web application
    toyz_app = Application(app_settings)
    
    # Continuous loop to wait for incomming connections
    print("Server is running on port", toyz_app.port)
    #tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    init_web_app()