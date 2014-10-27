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
#from passlib.context import CryptContext
#from passlib.hash import sha512_crypt

import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import tornado.escape
from tornado.options import options

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

class Application(tornado.web.Application):
    def __init__(self, settings):
        handlers = [
            (r"/", MainHandler, {
                'template_name': 'home.html',
                'template_path': [core.ROOT_DIR, 'web', 'templates']
            }),
            (r"/auth/login/", AuthLoginHandler),
            (r"/auth/logout/", AuthLogoutHandler),
            (r"/static/(.*)", tornado.web.StaticFileHandler,{
                'path':os.path.join(core.ROOT_DIR, 'web', 'static')
            }),
            (r"/jobsocket", JobSocketHandler),
            (r"/scrollTable", web_utils.BaseHandler, {
                'template_name': 'scrollTable.html',
                'template_path': [core.ROOT_DIR,'web', 'templates']
            }),
            (r"/viewer", web_utils.BaseHandler, {
                'template_name': 'image-viewer.html',
                'template_path': [core.ROOT_DIR, 'web', 'templates']
            }),
        ]
        
        settings={
            'static_path':os.path.join(core.ROOT_DIR, "static"),
            'cookie_secret':settings['cookie_secret'],
            'login_url':'/auth/login/'
        }
        tornado.web.Application.__init__(self, handlers, **settings)

class MainHandler(web_utils.BaseHandler):
    """
    Main Handler when user connects to `localhost:8888/`
    """
    pass

def init_web_app():
    print("Server root directory:", core.ROOT_DIR)
    print("Loading settings")
    settings = web_utils.get_settings()
    print('settings:',settings)
    tornado.options.define("port", default=settings['port'], help="run on the given port", type=int)
    tornado.options.parse_command_line()
    app = Application(settings)
    app.listen(options.port)
    print("Server is running")
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    init_web_app()