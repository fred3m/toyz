"""
Runs the webapp for Toyz
"""
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3

from __future__ import division,print_function
import sys
import platform
import os.path
import shutil
import importlib
import socket
import multiprocessing
#from futures import ProcessPoolExecutor

import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import tornado.escape
import tornado.gen

# Imports from Toyz package
from toyz.utils import core
from toyz.utils import file_access
from toyz.utils import third_party
import toyz.utils.db as db_utils
from toyz.utils.errors import ToyzError, ToyzWebError

class ToyzHandler:
    """
    Handler for Toyz extensions.
    """
    def get_toyz_path(self, path, path_type):
        """
        Given a toyz path, return the root path for the toy.
        """
        import importlib
        toyz_info = path.split('/')
        toy_name = toyz_info[0]
        rel_path = toyz_info[1:-1]
        filename = toyz_info[-1]
        config = core.get_toyz_module(
            self.application.toyz_settings, self.get_user_id(), toy_name+'.config')
        if path_type == 'static':
            for root in config.static_paths:
                pathlist = [root]+rel_path
                fullpath = os.path.join(*pathlist)
                if os.path.isfile(os.path.join(fullpath, filename)):
                    return {
                        'fullpath': fullpath,
                        'filename': filename
                    }
            raise tornado.web.HTTPError(404)
        elif path_type == 'template':
            for root in config.template_paths:
                pathlist = [root]+rel_path
                fullpath = os.path.join(*pathlist)
                if os.path.isfile(os.path.join(fullpath, filename)):
                    toyz_info = {
                        'fullpath': fullpath,
                        'filename': filename
                    }
                    if path in config.render_functions:
                        toyz_info['render'] = config.render_functions[path]
                    return toyz_info
            raise tornado.web.HTTPError(404)
        else:
            raise ToyzWebError("Unrecognized path type '"+path_type+"'")
    
    def get_current_user(self):
        """
        Load the name of the current user
        """
        return self.get_secure_cookie("user")
    
    def get_user_id(self):
        return self.get_current_user().strip('"')
    
    def get_user_theme(self):
        return 'redmond'

class AuthHandler:
    """
    Subclass for all secure handlers.
    """
    def get_current_user(self):
        """
        Load the name of the current user
        """
        return self.get_secure_cookie("user")

class ToyzTemplateHandler(ToyzHandler, tornado.web.RequestHandler):
    """* Not yet implemented*"""
    def initialize(self, **options):
        """
        Initialize handler
        """
        self.options=options
    
    @tornado.web.asynchronous
    def get(self, path):
        toyz_info = self.get_toyz_path(path, 'template')
        self.template_path = toyz_info['fullpath']
        if 'render' in toyz_info:
            toyz_info['render']({
                'handler': self,
                'path': path,
                'filename': toyz_info['filename']
            })
        else:
            self.render(toyz_info['filename'])
    
    def get_template_path(self):
        return self.template_path

class AuthToyzTemplateHandler(AuthHandler, ToyzTemplateHandler):
    @tornado.web.authenticated
    def get(self, path):
        ToyzTemplateHandler.get(self, path)
    

class ToyzStaticFileHandler(ToyzHandler, tornado.web.StaticFileHandler):
    """
    Static file handler for all toyz added to the application.
    """
    
    def parse_url_path(self, url_path):
        toyz_info = self.get_toyz_path(url_path, 'static')
        return os.path.join(toyz_info['fullpath'], toyz_info['filename'])

class AuthToyzStaticFileHandler(AuthHandler, ToyzStaticFileHandler):
    """
    Secure handler for all toyz added to the application. This handles security, such as making 
    sure the user has a registered cookie and that the user has acces to the requested files.
    """
    @tornado.web.authenticated
    def get(self, path):
        ToyzStaticFileHandler.get(self, path)

class AuthStaticFileHandler(AuthHandler, tornado.web.StaticFileHandler):
    """
    Handles static files and checks for a secure user cookie and that the user
    has permission to view the file.
    """
    @tornado.web.authenticated
    def get(self, path):
        tornado.web.StaticFileHandler.get(self, path)
    
    def validate_absolute_path(self, root, full_path):
        """
        Check that the user has permission to view the file
        """
        #print('root:{0}, full_path:{1}\n\n'.format(root, full_path))
        permissions = file_access.get_parent_permissions(
            self.application.toyz_settings.db, full_path, 
            user_id=self.get_current_user().strip('"'))
        if 'r' in permissions or 'x' in permissions:
            absolute_path = tornado.web.StaticFileHandler.validate_absolute_path(
                    self, root, full_path)
        else:
            absolute_path = None
        #print('Absoulte path:', absolute_path)
        return absolute_path

