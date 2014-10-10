# web_app.py
# Runs the webserver for Astropyp
# Copyright 2014 by Fred Moolekamp
# License: BSD 3 clause

from __future__ import division,print_function
#print("Starting Server, please wait...")

from random import *
import sys
import os.path
import cPickle as pickle
import datetime
from passlib.hash import sha512_crypt
import shutil

import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import tornado.escape
from tornado.options import options

from .utils import core
from .web_server import web_settings
from .web_server import web_utils

# If not using a database, send the job directly to the job server
if not web_settings.USE_DATABASE:
    from job_server import process_job as process_job
else:
    def process_job(job):
        """
        Immediately runs jobs related to the web sever, all other jobs are sent to the
        job server for processing
        
        Parameters
        ----------
        job: dict
            Job to be run on the server
        """
        if job['module'] == 'web_utils':
            core.run_job(job)
        else:
            # TODO: Insert code here to send job to database for processing
            pass
tornado.options.define("port", default=web_settings.DEFAULT_PORT, help="run on the given port", type=int)

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
            user_settings = web_utils.load_all_users_settings()[userId]
        except KeyError:
            web_utils.save_user_settings(userId,{})
            user_settings = {}
        core.active_users[userId] = WebUser(userId, user_settings)
        print('Users logged in:')
        for user_name, user in core.active_users.iteritems():
            print(user.userId)
    websocket.user = core.active_users[userId]
    core.active_users[userId].add_session(websocket)

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


class AuthLoginHandler(web_utils.BaseHandler):
    def initialize(self):
        """
        initialize
        
        When the handler is initialized, set the path to the template that needs to be rendered
        
        Parameters
        ----------
        None
        
        Returns
        -------
        None
        """
        self.template_path = os.path.join(core.ROOT_DIR,'templates')
        
    def get(self):
        try:
            err_msg = self.get_argument('error')
        except:
            err_msg = ''
        self.application.settings['template_path'] = self.template_path
        self.render('login.html', err_msg=err_msg, next=self.get_argument('next'))
    
    def set_current_user(self,userId):
        if userId:
            self.set_secure_cookie('user',tornado.escape.json_encode(userId))
        else:
            self.clear_cookie('user')
    
    def post(self):
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
        open
        
        open is called when a new websocket is opened
        
        Parameters
        ----------
        *args:
            Currently I don't pass any arguments to this function
        
        Returns
        -------
        None
        """
        userId=self.get_secure_cookie('user').strip('"')
        update_users(userId, websocket=self)
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

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler, {
                'template_name': 'home.html',
                'template_path': [core.ROOT_DIR,'templates']
            }),
            (r"/auth/login/", AuthLoginHandler),
            (r"/auth/logout/", AuthLogoutHandler),
            (r"/static/(.*)", tornado.web.StaticFileHandler,{'path':os.path.join(core.ROOT_DIR, "static")}),
            (r"/jobsocket", JobSocketHandler),
            (r"/scrollTable", web_utils.BaseHandler, {
                'template_name': 'scrollTable.html',
                'template_path': [core.ROOT_DIR,'templates']
            }),
            (r"/viewer", web_utils.BaseHandler, {
                'template_name': 'image-viewer.html',
                'template_path': [core.ROOT_DIR, 'templates']
            }),
        ]
        
        # See if the astro_pypelines package has been loaded,
        # if not only load from pypeline paths given in the
        # database or data table
        try:
            from astro_pypelines.settings import pypeline_handlers, pypeline_dir
            pypeline_dirs = [pypeline_dir]
        except ImportError:
            pypeline_handlers = []
            pypeline_dirs = []
        # TODO: Add code to check for saved pypeline paths and use sys.insert to add them
        
        # Create static file handlers for all of the static dirs
        for pyp_dir in pypeline_dirs:
            for dir_name in os.listdir(pyp_dir):
                static_url='/'+dir_name+'/static/(.*)'
                handlers.append((
                    static_url,
                    tornado.web.StaticFileHandler,
                    {'path':os.path.join(pyp_dir, dir_name, "static")}
                ))
        
        handlers.extend(pypeline_handlers)
        settings={
            'static_path':os.path.join(core.ROOT_DIR, "static"),
            'cookie_secret':web_settings.COOKIE_SECRET,
            'login_url':'/auth/login/'
        }
        tornado.web.Application.__init__(self, handlers, **settings)

class MainHandler(web_utils.BaseHandler):
    pass

def init_web_app():
    print("Server root directory:", core.ROOT_DIR)
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    print("Server is running")
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    init_web_app()