class Error(Exception):
    """
    Error
    
    Base class for custom errors related to the running of Toyz
    """
    pass

class ToyzError(Error):
    """
    ToyzError
    
    Class for custom errors related to the running of Toyz.
    """
    def __init__(self,msg):
        self.msg=msg
        self.traceback=traceback.format_exc()
    def __str__(self):
        return self.traceback+'\n'+self.msg+'\n'

class ToyzDbError(ToyzError):
    """
    ToyzError
    
    Class for errors initiating in the Toyz Database Interface
    """
    pass

class ToyzWebError(ToyzError):
    """
    ToyzError
    
    Class for errors initiating in the Toyz Web Application
    """
    pass

class ToyzJobError(ToyzError):
    """
    ToyzError
    
    Class for errors initiating in the Toyz Job Queue
    """
    pass

class ToyzWarning:
    def __init__(self, msg):
        print('Warning: {0}'.format(msg))

toyz_errors = [ToyzError, ToyzDbError, ToyzWebError, ToyzJobError]