class AuthLoginHandler(AuthHandler, tornado.web.RequestHandler):
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
    
    def set_current_user(self,user_id):
        """
        Send a secure cookie to the client to keep the user logged into the system
        
        Parameters
            user_id (*string* ): User id of the current user
        """
        if user_id:
            self.set_secure_cookie('user',tornado.escape.json_encode(user_id))
        else:
            self.clear_cookie('user')
    
    def post(self):
        """
        Load the user_id and password passed to the server from the client and 
        check authentication
        """
        user_id = self.get_argument('user_id',default='')
        pwd = self.get_argument('pwd',default='')
        if core.check_pwd(self.application.toyz_settings, user_id, pwd):
            self.set_current_user(user_id)
            self.redirect(self.get_argument('next',u'/'))
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

class ToyzWorkspaceHandler(ToyzHandler, tornado.web.RequestHandler):
    def initialize(self, ):
        self.template_path = os.path.join(core.ROOT_DIR, 'web', 'templates')
    def get(self, path):
        """
        Load the workspace
        """
        print('workspace path:', path)
        ws_options = {
            'user_theme': self.get_user_theme(),
            'user_id':'',
            'work_id': ''
        }
        path_split = path.split('/')
        print('path_split', path_split)
        print('path length', len(path_split))
        if len(path_split)>2:
            raise ToyzWebError('Workspace path must be host/workspace/user_id/workspace_name')
        elif len(path_split)==2:
            ws_options['user_id'] = path_split[0]
            ws_options['work_id'] = path_split[1]
        self.render('workspace.html', **ws_options)
    
    def get_template_path(self):
        return self.template_path

class AuthToyzWorkspaceHandler(AuthHandler, ToyzWorkspaceHandler):
    @tornado.web.authenticated
    def get(self, workspace):
        ToyzWorkspaceHandler.get(self, workspace)

class ToyzCoreJsHandler(ToyzHandler, tornado.web.RequestHandler):
    def initialize(self):
        self.template_path = os.path.join(core.ROOT_DIR, 'web', 'templates')
    def get(self):
        """
        Load the core javascript files
        """
        print('user=', self.get_user_id())
        self.render('toyz_core.js', user_theme=self.get_user_theme())
    
    def get_template_path(self):
        return self.template_path

class AuthToyzCoreJsHandler(AuthHandler, ToyzCoreJsHandler):
    @tornado.web.authenticated
    def get(self):
        ToyzCoreJsHandler.get(self)

class Toyz3rdPartyHandler(ToyzHandler, tornado.web.StaticFileHandler):
    def get(self, path):
        path = path.split('/')
        pkg_name = path[0]
        filename = path[-1]
        rel_path = path[1:-1]
        settings = self.application.toyz_settings.web.third_party
        #print('SETTINGS KEYS:', settings.keys())
        if pkg_name not in settings:
            raise ToyzWebError("Library '{0}' not found in third_party.py".format(pkg_name))
        #print('settings:', settings[pkg_name])
        if len(rel_path)>0:
            static_path = os.path.join(settings[pkg_name]['path'], *rel_path)
        else:
            static_path = settings[pkg_name]['path']
        self.root = static_path
        tornado.web.StaticFileHandler.get(self,filename)

class AuthToyz3rdPartyHandler(AuthHandler, Toyz3rdPartyHandler):
    @tornado.web.authenticated
    def get(self, path):
        Toyz3rdPartyHandler.get(self, path)

