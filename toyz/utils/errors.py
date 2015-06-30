"""
Error classes used in Toyz.
"""
# Copyright 2015 by Fred Moolekamp
# License: BSD 3-clause

import traceback

"""
Error types used in Toyz
"""

class Error(Exception):
    """
    Base class for custom errors related to the running of Toyz
    """
    pass

class ToyzError(Error):
    """
    Class for custom errors related to the running of Toyz.
    """
    def __init__(self,msg):
        self.msg=msg
        self.traceback=traceback.format_exc()
    def __str__(self):
        return self.traceback+'\n'+self.msg+'\n'

class ToyzDbError(ToyzError):
    """
    Class for errors initiating in the Toyz Database Interface
    """
    pass

class ToyzWebError(ToyzError):
    """
    Class for errors initiating in the Toyz Web Application
    """
    pass

class ToyzJobError(ToyzError):
    """
    Class for errors initiating in the Toyz Job Queue
    """
    pass

class ToyzIoError(ToyzError):
    """
    Class for I/O Errors
    """
    pass

class ToyzDataError(ToyzError):
    """
    Class for Toyz DataSource Errors
    """
    pass

class ToyzWarning:
    """
    Class for warnings
    """
    def __init__(self, msg):
        print('Warning: {0}'.format(msg))

toyz_errors = [ToyzError, ToyzDbError, ToyzWebError, ToyzJobError]