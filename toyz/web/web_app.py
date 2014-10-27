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
from ..utils import core
from ..config import default_config
import web_utils

class AuthLoginHandler(web_utils.BaseHandler):
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

class JobSocketHandler(tornado.websocket.WebSocketHandler):
    """
    JobSocketHandler
    
    Websocket that handles jobs sent to the server from clients
    """
    # All websockets have a built-in set of event handlers: open(), close(), on_message(message)
    
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

class AppSettings:
    def __init__():
        settings = get_settings
        self.web_settings = settings['web_settings']
        
    
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
            settings = first_time_setup()
        return settings
class Application(tornado.web.Application):
    def __init__(self):
        self.config = get_settings()
        
        handlers = [
            (r"/", MainHandler, {
                'template_name': 'home.html',
                'template_path': [core.ROOT_DIR, 'web', 'templates']
            }),
            (r"/auth/login/", AuthLoginHandler),
            (r"/auth/logout/", AuthLogoutHandler),
            (r"/static/(.*)", tornado.web.StaticFileHandler,{
                'path': web_settings['static_path']
            }),
            (r"/jobsocket", JobSocketHandler),
            (r"/scrollTable", web_utils.BaseHandler, {
                'template_name': 'scrollTable.html',
                'template_path': web_settings['template_path']
            }),
            (r"/viewer", web_utils.BaseHandler, {
                'template_name': 'image-viewer.html',
                'template_path': web_settings['template_path']
            }),
        ]
        
        settings={
            'static_path': web_settings['static_path'],
            'cookie_secret': web_settings['cookie_secret'],
            'login_url':'/auth/login/'
        }
        tornado.web.Application.__init__(self, handlers, **settings)

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
    
    def find_port(port):
        open_port = port
        try:
            self.listen(port)
        except: socket.error:
            open_port = find_port(port+1)
        return open_port
    def init_app():
        tornado.options.define("port", default=settings['port'], help="run on the given port", type=int)
        tornado.options.define(
            "user_id", default=settings['default_user'],
            help="run on the given port", type=int
        )
        tornado.options.parse_command_line()
        return find_port(options.port)

class MainHandler(web_utils.BaseHandler):
    """
    Main Handler when user connects to `localhost:8888/`
    """
    pass

def init_web_app():
    """
    Run the web application on the server
    """
    print("Server root directory:", core.ROOT_DIR)
    toyz_app = Application()
    
    # Continuous loop to wait for incomming connections
    print("Server is running on port", toyz_app.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    init_web_app()