def job_process(pipe):
    """
    Process created for the websocket. When a job is received from the Toyz
    Application it is run in this process and a response is sent.
    """
    while True:
        try:
            msg = pipe.recv()    # Read from the output pipe and do nothing
            job = msg['job']
            toyz_settings = msg['toyz_settings']
            result = core.run_job(toyz_settings, pipe, job)
            pipe.send(result)
        except EOFError:
            break
    print('job_process finished')

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    """
    Websocket that handles jobs sent to the server from clients
    """
    
    def open(self, session_id=None):
        """
        Called when a new websocket is opened
        
        Parameters
            *args: Currently no arguments are passed to this function
        """
        settings = {
            'websocket': self,
        }
        if session_id=='':
            print('New session')
        else:
            settings['session_id'] = session_id
            
        user_id = self.get_secure_cookie('user').strip('"')
        self.application.new_session(user_id, **settings)

    def on_close(self):
        """
        Called when the websocket is closed. This function calls the applications
        :py:func:`-toyz.web.app.ToyzWebApp.close_session)` function.
        """
        self.application.close_session(self.session)
    
    def on_message(self, message):
        """
        Called when the websocket recieves a message from the client. 
        The user and session information is then extracted and processed before running the 
        job initiated by the client. Only ``modules`` and ``toyz`` that the user has permission
        to view are accepted, all others return a :py:class:`toyz.utils.errors.ToyzJobError` .
        
        Parameters
            - message (*JSON unicode string* ): see(
              :py:func:`toyz.utils.core.run_job` for the format of the msg)
        
        """
        #logging.info("message recieved: %r",message)
        decoded = tornado.escape.json_decode(message)
        user_id = decoded['id']['user_id']
        if user_id !=self.session['user_id']:
            self.write_message({
                'id':"ERROR",
                'error':"Websocket user does not match task user_id",
                'traceback':''
            })
        session_id = decoded['id']['session_id']
        self.job_pipe.send({
            'job': decoded,
            'toyz_settings': self.application.toyz_settings
        })
    
    def send_response(self, remote_pipe, events, error=None):
        if events & tornado.ioloop.IOLoop.READ:
            result = remote_pipe.recv()
            #print("Result:", result)
            self.write_message(result['response'])
        elif events & tornado.ioloop.IOLoop.ERROR:
            print("ERROR: ", error)    

class MainHandler(ToyzHandler, tornado.web.RequestHandler):
    """
    Main Handler when user connects to **localhost:8888/** (or whatever port is used by the
    application).
    """
    def initialize(self, template_name, template_path):
        """
        Initialize handler
        """
        self.template_name = template_name
        self.template_path = template_path
    
    @tornado.web.asynchronous
    def get(self):
        """
        Render the main web page
        """
        self.render(self.template_name, user_theme=self.get_user_theme())
    
    def get_template_path(self):
        """
        Get the path for the main webpage
        """
        return self.template_path

class AuthMainHandler(MainHandler):
    """
    :py:class:`toyz.web.app.MainHandler` extensions when using secure cookies.
    """
    @tornado.web.authenticated
    def get(self):
        MainHandler.get(self)

class ToyzWebApp(tornado.web.Application):
    """
    Web application that runs on the server. Along with setting up the Tornado web application,
    it also processes jobs sent to the server from clients.
    """
    def __init__(self):
        """
        Initialize the web application and load saved settings.
        """
        if tornado.options.options.root_path is not None:
            root_path = core.normalize_path(tornado.options.options.root_path)
        else:
            root_path = tornado.options.options.root_path
        
        self.root_path = root_path
        self.toyz_settings = core.ToyzSettings(root_path)
        
        # Check that the database is up to date with the current version of Toyz
        core.check_version(self.toyz_settings.db)
        
        # If the user has specified a port, use it
        if tornado.options.options.port is not None:
            self.toyz_settings.web.port = tornado.options.options.port
        
        # If security is enabled, use the secure versions of the handlers
        if self.toyz_settings.security.user_login:
            main_handler = AuthMainHandler
            static_handler = AuthStaticFileHandler
            toyz_static_handler = AuthToyzStaticFileHandler
            toyz_template_handler = AuthToyzTemplateHandler
            workspace_handler = AuthToyzWorkspaceHandler
            core_handler = AuthToyzCoreJsHandler
            third_party_handler = AuthToyz3rdPartyHandler
        else:
            main_handler = MainHandler
            static_handler = tornado.web.StaticFileHandler
            toyz_static_handler = ToyzStaticFileHandler
            toyz_template_handler = ToyzTemplateHandler
            workspace_handler = ToyzWorkspaceHandler
            core_handler = ToyzCoreJsHandler
            third_party_handler = Toyz3rdPartyHandler
        
        self.user_sessions = {}
        
        if platform.system() == 'Windows':
            file_path = os.path.splitdrive(core.ROOT_DIR)
        else:
            file_path = '/'
        
        handlers = [
            (r"/", main_handler, {
                'template_name': 'home.html',
                'template_path': os.path.join(core.ROOT_DIR, 'web', 'templates')
            }),
            (r"/auth/login/", AuthLoginHandler),
            (r"/auth/logout/", AuthLogoutHandler),
            (r"/static/(.*)", static_handler, {'path': core.ROOT_DIR}),
            (r"/workspace/(.*)", workspace_handler),
            (r"/file/(.*)", static_handler, {'path': file_path}),
            (r"/toyz/static/(.*)", toyz_static_handler, {'path': '/'}),
            (r"/toyz/templates/(.*)", toyz_template_handler),
            (r"/toyz_core.js", core_handler),
            (r"/third_party/(.*)", third_party_handler, {'path':core.ROOT_DIR}),
            (r"/session/(.*)", WebSocketHandler),
        ]
        
        settings={
            'cookie_secret': self.toyz_settings.web.cookie_secret,
            'login_url':'/auth/login/'
        }
        tornado.web.Application.__init__(self, handlers, **settings)
        self.toyz_settings.web.port = self.find_open_port(self.toyz_settings.web.port)
    
    def find_open_port(self, port):
        """
        Begin at ``port`` and search for an open port on the server
        """
        open_port = port
        try:
            self.listen(port)
        except socket.error:
            open_port = self.find_open_port(port+1)
        return open_port
    
    def new_session(self, user_id, websocket, session_id=None):
        """
        Open a new websocket session for a given user
        
        Parameters
            user_id ( :py:class:`toyz.utils.core.ToyzUser` ): User id
            websocket (:py:class:`toyz.web.app.WebSocketHandler` ): new websocket opened
        """
        import datetime
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = {}
            print("Users logged in:", self.user_sessions.keys())
        
        if session_id is None:
            session_id = str(
                datetime.datetime.now()).replace(' ','__').replace('.','-').replace(':','_')
        self.user_sessions[user_id][session_id] = websocket
        shortcuts = db_utils.get_param(self.toyz_settings.db, 'shortcuts', 
            user_id=user_id)
        shortcuts = core.check_user_shortcuts(self.toyz_settings, user_id, shortcuts)
        websocket.session = {
            'user_id': user_id,
            'session_id': session_id,
            'path': os.path.join(shortcuts['temp'], session_id),
        }
        core.create_paths(websocket.session['path'])
        
        #initialize process for session jobs
        websocket.job_pipe, remote_pipe = multiprocessing.Pipe()
        websocket.process = multiprocessing.Process(
            target = job_process, args=(remote_pipe,))
        websocket.process.start()
        process_events = (tornado.ioloop.IOLoop.READ | tornado.ioloop.IOLoop.ERROR)
        tornado.ioloop.IOLoop.current().add_handler(
            websocket.job_pipe, websocket.send_response, process_events)
        
        websocket.write_message({
            'id': 'initialize',
            'user_id': user_id,
            'session_id': session_id,
        })
    
    def close_session(self, session):
        """
        Close a websocket session and delete any temporary files or directories
        created during the session. To help ensure all temp files are deleted (in
        case of a server or client error), if the user doesn't have any open session 
        his/her **temp** directory is also deleted.
        """
        shutil.rmtree(session['path'])
        del self.user_sessions[session['user_id']][session['session_id']]
        if len(self.user_sessions[session['user_id']])==0:
            shortcuts = db_utils.get_param(self.toyz_settings.db, 'shortcuts', 
                user_id=session['user_id'])
            shutil.rmtree(shortcuts['temp'])
            del self.user_sessions[session['user_id']]
        
        print('active users remaining:', self.user_sessions.keys())
    
    def update(self, attr):
        """
        Certain properties of the application may be changed by an external job,
        for example a user may change his/her password, a new user may be created,
        a setting may be changed, etc. When this happens the job notifies the application
        that something has changed and this function is called to reload the property.
        
        Parameters
            - attr (*string* ): Name of attribute that needs to be updated. So far 
              only **toyz_settings** is supported
        """
        if attr == 'toyz_settings':
            self.toyz_settings = core.ToyzSettings(self.root_path)

def init_web_app():
    """
    Run the web application on the server
    """
    
    # Find any options defined at the command line
    tornado.options.define("port", default=None, help="run on the given port", type=int)
    tornado.options.define("root_path", default=None, 
        help="Use root_path as the root directory for a Toyz instance")
    tornado.options.parse_command_line()
    
    print("Server root directory:", core.ROOT_DIR)
    #print('moduel update', db_utils.param_formats['modules']['update'])
    
    # Initialize the tornado web application
    toyz_app = ToyzWebApp()
    print("Application root directory:", toyz_app.root_path)
    
    # Continuous loop to wait for incomming connections
    print("Server is running on port", toyz_app.toyz_settings.web.port)
    print("Type CTRL-c at any time to quit the application")
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    init_web_app()